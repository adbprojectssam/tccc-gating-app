/*
 * <license header>
 */

/**
 * submit-validated-fields — server-side proxy to the Gate 1 field-submission
 * agent.
 *
 * Given the validated field list (high-confidence fields plus anything the
 * user confirmed/entered on the Pre-read Validation screen) and the Workfront
 * task id for the currently selected gate, it calls the Adobe agent that
 * writes these values back. Proxied server-side so the browser call is
 * same-origin (no browser→cloud CORS), and so the call can be made in the
 * agent-owning org's context (see AGENT_ORG_ID below) regardless of the
 * signed-in user's own org — same pattern as the `chat` and `extract-fields`
 * actions. Secured with require-adobe-auth.
 */
const fetch = require("node-fetch");
const { Core } = require("@adobe/aio-sdk");
const {
  errorResponse,
  stringParameters,
  checkMissingRequestInputs,
} = require("../utils");

const SUBMIT_ENDPOINT =
  "https://agents.automations.adobe.com/api/v3/agents/01a0aae7-412b-737a-8024-b63bd83eae5f/api";

// The org that OWNS the agent (from the working cURL). The request must be made
// in this org's context regardless of the signed-in user's own org.
const AGENT_ORG_ID = "9075A2B154DE8AF80A4C98A7@AdobeOrg";

async function main(params) {
  const logger = Core.Logger("submit-validated-fields", {
    level: params.LOG_LEVEL || "info",
  });
  try {
    logger.info("Calling the submit-validated-fields action");
    logger.debug(stringParameters(params));

    const errorMessage = checkMissingRequestInputs(
      params,
      ["fields", "taskId"],
      ["authorization"],
    );
    if (errorMessage) return errorResponse(400, errorMessage, logger);

    const fields = Array.isArray(params.fields) ? params.fields : [];
    if (!fields.length) {
      return errorResponse(400, "fields must be a non-empty array", logger);
    }

    const token = String((params.__ow_headers || {}).authorization || "").replace(
      /^Bearer\s+/i,
      "",
    );
    if (!token) return errorResponse(401, "missing IMS token", logger);

    const res = await fetch(SUBMIT_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-gw-ims-org-id": AGENT_ORG_ID,
        "x-headless-integration": "true",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        fields_payload: JSON.stringify(fields),
        workfront_task_id: params.taskId,
      }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const detail =
        (body && (body.error?.message || body.message)) ||
        `status ${res.status}`;
      return errorResponse(
        res.status && res.status >= 400 ? res.status : 502,
        `Field submission error: ${detail}`,
        logger,
      );
    }

    return { statusCode: 200, body: { data: body } };
  } catch (error) {
    logger.error(error);
    const detail = error && error.message ? error.message : "server error";
    return errorResponse(500, `Field submission error: ${detail}`, logger);
  }
}

exports.main = main;
