/*
 * <license header>
 */

import { useEffect, useState } from "react";
import { ProgressCircle } from "@react-spectrum/s2";
import { style } from "@react-spectrum/s2/style" with { type: "macro" };
import GatingDashboard from "./dashboard/GatingDashboard";
import ChatWidget from "./chat/ChatWidget";
import { loadProject } from "../data/loadProject";

const centered = style({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: 40,
});
const errorWrap = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 8,
  padding: 40,
  textAlign: "center",
});
const errorTitle = style({ font: "heading", color: "neutral" });
const errorBody = style({ font: "body", color: "neutral-subdued", maxWidth: 384 });

/**
 * Project Status route. Loads the project from Workfront and maps it to the
 * dashboard shape. On failure the deployed app shows an API-failure message
 * (never mock data); mock data is used only in local development. See
 * `data/loadProject.js`.
 */
const ProjectstatusMainMenuItem = () => {
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    let active = true;
    loadProject().then((result) => {
      if (active) setState({ status: "loaded", ...result });
    });
    return () => {
      active = false;
    };
  }, []);

  let content;
  if (state.status === "loading") {
    content = (
      <div className={centered}>
        <ProgressCircle aria-label="Loading project…" isIndeterminate />
      </div>
    );
  } else if (state.project) {
    content = <GatingDashboard project={state.project} />;
  } else {
    content = (
      <div className={errorWrap}>
        <div className={errorTitle}>Unable to load project</div>
        <div className={errorBody}>
          We couldn&rsquo;t reach the Workfront service to load this project.
          Please refresh the page or try again later.
        </div>
      </div>
    );
  }

  return (
    <>
      {content}
      <ChatWidget />
    </>
  );
};

export default ProjectstatusMainMenuItem;
