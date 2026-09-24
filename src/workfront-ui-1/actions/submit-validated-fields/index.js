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
/*
 * <license header>
 */

/**
 * submit-validated-fields — kicks off the field-submission agent call and
 * returns immediately with a `jobId` (the worker's own OpenWhisk activation
 * id); the frontend polls `submit-validated-fields-status` for the eventual
 * result.
 *
 * This does no agent work itself. Adobe I/O Runtime enforces a hard 60s
 * ceiling on BLOCKING web-action HTTP calls — confirmed against Adobe's own
 * docs — that `limits.timeout` cannot raise (a higher configured value is
 * silently ignored for blocking calls), and the agent's write-back pass can
 * easily exceed 60s. So this action invokes
 * `submit-validated-fields-worker` NON-BLOCKING (which, as a non-blocking
 * activation, can run up to 3 hours) and returns right away — well within
 * the 60s window. The result is read back later straight off that
 * activation's own record (see submit-validated-fields-status) rather than
 * a separate store. Secured with require-adobe-auth.
 */
const openwhisk = require("openwhisk");
const { Core } = require("@adobe/aio-sdk");
const {
  errorResponse,
  stringParameters,
  checkMissingRequestInputs,
} = require("../utils");

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

    const ow = openwhisk();
    const invoked = await ow.actions.invoke({
      name: "tccc-gating/submit-validated-fields-worker",
      params: {
        fields,
        taskId: params.taskId,
        imsToken: token,
      },
      blocking: false,
    });
    const jobId = invoked && invoked.activationId;
    if (!jobId) {
      return errorResponse(502, "Could not start the submission job", logger);
    }

    logger.info(`Started submission job ${jobId}`);
    return { statusCode: 200, body: { data: { jobId } } };
  } catch (error) {
    logger.error(error);
    const detail = error && error.message ? error.message : "server error";
    return errorResponse(500, `Field submission error: ${detail}`, logger);
  }
}

exports.main = main;

