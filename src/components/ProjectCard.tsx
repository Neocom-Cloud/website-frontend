import { projectRegistry, siteContent } from "../content/site.js";
import { Locale, ProjectSlug, getPagePath } from "../lib/routes";
import { Icon } from "./icons";

interface ProjectCardProps {
  locale: Locale;
  projectSlug: ProjectSlug;
  /** Zero-based position, rendered as the ghost numeral ("01", "02"...). */
  position: number;
}

export function ProjectCard({ locale, projectSlug, position }: ProjectCardProps) {
  const project = siteContent[locale].projects.items[projectSlug];
  const visual = projectRegistry[projectSlug];

  return (
    <a
      className="flex flex-col overflow-hidden rounded-panel bg-surface no-underline md:min-h-[450px]"
      data-accent={visual.accent}
      data-testid="project-card"
      href={getPagePath(locale, "project", projectSlug)}
    >
      <div className="relative flex h-[216px] items-center justify-center bg-project-field">
        <span
          aria-hidden="true"
          className="absolute bottom-1.5 left-[18px] text-[72px] leading-none font-semibold tracking-[-0.05em] text-ghost"
        >
          {String(position + 1).padStart(2, "0")}
        </span>
        <img
          alt={project.artAlt}
          className="relative max-h-[132px] w-[108px] object-contain"
          src={visual.artSrc}
        />
        {project.badge ? (
          <span className="absolute top-4 right-4 rounded-full bg-surface px-2.5 py-[5px] font-mono text-[10px] tracking-[0.14em] text-project uppercase">
            {project.badge}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3.5 p-[26px]">
        <span className="font-mono text-[10px] tracking-[0.18em] text-project uppercase">
          {project.category}
        </span>
        <div className="text-[30px] leading-[1.06] font-medium tracking-[-0.025em] text-ink">
          {project.name}
        </div>
        <div className="text-[15px] leading-[1.7] text-ink-2">{project.summary}</div>
        <div className="mt-auto inline-flex items-center gap-2.5 self-start rounded-full bg-project-field px-[18px] py-[11px] text-sm font-medium text-ink">
          <span>{project.cardCta}</span>
          <Icon className="size-[15px]" name="arrow" />
        </div>
      </div>
    </a>
  );
}
