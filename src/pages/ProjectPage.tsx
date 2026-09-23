import { Icon } from "../components/icons";
import { ButtonLink } from "../components/ui";
import { getProjectMailto, projectRegistry, siteContent } from "../content/site.js";
import { Locale, ProjectSlug, getLandingPath } from "../lib/routes";

interface ProjectPageProps {
  locale: Locale;
  projectSlug: ProjectSlug;
}

export function ProjectPage({ locale, projectSlug }: ProjectPageProps) {
  const copy = siteContent[locale];
  const project = copy.projects.items[projectSlug];
  const visual = projectRegistry[projectSlug];
  const mailto = getProjectMailto(locale, project.name);

  return (
    <>
      <section
        className="relative mx-5 overflow-hidden rounded-stage bg-project-field px-6 pt-10 pb-12 md:px-12 md:pb-[52px]"
        data-testid="project-hero"
      >
        <div aria-hidden="true" className="absolute top-0 left-6 h-[3px] w-24 bg-project md:left-12" />
        <img
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[-150px] left-1/2 h-auto w-[520px] object-contain opacity-[0.16] select-none"
          src={visual.artSrc}
        />

        <a
          className="relative inline-flex items-center gap-2.5 text-[15px] text-ink-2 no-underline"
          href={`${getLandingPath(locale)}#projects`}
        >
          <Icon className="size-4" name="back" />
          <span>{copy.projectPage.backToProjects}</span>
        </a>

        <div className="relative mt-10 grid items-start gap-10 lg:grid-cols-[7fr_5fr] lg:gap-[52px]">
          <div>
            <div className="inline-flex items-center gap-2.5 rounded-full bg-surface px-3.5 py-[7px] font-mono text-[10px] tracking-[0.18em] text-project uppercase">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-project" />
              <span>{project.category}</span>
            </div>
            <h1 className="mt-6 mb-[22px] text-[48px] leading-[0.98] font-medium tracking-[-0.04em] text-ink md:text-[72px]">
              {project.name}
            </h1>
            <p className="m-0 max-w-[32em] text-lg leading-[1.65] text-pretty text-ink-2 md:text-xl">
              {project.detailIntro}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-[18px]">
              <ButtonLink href={mailto}>{project.cta}</ButtonLink>
              {project.badge ? (
                <span className="rounded-full bg-surface px-3.5 py-2 font-mono text-[11px] tracking-[0.14em] text-ink-2 uppercase">
                  {project.badge}
                </span>
              ) : null}
            </div>
          </div>

          <aside className="overflow-hidden rounded-panel bg-surface">
            <div className="flex h-[208px] items-center justify-center bg-project-field">
              <img
                alt={project.artAlt}
                className="max-h-[136px] w-[112px] object-contain"
                src={visual.artSrc}
              />
            </div>
            <div className="p-[26px]">
              <div className="mb-3.5 font-mono text-[10px] tracking-[0.2em] text-project uppercase">
                {project.detailEyebrow}
              </div>
              <p className="m-0 text-[15px] leading-[1.75] text-ink-2">{project.summary}</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="px-5 py-14 md:px-16 md:py-[72px]">
        <div className="grid items-start gap-10 lg:grid-cols-[7fr_5fr] lg:gap-[52px]">
          <div>
            <div className="eyebrow mb-[26px] tracking-[0.22em] text-ink-3">
              {copy.projectPage.sectionsTitle}
            </div>
            <div className="flex flex-col gap-3.5">
              {project.sections.map((section) => (
                <article
                  key={section.title}
                  className="rounded-panel bg-surface px-6 py-7 md:px-[34px] md:py-8"
                >
                  <h2 className="m-0 mb-3.5 text-2xl font-medium tracking-[-0.02em] text-ink">
                    {section.title}
                  </h2>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="m-0 text-base leading-[1.8] text-pretty text-ink-2">
                      {paragraph}
                    </p>
                  ))}
                </article>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            <div className="rounded-panel bg-project-field px-6 py-[30px] md:px-8">
              <div className="eyebrow mb-[18px] text-project">{copy.projectPage.highlightsTitle}</div>
              <ul className="m-0 flex list-none flex-col gap-4 p-0">
                {project.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-3 text-base leading-[1.65] text-ink-2">
                    <span
                      aria-hidden="true"
                      className="mt-[9px] size-1.5 flex-none rounded-full bg-project"
                    />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-panel bg-surface px-6 py-[30px] md:px-8">
              <div className="eyebrow mb-3.5 text-ink-3">{copy.projectPage.statusTitle}</div>
              <p className="m-0 text-base leading-[1.75] text-ink-2">{project.status}</p>
            </div>

            <div className="rounded-panel bg-surface px-6 py-[30px] md:px-8">
              <p className="m-0 mb-[22px] text-lg leading-[1.65] tracking-[-0.01em] text-ink">
                {copy.projectPage.contactNote}
              </p>
              <ButtonLink size="sm" href={mailto} icon="mail" tone="soft">
                {project.cta}
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
