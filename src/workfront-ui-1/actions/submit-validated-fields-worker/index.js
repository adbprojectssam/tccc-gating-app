/*
 * <license header>
 */

/**
 * submit-validated-fields-worker — does the actual (slow) call to the
 * field-submission agent. Invoked NON-BLOCKING by `submit-validated-fields`
 * rather than called directly by the browser: Adobe I/O Runtime enforces a
 * hard 60s ceiling on BLOCKING web-action HTTP calls that `limits.timeout`
 * cannot raise, but non-blocking activations (this one) can run up to 3
 * hours — needed since the agent's write-back pass can exceed 60s.
 *
 * Returns its result as this action's own return value —
 * `submit-validated-fields-status` reads it back via
 * `ow.activations.get(activationId).response.result` once the activation
 * completes, so there's no separate persistence layer to depend on. Not a
 * web action and takes no require-adobe-auth annotation — it's only ever
 * invoked action-to-action from within this namespace, never by an external
 * HTTP caller.
 */
const fetch = require("node-fetch");
const { Core } = require("@adobe/aio-sdk");

const SUBMIT_ENDPOINT =
  "https://agents.automations.adobe.com/api/v3/agents/01a0aae7-412b-737a-8024-b63bd83eae5f/api";

// The org that OWNS the agent (from the working cURL). The request must be made
// in this org's context regardless of the signed-in user's own org.
const AGENT_ORG_ID = "9075A2B154DE8AF80A4C98A7@AdobeOrg";

async function main(params) {
  const logger = Core.Logger("submit-validated-fields-worker", {
    level: params.LOG_LEVEL || "info",
  });
  const { fields, taskId, imsToken } = params;

  try {
    logger.info("Starting field submission");
    if (!imsToken) {
      throw new Error("worker invoked without an imsToken");
    }

    const res = await fetch(SUBMIT_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${imsToken}`,
        "x-gw-ims-org-id": AGENT_ORG_ID,
        "x-headless-integration": "true",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        fields_payload: JSON.stringify(fields),
        workfront_task_id: taskId,
      }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const detail =
        (body && (body.error?.message || body.message)) ||
        `status ${res.status}`;
      throw new Error(`Field submission error: ${detail}`);
    }

    logger.info("Field submission completed");
    return { status: "done", data: body };
  } catch (error) {
    logger.error(error);
    const message = error && error.message ? error.message : "server error";
    return { status: "error", error: message };
  }
}

exports.main = main;
