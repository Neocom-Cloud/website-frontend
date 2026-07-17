import { describe, expect, it } from "vitest";
import {
  PAGES_API_ORIGIN,
  PUBLIC_PAGE_PROBES,
  getPagesApiUrl,
  getPublicProbeUrl,
  validatePagesConfiguration,
  verifyPagesStatus
} from "../scripts/verify-pages-status.mjs";

const repository = "Neocom-Cloud/website-frontend";
const token = "test-token";
const expectedPublicUrls = [
  "https://neocom.cloud/",
  "https://neocom.cloud/pt-br/",
  "https://neocom.cloud/en/",
  "https://neocom.cloud/robots.txt",
  "https://neocom.cloud/sitemap.xml"
];

function createPages(overrides = {}) {
  return {
    build_type: "workflow",
    cname: "neocom.cloud",
    protected_domain_state: "verified",
    https_certificate: { state: "approved" },
    https_enforced: false,
    status: null,
    ...overrides
  };
}

function createResponse({ status = 200, contentType = "application/json", body = {} } = {}) {
  const text = typeof body === "string" ? body : JSON.stringify(body);

  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ "content-type": contentType }),
    json: async () => (typeof body === "string" ? JSON.parse(body) : body),
    text: async () => text
  };
}

function createFetch(routes) {
  return async (url) => {
    const response = routes.get(String(url));

    if (!response) {
      throw new Error(`Unexpected request: ${url}`);
    }

    return response;
  };
}

function createLiveRoutes(pages = createPages({ https_enforced: true, status: "built" })) {
  const routes = new Map([[getPagesApiUrl(repository), createResponse({ body: pages })]]);

  for (const probe of PUBLIC_PAGE_PROBES) {
    const body = probe.expectedContent ?? "<!doctype html>";
    const contentType = probe.contentType === "xml" ? "application/xml" : probe.contentType;

    routes.set(
      getPublicProbeUrl(probe.pathname),
      createResponse({ body, contentType })
    );
  }

  return routes;
}

describe("GitHub Pages readiness", () => {
  it("accepts the first-release bootstrap without public probes", async () => {
    const pagesUrl = getPagesApiUrl(repository);
    const fetchImpl = createFetch(
      new Map([[pagesUrl, createResponse({ body: createPages() })]])
    );

    await expect(
      verifyPagesStatus({ repository, token, fetchImpl, attempts: 1 })
    ).resolves.toMatchObject({ bootstrap: true, probes: [] });
  });

  it("requires a valid GitHub Pages configuration", () => {
    expect(
      validatePagesConfiguration(createPages({ cname: "incorrect.example" }))
    ).toMatchObject({
      bootstrap: true,
      valid: false,
      errors: ["GitHub Pages custom domain must be neocom.cloud."]
    });
  });

  it("requires HTTPS enforcement once a deployment exists", () => {
    expect(
      validatePagesConfiguration(createPages({ status: "built" }))
    ).toMatchObject({
      bootstrap: false,
      valid: false,
      errors: ["GitHub Pages must enforce HTTPS after the first deployment."]
    });
  });

  it("checks every public route after a successful deployment", async () => {
    const result = await verifyPagesStatus({
      repository,
      token,
      fetchImpl: createFetch(createLiveRoutes()),
      attempts: 1
    });

    expect(result).toMatchObject({ bootstrap: false });
    expect(result.probes).toEqual(expectedPublicUrls);
  });

  it("fails when a published public route is unhealthy", async () => {
    const routes = createLiveRoutes();
    routes.set(
      getPublicProbeUrl("/pt-br/"),
      createResponse({ status: 503, body: "temporarily unavailable" })
    );

    await expect(
      verifyPagesStatus({
        repository,
        token,
        fetchImpl: createFetch(routes),
        attempts: 1
      })
    ).rejects.toThrow("https://neocom.cloud/pt-br/ returned HTTP 503.");
  });

  it("times out an unresponsive Pages request", async () => {
    const fetchImpl = (_url, { signal }) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(signal.reason), { once: true });
      });

    await expect(
      verifyPagesStatus({
        repository,
        token,
        fetchImpl,
        attempts: 1,
        attemptTimeoutMs: 5
      })
    ).rejects.toThrow(/timed out|timeout/i);
  });

  it("builds the Pages endpoint from the repository identifier", () => {
    expect(getPagesApiUrl(repository)).toBe(
      `${PAGES_API_ORIGIN}/repos/${repository}/pages`
    );
  });
});
