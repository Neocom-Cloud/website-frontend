# NeoCom site infrastructure

Hosts the static site on **S3 behind CloudFront with Origin Access Control**, in
AWS account `431915868573` (`us-east-1`). DNS stays in Cloudflare; this project
uses no Route 53 hosted zone, which also avoids its per-zone monthly charge.

Two stacks, both modelled on `DevRecord/infra/terraform-landing*`:

| Stack | What it owns | State |
| --- | --- | --- |
| `terraform-site-bootstrap` | Encrypted state bucket, KMS key, GitHub OIDC deploy roles | Local, committed nowhere |
| `terraform-site` | Site bucket, CloudFront distribution, OAC, directory-index function | The bucket the bootstrap created |
| `terraform-dns` | The Cloudflare zone's records | The same bucket, under `dns/` |
| `terraform-paperclip-deploy` | IAM Roles Anywhere trust anchor, profile and a content-deploy role for Paperclip | The same bucket, under `paperclip/` |

## Why CloudFront and not the S3 website endpoint

DevRecord's landing serves the S3 *website* endpoint through Cloudflare. That
endpoint is HTTP-only, so it forces the Cloudflare zone into **Flexible** SSL —
the Cloudflare-to-origin leg travels unencrypted — and it needs a Cloud
Connector to rewrite the `Host` header, because a plain proxied CNAME makes S3
answer `NoSuchBucket`.

This site's own copy promises privacy as a foundation, so it keeps the bucket
private and puts CloudFront in front: the origin leg is HTTPS, the zone can run
**Full (strict)**, and the Cloud Connector workaround disappears.

The cost is one extra moving part, `directory-index.js`. S3's website endpoint
resolves `/pt-br/` to `/pt-br/index.html` by itself; the REST endpoint does not,
and `default_root_object` only covers `/`. Every localized route here is a
directory, so without that CloudFront Function the whole site would 404 apart
from the root.

## Prerequisites

- The `neocom` profile, for account `431915868573`, pinned to `us-east-1`.
  All of this machine's profiles point at that one account — the names are
  local labels, not separate accounts. `devrecord` carries the same
  credentials but defaults to `us-east-2`, and the profile *named*
  `kaleb-cli` is a separate, currently expired, session. The deploy commands
  below pass `--region` explicitly so none of that matters.
- `token.actions.githubusercontent.com` is already registered in the account by
  the DevRecord bootstrap, and an account may hold only one provider per URL.
  `create_github_oidc_provider` therefore defaults to **false**.

## 1. Bootstrap

Run once per account. It keeps local state, because it creates the bucket the
other stack's state lives in.

```bash
export AWS_PROFILE=neocom
terraform -chdir=infra/terraform-site-bootstrap init
terraform -chdir=infra/terraform-site-bootstrap apply
```

Record `state_bucket_name` and `state_kms_key_arn` from the outputs.

Before relying on the deploy roles, decode the `sub` and `repository_id` claims
from the first workflow run's OIDC token and confirm they match the trust
policy. The subject-claim template is an organisation setting, and this trust
policy assumes Neocom-Cloud uses the same non-default template DevRecord does.

## 2. Site

```bash
export AWS_PROFILE=neocom
terraform -chdir=infra/terraform-site init \
  -backend-config="bucket=<state_bucket_name>" \
  -backend-config="key=site/preview.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="encrypt=true" \
  -backend-config="kms_key_id=<state_kms_key_arn>" \
  -backend-config="use_lockfile=true"
terraform -chdir=infra/terraform-site apply -var="environment=preview"
```

The preview leaves `custom_domain` empty and serves on the CloudFront domain,
which already carries a valid certificate. **No DNS record, no ACM request and
no nameserver change** — the preview is fully decoupled from the domain
migration.

## 3. Publish

```bash
pnpm build
aws s3 sync dist/ s3://<bucket_name>/ --delete --region us-east-1
aws cloudfront create-invalidation --distribution-id <distribution_id> --paths '/*'
```

`terraform output deploy_command` prints this with the values filled in.

## The Paperclip deploy stack

`terraform-paperclip-deploy` lets the Paperclip server publish the site with
**temporary credentials and no stored access key**, through IAM Roles Anywhere.
It owns three things: a trust anchor (the private CA), a role, and a Roles
Anywhere *profile* that ties them together. Only a certificate signed by that CA
**and** carrying `CN=paperclip` can assume the role. No IAM user is involved.

The role allows exactly what step 3 runs and nothing else: `s3:PutObject`,
`s3:DeleteObject`, `s3:ListBucket` and `s3:GetBucketLocation` on the site bucket,
and `cloudfront:CreateInvalidation` and `cloudfront:GetInvalidation` on the site
distribution. It cannot change infrastructure, touch IAM or read other buckets.

The trust anchor is a private CA made with OpenSSL, **not** the paid AWS Private
CA. Its public certificate is versioned here as `ca.pem`, so the whole setup is
reproducible from this repository. The bucket name and distribution ID are read
from the site stack's state, so run step 2 first. Apply with an identity that may
create IAM roles and Roles Anywhere resources.

```bash
export AWS_PROFILE=neocom
terraform -chdir=infra/terraform-paperclip-deploy init   -backend-config="bucket=<state_bucket_name>"   -backend-config="key=paperclip/preview.tfstate"   -backend-config="region=us-east-1"   -backend-config="encrypt=true"   -backend-config="kms_key_id=<state_kms_key_arn>"   -backend-config="use_lockfile=true"
terraform -chdir=infra/terraform-paperclip-deploy apply   # reads terraform.tfvars
terraform -chdir=infra/terraform-paperclip-deploy output -raw aws_config_profile
```

Operational notes:

- **Never commit a private key.** Only `ca.pem` (public) lives in the repo; the
  CA key stays offline on the operator's PC, and the client key
  (`paperclip.key`) lives only on the Paperclip host. `*.key` is git-ignored.
- The client certificate expires on **2027-11-17**. Re-issue it with the offline
  CA and replace it on the server before then. Nothing in AWS changes, because
  the trust anchor is the CA, valid until 2031-11-16.
- Rotating the CA means replacing `ca.pem` and re-applying.
- To revoke access at once, disable the profile or the trust anchor.
- Install `aws_signing_helper` on the Paperclip host and use the
  `aws_config_profile` output as its `~/.aws/config` block.

## The DNS stack

`terraform-dns` manages the Cloudflare zone. Its mail and verification records
come from `records.json`, generated by `scripts/generate-dns-json.mjs` from the
same inventory `pnpm verify:dns` checks — one source, so the verifier cannot
pass while this stack is missing a record. A test fails if the two fall out of
step; run `pnpm generate:dns` after editing the inventory.

Web records are declared separately, because they follow whichever host serves
the site: `web_target` starts at `github-pages` and moves to `cloudfront`.
The mail records are untouched either way.

`proxy_web` owns the orange cloud on those records and defaults to `false`,
which is Phase 1 of the runbook: an apply lands the zone grey. Raise it only
once the origin serves HTTPS for this domain, with SSL/TLS on Full (strict) —
proxying ahead of that answers 526. The cloud is never toggled in the
dashboard, because the next apply would revert it.

```bash
export TF_VAR_cloudflare_api_token=...   # Zone:DNS:Edit on this zone only
terraform -chdir=infra/terraform-dns init   -backend-config="bucket=neocom-tfstate-431915868573-us-east-1"   -backend-config="key=dns/production.tfstate"   -backend-config="region=us-east-1"   -backend-config="encrypt=true"   -backend-config="kms_key_id=<state_kms_key_arn>"   -backend-config="use_lockfile=true"
terraform -chdir=infra/terraform-dns apply -var="cloudflare_zone_id=..."
```

Apply this **before** pointing the registrar at Cloudflare, then prove it with
`pnpm verify:dns --server <a nameserver of the zone>`. A Cloudflare zone answers
on its own nameservers as soon as it exists, so the whole record set can be
checked while Hostinger is still authoritative and nothing is at risk.

## Attaching neocom.cloud later

Production needs, in order:

1. The Cloudflare zone for `neocom.cloud`, with **every** record from the
   Hostinger zone recreated first — the Zoho MX, SPF, DKIM (`zmail` selector)
   and the `zoho-verification` TXT especially. A record that exists at
   Hostinger and not at Cloudflare stops existing the moment the nameservers
   change, and broken outgoing mail fails silently.
2. An ACM certificate in `us-east-1`, validated by a DNS record in Cloudflare,
   covering **both** `neocom.cloud` and `www.neocom.cloud`. `terraform-dns`
   points both hosts at the distribution once `web_target` is `cloudfront`.
3. `custom_domain` and `acm_certificate_arn` set on this stack. The
   distribution takes both `custom_domain` and `www.<custom_domain>` as
   aliases, matching the pair `terraform-dns` points here, so the certificate
   in step 2 has to carry both names or the apply fails on the alias.
4. The web records pointed at the distribution (`web_target = "cloudfront"`),
   grey or proxied as `proxy_web` says. With the proxy on, SSL/TLS must be
   **Full (strict)**.

Flipping `web_target` is not seamless: Terraform destroys the four apex A
records and creates the CNAMEs in their place, so plan it for a quiet window
and keep the TTLs low going in.

See `docs/deployment.md` for the DNS runbook and the full record inventory.
