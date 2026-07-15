import { expect, test } from "@playwright/test";
import { E2E_BASE_URL } from "./constants";

const locales = ["pt-br", "en"] as const;
const projectSlugs = ["neorecicla", "devrecord", "neo-health"] as const;
const projectNames = {
  "pt-br": {
    neorecicla: "NeoRecicla",
    devrecord: "DevRecord",
    "neo-health": "Neo Health"
  },
  en: {
    neorecicla: "NeoRecicla",
    devrecord: "DevRecord",
    "neo-health": "Neo Health"
  }
} as const;
const localeLinkNames = { "pt-br": "PT", en: "EN" } as const;

function getSiteUrl(pathname: string) {
  return new URL(pathname, E2E_BASE_URL).toString();
}

test.describe("published static site", () => {
  for (const locale of locales) {
    test(`renders the ${locale} landing page and project navigation`, async ({ page }) => {
      await page.goto(`/${locale}/`);

      await expect(page.locator("html")).toHaveAttribute(
        "lang",
        locale === "pt-br" ? "pt-BR" : "en"
      );
      await expect(page.getByRole("link", { name: "NeoCom", exact: true })).toHaveAttribute(
        "href",
        `/${locale}/`
      );
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      for (const projectSlug of projectSlugs) {
        await expect(
          page.getByRole("link", { name: projectNames[locale][projectSlug] })
        ).toHaveCount(1);
      }

      const projectPath = `/${locale}/projects/neorecicla/`;
      const projectLink = page.getByRole("link", {
        name: projectNames[locale].neorecicla
      });

      await expect(projectLink).toHaveAttribute("href", projectPath);
      await projectLink.click();
      await expect(page).toHaveURL(getSiteUrl(projectPath));
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });

    for (const projectSlug of projectSlugs) {
      test(`keeps ${projectSlug} context when switching locale from ${locale}`, async ({ page }) => {
        const alternateLocale = locale === "pt-br" ? "en" : "pt-br";

        await page.goto(`/${locale}/projects/${projectSlug}/`);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

        const alternatePath = `/${alternateLocale}/projects/${projectSlug}/`;
        const localeLink = page.getByRole("link", {
          name: localeLinkNames[alternateLocale],
          exact: true
        });

        await expect(localeLink).toHaveAttribute("href", alternatePath);
        await localeLink.click();
        await expect(page).toHaveURL(getSiteUrl(alternatePath));
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      });
    }
  }

  test("gives query locale precedence over stored locale at the root route", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("neocom-locale", "pt-br"));
    await page.goto("/?lang=en");
    await expect(page).toHaveURL(getSiteUrl("/en/"));
  });

  test("gives stored locale precedence over browser locale at the root route", async ({
    browser
  }) => {
    const browserLocaleContext = await browser.newContext({
      baseURL: E2E_BASE_URL,
      locale: "en-US"
    });

    try {
      const browserLocalePage = await browserLocaleContext.newPage();
      await browserLocalePage.addInitScript(() =>
        window.localStorage.setItem("neocom-locale", "pt-br")
      );
      await browserLocalePage.goto("/");
      await expect(browserLocalePage).toHaveURL(getSiteUrl("/pt-br/"));
    } finally {
      await browserLocaleContext.close();
    }
  });

  test("uses browser locale when no higher-priority locale is available", async ({ browser }) => {
    const browserOnlyContext = await browser.newContext({
      baseURL: E2E_BASE_URL,
      locale: "en-US"
    });

    try {
      const browserOnlyPage = await browserOnlyContext.newPage();
      await browserOnlyPage.goto("/");
      await expect(browserOnlyPage).toHaveURL(getSiteUrl("/en/"));
    } finally {
      await browserOnlyContext.close();
    }
  });

  test("persists the selected theme after reload", async ({ page }) => {
    await page.goto("/pt-br/");
    await page.getByRole("button", { name: "Modo escuro", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});
