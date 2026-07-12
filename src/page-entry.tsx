import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles/global.css";
import { Locale, PageKind, ProjectSlug } from "./lib/routes";
import { setStoredLocale } from "./lib/locale";
import {
  getDocumentLocale,
  getPageKind,
  getProjectSlug,
  getQueryLocaleOverrideAction
} from "./lib/page-bootstrap";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Missing #root mount element.");
}

const locale = getDocumentLocale(document.documentElement.dataset);
const pageKind = getPageKind(document.documentElement.dataset);
const projectSlug = getProjectSlug(document.documentElement.dataset, pageKind);

applyQueryLocaleOverride(locale, pageKind, projectSlug);

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App locale={locale} pageKind={pageKind} projectSlug={projectSlug} />
  </React.StrictMode>,
);

function applyQueryLocaleOverride(
  locale: Locale,
  pageKind: PageKind,
  projectSlug?: ProjectSlug,
): void {
  const action = getQueryLocaleOverrideAction({
    currentLocale: locale,
    pageKind,
    projectSlug,
    url: new URL(window.location.href)
  });

  if (action.type === "none") {
    return;
  }

  setStoredLocale(action.localeToStore);

  if (action.type === "redirect") {
    window.location.replace(action.targetPath);
    return;
  }

  window.history.replaceState({}, "", action.cleanedPath);
}
