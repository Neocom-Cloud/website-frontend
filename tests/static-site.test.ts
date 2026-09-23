import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getStaticPageDefinitions,
  getViteInputMap,
  renderSitemapXml,
  renderStaticPage
} from "../scripts/static-site.mjs";

function getPagePathLabel(page: { locale: string; pageKind: string; projectSlug?: string }) {
  return `${page.locale}/${page.pageKind}${page.projectSlug ? `/${page.projectSlug}` : ""}`;
}

describe("static site generation", () => {
  it("builds the expected localized page manifest for Vite", () => {
    const rootDir = resolve("/tmp/neocom");
    const pages = getStaticPageDefinitions();
    const inputs = getViteInputMap(rootDir);
    const inputValues = Object.values(inputs);

    expect(pages).toHaveLength(8);
    expect(inputs.root).toBe(resolve(rootDir, "index.html"));
    expect(inputs.notFound).toBe(resolve(rootDir, "404.html"));
    expect(inputs.ptBrLanding).toBe(resolve(rootDir, "pt-br/index.html"));
    expect(inputs.enLanding).toBe(resolve(rootDir, "en/index.html"));
    expect(inputValues).toContain(
      resolve(rootDir, "pt-br/projects/neorecicla/index.html"),
    );
    expect(inputValues).toContain(
      resolve(rootDir, "en/projects/neo-health/index.html"),
    );
  });

  it("leaves the X/Twitter kit out of the published site", () => {
    // social/index.html is a development-only reference surface. Assert on the
    // resolved paths rather than the key, so renaming the entry cannot hide it.
    const inputPaths = Object.values(getViteInputMap(resolve("/tmp/neocom"))).map((path) =>
      path.replaceAll("\\", "/"),
    );

    expect(inputPaths.some((path) => path.endsWith("/social/index.html"))).toBe(false);
    expect(renderSitemapXml()).not.toContain("social");
  });

  it("renders localized landing metadata from the centralized catalog", () => {
    const html = renderStaticPage({
      locale: "pt-br",
      pageKind: "landing"
    });
    const page = new DOMParser().parseFromString(html, "text/html");

    expect(page.documentElement.lang).toBe("pt-BR");
    expect(page.querySelector("meta[charset]")?.getAttribute("charset")).toBe("UTF-8");
    expect(page.title).toBe("NeoCom | Inovação em comunicações");
    expect(page.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
      "Landing page da NeoCom focada em privacidade, sustentabilidade, confiança digital e projetos como NeoRecicla, DevRecord e Neo Health."
    );
    expect(page.querySelector('meta[property="og:title"]')?.getAttribute("content")).toBe(
      "NeoCom | Inovação em comunicações"
    );
    expect(page.querySelector('meta[property="og:description"]')?.getAttribute("content")).toBe(
      "Tecnologia com propósito, conexão com responsabilidade e privacidade como fundamento."
    );
    expect(page.querySelector('meta[name="twitter:title"]')?.getAttribute("content")).toBe(
      "NeoCom | Inovação em comunicações"
    );
    expect(page.querySelector('meta[name="twitter:description"]')?.getAttribute("content")).toBe(
      "Explore os projetos e a missão da NeoCom."
    );
    expect(html).toContain("https://neocom.cloud/assets/social-neocom.jpg");
    expect(html).toContain('hreflang="en" href="https://neocom.cloud/en/"');
  });

  it("renders semantic Portuguese metadata for every project page", () => {
    const projectMetadata = {
      devrecord: {
        description:
          "DevRecord é o conceito da NeoCom para reputação técnica verificável e histórico portável de contribuições.",
        ogDescription:
          "Identidade técnica verificável, além de plataformas únicas.",
        twitterDescription:
          "Explore o conceito da NeoCom para trilhas de contribuição verificáveis."
      },
      "neo-health": {
        description:
          "Neo Health é o conceito da NeoCom para organizar histórico e dados pessoais de saúde sob controle do usuário.",
        ogDescription:
          "Dados sensíveis com governança pessoal e contexto claro.",
        twitterDescription:
          "Conheça a visão da NeoCom para histórico pessoal de saúde."
      },
      neorecicla: {
        description:
          "NeoRecicla é o projeto da NeoCom para coleta automatizada de resíduos em universidades com recompensas verificáveis.",
        ogDescription:
          "Sustentabilidade rastreável para ambientes universitários.",
        twitterDescription:
          "Coleta automatizada com dados verificáveis para reciclagem."
      }
    };
    const generatedProjectSlugs = getStaticPageDefinitions()
      .flatMap((page) =>
        page.locale === "pt-br" && page.pageKind === "project"
          ? [page.projectSlug]
          : [],
      )
      .sort();

    expect(Object.keys(projectMetadata).sort()).toEqual(generatedProjectSlugs);

    for (const [projectSlug, metadata] of Object.entries(projectMetadata)) {
      const html = renderStaticPage({
        locale: "pt-br",
        pageKind: "project",
        projectSlug
      });
      const page = new DOMParser().parseFromString(html, "text/html");

      expect(page.querySelector('meta[name="description"]')?.getAttribute("content")).toBe(
        metadata.description,
      );
      expect(page.querySelector('meta[property="og:description"]')?.getAttribute("content")).toBe(
        metadata.ogDescription,
      );
      expect(page.querySelector('meta[name="twitter:description"]')?.getAttribute("content")).toBe(
        metadata.twitterDescription,
      );
    }
  });

  it("renders project metadata with the shared template and a raster social image", () => {
    const html = renderStaticPage({
      locale: "en",
      pageKind: "project",
      projectSlug: "neorecicla"
    });

    expect(html).toContain('data-page-kind="project"');
    expect(html).toContain('data-project-slug="neorecicla"');
    expect(html).toContain("NeoRecicla | NeoCom");
    expect(html).toContain("https://neocom.cloud/assets/social-neorecicla.jpg");
    expect(html).toContain(
      'hreflang="pt-BR" href="https://neocom.cloud/pt-br/projects/neorecicla/"',
    );
  });

  it("applies the stored theme before first paint on every page", () => {
    for (const page of getStaticPageDefinitions()) {
      const html = renderStaticPage(page);
      const head = html.slice(0, html.indexOf("</head>"));

      // The bootstrap has to run from the head, ahead of the module script, or
      // a visitor who chose dark sees the light default paint first.
      expect(head, getPagePathLabel(page)).toContain('localStorage.getItem("neocom-theme")');
      expect(head, getPagePathLabel(page)).toContain("document.documentElement.dataset.theme");
      expect(html.indexOf("dataset.theme")).toBeLessThan(html.indexOf("page-entry"));
    }
  });

  it("points social previews at raster images", () => {
    // Open Graph and Twitter cards do not accept SVG, so a crawler handed one
    // may render no preview at all.
    for (const page of getStaticPageDefinitions()) {
      const html = renderStaticPage(page);
      const images = [...html.matchAll(/(?:og:image|twitter:image)" content="([^"]+)"/g)].map(
        ([, url]) => url,
      );

      expect(images.length, getPagePathLabel(page)).toBe(2);

      for (const url of images) {
        expect(url, getPagePathLabel(page)).toMatch(/.(jpe?g|png|gif)$/);
      }
    }
  });

  it("includes root and every localized page in the sitemap", () => {
    const xml = renderSitemapXml();

    expect(xml).toContain("<loc>https://neocom.cloud/</loc>");
    expect(xml).toContain("<loc>https://neocom.cloud/pt-br/</loc>");
    expect(xml).toContain("<loc>https://neocom.cloud/en/</loc>");
    expect(xml).toContain(
      "<loc>https://neocom.cloud/en/projects/devrecord/</loc>",
    );
    expect(xml).toContain(
      "<loc>https://neocom.cloud/pt-br/projects/neo-health/</loc>",
    );
  });
});
