output "preserved_record_count" {
  value       = length(cloudflare_dns_record.preserved)
  description = "Mail and verification records under management."
}

output "verify_command" {
  value = "pnpm verify:dns --server <one of the zone's Cloudflare nameservers>"
}
