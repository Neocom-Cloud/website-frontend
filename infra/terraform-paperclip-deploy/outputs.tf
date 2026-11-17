output "iam_user_arn" {
  value = data.aws_iam_user.paperclip.arn
}

output "bucket_name" {
  value = local.bucket_name
}

output "distribution_id" {
  value = local.distribution_id
}
