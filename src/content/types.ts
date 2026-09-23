import type { Locale, ProjectSlug } from "../lib/routes";

export type Accent = "green" | "ember" | "amber";
export type ProjectTemplate = "standard";
export type IconName =
  | "lock"
  | "shield"
  | "award"
  | "certificate"
  | "users"
  | "mail"
  | "arrow"
  | "leaf"
  | "code"
  | "pulse"
  | "moon"
  | "sun"
  | "globe"
  | "back";

export interface ValuePillar {
  icon: IconName;
  label: string;
}

export interface ProjectSection {
  title: string;
  paragraphs: string[];
}

export interface ProjectCopy {
  name: string;
  category: string;
  summary: string;
  cardCta: string;
  artAlt: string;
  badge?: string;
  detailEyebrow: string;
  detailIntro: string;
  highlights: string[];
  sections: ProjectSection[];
  status: string;
  cta: string;
}

export interface SeoCopy {
  title: string;
  description: string;
  ogDescription: string;
  twitterDescription: string;
}

export interface ProjectSeoCopy {
  description: string;
  ogDescription: string;
  twitterDescription: string;
}

export interface SiteCopy {
  htmlLang: string;
  ogLocale: string;
  localeLabel: string;
  localeNames: Record<Locale, string>;
  themeToggle: {
    toDark: string;
    toLight: string;
    toDarkShort: string;
    toLightShort: string;
  };
  nav: {
    /** Accessible name for the primary navigation landmark. */
    label: string;
    projects: string;
    mission: string;
    contact: string;
  };
  hero: {
    eyebrow: string;
    titleLead: string;
    phrases: string[];
    subtitle: string;
    cta: string;
    secondaryCta: string;
  };
  values: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: ValuePillar[];
  };
  projects: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: Record<ProjectSlug, ProjectCopy>;
  };
  mission: {
    eyebrow: string;
    title: string;
    body: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    subtitle: string;
    emailLabel: string;
    availability: string;
    button: string;
  };
  projectPage: {
    backToProjects: string;
    highlightsTitle: string;
    sectionsTitle: string;
    statusTitle: string;
    contactNote: string;
  };
  seo: {
    landing: SeoCopy;
    projects: Record<ProjectSlug, ProjectSeoCopy>;
  };
  footer: string;
}

export interface ProjectDefinition {
  accent: Accent;
  artSrc: string;
  socialImageSrc?: string;
  template: ProjectTemplate;
}
