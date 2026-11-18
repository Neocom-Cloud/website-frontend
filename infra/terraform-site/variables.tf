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
    certificate — that is how the preview runs. Setting it serves this host
    and www.<custom_domain>, the pair terraform-dns points here, and requires
    an ACM certificate in us-east-1 covering both, plus DNS records in
    Cloudflare.
  EOT
}

variable "acm_certificate_arn" {
  type        = string
  default     = ""
  description = <<-EOT
    Certificate for custom_domain, in us-east-1. Required when custom_domain
    is set, and it must cover www.<custom_domain> as well — that host is an
    alias of the distribution. Terraform cannot read a certificate's names
    from its ARN, so a certificate missing the www name fails at apply with
    CloudFront rejecting the alias.
  EOT
}
