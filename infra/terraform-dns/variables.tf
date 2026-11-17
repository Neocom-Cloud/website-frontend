variable "domain" {
  type    = string
  default = "neocom.cloud"
}

variable "cloudflare_api_token" {
  type        = string
  sensitive   = true
  description = "Pass through TF_VAR_cloudflare_api_token; needs Zone:DNS:Edit on this zone only."
}

variable "cloudflare_zone_id" {
  type        = string
  description = "Zone ID, shown on the zone's overview page in Cloudflare."
}

variable "mail_ttl" {
  type        = number
  default     = 300
  description = <<-EOT
    Mail records are kept at a short TTL so a mistake costs five minutes
    rather than hours. Cloudflare uses 1 for "automatic", which these records
    deliberately avoid.
  EOT

  validation {
    condition     = var.mail_ttl >= 60 && var.mail_ttl <= 3600
    error_message = "mail_ttl must be between 60 and 3600 seconds."
  }
}

variable "web_target" {
  type        = string
  default     = "github-pages"
  description = <<-EOT
    Which host the web records point at. Start on github-pages, which is what
    the zone serves today, and switch to cloudfront once the distribution
    carries the custom domain. The mail records are unaffected either way.
  EOT

  validation {
    condition     = contains(["github-pages", "cloudfront"], var.web_target)
    error_message = "web_target must be github-pages or cloudfront."
  }
}

variable "cloudfront_domain" {
  type        = string
  default     = ""
  description = "Distribution domain, from the terraform-site output. Required when web_target is cloudfront."
}

variable "create_dmarc" {
  type        = bool
  default     = true
  description = "The zone has no DMARC record today; this adds one in monitoring mode."
}

variable "dmarc_report_address" {
  type    = string
  default = "contato@neocom.cloud"
}
