import type { Locale } from "../lib/routes";
import type { SiteCopy } from "./types";

export { locales } from "./locales/index.js";
export { projectRegistry, projectSlugs } from "./projects.js";

export const siteContent: Record<Locale, SiteCopy>;

export function getProjectMailto(
  locale: Locale,
  projectName: string,
): string;
