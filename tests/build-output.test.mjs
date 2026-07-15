import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { projectRegistry } from "../src/content/site.js";

const projectRoot = process.cwd();
const distDir = resolve(projectRoot, "dist");
const staticPageContract = [
  { locale: "pt-br", htmlLang: "pt-BR", outputPath: "pt-br/index.html", pathname: "/pt-br/" },
  { locale: "en", htmlLang: "en", outputPath: "en/index.html", pathname: "/en/" },
  {
    locale: "pt-br",
    htmlLang: "pt-BR",
    outputPath: "pt-br/projects/neorecicla/index.html",
    pathname: "/pt-br/projects/neorecicla/"
  },
  {
    locale: "pt-br",
    htmlLang: "pt-BR",
    outputPath: "pt-br/projects/devrecord/index.html",
    pathname: "/pt-br/projects/devrecord/"
  },
  {
    locale: "pt-br",
    htmlLang: "pt-BR",
    outputPath: "pt-br/projects/neo-health/index.html",
    pathname: "/pt-br/projects/neo-health/"
  },
  {
    locale: "en",
    htmlLang: "en",
    outputPath: "en/projects/neorecicla/index.html",
    pathname: "/en/projects/neorecicla/"
  },
  {
    locale: "en",
    htmlLang: "en",
    outputPath: "en/projects/devrecord/index.html",
    pathname: "/en/projects/devrecord/"
  },
  {
    locale: "en",
    htmlLang: "en",
    outputPath: "en/projects/neo-health/index.html",
    pathname: "/en/projects/neo-health/"
  }
];
const canonicalOrigin = "https://neocom.cloud";

function readDistFile(relativePath) {
  return readFileSync(resolve(distDir, relativePath), "utf8");
}

function getCanonicalUrl(pathname) {
  return new URL(pathname, `${canonicalOrigin}/`).toString();
}

function getAssetReferences(html) {
  return Array.from(
    html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g),
    ([, assetPath]) => assetPath
  );
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
      ...staticPageContract.map((page) => page.outputPath)
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
    for (const page of staticPageContract) {
      const html = readDistFile(page.outputPath);
      const assetReferences = getAssetReferences(html);

      expect(html).not.toContain("/src/page-entry.tsx");
      expect(html).toContain(`data-locale="${page.locale}"`);
      expect(html).toContain(`lang="${page.htmlLang}"`);
      expect(html).toContain(
        `rel="canonical" href="${getCanonicalUrl(page.pathname)}"`
      );
      expect(assetReferences.some((assetPath) => assetPath.endsWith(".js"))).toBe(true);
      expect(assetReferences.some((assetPath) => assetPath.endsWith(".css"))).toBe(true);

      for (const assetPath of assetReferences) {
        expect(existsSync(resolve(distDir, assetPath.slice(1))), assetPath).toBe(true);
      }
    }
  });

  it("publishes every required canonical URL in the sitemap", () => {
    const sitemap = readDistFile("sitemap.xml");
    const requiredCanonicalUrls = [
      `${canonicalOrigin}/`,
      ...staticPageContract.map((page) => getCanonicalUrl(page.pathname))
    ];

    for (const canonicalUrl of requiredCanonicalUrls) {
      expect(sitemap).toContain(`<loc>${canonicalUrl}</loc>`);
    }
  });

  it("keeps an asset bundle alongside the static documents", () => {
    const assetEntries = readdirSync(resolve(distDir, "assets"));

    expect(assetEntries.some((entry) => entry.endsWith(".js"))).toBe(true);
    expect(assetEntries.some((entry) => entry.endsWith(".css"))).toBe(true);
  });
});
