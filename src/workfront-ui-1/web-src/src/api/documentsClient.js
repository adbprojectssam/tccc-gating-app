/*
 * <license header>
 */

/**
 * Browser-side client for a project's Workfront documents. Does NOT call
 * Workfront directly (cross-origin + the API key must stay server-side) —
 * invokes the `get-documents` runtime action, which proxies `docu/search`.
 * See `src/workfront-ui-1/actions/get-documents`.
 */
import actionWebInvoke from '../utils';
import actionUrls from '../config.json';

function authHeaders(imsToken, imsOrg) {
  const headers = {};
  if (imsToken) headers.Authorization = `Bearer ${imsToken}`;
  if (imsOrg) headers['x-gw-ims-org-id'] = imsOrg;
  return headers;
}

function resolveUrl(name) {
  return actionUrls[`tccc-gating/${name}`] || actionUrls[name];
}

/**
 * Fetch every Workfront document attached to the project (search fields:
 * ID, name, description, downloadURL, currentVersion:*, docObjCode,
 * lastUpdateDate, task). Resolves to the raw `data` array. Throws on error.
 */
export async function fetchProjectDocuments({ projectId, hostname, imsToken, imsOrg }) {
  const actionUrl = resolveUrl('get-documents');
  if (!actionUrl) throw new Error('get-documents action is not configured — build the app');

  const result = await actionWebInvoke(actionUrl, authHeaders(imsToken, imsOrg), { projectId, hostname });
  if (!result || result.error) {
    const detail = (result && result.error && (result.error.error || result.error)) || 'unknown error';
    throw new Error(`Could not load documents: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
  }
  return Array.isArray(result.data) ? result.data : [];
}

/**
 * Find this gate's generated pre-read among the project's documents: a
 * Workfront document ("DOCU") named "Gate {number} pre-read" and attached to
 * this gate's own task. Returns the matching document, or null.
 */
export function findGatePreReadDocument(documents, { gateNumber, taskId }) {
  const targetName = `Gate ${gateNumber} pre-read`;
  return (
    documents.find(
      (doc) => doc && doc.objCode === 'DOCU' && doc.name === targetName && doc.task && doc.task.ID === taskId,
    ) || null
  );
}

export default { fetchProjectDocuments, findGatePreReadDocument };
