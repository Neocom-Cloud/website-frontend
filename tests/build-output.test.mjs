import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
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

function readDistDocument(relativePath) {
  return new JSDOM(readDistFile(relativePath)).window.document;
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

function expectMetaContent(document, selector, expectedContent) {
  expect(document.querySelector(selector)?.getAttribute("content")).toBe(
    expectedContent
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

  it("preserves accented Portuguese metadata in the published build", () => {
    const pages = [
      {
        outputPath: "pt-br/index.html",
        title: "NeoCom | Inovação em comunicações",
        description:
          "Landing page da NeoCom focada em privacidade, sustentabilidade, confiança digital e projetos como NeoRecicla, DevRecord e Neo Health.",
        ogDescription:
          "Tecnologia com propósito, conexão com responsabilidade e privacidade como fundamento.",
        twitterDescription: "Explore os projetos e a missão da NeoCom."
      },
      {
        outputPath: "pt-br/projects/neorecicla/index.html",
        title: "NeoRecicla | NeoCom",
        description:
          "NeoRecicla é o projeto da NeoCom para coleta automatizada de resíduos em universidades com recompensas verificáveis.",
        ogDescription: "Sustentabilidade rastreável para ambientes universitários.",
        twitterDescription:
          "Coleta automatizada com dados verificáveis para reciclagem."
      },
      {
        outputPath: "pt-br/projects/devrecord/index.html",
        title: "DevRecord | NeoCom",
        description:
          "DevRecord é o conceito da NeoCom para reputação técnica verificável e histórico portável de contribuições.",
        ogDescription: "Identidade técnica verificável, além de plataformas únicas.",
        twitterDescription:
          "Explore o conceito da NeoCom para trilhas de contribuição verificáveis."
      },
      {
        outputPath: "pt-br/projects/neo-health/index.html",
        title: "Neo Health | NeoCom",
        description:
          "Neo Health é o conceito da NeoCom para organizar histórico e dados pessoais de saúde sob controle do usuário.",
        ogDescription: "Dados sensíveis com governança pessoal e contexto claro.",
        twitterDescription:
          "Conheça a visão da NeoCom para histórico pessoal de saúde."
      }
    ];

    for (const page of pages) {
      const document = readDistDocument(page.outputPath);

      expect(document.title).toBe(page.title);
      expectMetaContent(document, 'meta[name="description"]', page.description);
      expectMetaContent(document, 'meta[property="og:title"]', page.title);
      expectMetaContent(document, 'meta[property="og:description"]', page.ogDescription);
      expectMetaContent(document, 'meta[name="twitter:title"]', page.title);
      expectMetaContent(
        document,
        'meta[name="twitter:description"]',
        page.twitterDescription
      );
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
