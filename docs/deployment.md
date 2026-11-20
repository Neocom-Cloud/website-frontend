# Deployment and DNS

The site is a static Vite build hosted on AWS: a private S3 bucket behind
CloudFront, served on `neocom.cloud`. DNS lives in Cloudflare and is managed
with Terraform. GitHub Pages is no longer used.

## Hosting model

- Build system: Vite static output
- Build runtime: Node.js 24 baseline with pnpm 11.3.0; CI also validates the current latest Node release
- Host: S3 bucket `neocom-site-production`, private, reached only through CloudFront (origin access control)
- CDN: CloudFront distribution `EDTRWBXZ0WVRY` (`d2bmtl9y1doakb.cloudfront.net`), aliases `neocom.cloud` and `www.neocom.cloud`
- Certificate: ACM, issued in `us-east-1` for both names, validated by DNS CNAMEs that must stay in the zone for renewal
- DNS: Cloudflare zone, `infra/terraform-dns`; the registrar remains Hostinger
- Canonical domain: `https://neocom.cloud`
- Alternate host: `https://www.neocom.cloud`
- Infrastructure code: `infra/` (see `infra/README.md`)

A preview copy of the same stack serves `develop` at `https://d2ogykvptv4dgl.cloudfront.net`.

## Publishing

`.github/workflows/deploy-aws.yml` has two triggers:

| Push to | Publishes to | Role assumed (GitHub OIDC) | Environment |
| --- | --- | --- | --- |
| `develop` | preview distribution | `neocom-site-preview-github` | `site-preview` |
| `deploy` | production distribution | `neocom-site-production-github` | `site-production` |

Manual dispatch publishes from whichever of these two branches it is run on.
Any other ref is refused.

Each run builds with the Node 24 baseline, reruns repository integrity,
typechecking, tests, the production build and the build-output checks, then:

1. assumes the role through GitHub OIDC. No access key is stored anywhere. The IAM trust policy accepts only tokens issued for the matching `site-<env>` environment, which GitHub creates on the first run (add required reviewers to `site-production` if a manual gate is wanted);
2. uploads the Vite-fingerprinted files (`assets/*.js`, `*.css`, `*.woff*`) with a one-year immutable cache, the other files for an hour, and HTML so that it always revalidates;
3. removes files that no longer exist, last, so a failed upload never leaves the site missing files;
4. invalidates `/*` in CloudFront, waits for it, and smoke-tests `/`, `/pt-br/`, `/en/` and a real 404 on the distribution's own domain.

The bucket, distribution ID and role are not secrets and are written in the
workflow; they come from `terraform output` of `infra/terraform-site` and
`infra/terraform-site-bootstrap`.

Known limits, on purpose:

- The OIDC roles are content-only: write to their own bucket and invalidate their own distribution (scoped by ARN, `distribution_ids` in `infra/terraform-site-bootstrap`). They hold no Terraform state, KMS, ACM or distribution-management permission, so a run on `develop` cannot touch production. Terraform is applied by the owner from a workstation.
- Paperclip's own role (`neocom-site-preview-paperclip-deploy`) reaches the preview only. Production is published through this workflow, never by hand.

### 1.1 Branch promotion

Use the following branch path for changes intended for production:

```text
develop -> Q.A -> main -> Q.A.E2E -> deploy
```

- `develop` is the integration branch, and publishes the preview.
- `Q.A` is the validation branch.
- `main` is the repository default and release branch.
- `Q.A.E2E` is the full-browser validation and manual-acceptance branch.
- `deploy` is the production publishing branch. A successful push to `deploy` publishes to AWS.

Recommended repository rules:

1. Add a branch ruleset for `develop`, `Q.A`, `main`, `Q.A.E2E`, and `deploy` that requires pull requests, requires branches to be up to date, blocks force pushes and deletions, and does not allow bypasses.
2. Require these checks before merging, with no human approval requirement:
   - `Validate GitHub Actions workflows`
   - `Validate Terraform stacks`
   - `Validate promotion path`
   - `Test and build (Node 24)`
   - `Test and build (Node latest)`
3. Require `Browser end-to-end` and `Deploy status` for `Q.A.E2E` promotion PRs. `Deploy status` probes the published production site over HTTPS.
4. Require `Pre-deploy test` for `deploy` promotion PRs. It runs Playwright on Chromium, Firefox, WebKit, and Chromium mobile against the Node 24-validated artifact that would be published.
5. Restrict the source branch for staged promotions through the CI policy. GitHub branch rules do not enforce a pull request's source branch by themselves.

Applied on 2026-11-20 as four rulesets: `protect-develop`, `protect-Q.A-and-main`, `protect-Q.A.E2E` and `protect-deploy-production`. One difference from the list above: "up to date" is required on `develop` only. Promotions are merge commits, so the destination branch is always one commit ahead of its source, and requiring it on `Q.A`, `main`, `Q.A.E2E` and `deploy` would block every promotion.

Production waits for the owner. The `site-production` environment has a required reviewer and accepts deployments from the `deploy` branch only, so a push to `deploy` pauses before the AWS role is assumed.

### Staging on `main` (LocalStack)

`.github/workflows/staging-localstack.yml` runs on every push to `main`. It builds the site, publishes `dist/` to an S3 bucket emulated by LocalStack with the same three upload commands as production, and then checks that the bucket holds exactly the built files, that `index.html`, `pt-br/`, `en/` and `404.html` exist, and that HTML revalidates while fingerprinted assets are immutable. It uses no AWS account and no AWS credential.

Limits, on purpose:

- CloudFront, ACM and DNS are not emulated. The preview and production smoke tests in `deploy-aws.yml` cover them.
- LocalStack requires an account token since release 2026.03. Add it as the repository secret `LOCALSTACK_AUTH_TOKEN`; without it the workflow fails and says so. Check the LocalStack terms for commercial use before relying on it.
- The image is pinned by tag and digest. Update both together.

## Locale routing model

The production model is fully static:

- `/` is a lightweight redirect shell
- `/pt-br/` and `/en/` are the SEO-facing localized landing pages
- `/pt-br/projects/:slug/` and `/en/projects/:slug/` are the SEO-facing project pages

Locale selection precedence on the root entry is:

1. `?lang=...`
2. stored locale in `localStorage`
3. browser locale from `navigator.languages`
4. default `pt-br`

Important limitation:

- Static files cannot inspect request headers or visitor geography before responding, so there is no server-side locale detection from `Accept-Language`.
- If edge-based locale routing is wanted later, implement it as a CloudFront Function or in Cloudflare Workers/Rules.

## 1. DNS: Hostinger registrar + Cloudflare zone

Cloudflare answers for the zone; Hostinger stays the registrar and only holds
the nameserver setting.

Important:

- Once the nameservers point at Cloudflare, Hostinger no longer serves the live zone.
- `contato@neocom.cloud` runs on Zoho, and that mailbox is the site's only contact channel. Every mail and verification record must exist in Cloudflare before the switch.

### 1.1 Why the mail records come first

Changing nameservers makes the new provider the sole source of truth: a record
that exists at Hostinger and not at Cloudflare stops existing the moment the
switch propagates, with no error anywhere.

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

### 1.2 The record set

`scripts/dns-records.mjs` holds the inventory: the mail and verification
records preserved from Hostinger's own zone export (archived at
`docs/dns/hostinger-zone-2026-11-17.txt`, which still lists the retired GitHub
Pages records for history) and the web records pointing at CloudFront, with the
consequence of losing each spelled out. `pnpm verify:dns` checks a nameserver
against it:

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

The apex has no entry in the inventory for the web: Cloudflare flattens the
apex CNAME, so a lookup returns addresses rather than a name. `www` is
expected to be a CNAME to the production distribution.
`_gh-neocom-cloud-o` is GitHub's organisation verification record. It has
nothing to do with hosting, so it stays.

Public DNS cannot enumerate a zone, so take a fresh export whenever the zone
changes rather than trusting a query sweep. A test reconciles the inventory
against the archived copy and fails if a record goes missing.

### 1.3 Order of operations

1. Export the full zone from Hostinger's DNS Zone Editor if anything has
   changed since `docs/dns/hostinger-zone-2026-11-17.txt`. That export, not
   this file, is the source of truth.
2. Create the zone in Cloudflare and let it scan, but **do not change
   nameservers**. Cloudflare's scan has the same blind spot as any external
   query, so treat it as a draft and reconcile it line by line.
3. Reconcile the scan with `infra/terraform-dns` before the first apply. The
   scan leaves records Terraform does not know about — the four apex A records
   and the `www` CNAME to GitHub among them — and the apply would try to create
   the same names a second time, which Cloudflare rejects. List what is there:

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
   already there (provider 5.x takes `<zone_id>/<dns_record_id>`). `preserved`
   holds the mail and verification set from `records.json`; `apex` and `www`
   are the web records.

   ```bash
   terraform -chdir=infra/terraform-dns import 'cloudflare_dns_record.preserved["<key from records.json>"]' '<zone_id>/<dns_record_id>'
   terraform -chdir=infra/terraform-dns import 'cloudflare_dns_record.www' '<zone_id>/<dns_record_id>'
   terraform -chdir=infra/terraform-dns import 'cloudflare_dns_record.apex' '<zone_id>/<dns_record_id>'
   ```

4. Apply the stack with `cloudfront_domain` set to the production distribution
   and the certificate's records in `acm_validation_records` (the
   `validation_records` output of `terraform-site-certificate`). Then run
   `terraform -chdir=infra/terraform-dns plan` again and read it: a clean plan
   means the zone and the stack agree. The stack sets the proxy itself — mail
   records are never proxied and the web records follow `proxy_web` — so there
   is no orange cloud left to check by hand.
5. `pnpm verify:dns --server <cloudflare nameserver>`. Do not proceed until it
   passes.
6. The mail records already carry a 300s TTL from `mail_ttl`, so a mistake
   costs five minutes. Confirm it in the plan output rather than in the
   dashboard.
7. Change the nameservers at Hostinger, and **keep the Hostinger zone** — it is
   the rollback. Reverting means pointing the nameservers back. This is the
   cut-over: the Cloudflare zone already answers with the CNAMEs.
8. `pnpm verify:dns` against public resolvers, then send and receive a real
   test message in both directions, and open `https://neocom.cloud` and
   `https://www.neocom.cloud`.
9. Set `SITE_ORIGIN=https://neocom.cloud` for the `Deploy status` gate
   (`pnpm verify:site`), so it probes the real domain from then on.

There is no DMARC record at Hostinger. The stack adds one in monitoring mode
(`create_dmarc`); `pnpm verify:dns --include-suggested` checks the `p=none`
form, which cannot reject mail. Do not start at `quarantine` or `reject`.

If DNSSEC is enabled at the registrar, disable it before changing nameservers.

### 1.4 Point Hostinger to Cloudflare nameservers

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

### 1.5 Phase 1: keep the web records DNS-only

`proxy_web` defaults to `false`, so an apply lands this phase with nothing
further to set. `@` and `www` stay grey (`DNS only`) and reach CloudFront
directly, on its own ACM certificate. This is the lowest-risk configuration and
may be all that is needed. Do not set `proxy_web = true` before the SSL/TLS
mode below is `Full (strict)`: proxying ahead of that produces `526`.

### 1.6 Phase 2: optional Cloudflare proxy

If you want Cloudflare in front of CloudFront:

1. In Cloudflare, open `SSL/TLS -> Overview`.
2. Set encryption mode to `Full (strict)`, **before** the proxy goes on. CloudFront serves a valid certificate for both names, so strict mode validates.
3. Set `proxy_web = true` and apply `infra/terraform-dns`, which flips the web records from grey to proxied. Do not toggle the cloud in the dashboard; the next apply would revert it.
4. Confirm that `https://neocom.cloud` and `https://www.neocom.cloud` both load correctly.

`pnpm verify:dns` expects the `www` CNAME as written, so run it in the DNS-only phase: a proxied record answers with Cloudflare addresses instead.

Cloudflare would then add its own caching on top of CloudFront's, which also
means a publish has to be invalidated at both layers. That is the reason to
keep this phase optional.

### 1.7 Proxy caveats and rollback

- Cloudflare `526` means the proxied origin certificate path is not valid for the requested hostname. Check that the distribution lists the hostname as an alias and that the ACM certificate covers it.
- Unexpected redirect loops or broken validation are a reason to go back: set `proxy_web = false` and apply. The records return to grey, and nothing else in the zone moves.
- If the site works in `DNS only` but fails when proxied, keep `proxy_web = false` and use Cloudflare only as the authoritative DNS provider.

## 2. Troubleshooting

### CloudFront answers 403 for a hostname

The hostname is not an alias of the distribution, or the certificate does not
cover it. `infra/terraform-site` lists both the apex and `www` as aliases; the
certificate in `infra/terraform-site-certificate` covers both names. Check the
distribution with `aws cloudfront get-distribution --id EDTRWBXZ0WVRY`.

### Certificate renewal fails

ACM re-validates through the DNS CNAMEs created for the certificate. If they
leave the zone, the renewal fails silently about a year later. They are part of
`acm_validation_records` in `infra/terraform-dns`; keep them.

### Cloudflare 526

This means Cloudflare strict SSL checks are failing against the origin. Verify that the distribution aliases include the hostname and that the ACM certificate is `ISSUED`, then retry. If needed, set `proxy_web = false` and apply.

### A page keeps showing old content

HTML revalidates on every request, and fingerprinted assets change name with
each build, so stale content points to a missed invalidation. The workflow
invalidates `/*` and waits for it; rerun the publish, or invalidate by hand:

```bash
aws cloudfront create-invalidation --distribution-id EDTRWBXZ0WVRY --paths "/*"
```

### Domain email stops working after moving to Cloudflare

This means required MX or TXT records were not recreated in Cloudflare. Re-add the email provider records as `DNS only`; they are listed in `scripts/dns-records.mjs`.

## 3. Reference commands

```bash
dig neocom.cloud +noall +answer -t A
dig neocom.cloud +noall +answer -t AAAA
dig www.neocom.cloud +noall +answer -t CNAME
dig ns neocom.cloud @1.1.1.1
dig ns neocom.cloud @8.8.8.8
```

## 4. References

- AWS:
  - https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html
  - https://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html
- Cloudflare:
  - https://developers.cloudflare.com/dns/cname-flattening/
  - https://developers.cloudflare.com/dns/proxy-status/
  - https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/
  - https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/
