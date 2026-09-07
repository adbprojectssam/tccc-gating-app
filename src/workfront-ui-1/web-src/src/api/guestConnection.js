/*
 * <license header>
 */

/**
 * A single shared UIX guest connection for this view iframe.
 *
 * `attach()` builds a NEW GuestUI and runs a fresh postMessage handshake with
 * the Workfront host every time it is called (see @adobe/uix-guest: attach →
 * `new GuestUI(config)` + `_connect()`). Calling it from more than one place in
 * the same iframe — e.g. the project loader AND the chat widget's auth — opens
 * competing guest connections in one window, which can break the host handshake
 * (mutual "timed out awaiting initial message" errors).
 *
 * Memoizing one connection promise here keeps exactly one guest per iframe. On
 * failure the cache is cleared so a later call can retry.
 */
import { attach } from "@adobe/uix-guest";
import { extensionId } from "../components/Constants";

let connectionPromise = null;

export function getGuestConnection() {
  if (!connectionPromise) {
    connectionPromise = attach({ id: extensionId }).catch((error) => {
      connectionPromise = null; // allow a retry on the next call
      throw error;
    });
  }
  return connectionPromise;
}

export default getGuestConnection;
