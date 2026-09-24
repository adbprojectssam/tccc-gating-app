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

export async function fetchApprovers({ hostname, imsToken, imsOrg }) {
  const url = resolveUrl('get-approvers');
  if (!url) throw new Error('get-approvers action is not configured — build the app');
  const result = await actionWebInvoke(url, authHeaders(imsToken, imsOrg), { hostname });
  if (!result || result.error) throw new Error('Could not load approvers');
  return Array.isArray(result.data) ? result.data : [];
}

export async function assignApprovers({ hostname, taskId, approverIds, imsToken, imsOrg }) {
  const url = resolveUrl('assign-approvers');
  if (!url) throw new Error('assign-approvers action is not configured — build the app');
  const result = await actionWebInvoke(url, authHeaders(imsToken, imsOrg), { hostname, taskId, approverIds });
  if (!result || result.error) throw new Error('Could not configure approvers');
  return result.data || [];
}

export default { fetchApprovers, assignApprovers };
