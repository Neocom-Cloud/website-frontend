variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "CloudFront certificates must live in us-east-1, so the stack stays there."
}

variable "project_name" {
  type    = string
  default = "neocom"
}

variable "environment" {
  type    = string
  default = "preview"

  validation {
    condition     = contains(["preview", "production"], var.environment)
    error_message = "environment must be preview or production."
  }
}

variable "site_bucket_name" {
  type        = string
  default     = ""
  description = "Globally unique bucket name. Defaults to neocom-site-<environment>."
}

variable "price_class" {
  type        = string
  default     = "PriceClass_All"
  description = <<-EOT
    PriceClass_All is the only class that includes the South American edge
    locations, and the audience is Brazilian. PriceClass_100 would drop
    São Paulo and serve the whole country from North America.
  EOT

  validation {
    condition     = contains(["PriceClass_100", "PriceClass_200", "PriceClass_All"], var.price_class)
    error_message = "price_class must be PriceClass_100, PriceClass_200 or PriceClass_All."
  }
}

variable "custom_domain" {
  type        = string
  default     = ""
  description = <<-EOT
    Optional hostname for the distribution, e.g. neocom.cloud. Leave empty to
    serve on the CloudFront domain only, which needs no DNS record and no
    certificate — that is how the preview runs. Setting it requires an ACM
    certificate in us-east-1 and a DNS record in Cloudflare.
  EOT
}

variable "acm_certificate_arn" {
  type        = string
  default     = ""
  description = "Certificate for custom_domain. Required when custom_domain is set."
}
