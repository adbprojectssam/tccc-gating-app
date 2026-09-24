/*
 * <license header>
 */

const fetch = require("node-fetch");
const { Core } = require("@adobe/aio-sdk");
const { errorResponse, stringParameters, checkMissingRequestInputs } = require("../utils");

const API_VERSION = "v22.0";

function isAllowedHost(hostname, allowed) {
  if (!hostname) return false;
  const list = String(allowed || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!list.length) return /^[a-z0-9-]+\.my\.workfront\.com$/i.test(hostname);
  return list.some((h) => hostname === h || hostname.endsWith(`.${h}`));
}

async function main(params) {
  const logger = Core.Logger("assign-approvers", { level: params.LOG_LEVEL || "info" });
  try {
    logger.info("Calling the assign-approvers action");
    logger.debug(stringParameters(params));
    const missing = checkMissingRequestInputs(params, ["hostname", "taskId", "approverIds"], []);
    if (missing) return errorResponse(400, missing, logger);
    const { hostname, taskId, approverIds, WORKFRONT_API_KEY, WORKFRONT_ALLOWED_HOSTS } = params;
    if (!WORKFRONT_API_KEY) return errorResponse(500, "WORKFRONT_API_KEY is not configured", logger);
    if (!isAllowedHost(hostname, WORKFRONT_ALLOWED_HOSTS)) return errorResponse(400, `host not allowed: ${hostname}`, logger);
    const ids = Array.isArray(approverIds) ? approverIds.filter(Boolean) : [];
    if (!ids.length) return errorResponse(400, "approverIds must be a non-empty array", logger);
    const results = await Promise.all(ids.map(async (assignedToID) => {
      const response = await fetch(`https://${hostname}/attask/api/${API_VERSION}/ASSGN?apiKey=${encodeURIComponent(WORKFRONT_API_KEY)}`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ taskID: taskId, assignedToID }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error((body && body.error && body.error.message) || `status ${response.status}`);
      return body && body.data;
    }));
    return { statusCode: 200, body: { data: results } };
  } catch (error) {
    logger.error(error);
    return errorResponse(500, `Workfront assignment error: ${error.message || "server error"}`, logger);
  }
}

exports.main = main;
