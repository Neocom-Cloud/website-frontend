import type { ProjectDefinition } from "../content/types";
import type { Theme } from "./routes";

/**
 * Picks the artwork variant for the active theme.
 *
 * Only Apollo ships two; the others are a single mark that reads on both
 * grounds. The pages render entirely on the client, so React already knows the
 * theme on its first pass and the browser fetches one variant, not both.
 */
export function getProjectArt(project: ProjectDefinition, theme: Theme): string {
  return theme === "light" && project.artLightSrc ? project.artLightSrc : project.artSrc;
}
