/*
 * <license header>
 */

/**
 * Browser-side client for the project data. It does NOT call Workfront
 * directly (cross-origin + the API key must stay server-side). Instead it
 * invokes the `get-project` App Builder runtime action, which proxies the call
 * to the Workfront (attask) API. See `src/workfront-ui-1/actions/get-project`.
 */
import actionWebInvoke from '../utils';
import actionUrls from '../config.json';

// Package/action name from ext.config.yaml → key in the generated config.json.
const ACTION = 'tccc-gating/get-project';

// Custom (DE:) + standard fields the dashboard reads. Keep in sync with the
// mapper (`data/mapWorkfrontProject.js`).
export const PROJECT_FIELDS = [
  'name',
  'owner:name',
  'DE:Leading Market',
  'DE:Global Category',
  'DE:Operating Unit',
  'DE:Absolute Volume Calendar Year 1',
  'DE:Incremental Volume Calendar Year 1',
  'DE:KO Gross Profit Margin',
  'DE:CAPEX Budget',
  'DE:Initiative Description',
  'DE:Innovation Driver',
  'DE:MS_Brand',
  'DE:Primary Package Type',
  'DE:Secondary Package Type',
  'DE:markets_selected',
  'DE:Target In-Market Date',
  'portfolioID'
];

/**
 * Fetch a project (with tasks) via the get-project action.
 * @param {{ projectId: string, hostname: string, imsToken?: string, imsOrg?: string }} args
 * @returns the unwrapped Workfront `data` object.
 * Throws on error so callers can fall back to mock.
 */
export async function fetchProject({ projectId, hostname, imsToken, imsOrg }) {
  const actionUrl = actionUrls[ACTION];
  if (!actionUrl) {
    throw new Error(`Action URL not configured for "${ACTION}" — build the app to populate config.json`);
  }

  const fields = `${PROJECT_FIELDS.join(',')},tasks`;
  // `require-adobe-auth` needs BOTH the bearer token and the IMS org id header.
  const headers = {};
  if (imsToken) headers.Authorization = `Bearer ${imsToken}`;
  if (imsOrg) headers['x-gw-ims-org-id'] = imsOrg;

  const result = await actionWebInvoke(actionUrl, headers, { projectId, hostname, fields });

  if (!result || result.error) {
    const detail = (result && result.error && (result.error.error || result.error)) || 'unknown error';
    throw new Error(`get-project action failed: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
  }
  if (!result.data) {
    throw new Error('get-project returned no data');
  }
  return result.data;
}

export default { fetchProject, PROJECT_FIELDS };
