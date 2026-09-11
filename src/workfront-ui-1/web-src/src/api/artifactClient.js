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

export default { uploadArtifact, deleteArtifact };
