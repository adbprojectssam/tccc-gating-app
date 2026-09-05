/*
 * <license header>
 */

/**
 * get-project — server-side proxy to the Workfront (attask) API.
 *
 * The browser cannot call Workfront directly (cross-origin + the API key must
 * not ship in client code), so this runtime action makes the call server-side
 * with the API key stored as a secret.
 *
 * It returns the project fields plus a distilled `gates` list: every task whose
 * name starts with "Gate", enriched with task details. Details are fetched
 * sequentially and STOP at the first non-completed gate — i.e. a gate's details
 * are fetched only if the previous gate is completed.
 *
 * Secured with `require-adobe-auth: true` (see ext.config.yaml): the caller
 * must present a valid Adobe IMS token + org id.
 */
const fetch = require("node-fetch");
const { Core } = require("@adobe/aio-sdk");
const {
  errorResponse,
  stringParameters,
  checkMissingRequestInputs,
} = require("../utils");

const API_VERSION = "v22.0";

// Fields fetched for each individual Gate task.
const TASK_FIELDS = [
  "name",
  "status",
  "parent:name",
  "assignedToID",
  "DE:PMO Comments",
  "actualCompletionDate",
  "plannedCompletionDate",
].join(",");

/**
 * SSRF guard: only proxy to trusted Workfront hosts, so a caller can't point
 * the action (with our API key) at an arbitrary server. Allowlist comes from
 * WORKFRONT_ALLOWED_HOSTS (comma-separated); defaults to any `*.my.workfront.com`.
 */
function isAllowedHost(hostname, allowed) {
  if (!hostname) return false;
  const list = String(allowed || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.length === 0)
    return /^[a-z0-9-]+\.my\.workfront\.com$/i.test(hostname);
  return list.some((h) => hostname === h || hostname.endsWith(`.${h}`));
}

/** GET a Workfront object. Sends the API key both as query param and header so
 *  whichever the instance honors works. Returns the unwrapped `data`. */
async function wfFetch(hostname, apiKey, path, fields) {
  const encodedFields = String(fields).replace(/ /g, "%20");
  const url =
    `https://${hostname}/attask/api/${API_VERSION}/${path}` +
    `?fields=${encodedFields}&apiKey=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { apiKey, Accept: "application/json" },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const detail =
      (body && body.error && body.error.message) || `status ${res.status}`;
    const err = new Error(detail);
    err.statusCode = res.status;
    throw err;
  }
  return body && body.data;
}

/** "Gate 1 - …" → 1 (used to filter and order gate tasks). */
function gateNumber(name) {
  const m = /^gate\s*(\d+)/i.exec(String(name).trim());
  return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
}
function isGateTask(task) {
  return (
    task && typeof task.name === "string" && /^gate\b/i.test(task.name.trim())
  );
}
/** A gate is complete if it has an actual completion date or a complete status. */
function isCompleted(details) {
  return !!(
    details &&
    (details.actualCompletionDate || details.status === "CPL")
  );
}

async function main(params) {
  const logger = Core.Logger("get-project", {
    level: params.LOG_LEVEL || "info",
  });
  try {
    logger.info("Calling the get-project action");
    logger.debug(stringParameters(params));

    const errorMessage = checkMissingRequestInputs(
      params,
      ["projectId", "hostname", "fields"],
      [],
    );
    if (errorMessage) return errorResponse(400, errorMessage, logger);

    const {
      projectId,
      hostname,
      fields,
      WORKFRONT_API_KEY,
      WORKFRONT_ALLOWED_HOSTS,
    } = params;
    if (!WORKFRONT_API_KEY)
      return errorResponse(500, "WORKFRONT_API_KEY is not configured", logger);
    if (!isAllowedHost(hostname, WORKFRONT_ALLOWED_HOSTS)) {
      return errorResponse(400, `host not allowed: ${hostname}`, logger);
    }

    // 1) Project (with its task list inline).
    const project = await wfFetch(
      hostname,
      WORKFRONT_API_KEY,
      `proj/${encodeURIComponent(projectId)}`,
      fields,
    );
    if (!project)
      return errorResponse(502, "Workfront returned no project data", logger);

    // 2) Gate tasks: name starts with "Gate", ordered by gate number.
    const tasks = Array.isArray(project.tasks) ? project.tasks : [];
    const gateTasks = tasks
      .filter(isGateTask)
      .sort((a, b) => gateNumber(a.name) - gateNumber(b.name));

    // 3) Fetch each gate's details in order; stop after the first non-completed
    //    gate (only fetch the next gate if the previous one is completed).
    const gates = [];
    for (let i = 0; i < gateTasks.length; i++) {
      const gt = gateTasks[i];
      let details = null;
      try {
        details = await wfFetch(
          hostname,
          WORKFRONT_API_KEY,
          `task/${encodeURIComponent(gt.ID)}`,
          TASK_FIELDS,
        );
      } catch (e) {
        logger.warn(`gate task ${gt.ID} detail fetch failed: ${e.message}`);
      }
      const completed = isCompleted(details);
      gates.push({
        id: gt.ID,
        number: gateNumber(gt.name),
        name: gt.name,
        fetched: !!details,
        completed,
        status: details?.status || null,
        parentName: details?.parent?.name || null,
        assignedToID: details?.assignedToID || null,
        pmoComments: details?.["DE:PMO Comments"] || null,
        actualCompletionDate: details?.actualCompletionDate || null,
        plannedCompletionDate: details?.plannedCompletionDate || null,
      });
      if (!completed) break;
    }

    // Remaining gate tasks (not fetched) — basic info so the pipeline can list them.
    for (let i = gates.length; i < gateTasks.length; i++) {
      const gt = gateTasks[i];
      gates.push({
        id: gt.ID,
        number: gateNumber(gt.name),
        name: gt.name,
        fetched: false,
        completed: false,
        status: null,
      });
    }

    // Return project fields + distilled gates (drop the raw task list).
    const { tasks: _tasks, ...projectFields } = project;
    return { statusCode: 200, body: { data: { ...projectFields, gates } } };
  } catch (error) {
    logger.error(error);
    const detail = error && error.message ? error.message : "server error";
    return errorResponse(
      error && error.statusCode ? error.statusCode : 500,
      `Workfront API error: ${detail}`,
      logger,
    );
  }
}

exports.main = main;
