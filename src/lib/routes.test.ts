import { describe, expect, it } from "vitest";
import {
  getAlternateLocale,
  getLandingPath,
  getPagePath,
  getProjectPath,
  isLocale,
  isProjectSlug,
  normalizeLocale
} from "./routes";

describe("routes helpers", () => {
  it("normalizes supported locale variants", () => {
    expect(normalizeLocale("pt")).toBe("pt-br");
    expect(normalizeLocale("pt_BR")).toBe("pt-br");
    expect(normalizeLocale("en")).toBe("en");
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("fr")).toBeNull();
  });

  it("returns localized landing and project paths", () => {
    expect(getLandingPath("pt-br")).toBe("/pt-br/");
    expect(getLandingPath("en")).toBe("/en/");
    expect(getProjectPath("en", "devrecord")).toBe("/en/projects/devrecord/");
    expect(getPagePath("pt-br", "project", "neo-health")).toBe(
      "/pt-br/projects/neo-health/",
    );
    expect(getPagePath("en", "landing")).toBe("/en/");
  });

  it("validates locale and project identifiers", () => {
    expect(isLocale("pt-br")).toBe(true);
    expect(isLocale("es")).toBe(false);
    expect(isProjectSlug("neorecicla")).toBe(true);
    expect(isProjectSlug("ragnarok")).toBe(false);
    expect(getAlternateLocale("pt-br")).toBe("en");
    expect(getAlternateLocale("en")).toBe("pt-br");
  });
});
