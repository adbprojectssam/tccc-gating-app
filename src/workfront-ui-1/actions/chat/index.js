/*
 * <license header>
 */

/**
 * chat — server-side proxy to the Adobe agent chat endpoint.
 *
 * The browser can't call the agent directly: the endpoint doesn't return CORS
 * headers for the deployed origin, so cross-origin calls are blocked for every
 * user except on localhost. This action proxies the call server-side (same-origin
 * from the browser's perspective), forwarding the caller's IMS token in the
 * agent-owning org's context, reading the streamed SSE response to completion,
 * and returning the full text + contextId.
 *
 * NOTE: Adobe I/O Runtime web actions can't stream a response, so the agent's
 * token-by-token SSE is buffered here and returned as one payload. Blocking web
 * invocations also cap at ~60s, which bounds how long an agent reply can take.
 * Secured with require-adobe-auth.
 */
const fetch = require("node-fetch");
const { Core } = require("@adobe/aio-sdk");
const {
  errorResponse,
  stringParameters,
  checkMissingRequestInputs,
} = require("../utils");

const AGENT_ENDPOINT =
  "https://agents.automations.adobe.com/api/v3/agents/01a07c15-5ca8-7061-833f-ce649478805f/chat";

// The org that OWNS the agent (from the working cURL). The request must be made
// in this org's context regardless of the signed-in user's own org.
const AGENT_ORG_ID = "9075A2B154DE8AF80A4C98A7@AdobeOrg";

/** Accumulate display text/contextId from one SSE `data:` payload. */
function handleData(data, state) {
  const s = String(data).trim();
  if (!s || s === "[DONE]") return;
  let obj = null;
  try {
    obj = JSON.parse(s);
  } catch (e) {
    // Non-JSON data line — treat as raw text.
    state.text += s;
    return;
  }
  if (obj.type === "done") {
    if (obj.contextId) state.contextId = obj.contextId;
    return;
  }
  if (obj.type === "token") {
    if (obj.content) state.text += obj.content;
    return;
  }
  if (obj.type === "error") {
    // The agent accepted the request but its own execution failed upstream.
    state.error = obj.hint || "the assistant hit an error during execution";
    if (obj.upstreamStatus) state.upstreamStatus = obj.upstreamStatus;
    return;
  }
  // Unknown shape — best-effort text extraction.
  const candidate =
    obj.delta ??
    obj.content ??
    obj.text ??
    obj.output ??
    obj.response ??
    obj.answer ??
    (obj.message && (typeof obj.message === "string" ? obj.message : obj.message.content)) ??
    "";
  if (typeof candidate === "string") state.text += candidate;
}

async function main(params) {
  const logger = Core.Logger("chat", { level: params.LOG_LEVEL || "info" });
  try {
    logger.info("Calling the chat action");
    logger.debug(stringParameters(params));

    const errorMessage = checkMissingRequestInputs(params, ["prompt"], ["authorization"]);
    if (errorMessage) return errorResponse(400, errorMessage, logger);

    const token = String((params.__ow_headers || {}).authorization || "").replace(
      /^Bearer\s+/i,
      "",
    );
    if (!token) return errorResponse(401, "missing IMS token", logger);

    const payload = { prompt: params.prompt };
    if (params.contextId) payload.contextId = params.contextId;

    const res = await fetch(AGENT_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "x-gw-ims-org-id": AGENT_ORG_ID,
        "x-headless-integration": "true",
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let detail = `status ${res.status}`;
      try {
        const body = await res.json();
        detail = (body && (body.error?.message || body.message)) || detail;
      } catch (e) {
        /* non-JSON error body */
      }
      return errorResponse(
        res.status && res.status >= 400 ? res.status : 502,
        `Chat request failed: ${detail}`,
        logger,
      );
    }

    // Buffer the whole SSE response and parse the typed events.
    const raw = await res.text();
    const state = { text: "", contextId: null, error: null, upstreamStatus: null };
    for (const evt of raw.split("\n\n")) {
      for (const line of evt.split("\n")) {
        const t = line.replace(/^\s+/, "");
        if (t.startsWith("data:")) handleData(t.slice(5).trim(), state);
      }
    }

    // An error event with no usable text → surface it (don't return "(no response)").
    if (state.error && !state.text) {
      logger.warn(`agent execution error (upstream ${state.upstreamStatus || "?"}): ${state.error}`);
      const status = state.upstreamStatus && state.upstreamStatus >= 400 ? state.upstreamStatus : 502;
      return errorResponse(status, `Assistant error: ${state.error}`, logger);
    }

    return { statusCode: 200, body: { text: state.text, contextId: state.contextId } };
  } catch (error) {
    logger.error(error);
    const detail = error && error.message ? error.message : "server error";
    return errorResponse(500, `Chat error: ${detail}`, logger);
  }
}

exports.main = main;
