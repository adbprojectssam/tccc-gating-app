/*
 * <license header>
 */

/**
 * extract-fields-status — polled by the frontend after `extract-fields`
 * kicks off an extraction job, to check whether `extract-fields-worker` has
 * finished yet. `jobId` is that worker's own OpenWhisk activation id — its
 * completion status/result is read directly from the platform's activation
 * record (`ow.activations.get`), so there's no separate persistence layer
 * (e.g. State/Files) to depend on. An activation that hasn't completed yet
 * reads back as a 404 from the platform, which this treats as "pending"
 * rather than an error. Secured with require-adobe-auth.
 */
const openwhisk = require("openwhisk");
const { Core } = require("@adobe/aio-sdk");
const { errorResponse, checkMissingRequestInputs } = require("../utils");

async function main(params) {
  const logger = Core.Logger("extract-fields-status", {
    level: params.LOG_LEVEL || "info",
  });
  try {
    const errorMessage = checkMissingRequestInputs(params, ["jobId"], []);
    if (errorMessage) return errorResponse(400, errorMessage, logger);

    const ow = openwhisk();
    let activation;
    try {
      activation = await ow.activations.get(params.jobId);
    } catch (e) {
      if (e && e.statusCode === 404) {
        // Not finished yet — activation records are only queryable once
        // the activation completes.
        return { statusCode: 200, body: { data: { status: "pending" } } };
      }
      throw e;
    }

    const result = activation && activation.response && activation.response.result;
    if (!result) {
      return { statusCode: 200, body: { data: { status: "pending" } } };
    }
    return { statusCode: 200, body: { data: result } };
  } catch (error) {
    logger.error(error);
    const detail = error && error.message ? error.message : "server error";
    return errorResponse(500, `Extraction status error: ${detail}`, logger);
  }
}

exports.main = main;
