variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "CloudFront only accepts ACM certificates that live in us-east-1."

  validation {
    condition     = var.aws_region == "us-east-1"
    error_message = "A certificate for CloudFront must be requested in us-east-1."
  }
}

variable "domain" {
  type        = string
  default     = "neocom.cloud"
  description = <<-EOT
    The certificate covers this name and www.<domain>, the same pair
    terraform-site serves as aliases of the distribution when custom_domain is
    set, so the two stacks cannot drift apart.
  EOT
}

variable "wait_for_validation" {
  type        = bool
  default     = false
  description = <<-EOT
    false (first apply): request the certificate and print the DNS records to
    create, then stop. true (second apply): wait until ACM sees those records
    and issues the certificate, which can take up to 45 minutes. Only then does
    the certificate_arn output become usable by terraform-site.
  EOT
}
