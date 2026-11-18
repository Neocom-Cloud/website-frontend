import { expect, test } from "@playwright/test";

/*
 * Opt-in pixel snapshots (chromium desktop only). Text rasterisation differs
 * between operating systems, so baselines are only meaningful where they were
 * recorded (see snapshotPathTemplate in playwright.config.ts):
 *
 *   pnpm test:visual          compare against the committed baselines
 *   pnpm test:visual:update   re-record them after an intentional design change
 */

test.skip(
  process.env.VISUAL_SNAPSHOTS !== "1",
  "Set VISUAL_SNAPSHOTS=1 (pnpm test:visual) to compare pixel snapshots."
);
test.skip(
  ({ browserName, isMobile }) => browserName !== "chromium" || isMobile,
  "Pixel snapshots are recorded on desktop chromium only."
);
test.use({ reducedMotion: "reduce", viewport: { width: 1280, height: 900 } });

const scenarios = [
  { name: "landing-pt-light", path: "/pt-br/", theme: "light" },
  { name: "landing-pt-dark", path: "/pt-br/", theme: "dark" },
  { name: "project-devrecord-en-light", path: "/en/projects/devrecord/", theme: "light" },
  { name: "project-neorecicla-pt-dark", path: "/pt-br/projects/neorecicla/", theme: "dark" }
] as const;

for (const scenario of scenarios) {
  test(`matches the ${scenario.name} baseline`, async ({ page }) => {
    await page.addInitScript(
      (theme) => window.localStorage.setItem("neocom-theme", theme),
      scenario.theme
    );
    await page.goto(scenario.path);
    await page.evaluate(() => document.fonts.ready);

    await expect(page).toHaveScreenshot(`${scenario.name}.png`, {
      fullPage: true,
      maxDiffPixelRatio: 0.01
    });
  });
}
