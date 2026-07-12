import { describe, expect, it } from "vitest";
import {
  getStaticPageDefinitions,
  getViteInputMap,
  renderSitemapXml,
  renderStaticPage
} from "../scripts/static-site.mjs";

describe("static site generation", () => {
  it("builds the expected localized page manifest for Vite", () => {
    const pages = getStaticPageDefinitions();
    const inputs = getViteInputMap("/tmp/neocom");
    const inputValues = Object.values(inputs);

    expect(pages).toHaveLength(8);
    expect(inputs.root).toBe("/tmp/neocom/index.html");
    expect(inputs.notFound).toBe("/tmp/neocom/404.html");
    expect(inputs.ptBrLanding).toBe("/tmp/neocom/pt-br/index.html");
    expect(inputs.enLanding).toBe("/tmp/neocom/en/index.html");
    expect(inputValues).toContain(
      "/tmp/neocom/pt-br/projects/neorecicla/index.html",
    );
    expect(inputValues).toContain(
      "/tmp/neocom/en/projects/neo-health/index.html",
    );
  });

  it("renders localized landing metadata from the centralized catalog", () => {
    const html = renderStaticPage({
      locale: "pt-br",
      pageKind: "landing"
    });

    expect(html).toContain('lang="pt-BR"');
    expect(html).toContain("NeoCom | Inovacao em comunicacoes");
    expect(html).toContain(
      "Landing page da NeoCom focada em privacidade, sustentabilidade, confianca digital",
    );
    expect(html).toContain("https://neocom.cloud/assets/NeoCom_Icon_Final_v2.svg");
    expect(html).toContain('hreflang="en" href="https://neocom.cloud/en/"');
  });

  it("renders project metadata with the shared template and SVG-first assets", () => {
    const html = renderStaticPage({
      locale: "en",
      pageKind: "project",
      projectSlug: "neorecicla"
    });

    expect(html).toContain('data-page-kind="project"');
    expect(html).toContain('data-project-slug="neorecicla"');
    expect(html).toContain("NeoRecicla | NeoCom");
    expect(html).toContain("https://neocom.cloud/assets/NeoRecicla_Icon.svg");
    expect(html).toContain(
      'hreflang="pt-BR" href="https://neocom.cloud/pt-br/projects/neorecicla/"',
    );
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
