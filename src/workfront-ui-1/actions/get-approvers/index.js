/*
 * <license header>
 */

const fetch = require("node-fetch");
const { Core } = require("@adobe/aio-sdk");
const { errorResponse, stringParameters, checkMissingRequestInputs } = require("../utils");

const API_VERSION = "v22.0";
const APPROVER_GROUP_ID = "6256dcab0038e332c3482ca3c8c817f8";

function isAllowedHost(hostname, allowed) {
  if (!hostname) return false;
  const list = String(allowed || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!list.length) return /^[a-z0-9-]+\.my\.workfront\.com$/i.test(hostname);
  return list.some((h) => hostname === h || hostname.endsWith(`.${h}`));
}

async function main(params) {
  const logger = Core.Logger("get-approvers", { level: params.LOG_LEVEL || "info" });
  try {
    logger.info("Calling the get-approvers action");
    logger.debug(stringParameters(params));
    const missing = checkMissingRequestInputs(params, ["hostname"], []);
    if (missing) return errorResponse(400, missing, logger);
    const { hostname, WORKFRONT_API_KEY, WORKFRONT_ALLOWED_HOSTS } = params;
    if (!WORKFRONT_API_KEY) return errorResponse(500, "WORKFRONT_API_KEY is not configured", logger);
    if (!isAllowedHost(hostname, WORKFRONT_ALLOWED_HOSTS)) return errorResponse(400, `host not allowed: ${hostname}`, logger);
    const query = new URLSearchParams({
      "otherGroups:ID": APPROVER_GROUP_ID,
      isActive: "true",
      fields: "ID,name,emailAddr",
      "$$LIMIT": "-1",
      apiKey: WORKFRONT_API_KEY,
    });
    const response = await fetch(`https://${hostname}/attask/api/${API_VERSION}/user/search?${query}`, { headers: { Accept: "application/json" } });
    const body = await response.json().catch(() => null);
    if (!response.ok) return errorResponse(response.status >= 400 ? response.status : 502, `Workfront user search error: ${(body && body.error && body.error.message) || `status ${response.status}`}`, logger);
    return { statusCode: 200, body: { data: (body && body.data) || [] } };
  } catch (error) {
    logger.error(error);
    return errorResponse(500, `Workfront API error: ${error.message || "server error"}`, logger);
  }
}

exports.main = main;
