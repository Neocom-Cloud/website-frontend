data "aws_caller_identity" "current" {}

# The IAM user already exists (created by hand); this stack only attaches the
# least-privilege deploy policy to it. It creates no access key on purpose: a
# key created here would be stored in Terraform state.
data "aws_iam_user" "paperclip" {
  user_name = var.iam_user_name
}

# Bucket name and distribution ID come from the site stack's own state, so
# nothing here is typed by hand and the two stacks cannot drift apart.
data "terraform_remote_state" "site" {
  backend = "s3"

  config = {
    bucket     = var.state_bucket_name
    key        = var.site_state_key != "" ? var.site_state_key : "site/${var.environment}.tfstate"
    region     = var.aws_region
    encrypt    = true
    kms_key_id = var.state_kms_key_arn
  }
}

locals {
  account_id      = data.aws_caller_identity.current.account_id
  bucket_name     = data.terraform_remote_state.site.outputs.bucket_name
  distribution_id = data.terraform_remote_state.site.outputs.distribution_id
}

# Content deploy only: `aws s3 sync --delete` plus a cache invalidation. It
# cannot change infrastructure, read other buckets or touch IAM.
data "aws_iam_policy_document" "deploy" {
  statement {
    sid       = "ListSiteBucket"
    actions   = ["s3:GetBucketLocation", "s3:ListBucket"]
    resources = ["arn:aws:s3:::${local.bucket_name}"]
  }

  statement {
    sid       = "PublishSiteObjects"
    actions   = ["s3:DeleteObject", "s3:PutObject"]
    resources = ["arn:aws:s3:::${local.bucket_name}/*"]
  }

  statement {
    sid     = "InvalidateSiteCache"
    actions = ["cloudfront:CreateInvalidation", "cloudfront:GetInvalidation"]
    resources = [
      "arn:aws:cloudfront::${local.account_id}:distribution/${local.distribution_id}"
    ]
  }
}

resource "aws_iam_user_policy" "paperclip_deploy" {
  name   = "${var.project_name}-site-${var.environment}-content-deploy"
  user   = data.aws_iam_user.paperclip.user_name
  policy = data.aws_iam_policy_document.deploy.json
}
