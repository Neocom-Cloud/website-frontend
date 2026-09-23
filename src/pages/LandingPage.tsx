import { CloudMark } from "../components/CloudMark";
import { Icon } from "../components/icons";
import { ProjectCard } from "../components/ProjectCard";
import { TypewriterWord } from "../components/TypewriterWord";
import { ButtonLink, SectionHeader, SectionLabel } from "../components/ui";
import { siteContent } from "../content/site.js";
import { CONTACT_EMAIL, Locale, ProjectSlug } from "../lib/routes";

export function LandingPage({ locale }: { locale: Locale }) {
  const copy = siteContent[locale];
  const projectSlugs = Object.keys(copy.projects.items) as ProjectSlug[];

  return (
    <>
      <section
        className="relative mx-4 overflow-hidden rounded-stage bg-field px-5 pt-14 pb-12 sm:mx-5 sm:px-6 md:px-12 md:pt-[74px] md:pb-[68px]"
        data-testid="hero"
      >
        <div aria-hidden="true" className="absolute top-0 left-5 h-[3px] w-24 bg-accent sm:left-6 md:left-12" />
        <CloudMark className="pointer-events-none absolute -top-16 -right-24 h-[360px] w-[380px] text-accent opacity-[0.13] md:-top-[150px] md:-right-[300px] md:h-[680px] md:w-[740px]" />

        <div className="relative inline-flex items-center gap-[9px] rounded-full bg-surface py-[7px] pr-3.5 pl-[11px] font-mono text-[11px] tracking-[0.2em] text-ink-2 uppercase">
          <span aria-hidden="true" className="size-[7px] rounded-full bg-accent" />
          <span>{copy.hero.eyebrow}</span>
        </div>

        <h1 className="relative mt-[30px] mb-0 max-w-[15em] text-[clamp(30px,9.5vw,44px)] leading-[0.98] font-medium tracking-[-0.04em] text-ink sm:text-[64px] md:text-[90px]">
          {copy.hero.titleLead} <TypewriterWord phrases={copy.hero.phrases} />
        </h1>

        <div className="relative mt-12 grid items-end gap-8 md:mt-[52px] md:grid-cols-2 md:gap-12">
          <p className="m-0 text-lg leading-[1.6] text-pretty text-ink-2 md:text-xl">
            {copy.hero.subtitle}
          </p>
          <div className="flex flex-wrap items-center gap-[22px] md:justify-end">
            <ButtonLink href="#projects" size="lg">
              {copy.hero.cta}
            </ButtonLink>
            <a
              className="border-b border-rule pb-[3px] text-[15px] text-ink-2 no-underline"
              href="#contact"
            >
              {copy.hero.secondaryCta}
            </a>
          </div>
        </div>
      </section>

      <section className="px-5 pt-14 pb-10 md:px-16 md:pt-[76px] md:pb-[60px]" id="values">
        <SectionHeader
          eyebrow={copy.values.eyebrow}
          index="01"
          subtitle={copy.values.subtitle}
          title={copy.values.title}
        />
        <ul className="m-0 grid list-none grid-cols-1 gap-3.5 p-0 min-[380px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {copy.values.items.map((item) => (
            <li
              key={item.label}
              className="flex flex-col gap-[26px] rounded-tile bg-surface p-4 sm:p-6"
              data-testid="value-tile"
            >
              <Icon className="size-[22px] text-accent" name={item.icon} strokeWidth={1.4} />
              <span className="text-[15px] font-medium text-ink sm:text-[17px]">{item.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="px-5 pt-4 pb-14 md:px-16 md:pb-[76px]" id="projects">
        <SectionHeader
          eyebrow={copy.projects.eyebrow}
          index="02"
          subtitle={copy.projects.subtitle}
          title={copy.projects.title}
        />
        <div className="grid gap-[18px] md:grid-cols-2 lg:grid-cols-3">
          {projectSlugs.map((slug, position) => (
            <ProjectCard key={slug} locale={locale} position={position} projectSlug={slug} />
          ))}
        </div>
      </section>

      <section
        className="mx-5 rounded-stage bg-surface px-6 py-12 md:px-12 md:py-[66px]"
        id="mission"
      >
        <div className="grid items-start gap-8 lg:grid-cols-[4fr_8fr] lg:gap-12">
          <div>
            <SectionLabel>03 — {copy.mission.eyebrow}</SectionLabel>
            <h2 className="m-0 text-[32px] leading-[1.02] font-medium tracking-[-0.03em] text-ink md:text-[42px]">
              {copy.mission.title}
            </h2>
          </div>
          <p className="m-0 text-xl leading-[1.5] tracking-[-0.015em] text-pretty text-ink md:text-[26px]">
            {copy.mission.body}
          </p>
        </div>
      </section>

      <section className="px-5 pt-14 pb-10 md:px-16 md:pt-[76px] md:pb-[60px]" id="contact">
        <div className="grid items-start gap-8 lg:grid-cols-[4fr_8fr] lg:gap-12">
          <div>
            <SectionLabel>04 — {copy.contact.eyebrow}</SectionLabel>
            <h2 className="m-0 mb-3.5 text-[32px] leading-[1.02] font-medium tracking-[-0.03em] text-ink md:text-[42px]">
              {copy.contact.title}
            </h2>
            <p className="m-0 text-[17px] leading-[1.7] text-ink-2">{copy.contact.subtitle}</p>
          </div>
          <div className="rounded-panel bg-field p-6 md:p-9">
            <div className="eyebrow mb-4 text-ink-3">{copy.contact.emailLabel}</div>
            <a
              className="text-[26px] font-medium tracking-[-0.03em] break-words text-ink no-underline sm:text-[38px]"
              href={`mailto:${CONTACT_EMAIL}`}
            >
              {CONTACT_EMAIL}
            </a>
            <p className="mt-5 mb-0 text-base leading-[1.7] text-ink-2">
              {copy.contact.availability}
            </p>
            <div className="mt-[26px]">
              <ButtonLink href={`mailto:${CONTACT_EMAIL}`}>{copy.contact.button}</ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
