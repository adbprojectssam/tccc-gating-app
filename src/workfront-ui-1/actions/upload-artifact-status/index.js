/*
 * <license header>
 */

const openwhisk = require("openwhisk");
const { Core } = require("@adobe/aio-sdk");
const { errorResponse, checkMissingRequestInputs } = require("../utils");

async function main(params) {
  const logger = Core.Logger("upload-artifact-status", {
    level: params.LOG_LEVEL || "info",
  });
  try {
    const errorMessage = checkMissingRequestInputs(params, ["jobId"], []);
    if (errorMessage) return errorResponse(400, errorMessage, logger);

    const ow = openwhisk();
    let activation;
    try {
      activation = await ow.activations.get(params.jobId);
    } catch (error) {
      if (error && error.statusCode === 404) {
        return { statusCode: 200, body: { data: { status: "pending" } } };
      }
      throw error;
    }

    const result = activation && activation.response && activation.response.result;
    return {
      statusCode: 200,
      body: { data: result || { status: "pending" } },
    };
  } catch (error) {
    logger.error(error);
    const detail = error && error.message ? error.message : "server error";
    return errorResponse(500, `Upload status error: ${detail}`, logger);
  }
}

exports.main = main;