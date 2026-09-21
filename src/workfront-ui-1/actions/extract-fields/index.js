/*
 * <license header>
 */

/**
 * extract-fields — kicks off the pre-read extraction agent call and returns
 * immediately with a `jobId` (the worker's own OpenWhisk activation id); the
 * frontend polls `extract-fields-status` for the eventual result.
 *
 * This does no agent work itself. Adobe I/O Runtime enforces a hard 60s
 * ceiling on BLOCKING web-action HTTP calls — confirmed against Adobe's own
 * docs — that `limits.timeout` cannot raise (a higher configured value is
 * silently ignored for blocking calls), and the agent's document-reading
 * pass can easily exceed 60s for larger or multi-document requests. So this
 * action invokes `extract-fields-worker` NON-BLOCKING (which, as a
 * non-blocking activation, can run up to 3 hours) and returns right away —
 * well within the 60s window. The result is read back later straight off
 * that activation's own record (see extract-fields-status) rather than a
 * separate store. Secured with require-adobe-auth.
 */
const openwhisk = require("openwhisk");
const { Core } = require("@adobe/aio-sdk");
const {
  errorResponse,
  stringParameters,
  checkMissingRequestInputs,
} = require("../utils");

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

    const ow = openwhisk();
    const invoked = await ow.actions.invoke({
      name: "tccc-gating/extract-fields-worker",
      params: {
        projectId: params.projectId,
        documentIds,
        imsToken: token,
      },
      blocking: false,
    });
    const jobId = invoked && invoked.activationId;
    if (!jobId) {
      return errorResponse(502, "Could not start the extraction job", logger);
    }

    logger.info(`Started extraction job ${jobId}`);
    return { statusCode: 200, body: { data: { jobId } } };
  } catch (error) {
    logger.error(error);
    const detail = error && error.message ? error.message : "server error";
    return errorResponse(500, `Field extraction error: ${detail}`, logger);
  }
}

exports.main = main;
