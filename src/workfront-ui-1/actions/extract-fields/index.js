/*
 * <license header>
 */

/**
 * extract-fields — server-side proxy to the pre-read extraction webhook.
 *
 * Given a project id and the uploaded Workfront document ids, it calls the
 * automation hook, which reads the documents and returns extracted field values
 * (`[{ field, value, page, evidence, confidence, source }]`). Proxied
 * server-side so the browser call is same-origin (no browser→cloud CORS).
 * Secured with require-adobe-auth.
 */
const fetch = require("node-fetch");
const { Core } = require("@adobe/aio-sdk");
const {
  errorResponse,
  stringParameters,
  checkMissingRequestInputs,
} = require("../utils");

// Automation webhook that extracts Workfront field values from the project's
// documents. Fixed endpoint (no secret / no per-host routing).
const EXTRACT_ENDPOINT =
  "https://hook.automations.adobe.com/1nekjze4m5w8776hwnfluozwred5tt13";

async function main(params) {
  const logger = Core.Logger("extract-fields", {
    level: params.LOG_LEVEL || "info",
  });
  try {
    logger.info("Calling the extract-fields action");
    logger.debug(stringParameters(params));

    const errorMessage = checkMissingRequestInputs(
      params,
      ["projectId", "documentIds"],
      [],
    );
    if (errorMessage) return errorResponse(400, errorMessage, logger);

    const documentIds = Array.isArray(params.documentIds)
      ? params.documentIds.filter(Boolean)
      : [];
    if (!documentIds.length) {
      return errorResponse(
        400,
        "documentIds must be a non-empty array",
        logger,
      );
    }

    const res = await fetch(EXTRACT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        project_id: params.projectId,
        document_ids: documentIds,
      }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const detail =
        (body && (body.error?.message || body.message)) ||
        `status ${res.status}`;
      return errorResponse(
        res.status && res.status >= 400 ? res.status : 502,
        `Field extraction error: ${detail}`,
        logger,
      );
    }

    // The hook returns a bare array of extracted fields; tolerate a { data: [] }
    // wrapper too.
    const fields = Array.isArray(body) ? body : (body && body.data) || [];
    return { statusCode: 200, body: { data: fields } };
  } catch (error) {
    logger.error(error);
    const detail = error && error.message ? error.message : "server error";
    return errorResponse(500, `Field extraction error: ${detail}`, logger);
  }
}

exports.main = main;
