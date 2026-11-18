output "trust_anchor_arn" {
  value = aws_rolesanywhere_trust_anchor.paperclip.arn
}

output "profile_arn" {
  value = aws_rolesanywhere_profile.paperclip.arn
}

output "role_arn" {
  value = aws_iam_role.paperclip_deploy.arn
}

output "bucket_name" {
  value = local.bucket_name
}

output "distribution_id" {
  value = local.distribution_id
}

output "aws_config_profile" {
  description = "Profile block for ~/.aws/config on the machine that runs Paperclip. Certificate paths are placeholders."
  value       = <<-EOT
    [profile paperclip]
    region = ${var.aws_region}
    credential_process = /usr/local/bin/aws_signing_helper credential-process --certificate /etc/paperclip/paperclip.pem --private-key /etc/paperclip/paperclip.key --trust-anchor-arn ${aws_rolesanywhere_trust_anchor.paperclip.arn} --profile-arn ${aws_rolesanywhere_profile.paperclip.arn} --role-arn ${aws_iam_role.paperclip_deploy.arn}
  EOT
}
