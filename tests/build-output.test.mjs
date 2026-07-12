import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { getStaticPageDefinitions } from "../scripts/static-site.mjs";
import { projectRegistry } from "../src/content/site.js";

const projectRoot = process.cwd();
const distDir = resolve(projectRoot, "dist");

function getPageOutputPath(page) {
  if (page.pageKind === "landing") {
    return `${page.locale}/index.html`;
  }

  return `${page.locale}/projects/${page.projectSlug}/index.html`;
}

function readDistFile(relativePath) {
  return readFileSync(resolve(distDir, relativePath), "utf8");
}

describe("production build output", () => {
  it("contains every generated page and required public file", () => {
    expect(existsSync(distDir)).toBe(true);

    const requiredFiles = [
      "index.html",
      "404.html",
      "CNAME",
      "favicon.svg",
      "robots.txt",
      "site.webmanifest",
      "sitemap.xml",
      ...getStaticPageDefinitions().map(getPageOutputPath)
    ];

    for (const relativePath of requiredFiles) {
      expect(existsSync(resolve(distDir, relativePath)), relativePath).toBe(true);
    }
  });

  it("publishes every configured project asset", () => {
    for (const project of Object.values(projectRegistry)) {
      for (const assetPath of [project.artSrc, project.socialImageSrc]) {
        expect(assetPath).toBeDefined();
        expect(existsSync(resolve(distDir, assetPath.slice(1))), assetPath).toBe(true);
      }
    }
  });

  it("rewrites localized pages to built assets while preserving metadata", () => {
    for (const page of getStaticPageDefinitions()) {
      const html = readDistFile(getPageOutputPath(page));

      expect(html).not.toContain("/src/page-entry.tsx");
      expect(html).toContain(`data-locale="${page.locale}"`);
      expect(html).toContain('rel="canonical" href="https://neocom.cloud/');
      expect(html).toMatch(/src="\/assets\/page-entry-[^"]+\.js"/);
      expect(html).toMatch(/href="\/assets\/global-[^"]+\.css"/);
    }
  });

  it("keeps an asset bundle alongside the static documents", () => {
    const assetEntries = readdirSync(resolve(distDir, "assets"));

    expect(assetEntries.some((entry) => entry.endsWith(".js"))).toBe(true);
    expect(assetEntries.some((entry) => entry.endsWith(".css"))).toBe(true);
  });
});
