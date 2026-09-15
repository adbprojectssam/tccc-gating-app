/*
 * <license header>
 */

/**
 * Client for the agent chat, proxied through the `chat` runtime action.
 *
 * A direct browser call to the agent endpoint is blocked by CORS on the deployed
 * origin (it works only from localhost), so the call is routed through a
 * same-origin runtime action instead. The action buffers the agent's streamed
 * SSE response and returns the full text + contextId, so `onToken` (when
 * provided) is invoked ONCE with the complete reply rather than incrementally.
 */
import actionWebInvoke from '../utils';
import actionUrls from '../config.json';

function resolveUrl(name) {
  return actionUrls[`tccc-gating/${name}`] || actionUrls[name];
}

/**
 * Send a prompt to the agent (via the `chat` action) and resolve to
 * `{ text, contextId }`. Passing `conversationId` (the agent's `contextId`)
 * continues the same conversation. Throws on missing token / action error.
 */
export async function streamChat({ prompt, imsToken, imsOrg, conversationId, onToken }) {
  if (!imsToken) {
    throw new Error('User is not authenticated.');
  }
  const actionUrl = resolveUrl('chat');
  if (!actionUrl) throw new Error('chat action is not configured — build the app');

  // `require-adobe-auth` needs BOTH the bearer token and the IMS org id header.
  const headers = { Authorization: `Bearer ${imsToken}` };
  if (imsOrg) headers['x-gw-ims-org-id'] = imsOrg;

  const payload = { prompt };
  if (conversationId) payload.contextId = conversationId;

  let result;
  try {
    result = await actionWebInvoke(actionUrl, headers, payload);
  } catch (err) {
    throw new Error(
      'Unable to reach the assistant. Your account may not have access to this AI agent.',
    );
  }

  if (!result || result.error) {
    const err = result && result.error;
    const detail =
      (err && ((err.body && err.body.error) || err.error || (typeof err === 'string' ? err : null))) ||
      'unknown error';
    throw new Error(typeof detail === 'string' ? detail : 'Chat request failed');
  }

  const text = result.text || '';
  const contextId = result.contextId || null;
  if (text && onToken) onToken(text);
  return { text, contextId };
}

export default { streamChat };
