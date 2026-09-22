/*
 * <license header>
 */

const fetch = require("node-fetch");
const FormData = require("form-data");
const { Core } = require("@adobe/aio-sdk");

const API_VERSION = "v22.0";
const MAX_UPLOAD_BYTES = 300 * 1024 * 1024;

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

function extensionOf(fileName) {
  const match = /\.([a-z0-9]+)$/i.exec(String(fileName || ""));
  return match ? match[1].toLowerCase() : "";
}

function isAllowedHost(hostname, allowed) {
  if (!hostname) return false;
  const list = String(allowed || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (list.length === 0) {
    return /^[a-z0-9-]+\.my\.workfront\.com$/i.test(hostname);
  }
  return list.some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

function validateStagedUrl(fileUrl) {
  const url = new URL(String(fileUrl));
  if (url.protocol !== "https:" || url.hostname !== "firefly.azureedge.net") {
    throw new Error("Invalid staged file URL");
  }
  return url.toString();
}

async function main(params) {
  const logger = Core.Logger("upload-artifact-worker", {
    level: params.LOG_LEVEL || "info",
  });
  const {
    hostname,
    projectId,
    fileName,
    contentType,
    fileUrl,
    size,
    WORKFRONT_API_KEY,
    WORKFRONT_ALLOWED_HOSTS,
  } = params;

  try {
    if (!WORKFRONT_API_KEY) throw new Error("WORKFRONT_API_KEY is not configured");
    if (!isAllowedHost(hostname, WORKFRONT_ALLOWED_HOSTS)) {
      throw new Error(`host not allowed: ${hostname}`);
    }
    const stagedUrl = validateStagedUrl(fileUrl);
    const expectedSize = Number(size);
    if (!Number.isFinite(expectedSize) || expectedSize <= 0 || expectedSize > MAX_UPLOAD_BYTES) {
      throw new Error("Staged file size must be between 1 byte and 300 MB");
    }

    const stagedResponse = await fetch(stagedUrl);
    if (!stagedResponse.ok || !stagedResponse.body) {
      throw new Error(`Could not read staged file (${stagedResponse.status})`);
    }
    const actualSize = Number(stagedResponse.headers.get("content-length"));
    if (Number.isFinite(actualSize) && actualSize > 0 && actualSize !== expectedSize) {
      throw new Error(`Staged file size mismatch: expected ${expectedSize}, received ${actualSize}`);
    }

    const extension = extensionOf(fileName);
    if (!extension) throw new Error("fileName must include an extension");
    const resolvedContentType =
      EXTENSION_CONTENT_TYPES[extension] || contentType || "application/octet-stream";

    const form = new FormData();
    form.append("uploadedFile", stagedResponse.body, {
      filename: fileName,
      contentType: resolvedContentType,
      knownLength: expectedSize,
    });
    const uploadUrl =
      `https://${hostname}/attask/api/${API_VERSION}/upload` +
      `?apiKey=${encodeURIComponent(WORKFRONT_API_KEY)}`;
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
    });
    const uploadBody = await uploadResponse.json().catch(() => null);
    const handle = uploadBody && uploadBody.data && uploadBody.data.handle;
    if (!uploadResponse.ok || !handle) {
      const detail =
        (uploadBody && uploadBody.error && uploadBody.error.message) ||
        `status ${uploadResponse.status}`;
      throw new Error(`Workfront upload error: ${detail}`);
    }

    const updates = {
      name: fileName,
      handle,
      docObjCode: "PROJ",
      objID: projectId,
      currentVersion: {
        version: "1.0",
        fileName,
        ext: extension,
        handle,
      },
    };
    const documentParams = new URLSearchParams({
      apiKey: WORKFRONT_API_KEY,
      updates: JSON.stringify(updates),
    });
    const documentUrl =
      `https://${hostname}/attask/api/${API_VERSION}/document?${documentParams.toString()}`;
    const documentResponse = await fetch(documentUrl, {
      method: "POST",
      headers: { Accept: "application/json" },
    });
    const documentBody = await documentResponse.json().catch(() => null);
    const document = documentBody && documentBody.data;
    if (!documentResponse.ok || !document || !document.ID) {
      const detail =
        (documentBody && documentBody.error && documentBody.error.message) ||
        `status ${documentResponse.status}`;
      throw new Error(`Workfront document create error: ${detail}`);
    }

    return {
      status: "done",
      data: {
        id: document.ID,
        name: document.name || fileName,
        ext: extension,
        contentType: resolvedContentType,
      },
    };
  } catch (error) {
    logger.error(error);
    return {
      status: "error",
      error: error && error.message ? error.message : "server error",
    };
  } finally {
    if (fileUrl) {
      try {
        await fetch(String(fileUrl), { method: "DELETE" });
      } catch (cleanupError) {
        logger.warn(`Could not delete staged file: ${cleanupError.message}`);
      }
    }
  }
}

exports.main = main;