# The public certificate for the custom domain. It lives in its own stack so
# its lifecycle (a DNS record somewhere else must exist before it is issued)
# does not block the distribution, and so the CloudFront stack can take its ARN
# as a plain variable, exactly as it already does.
resource "aws_acm_certificate" "site" {
  domain_name               = var.domain
  subject_alternative_names = ["www.${var.domain}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

locals {
  # ACM returns fully qualified names with a trailing dot, which neither
  # Cloudflare nor most registrars accept as typed.
  validation_records = {
    for option in aws_acm_certificate.site.domain_validation_options :
    option.domain_name => {
      name  = trimsuffix(option.resource_record_name, ".")
      type  = option.resource_record_type
      value = trimsuffix(option.resource_record_value, ".")
    }
  }
}

# Only created on the second apply. Without it Terraform would hand back an ARN
# that ACM has not issued yet, and CloudFront would refuse it.
resource "aws_acm_certificate_validation" "site" {
  count = var.wait_for_validation ? 1 : 0

  certificate_arn         = aws_acm_certificate.site.arn
  validation_record_fqdns = [for record in local.validation_records : record.name]

  timeouts {
    create = "45m"
  }
}
