/*
 * <license header>
 */

/**
 * Browser-side client for artifact documents. Uploads/deletes are proxied
 * through the `upload-artifact` / `delete-artifact` runtime actions (the API
 * key must stay server-side). The file is sent as base64 in the JSON body.
 */
import actionWebInvoke from '../utils';
import actionUrls from '../config.json';

/** Read a Blob/File as base64 (strips the data-URL prefix). */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.readAsDataURL(blob);
  });
}

function authHeaders(imsToken, imsOrg) {
  const headers = {};
  if (imsToken) headers.Authorization = `Bearer ${imsToken}`;
  if (imsOrg) headers['x-gw-ims-org-id'] = imsOrg;
  return headers;
}

function resolveUrl(name) {
  return actionUrls[`tccc-gating/${name}`] || actionUrls[name];
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Upload a file to Workfront (attached to the project). Resolves to the created
 * document `{ id, name }`. Throws on error.
 *
 * The file is base64-encoded and sent in the action body; the `upload-artifact`
 * action decodes it and pushes it to Workfront. NOTE: Adobe I/O Runtime caps the
 * request payload (~1 MB), so only small files go through this direct path.
 */
export async function uploadArtifact({ projectId, hostname, imsToken, imsOrg, file }) {
  const actionUrl = resolveUrl('upload-artifact');
  if (!actionUrl) throw new Error('upload-artifact action is not configured — build the app');

  const fileBase64 = await blobToBase64(file);
  const result = await actionWebInvoke(actionUrl, authHeaders(imsToken, imsOrg), {
    projectId,
    hostname,
    fileName: file.name,
    contentType: file.type,
    fileBase64,
  });
  if (!result || result.error || !result.data) {
    const detail = (result && result.error && (result.error.error || result.error)) || 'unknown error';
    throw new Error(`Upload failed: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
  }
  return result.data;
}

// Polling cadence + overall budget for extract-fields-status. Adobe I/O
// Runtime hard-caps blocking web-action HTTP calls at 60s (limits.timeout
// can't raise it), so extract-fields only kicks the job off; the actual
// (potentially slow) agent call runs in extract-fields-worker, and this
// polls until it's done. Budget is a little over the worker's own 5-minute
// action timeout.
const EXTRACT_POLL_INTERVAL_MS = 3000;
const EXTRACT_POLL_TIMEOUT_MS = 6 * 60 * 1000;

/**
 * Send the uploaded document ids (with the project id) to the pre-read
 * extraction agent. Kicks off the job via `extract-fields`, then polls
 * `extract-fields-status` until the background worker finishes. Resolves to
 * the array of extracted fields `[{ field, value, page, doc_name, confidence }]`.
 * Throws on error, or if the job doesn't finish within the poll budget.
 */
export async function extractFields({ projectId, documentIds, imsToken, imsOrg }) {
  const startUrl = resolveUrl('extract-fields');
  if (!startUrl) throw new Error('extract-fields action is not configured — build the app');
  const statusUrl = resolveUrl('extract-fields-status');
  if (!statusUrl) throw new Error('extract-fields-status action is not configured — build the app');

  const started = await actionWebInvoke(startUrl, { ...authHeaders(imsToken, imsOrg), 'x-headless-integration': true }, {
    projectId,
    documentIds,
  });
  if (!started || started.error || !started.data || !started.data.jobId) {
    const detail = (started && started.error && (started.error.error || started.error)) || 'unknown error';
    throw new Error(`Field extraction failed: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
  }
  const { jobId } = started.data;

  const deadline = Date.now() + EXTRACT_POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await delay(EXTRACT_POLL_INTERVAL_MS);
    const poll = await actionWebInvoke(statusUrl, authHeaders(imsToken, imsOrg), { jobId });
    if (!poll || poll.error || !poll.data) {
      const detail = (poll && poll.error && (poll.error.error || poll.error)) || 'unknown error';
      throw new Error(`Field extraction failed: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
    }
    if (poll.data.status === 'done') return poll.data.data;
    if (poll.data.status === 'error') throw new Error(poll.data.error || 'Field extraction failed');
    // status === 'pending' — keep polling.
  }
  throw new Error('Field extraction is taking longer than expected. Please try again.');
}

/**
 * Submit the validated field list (high-confidence fields, plus anything the
 * user confirmed/entered on the Pre-read Validation screen) for the given
 * Workfront task, via the `submit-validated-fields` action. `fields` is
 * `[{ field, value }]`. Throws on error.
 */
export async function submitValidatedFields({ fields, taskId, imsToken, imsOrg }) {
  const actionUrl = resolveUrl('submit-validated-fields');
  if (!actionUrl) throw new Error('submit-validated-fields action is not configured — build the app');

  const result = await actionWebInvoke(actionUrl, authHeaders(imsToken, imsOrg), {
    fields,
    taskId,
  });
  if (!result || result.error) {
    const detail = (result && result.error && (result.error.error || result.error)) || 'unknown error';
    throw new Error(`Field submission failed: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
  }
  return result.data;
}

/** Delete a Workfront document by id. Throws on error. */
export async function deleteArtifact({ documentId, hostname, imsToken, imsOrg }) {
  const actionUrl = resolveUrl('delete-artifact');
  if (!actionUrl) throw new Error('delete-artifact action is not configured — build the app');

  const result = await actionWebInvoke(actionUrl, authHeaders(imsToken, imsOrg), {
    documentId,
    hostname,
  });
  if (!result || result.error) {
    const detail = (result && result.error && (result.error.error || result.error)) || 'unknown error';
    throw new Error(`Delete failed: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
  }
  return result.data || {};
}

export default { uploadArtifact, extractFields, submitValidatedFields, deleteArtifact };
