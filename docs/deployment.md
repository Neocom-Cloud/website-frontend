# Deployment and DNS

This project deploys a static site to GitHub Pages and serves it on `neocom.cloud`.

## Current hosting model

- Build system: Vite static output
- Build runtime: Node.js 24 baseline with pnpm 11.3.0; CI also validates the current latest Node release
- Deploy target: GitHub Pages
- Canonical domain: `https://neocom.cloud`
- Alternate host: `https://www.neocom.cloud`
- GitHub Pages owner domain: `neocom-cloud.github.io`

## Locale routing model

The current production model is fully static:

- `/` is a lightweight redirect shell
- `/pt-br/` and `/en/` are the SEO-facing localized landing pages
- `/pt-br/projects/:slug/` and `/en/projects/:slug/` are the SEO-facing project pages

Locale selection precedence on the root entry is:

1. `?lang=...`
2. stored locale in `localStorage`
3. browser locale from `navigator.languages`
4. default `pt-br`

Important limitation:

- GitHub Pages cannot inspect request headers or visitor geography before responding, so it cannot do true server-side locale detection from `Accept-Language`.
- If later you want edge-based locale routing, implement it in Cloudflare Workers/Rules or during the AWS migration.

## 1. Configure the site now: Hostinger DNS -> GitHub Pages

Use this path while Hostinger remains the authoritative DNS provider for `neocom.cloud`. Confirm the active provider before changing records:

```bash
dig neocom.cloud +short -t NS
```

- This repository includes `public/CNAME`, but for a GitHub Actions publishing flow the repository setting is still the source of truth for the custom domain.
- GitHub recommends verifying the custom domain before or while configuring the repository to reduce takeover risk.
- Do not select `Deploy from a branch` in GitHub Pages. The workflow uploads the built `dist` directory as a Pages artifact.
- GitHub Pages does not require the default branch to deploy. This repository publishes production only when `deploy` changes.
- The repository does not need to be named `neocom-cloud.github.io`. That name identifies an organization root Pages repository; this project repository can serve `neocom.cloud` through the Pages custom-domain setting.

### 1.1 Branch promotion and production deployment

Use the following branch path for changes intended for production:

```text
develop -> Q.A -> main -> Q.A.E2E -> deploy
```

- `develop` is the integration branch.
- `Q.A` is the validation branch.
- `main` is the repository default and release branch.
- `Q.A.E2E` is the full-browser validation and manual-acceptance branch.
- `deploy` is the production publishing branch. A successful push to `deploy` starts the Pages deployment workflow.

Recommended repository rules:

1. Add a branch ruleset for `develop`, `Q.A`, `main`, `Q.A.E2E`, and `deploy` that requires pull requests, requires branches to be up to date, blocks force pushes and deletions, and does not allow bypasses.
2. Require these checks before merging, with no human approval requirement:
   - `Validate GitHub Actions workflows`
   - `Validate promotion path`
   - `Test and build (Node 24)`
   - `Test and build (Node latest)`
3. Require the `Browser end-to-end` check for `Q.A.E2E` and `deploy` promotion PRs. It runs Playwright on Chromium, Firefox, WebKit, and Chromium mobile.
4. Restrict the source branch for staged promotions through the CI policy: `develop -> Q.A -> main -> Q.A.E2E -> deploy`. GitHub branch rules do not enforce a pull request's source branch by themselves.
4. Keep GitHub Pages set to `GitHub Actions`; changing the default branch does not affect the deployment source.

A push to `deploy` publishes production. A manual dispatch also publishes only when run from `deploy`; both paths use the Node 24 baseline and rerun typechecking, tests, the production build, and deployment-output smoke tests before uploading the Pages artifact.

### 1.2 Preflight checks

1. Confirm that no other GitHub Pages repository serves `neocom.cloud`. Organization or enterprise domain verification proves ownership; it does not route this child repository's site.
2. Confirm the production branch contains a successful `deploy-pages.yml` run. Pushes to `develop` do not publish a Pages site unless `develop` is explicitly listed under `on.push.branches` in the active workflow.
3. In this repository, open `Settings -> Pages` and keep `Source` set to `GitHub Actions`.
4. Do not use the suggested Jekyll or Static HTML templates. This repository already has a custom Vite build and Pages deployment workflow.

### 1.3 Configure the GitHub Pages custom domain

1. In `Settings -> Pages`, enter `neocom.cloud` in `Custom domain` and save it.
2. Leave the setting in place while DNS propagates. Use `Check again` only after the records below resolve publicly.
3. Enable `Enforce HTTPS` only after GitHub makes it available.

Important:

- For a GitHub Actions publishing workflow, the Pages `Custom domain` setting is authoritative. GitHub does not create or require a `CNAME` file for this workflow type, so `public/CNAME` must not be used to diagnose or configure DNS routing.
- Keep any GitHub Pages domain-verification TXT record created for the organization or Pages account. Verification protects the domain from takeover; it does not replace the DNS records below.
- Do not use wildcard DNS records such as `*.neocom.cloud` for Pages.

### 1.4 Apply the required Hostinger DNS records

In Hostinger hPanel, open `Domains -> neocom.cloud -> DNS / Nameservers -> DNS Zone Editor`.

Create all five records below. Use the apex host name Hostinger displays as `@` or leave the name empty if Hostinger labels it as the root domain.

| Action | Type | Name | Value |
| --- | --- | --- | --- |
| Add | A | @ | 185.199.108.153 |
| Add | A | @ | 185.199.109.153 |
| Add | A | @ | 185.199.110.153 |
| Add | A | @ | 185.199.111.153 |
| Replace | CNAME | www | neocom-cloud.github.io |

Before saving:

- Replace the current `www -> neocom.cloud` CNAME. It must point directly to `neocom-cloud.github.io`.
- Do not create a CNAME record for `@`; Hostinger DNS does not provide Cloudflare-style apex CNAME flattening.
- Preserve existing MX, SPF, DKIM, DMARC, TXT, and third-party verification records. Only web records for `@` and `www` should change.
- If you later add a CAA record, include `letsencrypt.org` so GitHub Pages can issue HTTPS certificates.

Optional IPv6 records:

| Type | Name | Value |
| --- | --- | --- |
| AAAA | @ | 2606:50c0:8000::153 |
| AAAA | @ | 2606:50c0:8001::153 |
| AAAA | @ | 2606:50c0:8002::153 |
| AAAA | @ | 2606:50c0:8003::153 |

The four IPv4 A records are the required minimum. Add the IPv6 records after the IPv4 configuration is working if IPv6 support is desired.

### 1.5 Verify DNS, Pages, and HTTPS in order

Wait for DNS propagation, then run:

```bash
dig neocom.cloud +short -t A
dig www.neocom.cloud +short -t CNAME
dig neocom.cloud +short -t AAAA
```

Expected result:

- The A lookup returns all four `185.199.*` GitHub Pages addresses.
- The CNAME lookup returns `neocom-cloud.github.io.`.
- The AAAA lookup is either empty or returns the four optional GitHub Pages IPv6 addresses.

Then:

1. Confirm a Pages deployment workflow has completed successfully from the production deployment branch.
2. Return to `Settings -> Pages` and click `Check again`.
3. Wait for GitHub to validate the domain and issue HTTPS.
4. Enable `Enforce HTTPS`.
5. Verify both `https://neocom.cloud` and `https://www.neocom.cloud`. GitHub Pages should redirect the alternate host to the configured canonical domain.

## 2. Option B: Hostinger registrar + Cloudflare DNS and proxy

Use this path if you want Cloudflare to manage DNS and optionally proxy web traffic in front of GitHub Pages.

Important:

- Once you switch nameservers to Cloudflare, Hostinger no longer serves the live DNS zone for this domain.
- If you use domain email such as `contato@neocom.cloud`, recreate all required MX, SPF, DKIM, and DMARC records in Cloudflare before or immediately after the nameserver switch.
- Cloudflare documents that some SaaS-hosted sites may need `DNS only`. GitHub Pages usually works behind Cloudflare, but the safe rollout is to start with `DNS only`, confirm GitHub HTTPS works, and only then enable the proxy.

### 2.1 Prepare for the move

Before changing nameservers:

1. Audit the current DNS records in Hostinger.
2. Write down every non-web record you still need:
   - MX
   - SPF TXT
   - DKIM TXT or CNAME
   - DMARC TXT
   - any verification records for email or third-party services
3. If DNSSEC is enabled at the registrar, disable it before changing nameservers.

### 2.2 Add the domain to Cloudflare

1. Add `neocom.cloud` to Cloudflare using full setup.
2. Let Cloudflare scan the current DNS zone.
3. Remove incorrect defaults if needed.
4. Make sure the final Cloudflare zone contains the required non-web records for email and verification.

### 2.3 Cloudflare web records for GitHub Pages

Create or confirm these web records in Cloudflare:

| Type | Name | Target | Proxy status |
| --- | --- | --- | --- |
| CNAME | @ | neocom-cloud.github.io | DNS only at first |
| CNAME | www | neocom-cloud.github.io | DNS only at first |

Why CNAME on the apex works here:

- Cloudflare supports CNAME flattening at the zone apex, so `@ -> neocom-cloud.github.io` is valid even though normal DNS apex CNAME rules are restrictive.

### 2.4 Point Hostinger to Cloudflare nameservers

In Hostinger domain management:

1. Open nameserver management for `neocom.cloud`.
2. Remove the existing authoritative nameservers.
3. Add the two nameservers assigned by Cloudflare exactly as shown in the Cloudflare dashboard.
4. Save the change.

Verification commands after propagation:

```bash
whois neocom.cloud
dig ns neocom.cloud @1.1.1.1
dig ns neocom.cloud @8.8.8.8
```

Expected result:

- the authoritative nameservers are Cloudflare-assigned nameservers

### 2.5 Phase 1: keep the site DNS-only

Before enabling the Cloudflare proxy:

1. Keep `@` and `www` as `DNS only`.
2. Confirm GitHub Pages recognizes `neocom.cloud` as the custom domain.
3. Wait for GitHub Pages HTTPS issuance.
4. Enable `Enforce HTTPS` in GitHub Pages.

This is the lowest-risk configuration and may be all you need.

### 2.6 Phase 2: optional Cloudflare proxy

If you want Cloudflare in front of the site:

1. Switch the `@` and `www` CNAME records from `DNS only` to `Proxied`.
2. In Cloudflare, open `SSL/TLS -> Overview`.
3. Set encryption mode to `Full (strict)`.
4. Confirm that:
   - `https://neocom.cloud`
   - `https://www.neocom.cloud`
   both load correctly.

Expected benefits:

- Cloudflare caching
- edge security controls
- DDoS protection
- optional redirects, rules, and analytics later

### 2.7 Proxy caveats and rollback

If proxy mode causes issues:

- Cloudflare `526` usually means the proxied origin certificate path is not valid yet for the requested hostname. First confirm GitHub Pages HTTPS is active, then retry.
- Unexpected redirect loops or broken validation are a reason to switch the web records back to `DNS only`.
- If the site works in `DNS only` but fails when proxied, keep the site `DNS only` and use Cloudflare only as the authoritative DNS provider for now.

## 3. Troubleshooting

### GitHub Pages custom domain does not validate

If GitHub Pages displays `DNS check unsuccessful` or `NotServedByPagesError`, the domain is not resolving to GitHub Pages yet. This is a DNS problem, not a workflow-template problem.

The failure pattern is:

- `neocom.cloud` returns no A or AAAA records
- `www.neocom.cloud` resolves to `neocom.cloud` instead of `neocom-cloud.github.io`

Fix the records in [Apply the required Hostinger DNS records](#14-apply-the-required-hostinger-dns-records), wait for propagation, and then click `Check again` in GitHub Pages.

Also check:

- the repository Pages custom domain is exactly `neocom.cloud`
- the production branch has a successful Pages deployment run
- no other Pages repository is configured with the same apex domain

### GitHub Pages HTTPS toggle does not appear

Wait for propagation and GitHub certificate issuance. This can take time after DNS changes.

### Cloudflare 526

This means Cloudflare strict SSL checks are failing against the origin. Verify GitHub Pages HTTPS is active for the domain, then retry. If needed, move the site records back to `DNS only`.

### Domain email stops working after moving to Cloudflare

This means required MX or TXT records were not recreated in Cloudflare. Re-add the email provider records as `DNS only`.

## 4. Reference commands

```bash
dig neocom.cloud +noall +answer -t A
dig neocom.cloud +noall +answer -t AAAA
dig www.neocom.cloud +noall +answer -t CNAME
dig ns neocom.cloud @1.1.1.1
dig ns neocom.cloud @8.8.8.8
```

## 5. References

- GitHub Pages custom domains:
  - https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
  - https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages
  - https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages
- Cloudflare:
  - https://developers.cloudflare.com/dns/cname-flattening/
  - https://developers.cloudflare.com/dns/proxy-status/
  - https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/
  - https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/
