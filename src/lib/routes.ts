import { locales } from "../content/locales/index.js";
import { projectSlugs } from "../content/projects.js";
import {
  CONTACT_EMAIL,
  LOCALE_STORAGE_KEY,
  SITE_ORIGIN,
  THEME_STORAGE_KEY
} from "../site/constants.js";

export type Locale = (typeof locales)[number];
export type ProjectSlug = (typeof projectSlugs)[number];
export type PageKind = "landing" | "project";
export type Theme = "light" | "dark";

export {
  CONTACT_EMAIL,
  LOCALE_STORAGE_KEY,
  SITE_ORIGIN,
  THEME_STORAGE_KEY,
  locales,
  projectSlugs
};

export function isLocale(value: string | null | undefined): value is Locale {
  return Boolean(value && locales.includes(value as Locale));
}

export function isProjectSlug(
  value: string | null | undefined,
): value is ProjectSlug {
  return Boolean(value && projectSlugs.includes(value as ProjectSlug));
}

export function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) {
    return null;
  }

  const normalized = value.toLowerCase();

  if (normalized === "pt" || normalized === "pt-br" || normalized === "pt_br") {
    return "pt-br";
  }

  if (normalized === "en" || normalized === "en-us" || normalized === "en_us") {
    return "en";
  }

  return null;
}

export function getLandingPath(locale: Locale): string {
  return locale === "pt-br" ? "/pt-br/" : "/en/";
}

export function getProjectPath(locale: Locale, projectSlug: ProjectSlug): string {
  return `${getLandingPath(locale)}projects/${projectSlug}/`;
}

export function getPagePath(
  locale: Locale,
  pageKind: PageKind,
  projectSlug?: ProjectSlug,
): string {
  if (pageKind === "project" && projectSlug) {
    return getProjectPath(locale, projectSlug);
  }

  return getLandingPath(locale);
}

export function getAlternateLocale(locale: Locale): Locale {
  return locale === "pt-br" ? "en" : "pt-br";
}
