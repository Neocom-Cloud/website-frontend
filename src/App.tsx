import { useEffect, useState } from "react";
import { SiteFooter } from "./components/SiteFooter";
import { SiteHeader } from "./components/SiteHeader";
import { projectRegistry, siteContent } from "./content/site.js";
import { LandingPage } from "./pages/LandingPage";
import { ProjectPage } from "./pages/ProjectPage";
import { Locale, PageKind, ProjectSlug, getAlternateLocale, getPagePath } from "./lib/routes";
import { applyTheme, getOppositeTheme, readStoredTheme } from "./lib/theme";

interface AppProps {
  locale: Locale;
  pageKind: PageKind;
  projectSlug?: ProjectSlug;
}

export function App({ locale, pageKind, projectSlug }: AppProps) {
  const [theme, setTheme] = useState(readStoredTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const alternateLocale = getAlternateLocale(locale);
  const accent =
    pageKind === "project" && projectSlug ? projectRegistry[projectSlug].accent : undefined;

  return (
    <div
      className={`min-h-screen ${accent ? "bg-project-page" : "bg-page"} text-ink`}
      data-accent={accent}
      data-testid="page"
    >
      <div className="mx-auto max-w-[1360px]">
        <SiteHeader
          locale={locale}
          pageKind={pageKind}
          projectSlug={projectSlug}
          theme={theme}
          onToggleTheme={() => setTheme(getOppositeTheme(theme))}
        />

        <main>
          {pageKind === "landing" ? (
            <LandingPage locale={locale} />
          ) : (
            <ProjectPage locale={locale} projectSlug={projectSlug!} />
          )}
        </main>

        <SiteFooter locale={locale} />

        <div className="sr-only">
          <a
            href={getPagePath(alternateLocale, pageKind, projectSlug)}
            lang={siteContent[alternateLocale].htmlLang}
          >
            {alternateLocale}
          </a>
        </div>
      </div>
    </div>
  );
}
