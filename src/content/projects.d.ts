import type { ProjectDefinition } from "./types";

export const projectSlugs: readonly ["neorecicla", "devrecord", "neo-health"];
export type ProjectSlug = (typeof projectSlugs)[number];
export const projectRegistry: Record<ProjectSlug, ProjectDefinition>;
