/*
 * <license header>
 */

import { ErrorBoundary } from "react-error-boundary";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "@react-spectrum/s2";
import ExtensionRegistration from "./ExtensionRegistration";

import Projectstatus from "./ProjectstatusMainMenuItem";

function App() {
  return (
    <Provider background="base">
      <Router>
        <ErrorBoundary onError={onError} FallbackComponent={fallbackComponent}>
          <Routes>
            <Route index element={<ExtensionRegistration />} />
            <Route
              exact
              path="index.html"
              element={<ExtensionRegistration />}
            />
            {/* @todo YOUR CUSTOM ROUTES SHOULD BE HERE */}
            <Route exact path="project-status" element={<Projectstatus />} />
          </Routes>
        </ErrorBoundary>
      </Router>
    </Provider>
  );

  // error handler on UI rendering failure
  function onError(e, info) {}

  // component to show if UI fails rendering
  function fallbackComponent({ error, resetErrorBoundary }) {
    return (
      <>
        <h1 style={{ textAlign: "center", marginTop: "20px" }}>
          Phly, phly... Something went wrong :(
        </h1>
        <pre>{error.message}</pre>
      </>
    );
  }
}

export default App;
