import { describe, expect, it } from "vitest";
import {
  getDocumentLocale,
  getPageKind,
  getProjectSlug,
  getQueryLocaleOverrideAction
} from "./page-bootstrap";

describe("page bootstrap helpers", () => {
  it("reads locale and page kind from the dataset", () => {
    const dataset = {
      locale: "pt-br",
      pageKind: "landing"
    } as DOMStringMap;

    expect(getDocumentLocale(dataset)).toBe("pt-br");
    expect(getPageKind(dataset)).toBe("landing");
    expect(getProjectSlug(dataset, "landing")).toBeUndefined();
  });

  it("throws on invalid dataset values", () => {
    expect(() =>
      getDocumentLocale({ locale: "es" } as DOMStringMap),
    ).toThrowError("Invalid or missing locale dataset.");

    expect(() =>
      getPageKind({ pageKind: "unknown" } as DOMStringMap),
    ).toThrowError("Invalid or missing page kind dataset.");

    expect(() =>
      getProjectSlug({ projectSlug: "unknown" } as DOMStringMap, "project"),
    ).toThrowError("Invalid or missing project slug dataset.");
  });

  it("returns redirect actions when the query locale differs", () => {
    expect(
      getQueryLocaleOverrideAction({
        currentLocale: "pt-br",
        pageKind: "project",
        projectSlug: "devrecord",
        url: new URL("https://neocom.cloud/pt-br/projects/devrecord/?lang=en")
      }),
    ).toEqual({
      type: "redirect",
      localeToStore: "en",
      targetPath: "/en/projects/devrecord/"
    });
  });

  it("strips the lang query when already on the requested locale", () => {
    expect(
      getQueryLocaleOverrideAction({
        currentLocale: "en",
        pageKind: "landing",
        url: new URL("https://neocom.cloud/en/?lang=en&from=test#hero")
      }),
    ).toEqual({
      type: "strip-query",
      localeToStore: "en",
      cleanedPath: "/en/?from=test#hero"
    });
  });

  it("returns no action when the query does not specify a supported locale", () => {
    expect(
      getQueryLocaleOverrideAction({
        currentLocale: "en",
        pageKind: "landing",
        url: new URL("https://neocom.cloud/en/?lang=es")
      }),
    ).toEqual({
      type: "none",
      localeToStore: null
    });
  });
});
