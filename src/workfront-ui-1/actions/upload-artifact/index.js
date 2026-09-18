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

// The browser's File.type is sometimes empty or unreliable for Office
// documents depending on OS/browser MIME registration. Since Workfront's
// stored content-type affects how it's later served back (and therefore
// whether Word/Office recognizes the download), the file's own extension is
// treated as authoritative for known types — `file.type` is only a fallback.
const EXTENSION_CONTENT_TYPES = {
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
  csv: "text/csv",
  txt: "text/plain",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
};

/** Extension of `fileName` (lowercased, no dot), or '' if it has none. */
function extensionOf(fileName) {
  const m = /\.([a-z0-9]+)$/i.exec(String(fileName || ""));
  return m ? m[1].toLowerCase() : "";
}

/**
 * The content-type Workfront should store for this upload: the extension's
 * known type first (authoritative — see above), then whatever the browser
 * sent, then a generic binary fallback.
 */
function resolveContentType(fileName, browserContentType) {
  return (
    EXTENSION_CONTENT_TYPES[extensionOf(fileName)] ||
    browserContentType ||
    "application/octet-stream"
  );
}

// Conservative ceiling for the base64-encoded file, comfortably under Adobe
// I/O Runtime's ~1MB web-action request size limit once the JSON envelope
// (fileName/contentType/projectId/hostname keys, plus base64's own ~33%
// inflation over raw bytes) is accounted for. Above this, the request risks
// silent failure/corruption rather than a clean error — better to reject it
// here with an actionable message.
const MAX_BASE64_LENGTH = 900_000; // ~660KB raw

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

    if (String(fileBase64).length > MAX_BASE64_LENGTH) {
      return errorResponse(
        400,
        "File is too large for direct upload (max ~660KB) — please use a smaller file.",
        logger,
      );
    }

    const buffer = Buffer.from(String(fileBase64), "base64");
    if (!buffer.length) {
      return errorResponse(400, "Uploaded file was empty", logger);
    }
    // Sanity-check the decode against the input length — catches silent
    // truncation upstream (proxy/gateway) rather than a clean rejection.
    const expectedLength = Math.floor((String(fileBase64).length * 3) / 4);
    if (Math.abs(buffer.length - expectedLength) > 4) {
      logger.warn(
        `Decoded buffer length (${buffer.length}) doesn't match the expected length from the base64 input (~${expectedLength}) — the upload may have been truncated in transit.`,
      );
    }

    const resolvedContentType = resolveContentType(fileName, contentType);
    logger.debug(
      `Uploading ${fileName} — ${buffer.length} bytes, contentType=${resolvedContentType} (browser sent "${contentType}")`,
    );

    // 1) Upload the bytes → handle.
    const form = new FormData();
    form.append("uploadedFile", buffer, {
      filename: fileName,
      contentType: resolvedContentType,
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
    logger.debug(`Upload step succeeded — handle=${handle}`);

    // 2) Create the document attached to the project. Per Workfront's
    // documented upload flow, this is a JSON object passed via `updates=`
    // (not flat query params) — critically including `currentVersion`
    // (version + fileName + ext), which the earlier flat-param version of
    // this call omitted entirely. Workfront's preview generation keys off
    // this version metadata, not just the document's own `name` — omitting
    // it is why uploads succeeded but previews never rendered.
    const updates = {
      name: fileName,
      handle,
      docObjCode: "PROJ",
      objID: projectId,
      currentVersion: {
        version: "1",
        fileName,
        ext: extensionOf(fileName),
      },
    };
    const docParams = new URLSearchParams({
      apiKey: WORKFRONT_API_KEY,
      updates: JSON.stringify(updates),
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
