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
  'https://agents.automations.adobe.com/api/v3/agents/01a07c15-5ca8-7061-833f-ce649478805f/chat';

// The org that OWNS the agent (from the working cURL). The request must be made
// in this org's context regardless of which org the signed-in user's Workfront
// session reports — sending the user's own org gets the call rejected.
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
 * Stream a chat response. Calls `onToken(text)` for each chunk and resolves to
 * `{ contextId }` when the stream ends (the agent returns a `contextId` on its
 * `done` event; passing it back as top-level `contextId` continues the same
 * conversation). Throws on missing token or HTTP/network error.
 */
export async function streamChat({ prompt, imsToken, conversationId, onToken, signal }) {
  if (!imsToken) {
    throw new Error('User is not authenticated.');
  }

  const payload = { prompt };
  if (conversationId) payload.contextId = conversationId;

  let res;
  try {
    res = await fetch(AGENT_ENDPOINT, {
      method: 'POST',
      signal,
      headers: {
        Authorization: `Bearer ${imsToken}`,
        'x-gw-ims-org-id': AGENT_ORG_ID,
        'x-headless-integration': 'true',
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // fetch() throws on network failures AND on CORS-blocked responses — e.g. an
    // unauthorized 401/403 whose error body carries no CORS headers, which the
    // browser surfaces as a generic "Failed to fetch". The usual cause is that
    // the signed-in account doesn't have access to this AI agent.
    throw new Error(
      "Unable to reach the assistant. Your account may not have access to this AI agent.",
    );
  }

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
    return {};
  }

  let contextId;
  // Handle one SSE `data:` line. Events are typed: `token` carries a text chunk,
  // `done` carries the conversation `contextId`. Unknown shapes fall back to the
  // best-effort text extractor.
  const handleLine = (line) => {
    const trimmed = line.replace(/^\s+/, '');
    if (!trimmed.startsWith('data:')) return;
    const data = trimmed.slice(5).trim();
    if (!data || data === '[DONE]') return;
    let obj = null;
    try {
      obj = JSON.parse(data);
    } catch (e) {
      /* non-JSON data line */
    }
    if (obj && obj.type === 'done') {
      if (obj.contextId) contextId = obj.contextId;
      return;
    }
    if (obj && obj.type === 'token') {
      if (obj.content && onToken) onToken(obj.content);
      return;
    }
    const text = extractText(data);
    if (text && onToken) onToken(text);
  };

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
      for (const line of evt.split('\n')) handleLine(line);
    }
  }
  // Flush any trailing event left in the buffer (e.g. a final `done` event
  // without a trailing blank line).
  if (buffer) {
    for (const line of buffer.split('\n')) handleLine(line);
  }

  return { contextId };
}

export default { streamChat };
