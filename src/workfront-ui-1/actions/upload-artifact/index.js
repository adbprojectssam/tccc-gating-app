/*
 * <license header>
 */

/**
 * upload-artifact — server-side proxy that uploads a document to Workfront and
 * attaches it to the PROJECT.
 *
 * Workfront upload is a two-step flow: (1) POST the file bytes to /upload to get
 * a handle, then (2) POST /document with that handle to create the document
 * linked to the project.
 *
 * The browser sends the file as base64 in this action's JSON body; the action
 * decodes it and forwards it to Workfront as multipart. Secured with
 * require-adobe-auth. NOTE: Adobe I/O Runtime caps the request payload (~1 MB),
 * so this direct path only handles small files.
 */
const fetch = require("node-fetch");
const FormData = require("form-data");
const { Core } = require("@adobe/aio-sdk");
const {
  errorResponse,
  stringParameters,
  checkMissingRequestInputs,
} = require("../utils");

const API_VERSION = "v22.0";

/** SSRF guard — only proxy to trusted Workfront hosts (see get-project). */
function isAllowedHost(hostname, allowed) {
  if (!hostname) return false;
  const list = String(allowed || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.length === 0)
    return /^[a-z0-9-]+\.my\.workfront\.com$/i.test(hostname);
  return list.some((h) => hostname === h || hostname.endsWith(`.${h}`));
}

async function main(params) {
  const logger = Core.Logger("upload-artifact", {
    level: params.LOG_LEVEL || "info",
  });
  try {
    logger.info("Calling the upload-artifact action");
    logger.debug(stringParameters(params));

    const errorMessage = checkMissingRequestInputs(
      params,
      ["hostname", "projectId", "fileName", "fileBase64"],
      [],
    );
    if (errorMessage) return errorResponse(400, errorMessage, logger);

    const {
      hostname,
      projectId,
      fileName,
      contentType,
      fileBase64,
      WORKFRONT_API_KEY,
      WORKFRONT_ALLOWED_HOSTS,
    } = params;
    if (!WORKFRONT_API_KEY)
      return errorResponse(500, "WORKFRONT_API_KEY is not configured", logger);
    if (!isAllowedHost(hostname, WORKFRONT_ALLOWED_HOSTS)) {
      return errorResponse(400, `host not allowed: ${hostname}`, logger);
    }

    const buffer = Buffer.from(String(fileBase64), "base64");
    if (!buffer.length) {
      return errorResponse(400, "Uploaded file was empty", logger);
    }

    // 1) Upload the bytes → handle.
    const form = new FormData();
    form.append("uploadedFile", buffer, {
      filename: fileName,
      contentType: contentType || "application/octet-stream",
    });
    const uploadUrl =
      `https://${hostname}/attask/api/${API_VERSION}/upload` +
      `?apiKey=${encodeURIComponent(WORKFRONT_API_KEY)}`;
    const upRes = await fetch(uploadUrl, {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    });
    const upBody = await upRes.json().catch(() => null);
    const handle = upBody && upBody.data && upBody.data.handle;
    if (!upRes.ok || !handle) {
      const detail =
        (upBody && upBody.error && upBody.error.message) ||
        `status ${upRes.status}`;
      return errorResponse(
        upRes.status && upRes.status >= 400 ? upRes.status : 502,
        `Workfront upload error: ${detail}`,
        logger,
      );
    }

    // 2) Create the document attached to the project.
    const docParams = new URLSearchParams({
      apiKey: WORKFRONT_API_KEY,
      name: fileName,
      handle,
      docObjCode: "PROJ",
      objID: projectId,
    });
    const docUrl = `https://${hostname}/attask/api/${API_VERSION}/document?${docParams.toString()}`;
    const docRes = await fetch(docUrl, {
      method: "POST",
      headers: { Accept: "application/json" },
    });
    const docBody = await docRes.json().catch(() => null);
    const doc = docBody && docBody.data;
    if (!docRes.ok || !doc || !doc.ID) {
      const detail =
        (docBody && docBody.error && docBody.error.message) ||
        `status ${docRes.status}`;
      return errorResponse(
        docRes.status && docRes.status >= 400 ? docRes.status : 502,
        `Workfront document create error: ${detail}`,
        logger,
      );
    }

    return {
      statusCode: 200,
      body: { data: { id: doc.ID, name: doc.name || fileName } },
    };
  } catch (error) {
    logger.error(error);
    const detail = error && error.message ? error.message : "server error";
    return errorResponse(500, `Workfront API error: ${detail}`, logger);
  }
}

exports.main = main;
