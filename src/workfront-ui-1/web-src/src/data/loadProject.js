/*
 * <license header>
 */

/**
 * Loads the dashboard project: read the Workfront context from the UIX guest
 * connection (which project + host + IMS token), fetch via the `get-project`
 * runtime action, and map to the dashboard shape. Falls back to the mapped mock
 * (`mockProjectResponse`) when the context/action is unavailable (e.g. local dev).
 *
 * Returns `{ project, source, error }` so callers can surface which data set is
 * shown. Never throws.
 */
import { fetchProject } from "../api/workfrontClient";
import { mapWorkfrontProject } from "./mapWorkfrontProject";
import { mockProjectResponse } from "./mockProjectResponse";
import { attach } from "@adobe/uix-guest";
import { extensionId } from "../components/Constants";

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
  const guestConnection = await attach({ id: extensionId });
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
      3000,
      "Workfront context",
    );
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
    // Local dev / no session — map the mock response so the UI still works and
    // the same mapping pipeline is exercised.
    // eslint-disable-next-line no-console
    console.warn(
      "[loadProject] falling back to mock data:",
      error && error.message,
    );
    return { project: mapWorkfrontProject(mockProjectResponse), source: "mock", error };
  }
}

export default loadProject;
