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

const MONTH_INDEX = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};
// Longest names first so e.g. "september" doesn't get short-circuited by "sep".
const MONTH_ALTERNATION = 'january|february|march|april|may|june|july|august|september|sept|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec';
const NAME_DATE_RE = new RegExp(`\\b(${MONTH_ALTERNATION})\\.?\\s*(\\d{1,2})?,?\\s*(\\d{4})\\b`, 'i');
const NAME_QUARTER_RE = /\bQ([1-4])\s*(\d{4})\b/i;
const QUARTER_START_MONTH = { 1: 0, 2: 3, 3: 6, 4: 9 };

/**
 * The events search (docu/search-style `proj/search`) doesn't return a usable
 * date field for these "Gate Meeting" project records — the date only exists
 * as free text in the project name (e.g. "Europe Gate 1 Meeting October 15
 * 2026", "ASPOU_Thailand _INV Gate Mtg Q3 2026"). Parses "Month [Day,] Year"
 * first (day defaults to the 1st when omitted), then "Q# Year" (mapped to
 * that quarter's first month). Returns null when neither pattern is found —
 * that event can't be placed on the calendar or reliably registered against.
 */
function parseEventDateFromName(name) {
  if (!name) return null;
  const m = NAME_DATE_RE.exec(name);
  if (m) {
    const month = MONTH_INDEX[m[1].toLowerCase()];
    const day = m[2] ? parseInt(m[2], 10) : 1;
    const year = parseInt(m[3], 10);
    if (month != null && Number.isFinite(day) && Number.isFinite(year)) {
      return new Date(year, month, day);
    }
  }
  const q = NAME_QUARTER_RE.exec(name);
  if (q) {
    const year = parseInt(q[2], 10);
    const month = QUARTER_START_MONTH[parseInt(q[1], 10)];
    if (Number.isFinite(year)) return new Date(year, month, 1);
  }
  return null;
}

function mapEvent(raw) {
  const pv = raw.parameterValues || {};
  const level = pv['DE:What level is your Gate Meeting?'] || null;
  const initiativeTypes = pv['DE:Initiative Type Multiselect'];
  return {
    id: raw.ID,
    name: raw.name || '',
    date: parseWorkfrontDate(raw.plannedCompletionDate || raw.entryDate) || parseEventDateFromName(raw.name),
    level,
    levelValue: level ? pv[LEVEL_FIELD[level]] : null,
    initiativeTypes: Array.isArray(initiativeTypes) ? initiativeTypes : [],
  };
}

/**
 * Fetch upcoming Gate 1 meeting events. Resolves to an array of
 * `{ id, name, date, level, levelValue, initiativeTypes }` (only events with a
 * resolvable date are included, since undated events can't be placed on the
 * calendar or registered against). Throws on error.
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

/**
 * Register the current gate (a Workfront task) for a chosen Gate 1 event —
 * writes the meeting's project id onto the task's "DE:Gate Meeting
 * Innovation" field. `taskId` is the selected gate's own Workfront task id
 * (not the project id). Throws on error.
 */
export async function registerForGateEvent({ hostname, taskId, gateEventId, imsToken, imsOrg }) {
  const actionUrl = resolveUrl('register-gate-event');
  if (!actionUrl) throw new Error('register-gate-event action is not configured — build the app');

  const result = await actionWebInvoke(actionUrl, authHeaders(imsToken, imsOrg), {
    hostname,
    taskId,
    gateEventId,
  });
  if (!result || result.error) {
    const detail = (result && result.error && (result.error.error || result.error)) || 'unknown error';
    throw new Error(`Registration failed: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
  }
  return result.data || {};
}

export default { fetchGateEvents, registerForGateEvent };
