import { describe, expect, it } from "vitest";
import { getProjectMailto } from "./site.js";

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
      "Ola NeoCom,\n\nQuero conversar sobre NeoRecicla.",
    );
  });
});
