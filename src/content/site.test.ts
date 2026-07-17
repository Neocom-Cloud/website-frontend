import { describe, expect, it } from "vitest";
import { getProjectMailto, siteContent } from "./site.js";

describe("project mailto helper", () => {
  it("creates a localized mailto link with encoded subject and body", () => {
    const mailto = getProjectMailto("en", "DevRecord");

    expect(mailto).toContain("mailto:contato@neocom.cloud");
    expect(mailto).toContain("subject=DevRecord%20-%20NeoCom");
    expect(decodeURIComponent(mailto)).toContain(
      "Hello NeoCom,\n\nI want to discuss DevRecord.",
    );
  });

  it("supports Portuguese mail copy", () => {
    const mailto = getProjectMailto("pt-br", "NeoRecicla");

    expect(decodeURIComponent(mailto)).toContain(
      "Olá NeoCom,\n\nQuero conversar sobre NeoRecicla.",
    );
  });

  it("keeps Portuguese UI, project, and SEO copy accented", () => {
    const copy = siteContent["pt-br"];

    expect(copy.hero).toMatchObject({
      titleLead: "Inovação em",
      phrases: expect.arrayContaining(["comunicações", "tecnologia ética"]),
      cta: "Conheça nossos projetos"
    });
    expect(copy.projects.items.neorecicla.summary).toContain("resíduos");
    expect(copy.projects.items.devrecord.summary).toContain("histórico de produção");
    expect(copy.projects.items["neo-health"].summary).toContain("informações de saúde");
    expect(copy.seo.landing.title).toBe("NeoCom | Inovação em comunicações");
    expect(copy.seo.landing.description).toContain("confiança digital");
  });
});
