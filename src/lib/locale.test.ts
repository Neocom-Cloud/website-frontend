import { describe, expect, it } from "vitest";
import {
  detectLocaleFromCandidates,
  resolveRootLocaleFromInput
} from "./locale";

describe("locale resolution", () => {
  it("detects the first supported browser locale", () => {
    expect(detectLocaleFromCandidates(["fr", "en-US"])).toBe("en");
    expect(detectLocaleFromCandidates(["pt-BR", "en"])).toBe("pt-br");
  });

  it("falls back to pt-br when nothing matches", () => {
    expect(detectLocaleFromCandidates(["fr", "de"])).toBe("pt-br");
    expect(detectLocaleFromCandidates([])).toBe("pt-br");
  });

  it("prioritizes query, then storage, then browser, then default", () => {
    expect(
      resolveRootLocaleFromInput({
        url: new URL("https://neocom.cloud/?lang=en"),
        storedLocale: "pt-br",
        browserLocales: ["pt-BR"]
      }),
    ).toEqual({
      locale: "en",
      shouldPersist: true,
      source: "query"
    });

    expect(
      resolveRootLocaleFromInput({
        url: new URL("https://neocom.cloud/"),
        storedLocale: "en",
        browserLocales: ["pt-BR"]
      }),
    ).toEqual({
      locale: "en",
      shouldPersist: false,
      source: "storage"
    });

    expect(
      resolveRootLocaleFromInput({
        url: new URL("https://neocom.cloud/"),
        storedLocale: null,
        browserLocales: ["en-US"]
      }),
    ).toEqual({
      locale: "en",
      shouldPersist: true,
      source: "browser"
    });

    expect(
      resolveRootLocaleFromInput({
        url: new URL("https://neocom.cloud/"),
        storedLocale: null,
        browserLocales: []
      }),
    ).toEqual({
      locale: "pt-br",
      shouldPersist: true,
      source: "default"
    });
  });
});
