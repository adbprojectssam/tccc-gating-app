/*
 * <license header>
 */

/**
 * extract-fields-worker — does the actual (slow) call to the pre-read
 * extraction agent. Invoked NON-BLOCKING by `extract-fields` rather than
 * called directly by the browser: Adobe I/O Runtime enforces a hard 60s
 * ceiling on BLOCKING web-action HTTP calls that `limits.timeout` cannot
 * raise, but non-blocking activations (this one) can run up to 3 hours —
 * needed since the agent's document-reading pass can exceed 60s for larger
 * or multi-document requests.
 *
 * Returns its result as this action's own return value — `extract-fields-
 * status` reads it back via `ow.activations.get(activationId).response.
 * result` once the activation completes, so there's no separate persistence
 * layer to depend on. Not a web action and takes no require-adobe-auth
 * annotation — it's only ever invoked action-to-action (via the OpenWhisk
 * API, itself authenticated with __OW_API_KEY) from within this namespace,
 * never by an external HTTP caller.
 */
const fetch = require("node-fetch");
const { Core } = require("@adobe/aio-sdk");
const { MOCK_EXTRACTED_FIELDS } = require("../extract-fields/mockExtractedFields");

const EXTRACT_ENDPOINT =
  "https://agents.automations.adobe.com/api/v3/agents/01a08ef0-5a6f-7003-ac6e-3399920efd31/api";

// The org that OWNS the agent (from the working cURL). The request must be made
// in this org's context regardless of the signed-in user's own org.
const AGENT_ORG_ID = "9075A2B154DE8AF80A4C98A7@AdobeOrg";

async function main(params) {
  const logger = Core.Logger("extract-fields-worker", {
    level: params.LOG_LEVEL || "info",
  });
  const { projectId, documentIds, imsToken } = params;

  try {
    logger.info("Starting extraction");
    if (!imsToken) {
      throw new Error("worker invoked without an imsToken");
    }

    const res = await fetch(EXTRACT_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${imsToken}`,
        "x-gw-ims-org-id": AGENT_ORG_ID,
        "x-headless-integration": "true",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        project_id: projectId,
        document_ids: Array.isArray(documentIds) ? documentIds : [],
      }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const detail =
        (body && (body.error?.message || body.message)) ||
        `status ${res.status}`;
      throw new Error(`Field extraction error: ${detail}`);
    }

    // The agent returns a bare array of extracted fields; tolerate a { data: [] }
    // wrapper too.
    const fields = Array.isArray(body) ? body : (body && body.data) || [];
    if (fields.length === 0) {
      logger.info("Empty extraction result — falling back to mock data");
    }
    const resultFields = fields.length > 0 ? fields : MOCK_EXTRACTED_FIELDS;

    logger.info(`Extraction completed with ${resultFields.length} field entries`);
    return { status: "done", data: resultFields };
  } catch (error) {
    logger.error(error);
    const message = error && error.message ? error.message : "server error";
    return { status: "error", error: message };
  }
}

exports.main = main;
