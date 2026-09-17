/*
 * <license header>
 */

/**
 * register-gate-event — registers the current project for a chosen Gate 1
 * meeting event.
 *
 * PLACEHOLDER: the real Workfront write (e.g. a DE: field on the project
 * referencing the meeting, or a project relationship) is not defined yet —
 * this just validates inputs and echoes back success so the UI flow can be
 * wired end-to-end. Replace the body below once the real API is known.
 * Secured with require-adobe-auth.
 */
const { Core } = require("@adobe/aio-sdk");
const {
  errorResponse,
  stringParameters,
  checkMissingRequestInputs,
} = require("../utils");

async function main(params) {
  const logger = Core.Logger("register-gate-event", {
    level: params.LOG_LEVEL || "info",
  });
  try {
    logger.info("Calling the register-gate-event action");
    logger.debug(stringParameters(params));

    const errorMessage = checkMissingRequestInputs(
      params,
      ["projectId", "gateEventId"],
      [],
    );
    if (errorMessage) return errorResponse(400, errorMessage, logger);

    const { projectId, gateEventId, gateEventName } = params;

    // TODO: replace with the real Workfront write once defined.
    logger.info(
      `Placeholder register: project ${projectId} -> gate event ${gateEventId}`,
    );

    return {
      statusCode: 200,
      body: {
        data: { registered: true, gateEventId, gateEventName: gateEventName || null },
      },
    };
  } catch (error) {
    logger.error(error);
    const detail = error && error.message ? error.message : "server error";
    return errorResponse(500, `Register error: ${detail}`, logger);
  }
}

exports.main = main;
