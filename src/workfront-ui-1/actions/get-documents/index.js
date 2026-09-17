/*
 * <license header>
 */

/**
 * get-documents — server-side proxy that searches Workfront for a project's
 * documents (`docu/search`), used by the pre-read side panel's "Download"
 * button to find the generated pre-read document and its downloadURL.
 * Secured with require-adobe-auth; the API key stays server-side (see
 * get-project / get-gate-events for the same pattern).
 */
const fetch = require("node-fetch");
const { Core } = require("@adobe/aio-sdk");
const {
  errorResponse,
  stringParameters,
  checkMissingRequestInputs,
} = require("../utils");

const API_VERSION = "v22.0";
const DOCUMENT_FIELDS = "ID,name,description,downloadURL,currentVersion:*,docObjCode,lastUpdateDate,task";

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
  const logger = Core.Logger("get-documents", {
    level: params.LOG_LEVEL || "info",
  });
  try {
    logger.info("Calling the get-documents action");
    logger.debug(stringParameters(params));

    const errorMessage = checkMissingRequestInputs(params, ["projectId", "hostname"], []);
    if (errorMessage) return errorResponse(400, errorMessage, logger);

    const { projectId, hostname, WORKFRONT_API_KEY, WORKFRONT_ALLOWED_HOSTS } = params;
    if (!WORKFRONT_API_KEY)
      return errorResponse(500, "WORKFRONT_API_KEY is not configured", logger);
    if (!isAllowedHost(hostname, WORKFRONT_ALLOWED_HOSTS)) {
      return errorResponse(400, `host not allowed: ${hostname}`, logger);
    }

    const searchParams = new URLSearchParams({
      projectID: projectId,
      fields: DOCUMENT_FIELDS,
      apiKey: WORKFRONT_API_KEY,
    });
    const url = `https://${hostname}/attask/api/${API_VERSION}/docu/search?${searchParams.toString()}`;
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
