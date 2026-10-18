import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { READING_NEST_RESOURCE_VERSION } from "@ss/shared";
import { Boot } from "./Boot.js";
import { initializeReadingHostBridge } from "./bridge/host.js";
import "./styles/tokens.css";
import "./styles/app.css";
import "./styles/dessert-room-v2.css";
import "./styles/dessert-room-reference.css";
import "./styles/mobile-release.css";

const rootElement = document.getElementById("root");

const syncHostEmbedding = () => {
  // ChatGPT's mobile Site viewer can host us as a top-level WebView rather
  // than an iframe.  `window.parent === window` therefore does not mean the
  // page is standalone on iPhone; the injected `window.openai` object is the
  // reliable second signal.  Re-run this when the host globals arrive because
  // some WebViews install them after the document module has started.
  document.documentElement.dataset.hostEmbedding =
    window.parent !== window || Boolean(window.openai) ? "embedded" : "standalone";
  // ChatGPT measures inline widgets before React effects run. Expose the
  // display mode synchronously so the first layout is already phone-sized.
  document.documentElement.dataset.displayMode =
    window.openai?.hostContext?.displayMode ?? "inline";
};

syncHostEmbedding();
window.addEventListener("openai:set_globals", syncHostEmbedding);

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <Boot />
    </StrictMode>
  );
  queueMicrotask(initializeReadingHostBridge);
} else {
  document.body.insertAdjacentHTML(
    "afterbegin",
      `<main class="boot-diagnostics" role="alert"><strong>冰冰和星星的小书房加载状态</strong><p>Missing app root. Please refresh the widget.</p><dl><div><dt>resourceVersion</dt><dd>${READING_NEST_RESOURCE_VERSION}</dd></div><div><dt>bootStage</dt><dd>missing-root</dd></div></dl></main>`
  );
}
