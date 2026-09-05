/*
 * <license header>
 */

/**
 * Streaming client for the Adobe agent chat endpoint. Each submit POSTs the
 * prompt and reads the Server-Sent Events (text/event-stream) response,
 * invoking `onToken` as text chunks arrive.
 *
 * NOTE: this is a direct cross-origin browser call (the endpoint is designed
 * for headless integration). If the deployed extension is blocked by CORS,
 * the call will fail and surface an error in the chat.
 */

const AGENT_ENDPOINT =
  'https://agents.automations.adobe.com/api/v3/agents/01a03747-f9b6-70d1-8d1e-79824fc50340/chat';

// The agent's IMS org (from the provided cURL). Used when the signed-in context
// doesn't supply one.
const AGENT_ORG_ID = '9075A2B154DE8AF80A4C98A7@AdobeOrg';

/** Best-effort extraction of display text from one SSE `data:` payload. */
function extractText(raw) {
  const s = String(raw).trim();
  if (!s || s === '[DONE]') return '';
  try {
    const obj = JSON.parse(s);
    if (typeof obj === 'string') return obj;
    const candidate =
      obj.delta ??
      obj.content ??
      obj.text ??
      obj.output ??
      obj.response ??
      obj.answer ??
      (obj.message && (typeof obj.message === 'string' ? obj.message : obj.message.content)) ??
      '';
    return typeof candidate === 'string' ? candidate : '';
  } catch (e) {
    // Non-JSON data line — treat as raw text.
    return s;
  }
}

/**
 * Stream a chat response. Calls `onToken(text)` for each chunk; resolves when
 * the stream ends. Throws on missing token or HTTP/network error.
 */
export async function streamChat({ prompt, imsToken, imsOrg, context = {}, onToken, signal }) {
  if (!imsToken) {
    throw new Error('User is not authenticated.');
  }

  const res = await fetch(AGENT_ENDPOINT, {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${imsToken}`,
      'x-gw-ims-org-id': imsOrg || AGENT_ORG_ID,
      'x-headless-integration': 'true',
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({ prompt, context }),
  });

  if (!res.ok) {
    let detail = `status ${res.status}`;
    try {
      const body = await res.json();
      detail = (body && (body.error?.message || body.message)) || detail;
    } catch (e) {
      /* ignore non-JSON error body */
    }
    throw new Error(`Chat request failed: ${detail}`);
  }

  // Non-streaming fallback.
  if (!res.body || !res.body.getReader) {
    const text = await res.text();
    if (text && onToken) onToken(extractText(text) || text);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by a blank line.
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';
    for (const evt of events) {
      for (const line of evt.split('\n')) {
        const trimmed = line.replace(/^\s+/, '');
        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '[DONE]') return;
        const text = extractText(data);
        if (text && onToken) onToken(text);
      }
    }
  }
}

export default { streamChat };
