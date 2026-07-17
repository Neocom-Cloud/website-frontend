import { pathToFileURL } from "node:url";

export const PAGES_API_ORIGIN = "https://api.github.com";
export const PRODUCTION_ORIGIN = "https://neocom.cloud";
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

const REQUIRED_PAGES_BUILD_TYPE = "workflow";
const REQUIRED_PAGES_CNAME = "neocom.cloud";
const REQUIRED_DOMAIN_STATE = "verified";
const REQUIRED_CERTIFICATE_STATE = "approved";

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function getPagesApiUrl(repository, apiOrigin = PAGES_API_ORIGIN) {
  return new URL(`/repos/${repository}/pages`, apiOrigin).toString();
}

export function getPublicProbeUrl(pathname, siteOrigin = PRODUCTION_ORIGIN) {
  return new URL(pathname, siteOrigin).toString();
}

export function validatePagesConfiguration(pages) {
  const errors = [];

  if (pages.build_type !== REQUIRED_PAGES_BUILD_TYPE) {
    errors.push(`GitHub Pages build type must be ${REQUIRED_PAGES_BUILD_TYPE}.`);
  }

  if (pages.cname !== REQUIRED_PAGES_CNAME) {
    errors.push(`GitHub Pages custom domain must be ${REQUIRED_PAGES_CNAME}.`);
  }

  if (pages.protected_domain_state !== REQUIRED_DOMAIN_STATE) {
    errors.push("GitHub Pages custom-domain protection must be verified.");
  }

  if (pages.https_certificate?.state !== REQUIRED_CERTIFICATE_STATE) {
    errors.push("GitHub Pages HTTPS certificate must be approved.");
  }

  const bootstrap = pages.status === null;

  if (!bootstrap && pages.status !== "built") {
    errors.push(`GitHub Pages status must be built after deployment (received ${pages.status}).`);
  }

  if (!bootstrap && pages.https_enforced !== true) {
    errors.push("GitHub Pages must enforce HTTPS after the first deployment.");
  }

  return {
    bootstrap,
    errors,
    valid: errors.length === 0
  };
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

export async function verifyPagesStatus({
  repository,
  token,
  fetchImpl = fetch,
  apiOrigin = PAGES_API_ORIGIN,
  siteOrigin = PRODUCTION_ORIGIN,
  attempts = 3,
  retryDelayMs = 1_000,
  attemptTimeoutMs = 10_000
}) {
  if (!repository || !token) {
    throw new Error("GITHUB_REPOSITORY and GITHUB_TOKEN are required.");
  }

  const pagesResponse = await fetchWithRetry(
    getPagesApiUrl(repository, apiOrigin),
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28"
      }
    },
    fetchImpl,
    attempts,
    retryDelayMs,
    attemptTimeoutMs
  );
  const pages = await pagesResponse.json();
  const configuration = validatePagesConfiguration(pages);

  if (!configuration.valid) {
    throw new Error(`GitHub Pages readiness failed:\n- ${configuration.errors.join("\n- ")}`);
  }

  if (configuration.bootstrap) {
    return { bootstrap: true, pages, probes: [] };
  }

  const probes = [];

  // Keep external readiness probes predictable and avoid a burst against the custom domain.
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

  return { bootstrap: false, pages, probes };
}

export async function runPagesStatusCheck(environment = process.env) {
  const result = await verifyPagesStatus({
    repository: environment.GITHUB_REPOSITORY,
    token: environment.GITHUB_TOKEN
  });

  if (result.bootstrap) {
    console.log(
      "GitHub Pages readiness accepted in bootstrap mode: no published deployment exists yet."
    );
    return;
  }

  console.log("GitHub Pages readiness accepted: public HTTPS smoke checks passed.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runPagesStatusCheck().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
