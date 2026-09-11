/*
 * <license header>
 */

/**
 * delete-artifact — server-side proxy that deletes a Workfront document by id.
 * Secured with require-adobe-auth.
 */
const fetch = require("node-fetch");
const { Core } = require("@adobe/aio-sdk");
const {
  errorResponse,
  stringParameters,
  checkMissingRequestInputs,
} = require("../utils");

const API_VERSION = "v22.0";

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
  const logger = Core.Logger("delete-artifact", {
    level: params.LOG_LEVEL || "info",
  });
  try {
    logger.info("Calling the delete-artifact action");
    logger.debug(stringParameters(params));

    const errorMessage = checkMissingRequestInputs(
      params,
      ["hostname", "documentId"],
      [],
    );
    if (errorMessage) return errorResponse(400, errorMessage, logger);

    const { hostname, documentId, WORKFRONT_API_KEY, WORKFRONT_ALLOWED_HOSTS } =
      params;
    if (!WORKFRONT_API_KEY)
      return errorResponse(500, "WORKFRONT_API_KEY is not configured", logger);
    if (!isAllowedHost(hostname, WORKFRONT_ALLOWED_HOSTS)) {
      return errorResponse(400, `host not allowed: ${hostname}`, logger);
    }

    // Workfront honors ?method=DELETE on a POST for API-key auth.
    const url =
      `https://${hostname}/attask/api/${API_VERSION}/document/${encodeURIComponent(documentId)}` +
      `?method=DELETE&apiKey=${encodeURIComponent(WORKFRONT_API_KEY)}`;
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
        `Workfront delete error: ${detail}`,
        logger,
      );
    }

    return { statusCode: 200, body: { data: { deleted: true, documentId } } };
  } catch (error) {
    logger.error(error);
    const detail = error && error.message ? error.message : "server error";
    return errorResponse(500, `Workfront API error: ${detail}`, logger);
  }
}

exports.main = main;
