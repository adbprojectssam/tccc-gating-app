/*
 * <license header>
 */

import { useEffect, useState } from "react";
import { ProgressCircle } from "@react-spectrum/s2";
import GatingDashboard from "./dashboard/GatingDashboard";
import ChatWidget from "./chat/ChatWidget";
import { loadProject } from "../data/loadProject";
// import { register } from "@adobe/uix-guest";
// import { extensionId } from "./Constants";

/**
 * Project Status route. Loads the project from Workfront and maps it to the
 * dashboard shape; on failure (e.g. local dev / no Workfront session) it falls
 * back to the bundled mock so the UI still renders. See `data/loadProject.js`.
 */
const ProjectstatusMainMenuItem = () => {
  const [project, setProject] = useState(null);
  // const [projectId, setProjectId] = useState(null);
  // const [connection, setConnection] = useState(null);

  useEffect(() => {
    let active = true;
    loadProject().then((result) => {
      if (active) setProject(result.project);
    });
    return () => {
      active = false;
    };
  }, []);

  // useEffect(async () => {
  //   const guestConnection = await register({
  //     id: extensionId,
  //     methods: {},
  //   });
  //   setConnection(guestConnection);
  //   const context = guestConnection?.sharedContext;
  //   console.log("context", context);
  //   // objCode will be "PROJECT", objID is the project's ID
  //   setProjectId(context?.get("objID"));
  // }, []);

  return (
    <>
      {project ? (
        <GatingDashboard project={project} />
      ) : (
        <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
          <ProgressCircle aria-label="Loading project…" isIndeterminate />
        </div>
      )}
      <ChatWidget />
    </>
  );
};

export default ProjectstatusMainMenuItem;
