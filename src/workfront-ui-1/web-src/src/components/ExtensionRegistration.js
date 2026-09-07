/*
 * <license header>
 */

import { Text } from "@react-spectrum/s2";
import { register } from "@adobe/uix-guest";
import { extensionId } from "./Constants";
import metadata from "../../../../app-metadata.json";
import { icon1, icon2 } from "./icons";

function ExtensionRegistration() {
  const init = async () => {
    console.log('[ExtensionRegistration] registering with host:', extensionId);
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
    console.info("[ExtensionRegistration] registered with host:", guestConnection, guestConnection.sharedContext);
  };
  init().catch(console.error);

  return <Text>IFrame for integration with Host (Workfront)...</Text>;
}

export default ExtensionRegistration;
