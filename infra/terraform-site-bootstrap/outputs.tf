output "aws_account_id" {
  value = local.account_id
}

output "state_bucket_name" {
  value = aws_s3_bucket.terraform_state.id
}

output "state_kms_key_arn" {
  value = aws_kms_key.terraform_state.arn
}

output "preview_role_arn" {
  value = aws_iam_role.github_site["preview"].arn
}

output "production_role_arn" {
  value = aws_iam_role.github_site["production"].arn
}
