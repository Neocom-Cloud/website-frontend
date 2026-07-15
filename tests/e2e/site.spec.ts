import { expect, test } from "@playwright/test";

const locales = ["pt-br", "en"] as const;
const projectSlugs = ["neorecicla", "devrecord", "neo-health"] as const;

test.describe("published static site", () => {
  for (const locale of locales) {
    test(`renders the ${locale} landing page and project navigation`, async ({ page }) => {
      await page.goto(`/${locale}/`);

      await expect(page.locator("html")).toHaveAttribute(
        "lang",
        locale === "pt-br" ? "pt-BR" : "en"
      );
      await expect(page.locator(".nav-logo")).toHaveAttribute("href", `/${locale}/`);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator(".projects-grid .project-tile")).toHaveCount(projectSlugs.length);

      await page.locator(`.project-tile[href="/${locale}/projects/neorecicla/"]`).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/projects/neorecicla/$`));
      await expect(page.locator("h1")).toBeVisible();
    });

    for (const projectSlug of projectSlugs) {
      test(`keeps ${projectSlug} context when switching locale from ${locale}`, async ({ page }) => {
        const alternateLocale = locale === "pt-br" ? "en" : "pt-br";

        await page.goto(`/${locale}/projects/${projectSlug}/`);
        await expect(page.locator("h1")).toBeVisible();
        await page.locator(`.locale-link[href="/${alternateLocale}/projects/${projectSlug}/"]`).click();

        await expect(page).toHaveURL(
          new RegExp(`/${alternateLocale}/projects/${projectSlug}/$`)
        );
        await expect(page.locator("h1")).toBeVisible();
      });
    }
  }

  test("honors query, stored, and browser locale precedence at the root route", async ({
    browser,
    page
  }) => {
    await page.goto("/?lang=en");
    await expect(page).toHaveURL(/\/en\/$/);

    await page.addInitScript(() => window.localStorage.setItem("neocom-locale", "pt-br"));
    await page.goto("/");
    await expect(page).toHaveURL(/\/pt-br\/$/);

    const browserLocaleContext = await browser.newContext({ locale: "en-US" });
    const browserLocalePage = await browserLocaleContext.newPage();
    await browserLocalePage.goto("/");
    await expect(browserLocalePage).toHaveURL(/\/en\/$/);
    await browserLocaleContext.close();
  });

  test("persists the selected theme after reload", async ({ page }) => {
    await page.goto("/pt-br/");
    await page.locator(".theme-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});
