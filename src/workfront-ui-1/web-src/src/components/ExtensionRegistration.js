/*
 * <license header>
 */

import { useEffect } from "react";
import { Text } from "@react-spectrum/s2";
import { register } from "@adobe/uix-guest";
import { extensionId } from "./Constants";
import metadata from "../../../../app-metadata.json";
import { icon1, icon2 } from "./icons";

// register() opens a guest connection to the host; calling it more than once in
// the same iframe (a re-render or a StrictMode double-invoke) races competing
// connections and breaks the handshake. This module-level flag persists across
// re-renders and StrictMode remounts, so registration happens exactly once.
let registered = false;

function ExtensionRegistration() {
  useEffect(() => {
    if (registered) return;
    registered = true;
    const init = async () => {
      console.log("[ExtensionRegistration] registering with host:", extensionId);
      const guestConnection = await register({
        metadata,
        methods: {
          id: extensionId,
          mainMenu: {
            getItems() {
              return [
                {
                  id: "project-status",
                  url: "/index.html#/project-status",
                  label: "Project Status",
                  icon: icon1,
                },
                // @todo YOUR HEADER BUTTONS DECLARATION SHOULD BE HERE
              ];
            },
          },
          secondaryNav: {
            PROJECT: {
              getItems() {
                return [
                  {
                    id: "project-status-left-panel",
                    url: "/index.html#/project-status",
                    label: "Project Status",
                    icon: icon2,
                  },
                  // @todo YOUR SECONDARY NAV BUTTONS DECLARATION SHOULD BE HERE
                ];
              },
            },
          },
        },
      });
      console.info(
        "[ExtensionRegistration] registered with host:",
        guestConnection,
        guestConnection.sharedContext,
      );
    };
    init().catch((error) => {
      registered = false; // allow a retry if registration failed
      // eslint-disable-next-line no-console
      console.error(error);
    });
  }, []);

  return <Text>IFrame for integration with Host (Workfront)...</Text>;
}

export default ExtensionRegistration;
