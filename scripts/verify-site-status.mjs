import { pathToFileURL } from "node:url";

/**
 * Readiness gate for the production site, hosted on AWS (S3 behind CloudFront).
 *
 * It probes the public routes over HTTPS. The default origin is the production
 * CloudFront distribution rather than neocom.cloud, so the gate reflects what
 * was published and cannot be failed by a DNS problem. Set SITE_ORIGIN to
 * https://neocom.cloud to probe the real domain once the cut-over is done.
 */
export const PRODUCTION_DISTRIBUTION_ORIGIN = "https://d2bmtl9y1doakb.cloudfront.net";
export const SITE_ORIGIN = PRODUCTION_DISTRIBUTION_ORIGIN;
export const PUBLIC_PAGE_PROBES = [
  {
    pathname: "/",
    contentType: "text/html",
    description: "site root"
  },
  {
    pathname: "/pt-br/",
    contentType: "text/html",
    expectedContent: 'data-locale="pt-br"',
    description: "Portuguese landing page"
  },
  {
    pathname: "/en/",
    contentType: "text/html",
    expectedContent: 'data-locale="en"',
    description: "English landing page"
  },
  {
    pathname: "/robots.txt",
    contentType: "text/plain",
    expectedContent: "Sitemap: https://neocom.cloud/sitemap.xml",
    description: "robots file"
  },
  {
    pathname: "/sitemap.xml",
    contentType: "xml",
    expectedContent: "<urlset",
    description: "sitemap"
  }
];

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function getPublicProbeUrl(pathname, siteOrigin = SITE_ORIGIN) {
  return new URL(pathname, siteOrigin).toString();
}

async function fetchWithRetry(
  url,
  options,
  fetchImpl,
  attempts,
  retryDelayMs,
  attemptTimeoutMs
) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const timeoutSignal = AbortSignal.timeout(attemptTimeoutMs);
      const signal = options.signal
        ? AbortSignal.any([options.signal, timeoutSignal])
        : timeoutSignal;
      const response = await fetchImpl(url, { ...options, signal });

      if (response.ok) {
        return response;
      }

      lastError = new Error(`${url} returned HTTP ${response.status}.`);
    } catch (error) {
      lastError = error;
    }

    if (attempt < attempts) {
      await wait(retryDelayMs);
    }
  }

  throw lastError;
}

function getContentType(response) {
  return response.headers.get("content-type")?.toLowerCase() ?? "";
}

async function verifyPublicProbe(probe, options) {
  const url = getPublicProbeUrl(probe.pathname, options.siteOrigin);
  const response = await fetchWithRetry(
    url,
    { headers: { Accept: "text/html,application/xml,text/plain" } },
    options.fetchImpl,
    options.attempts,
    options.retryDelayMs,
    options.attemptTimeoutMs
  );
  const contentType = getContentType(response);

  if (!contentType.includes(probe.contentType)) {
    throw new Error(
      `${probe.description} must use content type ${probe.contentType} (received ${contentType || "none"}).`
    );
  }

  if (probe.expectedContent) {
    const body = await response.text();

    if (!body.includes(probe.expectedContent)) {
      throw new Error(`${probe.description} is missing expected published content.`);
    }
  }

  return url;
}

export async function verifySiteStatus({
  fetchImpl = fetch,
  siteOrigin = SITE_ORIGIN,
  attempts = 3,
  retryDelayMs = 1_000,
  attemptTimeoutMs = 10_000
} = {}) {
  const probes = [];

  // Keep external readiness probes predictable and avoid a burst against the origin.
  for (const probe of PUBLIC_PAGE_PROBES) {
    probes.push(
      await verifyPublicProbe(probe, {
        attempts,
        attemptTimeoutMs,
        fetchImpl,
        retryDelayMs,
        siteOrigin
      })
    );
  }

  return { probes, siteOrigin };
}

export async function runSiteStatusCheck(environment = process.env) {
  const siteOrigin = environment.SITE_ORIGIN || SITE_ORIGIN;
  const result = await verifySiteStatus({ siteOrigin });

  console.log(
    `Site readiness accepted: ${result.probes.length} public HTTPS checks passed on ${siteOrigin}.`
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runSiteStatusCheck().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
