import { describe, expect, it } from "vitest";
import {
  PRODUCTION_DISTRIBUTION_ORIGIN,
  PUBLIC_PAGE_PROBES,
  getPublicProbeUrl,
  verifySiteStatus
} from "../scripts/verify-site-status.mjs";

const expectedPublicUrls = [
  `${PRODUCTION_DISTRIBUTION_ORIGIN}/`,
  `${PRODUCTION_DISTRIBUTION_ORIGIN}/pt-br/`,
  `${PRODUCTION_DISTRIBUTION_ORIGIN}/en/`,
  `${PRODUCTION_DISTRIBUTION_ORIGIN}/robots.txt`,
  `${PRODUCTION_DISTRIBUTION_ORIGIN}/sitemap.xml`
];

function createResponse({ status = 200, contentType = "text/html", body = "" } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ "content-type": contentType }),
    text: async () => body
  };
}

function createLiveRoutes(siteOrigin) {
  const routes = new Map();

  for (const probe of PUBLIC_PAGE_PROBES) {
    const body = probe.expectedContent ?? "<!doctype html>";
    const contentType = probe.contentType === "xml" ? "application/xml" : probe.contentType;

    routes.set(
      getPublicProbeUrl(probe.pathname, siteOrigin),
      createResponse({ body, contentType })
    );
  }

  return routes;
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

describe("production site readiness", () => {
  it("probes the production CloudFront distribution by default", () => {
    expect(PRODUCTION_DISTRIBUTION_ORIGIN).toMatch(/^https:\/\/[a-z0-9]+\.cloudfront\.net$/);
  });

  it("checks every public route, one at a time", async () => {
    const routes = createLiveRoutes(PRODUCTION_DISTRIBUTION_ORIGIN);
    let active = 0;
    let maximumActive = 0;
    const fetchImpl = async (url) => {
      const response = routes.get(String(url));

      if (!response) {
        throw new Error(`Unexpected request: ${url}`);
      }

      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await new Promise((resolve) => setTimeout(resolve, 0));
      active -= 1;

      return response;
    };
    const result = await verifySiteStatus({ fetchImpl, attempts: 1 });

    expect(result.probes).toEqual(expectedPublicUrls);
    expect(maximumActive).toBe(1);
  });

  it("probes another origin when asked, such as the real domain after cut-over", async () => {
    const siteOrigin = "https://neocom.cloud";
    const result = await verifySiteStatus({
      fetchImpl: createFetch(createLiveRoutes(siteOrigin)),
      siteOrigin,
      attempts: 1
    });

    expect(result.probes[0]).toBe("https://neocom.cloud/");
    expect(result.siteOrigin).toBe(siteOrigin);
  });

  it("fails when a public route is unhealthy", async () => {
    const routes = createLiveRoutes(PRODUCTION_DISTRIBUTION_ORIGIN);
    routes.set(
      getPublicProbeUrl("/pt-br/"),
      createResponse({ status: 503, body: "temporarily unavailable" })
    );

    await expect(
      verifySiteStatus({ fetchImpl: createFetch(routes), attempts: 1 })
    ).rejects.toThrow(`${PRODUCTION_DISTRIBUTION_ORIGIN}/pt-br/ returned HTTP 503.`);
  });

  it("fails when a route serves the wrong content type", async () => {
    const routes = createLiveRoutes(PRODUCTION_DISTRIBUTION_ORIGIN);
    routes.set(
      getPublicProbeUrl("/robots.txt"),
      createResponse({ contentType: "text/html", body: "<html></html>" })
    );

    await expect(
      verifySiteStatus({ fetchImpl: createFetch(routes), attempts: 1 })
    ).rejects.toThrow("robots file must use content type text/plain");
  });

  it("fails when a route is missing the published content it must carry", async () => {
    const routes = createLiveRoutes(PRODUCTION_DISTRIBUTION_ORIGIN);
    routes.set(
      getPublicProbeUrl("/en/"),
      createResponse({ body: "<!doctype html><html></html>" })
    );

    await expect(
      verifySiteStatus({ fetchImpl: createFetch(routes), attempts: 1 })
    ).rejects.toThrow("English landing page is missing expected published content.");
  });

  it("recovers when a route is temporarily unavailable", async () => {
    const routes = createLiveRoutes(PRODUCTION_DISTRIBUTION_ORIGIN);
    const root = getPublicProbeUrl("/");
    let rootCalls = 0;
    const fetchImpl = async (url, options) => {
      if (String(url) === root) {
        rootCalls += 1;

        if (rootCalls === 1) {
          return createResponse({ status: 503, body: "temporarily unavailable" });
        }
      }

      return createFetch(routes)(url, options);
    };

    await expect(
      verifySiteStatus({ fetchImpl, attempts: 2, retryDelayMs: 0 })
    ).resolves.toMatchObject({ probes: expectedPublicUrls });

    expect(rootCalls).toBe(2);
  });

  it("fails after exhausting the retry attempts", async () => {
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      return createResponse({ status: 503, body: "temporarily unavailable" });
    };

    await expect(
      verifySiteStatus({ fetchImpl, attempts: 2, retryDelayMs: 0 })
    ).rejects.toThrow(`${PRODUCTION_DISTRIBUTION_ORIGIN}/ returned HTTP 503.`);

    expect(calls).toBe(2);
  });

  it("times out an unresponsive request", async () => {
    const fetchImpl = (_url, { signal }) =>
      new Promise((_resolve, reject) => {
        signal.addEventListener("abort", () => reject(signal.reason), { once: true });
      });

    await expect(
      verifySiteStatus({ fetchImpl, attempts: 1, attemptTimeoutMs: 5 })
    ).rejects.toThrow(/timed out|timeout/i);
  });
});
