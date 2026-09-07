/*
 * <license header>
 */

/**
 * Loads the dashboard project: read the Workfront context from the UIX guest
 * connection (which project + host + IMS token), fetch via the `get-project`
 * runtime action, and map to the dashboard shape.
 *
 * On failure the behavior depends on the environment: in LOCAL DEVELOPMENT it
 * falls back to the mapped mock (`mockProjectResponse`) so the UI still works
 * without a Workfront session; in DEPLOYED environments it returns no project
 * with `source: "error"` so the caller can surface an API-failure message
 * instead of presenting mock data as real.
 *
 * Returns `{ project, source, error }` (project is null on error). Never throws.
 */
import { fetchProject } from "../api/workfrontClient";
import { mapWorkfrontProject } from "./mapWorkfrontProject";
import { mockProjectResponse } from "./mockProjectResponse";
import { getGuestConnection } from "../api/guestConnection";

/**
 * True only when served from the local dev server (`aio app run`, localhost).
 * The deployed extension is hosted elsewhere, so mock data — a dev convenience —
 * is never shown there.
 */
function isLocalDev() {
  const loc = typeof globalThis !== "undefined" && globalThis.location;
  if (!loc) return false;
  return /^(localhost|127\.0\.0\.1)$/.test(loc.hostname);
}

/** Reject after `ms` so a missing Workfront host (local dev) doesn't hang. */
function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** Read the first present value from the shared context for any of the keys. */
async function firstContextValue(context, keys) {
  for (const key of keys) {
    // eslint-disable-next-line no-await-in-loop
    const value = context ? await context.get(key) : null;
    if (value) return value;
  }
  return null;
}

/** Which project to show, which Workfront host, and the IMS token for the action. */
async function getProjectContext() {
  // Use the single shared guest connection for this iframe (see
  // api/guestConnection.js). Opening a second `attach()` here — while the chat
  // widget's auth opens its own — races two guests in one iframe and breaks the
  // host handshake.
  // eslint-disable-next-line no-console
  console.info("[loadProject] connecting to Workfront host…");
  const guestConnection = await getGuestConnection();
  // eslint-disable-next-line no-console
  console.info("[loadProject] connected; reading shared context");
  const context = guestConnection && guestConnection.sharedContext;
  const projectId = await firstContextValue(context, ["objID"]);
  const hostname = await firstContextValue(context, ["hostname"]);
  const auth = await firstContextValue(context, ["auth"]);
  // `require-adobe-auth` on the action needs BOTH the IMS token and the IMS
  // org id. Both come from the shared `auth` object; key names can vary by host.
  const imsToken = auth?.imsToken || auth?.token || auth?.imsProfile;
  const imsOrg = auth?.imsOrg || auth?.imsOrgId || auth?.imsOrgID || auth?.orgId;
  return { projectId, hostname, imsToken, imsOrg };
}

export async function loadProject() {
  try {
    const { projectId, hostname, imsToken, imsOrg } = await withTimeout(
      getProjectContext(),
      10000,
      "Workfront context",
    );
    // eslint-disable-next-line no-console
    console.info("[loadProject] context resolved:", {
      projectId,
      hostname,
      hasToken: !!imsToken,
      hasOrg: !!imsOrg,
    });
    if (!projectId || !hostname) {
      throw new Error("Missing Workfront context (objID/hostname)");
    }
    const raw = await fetchProject({ projectId, hostname, imsToken, imsOrg });
    const project = mapWorkfrontProject(raw);
    if (!project) {
      throw new Error("Mapper returned no project");
    }
    return { project, source: "api" };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn("[loadProject] project load failed:", error && error.message);
    // Local dev / no session — map the mock response so the UI still works and
    // the same mapping pipeline is exercised. In deployed environments we do NOT
    // show mock data; surface the failure so the UI can render an error message.
    if (isLocalDev()) {
      return { project: mapWorkfrontProject(mockProjectResponse), source: "mock", error };
    }
    return { project: null, source: "error", error };
  }
}

export default loadProject;
