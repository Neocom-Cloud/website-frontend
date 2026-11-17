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

variable "cloudfront_domain" {
  type        = string
  description = "Production distribution domain, the distribution_domain output of terraform-site with environment=production."

  validation {
    condition     = can(regex("\\.cloudfront\\.net$", var.cloudfront_domain))
    error_message = "cloudfront_domain must be a *.cloudfront.net hostname."
  }
}

variable "proxy_web" {
  type        = bool
  default     = false
  description = <<-EOT
    Whether the web records go through Cloudflare's proxy (the orange cloud).
    Phase 1 of the runbook in docs/deployment.md keeps them grey. A proxied
    record in front of an origin that does not carry HTTPS for this domain
    answers 526. Flip this to true only once the origin
    serves HTTPS, with SSL/TLS set to Full (strict). The mail and verification
    records in records.json are never proxied, whatever this is set to.
  EOT
}

variable "acm_validation_records" {
  type = map(object({
    name  = string
    type  = string
    value = string
  }))
  default     = {}
  description = <<-EOT
    The validation_records output of terraform-site-certificate. They must stay
    in the zone for good: ACM re-checks them to renew the certificate, and a
    zone that loses them fails the renewal about a year later, silently. They
    are never proxied.
  EOT

  validation {
    condition     = alltrue([for record in values(var.acm_validation_records) : record.type == "CNAME"])
    error_message = "ACM DNS validation records are CNAMEs."
  }
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
