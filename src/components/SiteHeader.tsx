import { siteContent } from "../content/site.js";
import {
  Locale,
  PageKind,
  ProjectSlug,
  Theme,
  getLandingPath,
  getPagePath
} from "../lib/routes";
import { setStoredLocale } from "../lib/locale";

interface SiteHeaderProps {
  locale: Locale;
  pageKind: PageKind;
  projectSlug?: ProjectSlug;
  theme: Theme;
  onToggleTheme: () => void;
}

export function SiteHeader({
  locale,
  pageKind,
  projectSlug,
  theme,
  onToggleTheme
}: SiteHeaderProps) {
  const copy = siteContent[locale];
  const brandHref = getLandingPath(locale);
  const anchorPrefix = pageKind === "landing" ? "" : brandHref;
  const isDark = theme === "dark";
  const toggleLabel = isDark ? copy.themeToggle.toLight : copy.themeToggle.toDark;
  const toggleShortLabel = isDark
    ? copy.themeToggle.toLightShort
    : copy.themeToggle.toDarkShort;

  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-4 px-4 py-5 sm:gap-x-8 sm:px-5 md:px-11 md:py-[22px]">
      <a
        className="inline-flex items-center gap-[11px] text-[19px] font-semibold tracking-[-0.01em] text-ink no-underline"
        href={brandHref}
      >
        <img alt="" className="block size-[27px] rounded-lg" src="/assets/nc-mark.svg" />
        <span>NeoCom</span>
      </a>

      <nav
        aria-label="Primary"
        className="order-last flex w-full items-center gap-7 text-[15px] md:order-none md:ml-auto md:w-auto"
      >
        <a className="text-ink-2 no-underline" href={`${anchorPrefix}#projects`}>
          {copy.nav.projects}
        </a>
        <a className="text-ink-2 no-underline" href={`${anchorPrefix}#mission`}>
          {copy.nav.mission}
        </a>
        <a className="text-ink-2 no-underline" href={`${anchorPrefix}#contact`}>
          {copy.nav.contact}
        </a>
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3.5 md:ml-0">
        <div
          aria-label={copy.localeLabel}
          className="flex items-center gap-1 rounded-full bg-chip p-[5px] text-xs font-medium"
          role="group"
        >
          {(["pt-br", "en"] as const).map((option) => {
            const isActive = option === locale;

            return (
              <a
                key={option}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-full px-2.5 py-1 no-underline ${
                  isActive ? "bg-surface text-ink" : "text-ink-2"
                }`}
                data-active={isActive}
                href={getPagePath(option, pageKind, projectSlug)}
                onClick={() => setStoredLocale(option)}
              >
                {copy.localeNames[option]}
              </a>
            );
          })}
        </div>

        <button
          aria-label={toggleLabel}
          className="cursor-pointer rounded-full border border-rule bg-transparent px-3 py-[9px] font-[inherit] text-xs font-medium text-ink-2 sm:px-[15px]"
          type="button"
          onClick={onToggleTheme}
        >
          {toggleShortLabel}
        </button>
      </div>
    </header>
  );
}
