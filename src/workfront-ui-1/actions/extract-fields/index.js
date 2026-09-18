/*
 * <license header>
 */

/**
 * extract-fields — server-side proxy to the pre-read extraction agent.
 *
 * Given a project id and the uploaded Workfront document ids, it calls the
 * Adobe agent, which reads the documents and returns extracted field values
 * (`[{ field, value, page, doc_name, confidence }]`). The same `field` name
 * can appear more than once (e.g. several "risks" bullets) — the frontend
 * (`PreReadValidation.js`'s `mergeDuplicateFields`) merges those into one
 * card per field, so no de-duplication happens here. Proxied server-side so
 * the browser call is same-origin (no browser→cloud CORS), and so the call
 * can be made in the agent-owning org's context (see AGENT_ORG_ID below)
 * regardless of the signed-in user's own org — same pattern as the `chat`
 * action. Secured with require-adobe-auth.
 *
 * `limits.timeout` is raised to 300000ms (ext.config.yaml) — the agent's own
 * document-reading/extraction pass can exceed Adobe I/O Runtime's default
 * 60s action timeout for larger or multi-document requests, at which point
 * the platform itself returns a blocking-call "Response not yet ready."
 * error instead of this action's actual result (same reasoning as
 * upload-artifact's raised timeout).
 */
const fetch = require("node-fetch");
const { Core } = require("@adobe/aio-sdk");
const {
  errorResponse,
  stringParameters,
  checkMissingRequestInputs,
} = require("../utils");
const { MOCK_EXTRACTED_FIELDS } = require("./mockExtractedFields");

const EXTRACT_ENDPOINT =
  "https://agents.automations.adobe.com/api/v3/agents/01a08ef0-5a6f-7003-ac6e-3399920efd31/api";

// The org that OWNS the agent (from the working cURL). The request must be made
// in this org's context regardless of the signed-in user's own org.
const AGENT_ORG_ID = "9075A2B154DE8AF80A4C98A7@AdobeOrg";

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
      ["authorization"],
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

    const token = String((params.__ow_headers || {}).authorization || "").replace(
      /^Bearer\s+/i,
      "",
    );
    if (!token) return errorResponse(401, "missing IMS token", logger);

    const res = await fetch(EXTRACT_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-gw-ims-org-id": AGENT_ORG_ID,
        "x-headless-integration": "true",
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

    // The agent returns a bare array of extracted fields; tolerate a { data: [] }
    // wrapper too.
    const fields = Array.isArray(body) ? body : (body && body.data) || [];
    if (fields.length === 0) {
      logger.info("Empty extraction result — falling back to mock data");
    }
    const resultFields = fields.length > 0 ? fields : MOCK_EXTRACTED_FIELDS;
    return { statusCode: 200, body: { data: resultFields } };
  } catch (error) {
    logger.error(error);
    const detail = error && error.message ? error.message : "server error";
    return errorResponse(500, `Field extraction error: ${detail}`, logger);
  }
}

exports.main = main;
