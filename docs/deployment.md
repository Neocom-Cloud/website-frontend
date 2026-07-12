# Deployment and DNS

This project deploys a static site to GitHub Pages and serves it on `neocom.cloud`.

## Current hosting model

- Build system: Vite static output
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

## 1. GitHub Pages repository setup

1. Push the repository to GitHub.
2. In the repository, open `Settings -> Pages`.
3. Configure GitHub Pages to deploy from GitHub Actions.
4. In the `Custom domain` field, set `neocom.cloud`.
5. Save the custom domain and wait for GitHub Pages to validate it.
6. When the `Enforce HTTPS` option becomes available, enable it.

Notes:

- This repository includes `public/CNAME`, but for a GitHub Actions publishing flow the repository setting is still the source of truth for the custom domain.
- GitHub recommends verifying the custom domain before or while configuring the repository to reduce takeover risk.
- Do not select `Deploy from a branch` in GitHub Pages. The workflow uploads the built `dist` directory as a Pages artifact.
- GitHub Pages does not require the default branch to deploy. This repository publishes production only when `deploy` changes.

### 1.1 Branch promotion and production deployment

Use the following branch path for changes intended for production:

```text
develop -> Q.A -> main -> deploy
```

- `develop` is the integration branch.
- `Q.A` is the validation branch.
- `main` is the repository default and release branch.
- `deploy` is the production publishing branch. A successful push to `deploy` starts the Pages deployment workflow.

Recommended repository rules:

1. Add a branch ruleset for `develop`, `Q.A`, `main`, and `deploy` that requires pull requests, requires branches to be up to date, blocks force pushes and deletions, and does not allow bypasses.
2. Require these checks before merging, with no human approval requirement:
   - `Validate GitHub Actions workflows`
   - `Validate promotion path`
   - `Test and build`
3. Restrict the source branch for staged promotions through the CI policy: `develop -> Q.A -> main -> deploy`. GitHub branch rules do not enforce a pull request's source branch by themselves.
4. Keep GitHub Pages set to `GitHub Actions`; changing the default branch does not affect the deployment source.

The deployment workflow supports manual dispatch, but it only publishes when dispatched from `deploy`. It reruns typechecking, tests, the production build, and deployment-output smoke tests before uploading the Pages artifact.

## 2. Option A: Direct Hostinger DNS -> GitHub Pages

Use this path if you want the simplest working setup and do not need Cloudflare in front of the site.

### 2.1 Hostinger DNS records

Open the DNS zone editor for `neocom.cloud` in Hostinger hPanel and create these records:

| Type | Name | Value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | neocom-cloud.github.io |

Optional IPv6 records:

| Type | Name | Value |
| --- | --- | --- |
| AAAA | @ | 2606:50c0:8000::153 |
| AAAA | @ | 2606:50c0:8001::153 |
| AAAA | @ | 2606:50c0:8002::153 |
| AAAA | @ | 2606:50c0:8003::153 |

### 2.2 Direct DNS verification

After propagation, verify the records locally:

```bash
dig neocom.cloud +noall +answer -t A
dig www.neocom.cloud +noall +answer -t CNAME
```

Expected result:

- `neocom.cloud` resolves to the GitHub Pages IPs above
- `www.neocom.cloud` resolves to `neocom-cloud.github.io`

### 2.3 Behavior

- With `neocom.cloud` configured as the custom domain and `www` pointed correctly, GitHub Pages should handle redirects between apex and `www`.
- Wait for HTTPS issuance before expecting the GitHub Pages `Enforce HTTPS` toggle to appear.

## 3. Option B: Hostinger registrar + Cloudflare DNS and proxy

Use this path if you want Cloudflare to manage DNS and optionally proxy web traffic in front of GitHub Pages.

Important:

- Once you switch nameservers to Cloudflare, Hostinger no longer serves the live DNS zone for this domain.
- If you use domain email such as `contato@neocom.cloud`, recreate all required MX, SPF, DKIM, and DMARC records in Cloudflare before or immediately after the nameserver switch.
- Cloudflare documents that some SaaS-hosted sites may need `DNS only`. GitHub Pages usually works behind Cloudflare, but the safe rollout is to start with `DNS only`, confirm GitHub HTTPS works, and only then enable the proxy.

### 3.1 Prepare for the move

Before changing nameservers:

1. Audit the current DNS records in Hostinger.
2. Write down every non-web record you still need:
   - MX
   - SPF TXT
   - DKIM TXT or CNAME
   - DMARC TXT
   - any verification records for email or third-party services
3. If DNSSEC is enabled at the registrar, disable it before changing nameservers.

### 3.2 Add the domain to Cloudflare

1. Add `neocom.cloud` to Cloudflare using full setup.
2. Let Cloudflare scan the current DNS zone.
3. Remove incorrect defaults if needed.
4. Make sure the final Cloudflare zone contains the required non-web records for email and verification.

### 3.3 Cloudflare web records for GitHub Pages

Create or confirm these web records in Cloudflare:

| Type | Name | Target | Proxy status |
| --- | --- | --- | --- |
| CNAME | @ | neocom-cloud.github.io | DNS only at first |
| CNAME | www | neocom-cloud.github.io | DNS only at first |

Why CNAME on the apex works here:

- Cloudflare supports CNAME flattening at the zone apex, so `@ -> neocom-cloud.github.io` is valid even though normal DNS apex CNAME rules are restrictive.

### 3.4 Point Hostinger to Cloudflare nameservers

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

### 3.5 Phase 1: keep the site DNS-only

Before enabling the Cloudflare proxy:

1. Keep `@` and `www` as `DNS only`.
2. Confirm GitHub Pages recognizes `neocom.cloud` as the custom domain.
3. Wait for GitHub Pages HTTPS issuance.
4. Enable `Enforce HTTPS` in GitHub Pages.

This is the lowest-risk configuration and may be all you need.

### 3.6 Phase 2: optional Cloudflare proxy

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

### 3.7 Proxy caveats and rollback

If proxy mode causes issues:

- Cloudflare `526` usually means the proxied origin certificate path is not valid yet for the requested hostname. First confirm GitHub Pages HTTPS is active, then retry.
- Unexpected redirect loops or broken validation are a reason to switch the web records back to `DNS only`.
- If the site works in `DNS only` but fails when proxied, keep the site `DNS only` and use Cloudflare only as the authoritative DNS provider for now.

## 4. Troubleshooting

### GitHub Pages custom domain does not validate

Check:

- the repository Pages custom domain is exactly `neocom.cloud`
- the apex record targets are correct
- the `www` record points to `neocom-cloud.github.io`
- DNS propagation has finished

### GitHub Pages HTTPS toggle does not appear

Wait for propagation and GitHub certificate issuance. This can take time after DNS changes.

### Cloudflare 526

This means Cloudflare strict SSL checks are failing against the origin. Verify GitHub Pages HTTPS is active for the domain, then retry. If needed, move the site records back to `DNS only`.

### Domain email stops working after moving to Cloudflare

This means required MX or TXT records were not recreated in Cloudflare. Re-add the email provider records as `DNS only`.

## 5. Reference commands

```bash
dig neocom.cloud +noall +answer -t A
dig neocom.cloud +noall +answer -t AAAA
dig www.neocom.cloud +noall +answer -t CNAME
dig ns neocom.cloud @1.1.1.1
dig ns neocom.cloud @8.8.8.8
```

## 6. References

- GitHub Pages custom domains:
  - https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
  - https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages
- Cloudflare:
  - https://developers.cloudflare.com/dns/cname-flattening/
  - https://developers.cloudflare.com/dns/proxy-status/
  - https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/
  - https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/
