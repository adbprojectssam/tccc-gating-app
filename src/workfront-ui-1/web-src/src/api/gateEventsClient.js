/*
 * <license header>
 */

/**
 * Browser-side client for Gate 1 registration events. `get-gate-events` proxies
 * Workfront's project search (the API key stays server-side); `register-gate-event`
 * is currently a placeholder until the real Workfront write is defined.
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

// Maps a gate meeting's "DE:What level is your Gate Meeting?" value to the
// parameterValues field holding that level's actual value.
const LEVEL_FIELD = {
  OU: 'DE:Operating Unit',
  Category: 'DE:Global Category',
  Country: 'DE:Primary Launch Market Country',
};

/** Workfront datetime → Date, tolerant of the "...:000+0530" shape `new Date()` can't parse. */
function parseWorkfrontDate(value) {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function mapEvent(raw) {
  const pv = raw.parameterValues || {};
  const level = pv['DE:What level is your Gate Meeting?'] || null;
  return {
    id: raw.ID,
    name: raw.name || '',
    date: parseWorkfrontDate(raw.plannedCompletionDate || raw.entryDate),
    level,
    levelValue: level ? pv[LEVEL_FIELD[level]] : null,
  };
}

/**
 * Fetch upcoming Gate 1 meeting events. Resolves to an array of
 * `{ id, name, date, level, levelValue }` (only events with a resolvable date
 * are included, since undated events can't be placed on the calendar). Throws
 * on error.
 */
export async function fetchGateEvents({ hostname, imsToken, imsOrg }) {
  const actionUrl = resolveUrl('get-gate-events');
  if (!actionUrl) throw new Error('get-gate-events action is not configured — build the app');

  const result = await actionWebInvoke(actionUrl, authHeaders(imsToken, imsOrg), { hostname });
  if (!result || result.error || !result.data) {
    const detail = (result && result.error && (result.error.error || result.error)) || 'unknown error';
    throw new Error(`Could not load gate events: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
  }
  return result.data.map(mapEvent).filter((e) => e.id && e.date);
}

/** Register the current project for a chosen Gate 1 event. Throws on error. */
export async function registerForGateEvent({ projectId, gateEventId, gateEventName, imsToken, imsOrg }) {
  const actionUrl = resolveUrl('register-gate-event');
  if (!actionUrl) throw new Error('register-gate-event action is not configured — build the app');

  const result = await actionWebInvoke(actionUrl, authHeaders(imsToken, imsOrg), {
    projectId,
    gateEventId,
    gateEventName,
  });
  if (!result || result.error) {
    const detail = (result && result.error && (result.error.error || result.error)) || 'unknown error';
    throw new Error(`Registration failed: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
  }
  return result.data || {};
}

export default { fetchGateEvents, registerForGateEvent };
