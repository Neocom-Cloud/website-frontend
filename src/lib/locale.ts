import {
  LOCALE_STORAGE_KEY,
  Locale,
  getLandingPath,
  normalizeLocale
} from "./routes";

export interface RootLocaleResolution {
  locale: Locale;
  shouldPersist: boolean;
  source: "query" | "storage" | "browser" | "default";
}

export function getStoredLocale(): Locale | null {
  try {
    return normalizeLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function setStoredLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Ignore private mode and storage denial.
  }
}

export function detectBrowserLocale(): Locale {
  return detectLocaleFromCandidates([...navigator.languages, navigator.language]);
}

export function detectLocaleFromCandidates(
  candidates: ReadonlyArray<string | null | undefined>,
): Locale {
  for (const candidate of candidates) {
    const locale = normalizeLocale(candidate);

    if (locale) {
      return locale;
    }
  }

  return "pt-br";
}

export function resolveRootLocaleFromInput(args: {
  url: URL;
  storedLocale: string | null;
  browserLocales: ReadonlyArray<string | null | undefined>;
}): RootLocaleResolution {
  const { url, storedLocale, browserLocales } = args;
  const queryLocale = normalizeLocale(url.searchParams.get("lang"));

  if (queryLocale) {
    return {
      locale: queryLocale,
      shouldPersist: true,
      source: "query"
    };
  }

  const normalizedStoredLocale = normalizeLocale(storedLocale);

  if (normalizedStoredLocale) {
    return {
      locale: normalizedStoredLocale,
      shouldPersist: false,
      source: "storage"
    };
  }

  const browserLocale = detectLocaleFromCandidates(browserLocales);

  if (browserLocales.length > 0) {
    return {
      locale: browserLocale,
      shouldPersist: true,
      source: "browser"
    };
  }

  return {
    locale: "pt-br",
    shouldPersist: true,
    source: "default"
  };
}

export function resolveRootLocale(url: URL): Locale {
  const resolution = resolveRootLocaleFromInput({
    url,
    storedLocale: getStoredLocale(),
    browserLocales: [...navigator.languages, navigator.language]
  });

  if (resolution.shouldPersist) {
    setStoredLocale(resolution.locale);
  }

  return resolution.locale;
}

export function getRootRedirectPath(url: URL): string {
  return getLandingPath(resolveRootLocale(url));
}
