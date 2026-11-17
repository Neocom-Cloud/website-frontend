variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = <<-EOT
    CloudFront is global, but its ACM certificates must live in us-east-1, so
    the whole stack stays there to avoid a second provider alias.
  EOT
}

variable "github_owner" {
  type    = string
  default = "Neocom-Cloud"
}

variable "github_repository" {
  type    = string
  default = "website-frontend"
}

variable "github_repository_id" {
  type        = string
  default     = "1281751932"
  description = <<-EOT
    GitHub's immutable numeric repository ID, read from
    `GET /repos/Neocom-Cloud/website-frontend` on 2026-11-16.

    The trust policy conditions on this rather than on the `sub` claim for the
    same reason the DevRecord stack does: this organisation's OIDC
    subject-claim template embeds numeric owner/repo IDs
    (repo:OWNER@owner_id/REPO@repo_id:environment:NAME) instead of the default
    repo:OWNER/REPO:environment:NAME. Conditioning on repository_id is also
    immune to a future rename.

    Verify against a decoded token from the first workflow run before relying
    on it; the subject-claim template is an organisation setting and can
    differ from DevRecord's.
  EOT
}

variable "create_github_oidc_provider" {
  type        = bool
  default     = false
  description = <<-EOT
    Defaults to false: token.actions.githubusercontent.com is already
    registered in account 431915868573 by the DevRecord bootstrap, and an
    account may hold only one provider per URL. Set true only in a fresh
    account.
  EOT
}

variable "state_bucket_name" {
  type        = string
  default     = ""
  description = "Optional globally unique override. The default includes the current account ID and region."
}

variable "site_bucket_prefix" {
  type        = string
  default     = "neocom-site"
  description = "Bucket and role name prefix; each environment appends its own name."
}
