import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(resolve(process.cwd(), "src/styles/global.css"), "utf8");

function getBlock(selector: string): string {
  const start = css.indexOf(`${selector} {`);
  expect(start, `missing block ${selector}`).toBeGreaterThan(-1);
  return css.slice(start, css.indexOf("}", start));
}

/** Palette copied from the "NeoCom 3A" design model (B2 / project themes). */
const palette = {
  light: {
    "--page": "#eeece7",
    "--surface": "#faf9f6",
    "--field": "#e4e7e6",
    "--chip": "#e6e4de",
    "--ink": "#16161a",
    "--accent": "#037494",
    "--green-accent": "#2f7d4a",
    "--ember-accent": "#a8620c",
    "--amber-accent": "#8f6a1f",
    "--green-field": "#e3ece1",
    "--ember-page": "#f7f0e6"
  },
  dark: {
    "--page": "#131313",
    "--surface": "#1c1c1b",
    "--field": "#191b1c",
    "--chip": "#232322",
    "--ink": "#ecebe7",
    "--accent": "#06cfe3",
    "--green-accent": "#5fbf7c",
    "--ember-accent": "#f4a71a",
    "--amber-accent": "#d9a94f",
    "--green-field": "#15201a",
    "--ember-page": "#16110a"
  }
} as const;

describe("design tokens", () => {
  for (const theme of ["light", "dark"] as const) {
    it(`matches the design palette in the ${theme} theme`, () => {
      const block = getBlock(`html[data-theme="${theme}"]`);

      for (const [token, value] of Object.entries(palette[theme])) {
        expect(block, `${theme} ${token}`).toContain(`${token}: ${value};`);
      }
    });
  }

  it("defines a project accent layer for every project accent", () => {
    for (const accent of ["green", "ember", "amber"]) {
      const block = getBlock(`[data-accent="${accent}"]`);

      expect(block).toContain(`--project-accent: var(--${accent}-accent)`);
      expect(block).toContain(`--project-field: var(--${accent}-field)`);
      expect(block).toContain(`--project-page: var(--${accent}-page)`);
    }
  });

  it("self-hosts the design typefaces instead of calling a font CDN", () => {
    expect(css).toContain("@fontsource-variable/familjen-grotesk");
    expect(css).toContain("@fontsource/ibm-plex-mono");
    expect(css).not.toContain("fonts.googleapis.com");
  });
});
