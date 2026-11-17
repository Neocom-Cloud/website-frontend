output "bucket_name" {
  value = aws_s3_bucket.site.id
}

output "distribution_id" {
  value = aws_cloudfront_distribution.site.id
}

output "distribution_domain" {
  value       = aws_cloudfront_distribution.site.domain_name
  description = "Public hostname while no custom domain is attached."
}

output "site_url" {
  value = var.custom_domain != "" ? "https://${var.custom_domain}" : "https://${aws_cloudfront_distribution.site.domain_name}"
}

output "deploy_command" {
  value = <<-EOT
    pnpm build
    aws s3 sync dist/ s3://${aws_s3_bucket.site.id}/ --delete
    aws cloudfront create-invalidation --distribution-id ${aws_cloudfront_distribution.site.id} --paths '/*'
  EOT
}
