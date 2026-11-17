output "certificate_arn" {
  value       = aws_acm_certificate.site.arn
  description = "Pass to terraform-site as acm_certificate_arn once validated is true."
}

output "validated" {
  value       = var.wait_for_validation
  description = "True only after the second apply, which waits for ACM to issue the certificate."
}

output "validation_records" {
  value       = local.validation_records
  description = <<-EOT
    DNS records that prove control of the domain. They are additive CNAMEs, so
    they can be created at the current DNS provider (Hostinger) without touching
    anything that exists. They must also be kept in the zone that serves the
    domain afterwards: ACM re-checks them to renew the certificate. Feed this
    output to terraform-dns as acm_validation_records.
  EOT
}

output "domains" {
  value = [var.domain, "www.${var.domain}"]
}
