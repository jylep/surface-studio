import React from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

let rootEl = document.getElementById('root');

if (rootEl === null) {
  document.body.innerHTML = '<div id="root"></div>';
  rootEl = document.getElementById('root') as HTMLElement; // casting because we know it won't be null
}

const root = createRoot(rootEl);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);