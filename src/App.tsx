import { useEffect, useState } from "react";
import {
  getProjectMailto,
  projectRegistry,
  siteContent
} from "./content/site.js";
import type { IconName } from "./content/types";
import { Icon } from "./components/icons";
import {
  CONTACT_EMAIL,
  Locale,
  PageKind,
  ProjectSlug,
  THEME_STORAGE_KEY,
  Theme,
  getAlternateLocale,
  getLandingPath,
  getPagePath
} from "./lib/routes";
import { setStoredLocale } from "./lib/locale";

interface AppProps {
  locale: Locale;
  pageKind: PageKind;
  projectSlug?: ProjectSlug;
}

export function App({ locale, pageKind, projectSlug }: AppProps) {
  const copy = siteContent[locale];
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage denial.
    }
  }, [theme]);

  const alternateLocale = getAlternateLocale(locale);
  const alternatePath = getPagePath(alternateLocale, pageKind, projectSlug);
  const brandHref = getLandingPath(locale);
  const projectsHref =
    pageKind === "landing" ? "#projects" : `${brandHref}#projects`;
  const missionHref =
    pageKind === "landing" ? "#mission" : `${brandHref}#mission`;
  const contactHref =
    pageKind === "landing" ? "#contact" : `${brandHref}#contact`;

  return (
    <div className="page">
      <header className="nav">
        <a className="nav-logo" href={brandHref}>
          NeoCom
        </a>

        <nav className="nav-links" aria-label="Primary">
          <a href={projectsHref}>{copy.nav.projects}</a>
          <a href={missionHref}>{copy.nav.mission}</a>
          <a href={contactHref}>{copy.nav.contact}</a>
        </nav>

        <div className="nav-actions">
          <div className="locale-switcher" aria-label={copy.localeLabel}>
            <Icon className="locale-icon" name="globe" />
            {(["pt-br", "en"] as const).map((option) => {
              const href = getPagePath(option, pageKind, projectSlug);
              const isActive = option === locale;

              return (
                <a
                  key={option}
                  aria-current={isActive ? "page" : undefined}
                  className={`locale-link${isActive ? " active" : ""}`}
                  href={href}
                  onClick={() => setStoredLocale(option)}
                >
                  {copy.localeNames[option]}
                </a>
              );
            })}
          </div>

          <button
            aria-label={
              theme === "dark" ? copy.themeToggle.toLight : copy.themeToggle.toDark
            }
            className="theme-toggle"
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} />
            <span>
              {theme === "dark" ? copy.themeToggle.toLight : copy.themeToggle.toDark}
            </span>
          </button>
        </div>
      </header>

      {pageKind === "landing" ? (
        <LandingPage locale={locale} />
      ) : (
        <ProjectPage locale={locale} projectSlug={projectSlug!} />
      )}

      <footer className="footer">
        <div className="footer-row">
          <p>
            <span>NeoCom</span> / neocom.cloud / {new Date().getFullYear()}
          </p>
          <a className="footer-mail" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </div>
        <p>{copy.footer}</p>
      </footer>

      <div className="sr-only">
        <a href={alternatePath} lang={siteContent[alternateLocale].htmlLang}>
          {alternateLocale}
        </a>
      </div>
    </div>
  );
}

function LandingPage({ locale }: Pick<AppProps, "locale">) {
  const copy = siteContent[locale];

  return (
    <>
      <section className="hero">
        <div className="hero-glow" />
        <img
          alt="NeoCom"
          className="hero-mark"
          src="/assets/NeoCom_Icon_Final_v2.svg"
        />
        <div className="hero-eyebrow">{copy.hero.eyebrow}</div>
        <h1 className="hero-title">
          {copy.hero.titleLead}
          <br />
          <span className="morph-wrap">
            <RotatingWord phrases={copy.hero.phrases} />
          </span>
        </h1>
        <p className="hero-sub">{copy.hero.subtitle}</p>
        <a className="hero-btn" href="#projects">
          <Icon name="arrow" />
          <span>{copy.hero.cta}</span>
        </a>
      </section>

      <div className="divider" />

      <section className="section" id="projects">
        <div className="section-inner">
          <SectionHeading
            eyebrow={copy.values.eyebrow}
            title={copy.values.title}
            subtitle={copy.values.subtitle}
          />

          <div className="chips">
            {copy.values.items.map((item) => (
              <div className="chip" key={item.label}>
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <SectionHeading
            eyebrow={copy.projects.eyebrow}
            title={copy.projects.title}
            subtitle={copy.projects.subtitle}
          />

          <div className="projects-grid">
            {(Object.keys(copy.projects.items) as ProjectSlug[]).map((slug) => (
              <ProjectCard key={slug} locale={locale} projectSlug={slug} />
            ))}
          </div>
        </div>
      </section>

      <div className="divider" />

      <section className="section" id="mission">
        <div className="section-inner">
          <SectionHeading
            eyebrow={copy.mission.eyebrow}
            title={copy.mission.title}
          />
          <div className="mission-block">
            <p>{copy.mission.body}</p>
          </div>
        </div>
      </section>

      <div className="divider" />

      <section className="section" id="contact">
        <div className="section-inner">
          <SectionHeading
            eyebrow={copy.contact.eyebrow}
            title={copy.contact.title}
            subtitle={copy.contact.subtitle}
          />
          <div className="contact-card">
            <div className="contact-copy">
              <div className="contact-label">
                <Icon name="mail" />
                <span>{copy.contact.emailLabel}</span>
              </div>
              <a className="contact-email" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
              <p className="contact-note">{copy.contact.availability}</p>
            </div>
            <a className="hero-btn" href={`mailto:${CONTACT_EMAIL}`}>
              <Icon name="arrow" />
              <span>{copy.contact.button}</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

function ProjectPage({
  locale,
  projectSlug
}: {
  locale: Locale;
  projectSlug: ProjectSlug;
}) {
  const copy = siteContent[locale];
  const project = copy.projects.items[projectSlug];
  const visual = projectRegistry[projectSlug];

  return (
    <>
      <section className="project-hero">
        <div className="section-inner project-hero-inner">
          <div className="project-hero-copy">
            <a className="back-link" href={`${getLandingPath(locale)}#projects`}>
              <Icon name="back" />
              <span>{copy.projectPage.backToProjects}</span>
            </a>

            <div className={`project-cat ${visual.accent}`}>{project.category}</div>
            <h1 className="project-page-title">{project.name}</h1>
            <p className="project-page-intro">{project.detailIntro}</p>

            <div className="project-hero-actions">
              <a className="hero-btn" href={getProjectMailto(locale, project.name)}>
                <Icon name="arrow" />
                <span>{project.cta}</span>
              </a>
              {project.badge ? (
                <span className="project-badge static-badge">{project.badge}</span>
              ) : null}
            </div>
          </div>

          <aside className={`project-side-card ${visual.accent}`}>
            <div className={`project-media ${visual.accent}`}>
              <img
                alt={project.artAlt}
                className={`project-art${visual.artClassName ? ` ${visual.artClassName}` : ""}`}
                src={visual.artSrc}
              />
            </div>
            <div className="project-side-content">
              <div className="project-side-eyebrow">{project.detailEyebrow}</div>
              <p className="detail-text">{project.summary}</p>
            </div>
          </aside>
        </div>
      </section>

      <div className="divider" />

      <section className="section">
        <div className="section-inner detail-layout">
          <div className="detail-column">
            <div className="sec-label">{copy.projectPage.sectionsTitle}</div>
            {project.sections.map((section) => (
              <article className="detail-panel" key={section.title}>
                <h2 className="detail-title">{section.title}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p className="detail-text" key={paragraph}>
                    {paragraph}
                  </p>
                ))}
              </article>
            ))}
          </div>

          <div className="detail-sidebar">
            <div className="detail-panel compact">
              <div className="sec-label">{copy.projectPage.highlightsTitle}</div>
              <ul className="highlight-list">
                {project.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </div>

            <div className="detail-panel compact">
              <div className="sec-label">{copy.projectPage.statusTitle}</div>
              <p className="detail-text">{project.status}</p>
            </div>

            <div className="detail-panel compact contact-panel">
              <p className="detail-text">{copy.projectPage.contactNote}</p>
              <a className="hero-btn" href={getProjectMailto(locale, project.name)}>
                <Icon name="mail" />
                <span>{project.cta}</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ProjectCard({
  locale,
  projectSlug
}: {
  locale: Locale;
  projectSlug: ProjectSlug;
}) {
  const copy = siteContent[locale];
  const project = copy.projects.items[projectSlug];
  const visual = projectRegistry[projectSlug];

  return (
    <a className={`project-tile ${visual.accent}`} href={getPagePath(locale, "project", projectSlug)}>
      {project.badge ? <div className="project-badge">{project.badge}</div> : null}
      <div className={`tile-topline ${visual.accent}`} />
      <div className={`project-media ${visual.accent}`}>
        <img
          alt={project.artAlt}
          className={`project-art${visual.artClassName ? ` ${visual.artClassName}` : ""}`}
          src={visual.artSrc}
        />
      </div>
      <div className="project-copy">
        <div className={`project-cat ${visual.accent}`}>{project.category}</div>
        <div className="project-name">{project.name}</div>
        <div className="project-desc">{project.summary}</div>
        <div className="project-meta">
          <Icon name={projectIconMap[projectSlug]} />
          <span>{project.cardCta}</span>
        </div>
      </div>
    </a>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <>
      <div className="sec-label">{eyebrow}</div>
      <div className="sec-title">{title}</div>
      {subtitle ? <div className="sec-sub">{subtitle}</div> : null}
    </>
  );
}

function RotatingWord({ phrases }: { phrases: string[] }) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [characterIndex, setCharacterIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mediaQuery.matches);
    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const activePhrase = phrases[phraseIndex];
    const delay = paused ? 1500 : deleting ? 50 : 88;

    const timeout = window.setTimeout(() => {
      if (paused) {
        setPaused(false);
        return;
      }

      if (!deleting) {
        const nextIndex = characterIndex + 1;
        setCharacterIndex(nextIndex);

        if (nextIndex === activePhrase.length) {
          setPaused(true);
          setDeleting(true);
        }

        return;
      }

      const nextIndex = characterIndex - 1;
      setCharacterIndex(nextIndex);

      if (nextIndex === 0) {
        setDeleting(false);
        setPhraseIndex((phraseIndex + 1) % phrases.length);
      }
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [characterIndex, deleting, paused, phraseIndex, phrases, reducedMotion]);

  const phrase = phrases[phraseIndex];
  const visibleText = reducedMotion ? phrase : phrase.slice(0, characterIndex);

  return (
    <>
      <span id="morph">{visibleText}</span>
      {!reducedMotion ? <span className="cursor" /> : null}
    </>
  );
}

function readStoredTheme(): Theme {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

const projectIconMap: Record<ProjectSlug, IconName> = {
  neorecicla: "leaf",
  devrecord: "code",
  "neo-health": "pulse"
};
