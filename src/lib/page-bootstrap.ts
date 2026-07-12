import {
  Locale,
  PageKind,
  ProjectSlug,
  getPagePath,
  isLocale,
  isProjectSlug,
  normalizeLocale
} from "./routes";

export function getDocumentLocale(dataset: DOMStringMap): Locale {
  const value = dataset.locale;

  if (!isLocale(value)) {
    throw new Error("Invalid or missing locale dataset.");
  }

  return value;
}

export function getPageKind(dataset: DOMStringMap): PageKind {
  const value = dataset.pageKind;

  if (value === "landing" || value === "project") {
    return value;
  }

  throw new Error("Invalid or missing page kind dataset.");
}

export function getProjectSlug(
  dataset: DOMStringMap,
  pageKind: PageKind,
): ProjectSlug | undefined {
  if (pageKind !== "project") {
    return undefined;
  }

  const value = dataset.projectSlug;

  if (!isProjectSlug(value)) {
    throw new Error("Invalid or missing project slug dataset.");
  }

  return value;
}

export type QueryLocaleOverrideAction =
  | {
      type: "none";
      localeToStore: null;
    }
  | {
      type: "redirect";
      localeToStore: Locale;
      targetPath: string;
    }
  | {
      type: "strip-query";
      localeToStore: Locale;
      cleanedPath: string;
    };

export function getQueryLocaleOverrideAction(args: {
  currentLocale: Locale;
  pageKind: PageKind;
  projectSlug?: ProjectSlug;
  url: URL;
}): QueryLocaleOverrideAction {
  const { currentLocale, pageKind, projectSlug, url } = args;
  const queryLocale = normalizeLocale(url.searchParams.get("lang"));

  if (!queryLocale) {
    return {
      type: "none",
      localeToStore: null
    };
  }

  if (queryLocale !== currentLocale) {
    return {
      type: "redirect",
      localeToStore: queryLocale,
      targetPath: getPagePath(queryLocale, pageKind, projectSlug)
    };
  }

  url.searchParams.delete("lang");

  return {
    type: "strip-query",
    localeToStore: queryLocale,
    cleanedPath: `${url.pathname}${url.search}${url.hash}`
  };
}
