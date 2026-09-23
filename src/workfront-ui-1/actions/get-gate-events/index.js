/*
 * <license header>
 */

/**
 * get-gate-events — server-side proxy that searches Workfront for upcoming
 * "Gate 1 Meeting" projects, used to populate the "Choose a Gate 1 event"
 * registration modal. Secured with require-adobe-auth; the API key stays
 * server-side (see get-project / upload-artifact for the same pattern).
 */
const fetch = require("node-fetch");
const { Core } = require("@adobe/aio-sdk");
const {
  errorResponse,
  stringParameters,
  checkMissingRequestInputs,
} = require("../utils");

const API_VERSION = "v22.0";
// Workfront portfolio/template identifying "Gate 1 Meeting" project records.
const GATE1_PORTFOLIO_ID = "61fdad0600034b691cf17a0c7147ab61";
const GATE1_TEMPLATE_ID = "622b553500038b1464b55db796ece854";

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
  const logger = Core.Logger("get-gate-events", {
    level: params.LOG_LEVEL || "info",
  });
  try {
    logger.info("Calling the get-gate-events action");
    logger.debug(stringParameters(params));

    const errorMessage = checkMissingRequestInputs(params, ["hostname"], []);
    if (errorMessage) return errorResponse(400, errorMessage, logger);

    const { hostname, WORKFRONT_API_KEY, WORKFRONT_ALLOWED_HOSTS } = params;
    if (!WORKFRONT_API_KEY)
      return errorResponse(500, "WORKFRONT_API_KEY is not configured", logger);
    if (!isAllowedHost(hostname, WORKFRONT_ALLOWED_HOSTS)) {
      return errorResponse(400, `host not allowed: ${hostname}`, logger);
    }

    const searchParams = new URLSearchParams({
      fields: "parameterValues:*,plannedCompletionDate",
      portfolioID: GATE1_PORTFOLIO_ID,
      templateID: GATE1_TEMPLATE_ID,
      status: "CPL",
      status_Mod: "ne",
      $$LIMIT: "-1",
      apiKey: WORKFRONT_API_KEY,
    });
    const url = `https://${hostname}/attask/api/${API_VERSION}/proj/search?${searchParams.toString()}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const detail =
        (body && body.error && body.error.message) || `status ${res.status}`;
      return errorResponse(
        res.status && res.status >= 400 ? res.status : 502,
        `Workfront search error: ${detail}`,
        logger,
      );
    }

    return {
      statusCode: 200,
      body: { data: (body && body.data) || [] },
    };
  } catch (error) {
    logger.error(error);
    const detail = error && error.message ? error.message : "server error";
    return errorResponse(500, `Workfront API error: ${detail}`, logger);
  }
}

exports.main = main;
