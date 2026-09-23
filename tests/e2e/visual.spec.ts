import { expect, test, type Page } from "@playwright/test";

/*
 * Visual contract for the "NeoCom 3A" model. Assertions use computed styles and
 * geometry instead of pixels, so they hold on every OS and browser. Pixel
 * snapshots live in visual-snapshots.spec.ts and are opt-in.
 */

const palette = {
  light: {
    page: "rgb(238, 236, 231)",
    surface: "rgb(250, 249, 246)",
    field: "rgb(228, 231, 230)",
    accent: "rgb(3, 116, 148)"
  },
  dark: {
    page: "rgb(19, 19, 19)",
    surface: "rgb(28, 28, 27)",
    field: "rgb(25, 27, 28)",
    accent: "rgb(6, 207, 227)"
  }
} as const;

const projectPalette = {
  neorecicla: {
    light: { accent: "rgb(47, 125, 74)", field: "rgb(227, 236, 225)", page: "rgb(239, 242, 236)" },
    dark: { accent: "rgb(95, 191, 124)", field: "rgb(21, 32, 26)", page: "rgb(16, 19, 17)" }
  },
  devrecord: {
    light: { accent: "rgb(168, 98, 12)", field: "rgb(242, 229, 214)", page: "rgb(247, 240, 230)" },
    dark: { accent: "rgb(244, 167, 26)", field: "rgb(37, 26, 12)", page: "rgb(22, 17, 10)" }
  },
  "neo-health": {
    light: { accent: "rgb(143, 106, 31)", field: "rgb(239, 231, 216)", page: "rgb(244, 239, 229)" },
    dark: { accent: "rgb(217, 169, 79)", field: "rgb(33, 28, 17)", page: "rgb(20, 18, 16)" }
  }
} as const;

const themes = ["light", "dark"] as const;
type ThemeName = (typeof themes)[number];
const projectSlugs = Object.keys(projectPalette) as (keyof typeof projectPalette)[];
const pages = [
  "/pt-br/",
  "/en/",
  ...projectSlugs.flatMap((slug) => [`/pt-br/projects/${slug}/`, `/en/projects/${slug}/`])
];

test.use({ reducedMotion: "reduce" });

async function gotoWithTheme(page: Page, path: string, theme: ThemeName) {
  await page.addInitScript((value) => window.localStorage.setItem("neocom-theme", value), theme);
  await page.goto(path);
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  await page.evaluate(() => document.fonts.ready);
}

function background(page: Page, selector: string) {
  return page
    .locator(selector)
    .first()
    .evaluate((element) => getComputedStyle(element).backgroundColor);
}

function rects(page: Page, testId: string) {
  return page.getByTestId(testId).evaluateAll((elements) =>
    elements.map((element) => {
      const { left, top } = element.getBoundingClientRect();
      return { left: Math.round(left), top: Math.round(top) };
    })
  );
}

test.describe("landing visual contract", () => {
  for (const theme of themes) {
    test(`uses the ${theme} palette for page, hero and cards`, async ({ page }) => {
      await gotoWithTheme(page, "/pt-br/", theme);

      expect(await background(page, "body")).toBe(palette[theme].page);
      expect(await background(page, '[data-testid="hero"]')).toBe(palette[theme].field);
      expect(await background(page, '[data-testid="value-tile"]')).toBe(palette[theme].surface);

      const accent = await page
        .getByTestId("typewriter-text")
        .evaluate((element) => getComputedStyle(element).color);

      expect(accent).toBe(palette[theme].accent);
    });
  }

  test("sets the display typography from the design", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoWithTheme(page, "/pt-br/", "light");

    const heading = await page.getByRole("heading", { level: 1 }).evaluate((element) => {
      const style = getComputedStyle(element);
      return { size: style.fontSize, weight: style.fontWeight, family: style.fontFamily };
    });

    expect(heading.size).toBe("90px");
    expect(heading.weight).toBe("500");
    expect(heading.family).toContain("Familjen Grotesk");
    expect(
      await page.evaluate(() => document.fonts.check('16px "Familjen Grotesk Variable"'))
    ).toBe(true);
    expect(await page.evaluate(() => document.fonts.check('16px "IBM Plex Mono"'))).toBe(true);
  });

  test("lays out five values and three projects in a single row on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoWithTheme(page, "/pt-br/", "light");

    const values = await rects(page, "value-tile");
    const cards = await rects(page, "project-card");

    expect(values).toHaveLength(5);
    expect(new Set(values.map((rect) => rect.top)).size).toBe(1);
    expect(cards).toHaveLength(3);
    expect(new Set(cards.map((rect) => rect.top)).size).toBe(1);
  });

  test("stacks the project cards and wraps the values on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await gotoWithTheme(page, "/pt-br/", "light");

    const cards = await rects(page, "project-card");
    const values = await rects(page, "value-tile");

    expect(new Set(cards.map((rect) => rect.left)).size).toBe(1);
    expect(new Set(cards.map((rect) => rect.top)).size).toBe(3);
    expect(new Set(values.map((rect) => rect.left)).size).toBe(2);
  });

  test("keeps the inactive locale link readable", async ({ page }) => {
    await gotoWithTheme(page, "/pt-br/", "light");

    // --ink-3 sits at 2.68:1 against the chip; the switcher is a control, so it
    // uses --ink-2 (4.96:1) and clears WCAG AA.
    const colour = await page
      .getByRole("link", { name: "EN", exact: true })
      .evaluate((element) => getComputedStyle(element).color);

    expect(colour).toBe("rgba(22, 22, 26, 0.62)");
  });

  test("gives each project card its own accent colours", async ({ page }) => {
    await gotoWithTheme(page, "/pt-br/", "light");

    const fields = await page.getByTestId("project-card").evaluateAll((cards) =>
      cards.map((card) => getComputedStyle(card.firstElementChild as HTMLElement).backgroundColor)
    );

    expect(fields).toEqual(projectSlugs.map((slug) => projectPalette[slug].light.field));
  });
});

test.describe("project pages visual contract", () => {
  for (const slug of projectSlugs) {
    for (const theme of themes) {
      test(`${slug} applies its ${theme} accent, field and page colours`, async ({ page }) => {
        await gotoWithTheme(page, `/pt-br/projects/${slug}/`, theme);

        const expected = projectPalette[slug][theme];

        expect(await background(page, '[data-testid="page"]')).toBe(expected.page);
        expect(await background(page, '[data-testid="project-hero"]')).toBe(expected.field);

        const categoryColor = await page
          .getByTestId("project-hero")
          .locator(".text-project")
          .first()
          .evaluate((element) => getComputedStyle(element).color);

        expect(categoryColor).toBe(expected.accent);
      });
    }
  }
});

test.describe("every page renders cleanly", () => {
  const viewports = [
    ["desktop", { width: 1280, height: 900 }],
    ["laptop", { width: 1024, height: 800 }],
    ["mobile", { width: 390, height: 800 }],
    ["small", { width: 320, height: 720 }]
  ] as const;

  for (const path of pages) {
    for (const [name, size] of viewports) {
      test(`${path} has no overflow or broken images on ${name}`, async ({ page }) => {
        await page.setViewportSize(size);
        await gotoWithTheme(page, path, "light");

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        );

        expect(overflow).toBeLessThanOrEqual(0);

        const broken = await page.evaluate(() =>
          Array.from(document.images)
            .filter((image) => !(image.complete && image.naturalWidth > 0))
            .map((image) => image.src)
        );

        expect(broken).toEqual([]);
      });
    }
  }
});
