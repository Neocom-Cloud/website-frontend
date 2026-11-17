# Deployment and DNS

This project deploys a static site to GitHub Pages and serves it on `neocom.cloud`.

## Current hosting model

- Build system: Vite static output
- Build runtime: Node.js 24 baseline with pnpm 11.3.0; CI also validates the current latest Node release
- Deploy target: GitHub Pages
- Canonical domain: `https://neocom.cloud`
- Alternate host: `https://www.neocom.cloud`
- GitHub Pages owner domain: `neocom-cloud.github.io`

## Direction: moving to AWS

Decided on 2026-11-17: the site leaves GitHub Pages and is hosted on AWS, as a
private S3 bucket behind CloudFront (see `infra/README.md`). GitHub Pages stays
the production host until the cut-over, and `neocom.cloud` is not touched by
anything below.

Migration order:

1. **Preview publishing** (this section): `deploy-aws.yml` publishes `develop`
   to the preview distribution.
2. Production stack (`environment=production`), an ACM certificate and the
   custom domain.
3. Cloudflare DNS with every record recreated first (Zoho mail especially), then
   the cut-over to CloudFront, then retire GitHub Pages.

### AWS preview publishing

`.github/workflows/deploy-aws.yml` runs on every push to `develop` and on manual
dispatch from `develop`. It runs the same gates as the Pages workflow, then:

1. assumes `neocom-site-preview-github` through GitHub OIDC. No access key is
   stored anywhere. The IAM trust policy accepts only tokens issued for the
   `site-preview` environment, which GitHub creates on the first run;
2. uploads the Vite-fingerprinted files (`assets/*.js`, `*.css`, `*.woff*`) with
   a one-year immutable cache, the other files for an hour, and HTML so that it
   always revalidates;
3. removes files that no longer exist, last, so a failed upload never leaves
   the site missing files;
4. invalidates `/*` in CloudFront, waits for it, and smoke-tests `/`,
   `/pt-br/`, `/en/` and a real 404.

The preview is served at `https://d2ogykvptv4dgl.cloudfront.net`. The bucket,
distribution ID and role are not secrets and are written in the workflow; they
come from the `terraform output` of `infra/terraform-site` and
`infra/terraform-site-bootstrap`.

Known limits, on purpose:

- The OIDC role is the Terraform deploy role of the bootstrap stack, which is
  broader than a content publish needs (`s3:*` on the site bucket and the whole
  CloudFront surface). A narrower content-only role is a follow-up.
- `public/CNAME` is a GitHub Pages file; it is uploaded to the bucket and
  ignored by CloudFront. It goes away with Pages.

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
   - `Validate Terraform stacks`
   - `Validate promotion path`
   - `Test and build (Node 24)`
   - `Test and build (Node latest)`
3. Require `Browser end-to-end` and `Deploy status` for `Q.A.E2E` promotion PRs. `Deploy status` validates Pages configuration and, after the first publication, the live HTTPS site.
4. Require `Pre-deploy test` for `deploy` promotion PRs. It runs Playwright on Chromium, Firefox, WebKit, and Chromium mobile against the Node 24-validated artifact that would be published.
5. Restrict the source branch for staged promotions through the CI policy: `develop -> Q.A -> main -> Q.A.E2E -> deploy`. GitHub branch rules do not enforce a pull request's source branch by themselves.
6. Keep GitHub Pages set to `GitHub Actions`; changing the default branch does not affect the deployment source.

A push to `deploy` publishes production. A manual dispatch also publishes only when run from `deploy`; both paths use the Node 24 baseline and rerun typechecking, tests, the production build, and deployment-output smoke tests before uploading the Pages artifact.

### 1.2 Preflight checks

1. Confirm that no other GitHub Pages repository serves `neocom.cloud`. Organization or enterprise domain verification proves ownership; it does not route this child repository's site.
2. Confirm the production branch contains a successful `deploy-pages.yml` run. Pushes to `develop` do not publish a Pages site unless `develop` is explicitly listed under `on.push.branches` in the active workflow.
3. In this repository, open `Settings -> Pages` and keep `Source` set to `GitHub Actions`.
4. Do not use the suggested Jekyll or Static HTML templates. This repository already has a custom Vite build and Pages deployment workflow.

### 1.3 Configure the GitHub Pages custom domain

1. In `Settings -> Pages`, enter `neocom.cloud` in `Custom domain` and save it.
2. Leave the setting in place while DNS propagates. Use `Check again` only after the records below resolve publicly.
3. Enable `Enforce HTTPS` as soon as GitHub makes it available after the first deployment. Subsequent `Deploy status` checks require it.

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

`contato@neocom.cloud` runs on Zoho, and that mailbox is the site's only
contact channel. Changing nameservers makes the new provider the sole source
of truth: a record that exists at Hostinger and not at Cloudflare stops
existing the moment the switch propagates, with no error anywhere.

Mail breaks in three independent ways, and only the first is loud:

| Record | What stops | How you notice |
| --- | --- | --- |
| MX | Receiving | Immediately — senders get a bounce |
| SPF, DKIM | Sending | **Silently** — your mail is filed as spam |
| Zoho verification TXT | Proof of ownership | Weeks later, when Zoho rechecks |

Propagation is neither instant nor uniform. For up to 48 hours both
nameserver sets may answer different resolvers, so the Cloudflare zone has to
be a complete and correct superset **before** the switch — whichever one
answers has to answer correctly.

#### The record set

`scripts/dns-records.mjs` holds the inventory, reconciled against Hostinger's
own zone export — archived at `docs/dns/hostinger-zone-2026-11-17.txt` — with
the consequence of losing each record spelled out. `pnpm verify:dns` checks a
nameserver against it:

```bash
pnpm verify:dns                                  # public resolvers
pnpm verify:dns --server ns1.dns-parking.com     # Hostinger, the current zone
pnpm verify:dns --only mail                      # just the mailbox
```

The point is the `--server` flag. A Cloudflare zone can be queried on its
assigned nameservers **as soon as it exists**, before the registrar points at
it, so the whole record set can be proved correct while Hostinger is still
authoritative and nothing is at risk. The switch then becomes reversible
bookkeeping rather than a leap.

That reconciliation mattered. External probing had found six records; the
export carried **eight**. The two it added were
`_github-pages-challenge-neocom-cloud` and `_gh-neocom-cloud-o`, GitHub's
verification records for Pages and for the organisation. Their names cannot
be guessed, so no amount of querying would have turned them up — losing the
first would drop the custom-domain verification that blocks takeover.

Public DNS still cannot enumerate a zone, so take a fresh export whenever the
zone changes rather than trusting a query sweep. A test reconciles the
inventory against the archived copy and fails if a record goes missing.

#### Order of operations

1. Export the full zone from Hostinger's DNS Zone Editor if anything has
   changed since `docs/dns/hostinger-zone-2026-11-17.txt`. That export, not
   this file, is the source of truth.
2. Create the zone in Cloudflare and let it scan, but **do not change
   nameservers**. Cloudflare's scan has the same blind spot as any external
   query, so treat it as a draft and reconcile it line by line.
3. Reconcile the scan with `infra/terraform-dns` before the first apply. The
   scan leaves records Terraform does not know about — the `www` CNAME and the
   apex addresses among them — and the apply would try to create them a second
   time, which Cloudflare rejects. List what is there:

   ```bash
   curl -sS -H "Authorization: Bearer $TF_VAR_cloudflare_api_token" "https://api.cloudflare.com/client/v4/zones/<zone_id>/dns_records?per_page=100" | jq -r '.result[] | [.id, .type, .name, .content] | @tsv'
   ```

   The zone is not authoritative yet, so nothing is at risk: deleting every
   record the scan created and letting the apply own the whole set is the
   simplest path, and the one that leaves no record outside the stack.

   ```bash
   curl -sS -X DELETE -H "Authorization: Bearer $TF_VAR_cloudflare_api_token" "https://api.cloudflare.com/client/v4/zones/<zone_id>/dns_records/<dns_record_id>"
   ```

   To keep a scanned record instead, import it so Terraform manages what is
   already there (provider 5.x takes `<zone_id>/<dns_record_id>`). The address
   depends on which resource owns the record: `preserved` holds only the mail
   and verification set from `records.json`, and each web record is its own
   resource, keyed by count or by the address itself.

   ```bash
   terraform -chdir=infra/terraform-dns import 'cloudflare_dns_record.preserved["<key from records.json>"]' '<zone_id>/<dns_record_id>'
   terraform -chdir=infra/terraform-dns import 'cloudflare_dns_record.www_github_pages[0]' '<zone_id>/<dns_record_id>'
   terraform -chdir=infra/terraform-dns import 'cloudflare_dns_record.apex_github_pages["185.199.108.153"]' '<zone_id>/<dns_record_id>'
   ```

4. Apply the stack, then run `terraform -chdir=infra/terraform-dns plan` again
   and read it: a clean plan means the zone and the stack agree. The stack sets
   the proxy itself — mail records are never proxied and the web records follow
   `proxy_web` — so there is no orange cloud left to check by hand.
5. `pnpm verify:dns --server <cloudflare nameserver>`. Do not proceed until it
   passes.
6. The mail records already carry a 300s TTL from `mail_ttl`, so a mistake
   costs five minutes. Confirm it in the plan output rather than in the
   dashboard.
7. Change the nameservers at Hostinger, and **keep the Hostinger zone** — it is
   the rollback. Reverting means pointing the nameservers back.
8. `pnpm verify:dns` against public resolvers, then send and receive a real
   test message in both directions.
9. Only then move the web records.

There is no DMARC record today. Adding one is worthwhile but separate:
`pnpm verify:dns --include-suggested` checks the `p=none` form, which is
monitoring only and cannot reject mail. Do not start at `quarantine` or
`reject`.

If DNSSEC is enabled at the registrar, disable it before changing nameservers.

### 2.2 Add the domain to Cloudflare

1. Add `neocom.cloud` to Cloudflare using full setup.
2. Let Cloudflare scan the current DNS zone.
3. Remove incorrect defaults if needed.
4. Make sure the final Cloudflare zone contains the required non-web records for email and verification.

### 2.3 Cloudflare web records for GitHub Pages

`infra/terraform-dns` declares these records, so the stack is where they
change, not the dashboard. Apply it before the nameserver switch, as in the
order of operations above.

| Type | Name | Target | Proxy status |
| --- | --- | --- | --- |
| A | @ | 185.199.108.153 | grey, while `proxy_web = false` |
| A | @ | 185.199.109.153 | grey, while `proxy_web = false` |
| A | @ | 185.199.110.153 | grey, while `proxy_web = false` |
| A | @ | 185.199.111.153 | grey, while `proxy_web = false` |
| CNAME | www | neocom-cloud.github.io | grey, while `proxy_web = false` |

Why four A records on the apex and not a CNAME:

- Cloudflare does support CNAME flattening at the zone apex, so `@ -> neocom-cloud.github.io` would be valid here too, unlike at a provider without it.
- The stack uses GitHub Pages' four published apex addresses anyway, so the Cloudflare zone answers the apex exactly as Hostinger does today. The nameserver switch then changes nothing about the web records, which is one less difference to reason about if something breaks.
- The flattened apex CNAME returns when `web_target` moves to `cloudfront`, where there is no published address set to use instead.

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

`proxy_web` defaults to `false`, so an apply lands this phase with nothing
further to set:

1. Leave `proxy_web = false`, which keeps `@` and `www` grey (`DNS only`).
2. Confirm GitHub Pages recognizes `neocom.cloud` as the custom domain.
3. Wait for GitHub Pages HTTPS issuance.
4. Enable `Enforce HTTPS` in GitHub Pages.

This is the lowest-risk configuration and may be all you need. Do not set
`proxy_web = true` before step 4: proxying a host that carries no certificate
for the domain yet is what produces `526`.

### 2.6 Phase 2: optional Cloudflare proxy

If you want Cloudflare in front of the site:

1. In Cloudflare, open `SSL/TLS -> Overview`.
2. Set encryption mode to `Full (strict)`, **before** the proxy goes on. On `Flexible`, Cloudflare fetches the origin over HTTP, GitHub Pages redirects that straight back to HTTPS because section 2.5 enabled `Enforce HTTPS`, and the two bounce in a redirect loop until the mode is corrected.
3. Set `proxy_web = true` and apply `infra/terraform-dns`, which flips the web records from grey to proxied. Do not toggle the cloud in the dashboard; the next apply would revert it.
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
- Unexpected redirect loops or broken validation are a reason to go back: set `proxy_web = false` and apply. The records return to grey, and nothing else in the zone moves.
- If the site works in `DNS only` but fails when proxied, keep `proxy_web = false` and use Cloudflare only as the authoritative DNS provider for now.

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
