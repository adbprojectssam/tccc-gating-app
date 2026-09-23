/*
 * <license header>
 */

/**
 * register-gate-event — registers the current gate (a Workfront task) for a
 * chosen Gate 1 meeting event, by writing that meeting's project id onto the
 * task's "DE:Gate Meeting Innovation" field (as a JSON-encoded {"ID": ...}
 * string, per Workfront's convention for object-reference custom fields).
 * Secured with require-adobe-auth; the API key stays server-side (see
 * get-project / delete-artifact for the same pattern).
 */
const fetch = require("node-fetch");
const { Core } = require("@adobe/aio-sdk");
const {
  errorResponse,
  stringParameters,
  checkMissingRequestInputs,
} = require("../utils");

const API_VERSION = "v22.0";
const GATE_MEETING_FIELD1 = "DE:Gate Meeting Innovation";
const GATE_MEETING_FIELD2 = "DE:Gate Meeting Exloop";

/** SSRF guard — only proxy to trusted Workfront hosts (see get-project). */
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

async function main(params) {
  const logger = Core.Logger("register-gate-event", {
    level: params.LOG_LEVEL || "info",
  });
  try {
    logger.info("Calling the register-gate-event action");
    logger.debug(stringParameters(params));

    const errorMessage = checkMissingRequestInputs(
      params,
      ["hostname", "taskId", "gateEventId"],
      [],
    );
    if (errorMessage) return errorResponse(400, errorMessage, logger);

    const {
      hostname,
      taskId,
      gateEventId,
      WORKFRONT_API_KEY,
      WORKFRONT_ALLOWED_HOSTS,
    } = params;
    if (!WORKFRONT_API_KEY)
      return errorResponse(500, "WORKFRONT_API_KEY is not configured", logger);
    if (!isAllowedHost(hostname, WORKFRONT_ALLOWED_HOSTS)) {
      return errorResponse(400, `host not allowed: ${hostname}`, logger);
    }

    // Workfront honors ?method=PUT on a POST for API-key auth (see
    // delete-artifact's ?method=DELETE for the same convention); field values
    // are passed as query params, not a JSON body.
    const updateParams = new URLSearchParams({
      apiKey: WORKFRONT_API_KEY,
      [GATE_MEETING_FIELD1]: JSON.stringify({ ID: gateEventId }),
      [GATE_MEETING_FIELD2]: JSON.stringify({ ID: gateEventId }),
    });
    const url =
      `https://${hostname}/attask/api/${API_VERSION}/task/${encodeURIComponent(taskId)}` +
      `?method=PUT&${updateParams.toString()}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { Accept: "application/json" },
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || (body && body.error)) {
      const detail =
        (body && body.error && body.error.message) || `status ${res.status}`;
      return errorResponse(
        res.status && res.status >= 400 ? res.status : 502,
        `Workfront update error: ${detail}`,
        logger,
      );
    }

    return {
      statusCode: 200,
      body: { data: { registered: true, taskId, gateEventId } },
    };
  } catch (error) {
    logger.error(error);
    const detail = error && error.message ? error.message : "server error";
    return errorResponse(500, `Register error: ${detail}`, logger);
  }
}

exports.main = main;
