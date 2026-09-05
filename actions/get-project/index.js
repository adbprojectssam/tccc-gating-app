const fetch = require("node-fetch");
const { Core } = require("@adobe/aio-sdk");

async function main(params) {
  const logger = Core.Logger("get-project", {
    level: params.LOG_LEVEL || "info",
  });

  try {
    // IMS token and org come through from the frontend's shared context
    const { imsToken, imsOrg, apiKey, projectId, wfHost } = params;

    if (!imsToken || !projectId) {
      return {
        statusCode: 400,
        body: { error: "Missing imsToken or projectId" },
      };
    }

    const url = `https://${wfHost}/attask/api/v22.0/project/${projectId}?fields=name,status,percentComplete`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${imsToken}`,
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error(data);
      return { statusCode: response.status, body: { error: data } };
    }

    return { statusCode: 200, body: { data: data.data } };
  } catch (error) {
    logger.error(error);
    return { statusCode: 500, body: { error: error.message } };
  }
}

exports.main = main;
