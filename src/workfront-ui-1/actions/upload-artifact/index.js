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
const openwhisk = require("openwhisk");
const { Core } = require("@adobe/aio-sdk");
const filesLib = require("@adobe/aio-lib-files");
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

const CONTENT_TYPE_EXTENSIONS = Object.fromEntries(
  Object.entries(EXTENSION_CONTENT_TYPES).map(([ext, type]) => [type, ext]),
);
// Prefer docx/xlsx/pptx when several Office types share a family.
CONTENT_TYPE_EXTENSIONS["image/jpg"] = "jpg";

/** Extension of `fileName` (lowercased, no dot), or '' if it has none. */
function extensionOf(fileName) {
  const m = /\.([a-z0-9]+)$/i.exec(String(fileName || ""));
  return m ? m[1].toLowerCase() : "";
}

/**
 * Resolve a usable extension for Workfront preview. Empty `ext` is a common
 * reason uploads succeed but the UI never generates a preview.
 */
function resolveExtension(fileName, browserContentType) {
  const fromName = extensionOf(fileName);
  if (fromName) return fromName;
  const type = String(browserContentType || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  return CONTENT_TYPE_EXTENSIONS[type] || "";
}

/**
 * Ensure the stored file name ends with `.${ext}` so Workfront version
 * metadata matches the binary type.
 */
function resolveFileName(fileName, ext) {
  const name = String(fileName || "upload").trim() || "upload";
  if (!ext) return name;
  if (extensionOf(name) === ext) return name;
  if (extensionOf(name)) return name; // keep caller extension if already present
  return `${name}.${ext}`;
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

// Adobe App Builder web actions are limited to comparatively small JSON payloads,
// so the direct file-in-JSON path is only for small documents. Large files are
// staged in App Builder Files storage via a presigned URL and then streamed to
// Workfront by the runtime action, which avoids the 1 MB request-body ceiling.
const MAX_BASE64_LENGTH = 900_000; // ~660KB raw

async function prepareLargeUpload(fileName, contentType, size) {
  const files = await filesLib.init();
  const safeName = String(fileName || "upload.bin")
    .replace(/[^a-zA-Z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "upload.bin";
  const storagePath = `tmp/workfront-upload/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}-${safeName}`;
  const uploadUrl = await files.generatePresignURL(storagePath, {
    expiryInSeconds: 3600,
    permissions: "rwd",
    urlType: filesLib.UrlType.external,
  });

  return {
    storagePath,
    uploadUrl,
    size,
    contentType: contentType || "application/octet-stream",
  };
}

async function resolveUploadBuffer(params) {
  const { fileBase64, fileUrl, storagePath, fileName } = params;

  if (fileUrl) {
    const stagedUrl = new URL(String(fileUrl));
    if (
      stagedUrl.protocol !== "https:" ||
      stagedUrl.hostname !== "firefly.azureedge.net"
    ) {
      throw new Error("Invalid staged file URL");
    }
    const response = await fetch(stagedUrl.toString(), { method: "GET" });
    if (!response.ok) {
      throw new Error(`failed to fetch staged file (${response.status})`);
    }
    return {
      buffer: Buffer.from(await response.arrayBuffer()),
      fileName: fileName || "upload.bin",
    };
  }

  if (storagePath) {
    const files = await filesLib.init();
    const buffer = await files.read(String(storagePath));
    return {
      buffer,
      fileName: fileName || String(storagePath).split("/").pop() || "upload.bin",
    };
  }

  if (fileBase64) {
    const base64 = String(fileBase64);
    if (base64.length > MAX_BASE64_LENGTH) {
      throw new Error(
        "File exceeds the direct App Builder request limit. Upload it to App Builder Files first and retry using the staged upload flow.",
      );
    }
    return {
      buffer: Buffer.from(base64, "base64"),
      fileName: fileName || "upload.bin",
    };
  }

  throw new Error("No upload payload was supplied");
}

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

function isValidStagedFileUrl(fileUrl) {
  try {
    const url = new URL(String(fileUrl));
    return url.protocol === "https:" && url.hostname === "firefly.azureedge.net";
  } catch (_) {
    return false;
  }
}

async function main(params) {
  const logger = Core.Logger("upload-artifact", {
    level: params.LOG_LEVEL || "info",
  });
  try {
    logger.info("Calling the upload-artifact action");
    logger.debug(
      stringParameters({
        ...params,
        fileBase64: params.fileBase64 ? "<hidden>" : undefined,
        fileUrl: params.fileUrl ? "<hidden>" : undefined,
      }),
    );

    const mode = String(params.mode || "upload").toLowerCase();

    if (mode === "prepare") {
      const { fileName, contentType, size } = params;
      if (!fileName) {
        return errorResponse(400, "fileName is required for staged uploads", logger);
      }
      const staged = await prepareLargeUpload(fileName, contentType, size || 0);
      return {
        statusCode: 200,
        body: {
          data: {
            uploadUrl: staged.uploadUrl,
            contentType: staged.contentType,
            size: staged.size,
          },
        },
      };
    }

    if (mode === "finalize" && params.fileUrl) {
      const errorMessage = checkMissingRequestInputs(
        params,
        ["hostname", "projectId", "fileName", "fileUrl"],
        [],
      );
      if (errorMessage) return errorResponse(400, errorMessage, logger);
      if (!isAllowedHost(params.hostname, params.WORKFRONT_ALLOWED_HOSTS)) {
        return errorResponse(400, `host not allowed: ${params.hostname}`, logger);
      }
      if (!isValidStagedFileUrl(params.fileUrl)) {
        return errorResponse(400, "Invalid staged file URL", logger);
      }

      const ow = openwhisk();
      const invoked = await ow.actions.invoke({
        name: "tccc-gating/upload-artifact-worker",
        params: {
          hostname: params.hostname,
          projectId: params.projectId,
          fileName: params.fileName,
          contentType: params.contentType,
          fileUrl: params.fileUrl,
          size: params.size,
        },
        blocking: false,
      });
      const jobId = invoked && invoked.activationId;
      if (!jobId) {
        return errorResponse(502, "Could not start the upload job", logger);
      }
      return { statusCode: 202, body: { data: { jobId } } };
    }

    const required = ["hostname", "projectId", "fileName"];
    if (!params.storagePath && !params.fileBase64 && !params.fileUrl) {
      required.push("fileBase64");
    }
    const errorMessage = checkMissingRequestInputs(params, required, []);
    if (errorMessage) return errorResponse(400, errorMessage, logger);

    const {
      hostname,
      projectId,
      fileName,
      contentType,
      fileBase64,
      fileUrl,
      storagePath,
      WORKFRONT_API_KEY,
      WORKFRONT_ALLOWED_HOSTS,
    } = params;
    if (!WORKFRONT_API_KEY)
      return errorResponse(500, "WORKFRONT_API_KEY is not configured", logger);
    if (!isAllowedHost(hostname, WORKFRONT_ALLOWED_HOSTS)) {
      return errorResponse(400, `host not allowed: ${hostname}`, logger);
    }

    const payload = await resolveUploadBuffer({
      fileBase64,
      fileUrl,
      storagePath,
      fileName,
    });
    const buffer = payload.buffer;
    if (!buffer || !buffer.length) {
      return errorResponse(400, "Uploaded file was empty", logger);
    }
    const directLength = String(fileBase64 || "").length;
    if (directLength > MAX_BASE64_LENGTH) {
      logger.warn(
        `Direct upload invoked with ${directLength} base64 chars; large-file staged flow should be used instead.`,
      );
    }
    // Sanity-check the decode against the input length — catches silent
    // truncation upstream (proxy/gateway) rather than a clean rejection.
    if (fileBase64) {
      const expectedLength = Math.floor((String(fileBase64).length * 3) / 4);
      if (Math.abs(buffer.length - expectedLength) > 4) {
        logger.warn(
          `Decoded buffer length (${buffer.length}) doesn't match the expected length from the base64 input (~${expectedLength}) — the upload may have been truncated in transit.`,
        );
      }
    }

    const ext = resolveExtension(fileName, contentType);
    if (!ext) {
      return errorResponse(
        400,
        "fileName must include a known extension (e.g. .pdf, .docx) so Workfront can generate a preview",
        logger,
      );
    }
    const resolvedFileName = resolveFileName(fileName, ext);
    const resolvedContentType = resolveContentType(
      resolvedFileName,
      contentType,
    );
    logger.debug(
      `Uploading ${resolvedFileName} — ${buffer.length} bytes, ext=${ext}, contentType=${resolvedContentType} (browser sent "${contentType}")`,
    );

    // 1) Upload the bytes → handle.
    const form = new FormData();
    form.append("uploadedFile", buffer, {
      filename: resolvedFileName,
      contentType: resolvedContentType,
      knownLength: buffer.length,
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
    logger.info(`Upload step succeeded — handle=${handle}`);

    // 2) Create the document attached to the project.
    // Workfront preview generation needs currentVersion with fileName + ext
    // (and the same handle). Omitting this is why upload can succeed while
    // the UI never shows a preview.
    const updates = {
      name: resolvedFileName,
      handle,
      docObjCode: "PROJ",
      objID: projectId,
      currentVersion: {
        version: "1.0",
        fileName: resolvedFileName,
        ext,
        handle,
      },
    };
    logger.debug(`Document create updates=${JSON.stringify(updates)}`);
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
      logger.error(`Document create failed — body=${JSON.stringify(docBody)}`);
      return errorResponse(
        docRes.status && docRes.status >= 400 ? docRes.status : 502,
        `Workfront document create error: ${detail}`,
        logger,
      );
    }

    logger.info(
      `Document created — id=${doc.ID}, name=${doc.name || resolvedFileName}, ext=${ext}`,
    );

    if (fileUrl) {
      try {
        await fetch(String(fileUrl), { method: "DELETE" });
      } catch (cleanupError) {
        logger.warn(`could not clean up staged upload URL: ${cleanupError.message}`);
      }
    } else if (storagePath) {
      try {
        const files = await filesLib.init();
        await files.delete(String(storagePath));
      } catch (cleanupError) {
        logger.warn(`could not clean up staged upload ${storagePath}: ${cleanupError.message}`);
      }
    }

    return {
      statusCode: 200,
      body: {
        data: {
          id: doc.ID,
          name: doc.name || resolvedFileName,
          ext,
          contentType: resolvedContentType,
        },
      },
    };
  } catch (error) {
    logger.error(error);
    const detail = error && error.message ? error.message : "server error";
    return errorResponse(500, `Workfront API error: ${detail}`, logger);
  }
}

exports.main = main;
