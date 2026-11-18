data "aws_caller_identity" "current" {}

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
  name            = "${var.project_name}-site-${var.environment}-paperclip-deploy"
  bucket_name     = data.terraform_remote_state.site.outputs.bucket_name
  distribution_id = data.terraform_remote_state.site.outputs.distribution_id
}

# Trust anchor: the private CA's PUBLIC certificate, versioned beside this
# stack as ca.pem. AWS never sees the CA's private key, and this is not the
# paid AWS Private CA service.
#
# Revoking access: setting enabled = false here (or on the profile) stops new
# credentials from being issued. It does NOT cancel sessions already issued,
# which stay valid until they expire (session_duration_seconds, one hour by
# default). To cut those off at once, attach an inline deny on the role with
# aws:TokenIssueTime earlier than now. Keeping the session short is what bounds
# the exposure, which is why max_session_duration is not raised above it.
resource "aws_rolesanywhere_trust_anchor" "paperclip" {
  name    = local.name
  enabled = true

  source {
    source_type = "CERTIFICATE_BUNDLE"
    source_data {
      x509_certificate_data = file(var.ca_certificate_file)
    }
  }
}

# Only a certificate issued by this trust anchor AND carrying the expected CN
# can assume the role.
data "aws_iam_policy_document" "trust" {
  statement {
    actions = [
      "sts:AssumeRole",
      "sts:SetSourceIdentity",
      "sts:TagSession",
    ]

    principals {
      type        = "Service"
      identifiers = ["rolesanywhere.amazonaws.com"]
    }

    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values   = [aws_rolesanywhere_trust_anchor.paperclip.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "aws:PrincipalTag/x509Subject/CN"
      values   = [var.client_common_name]
    }
  }
}

resource "aws_iam_role" "paperclip_deploy" {
  name                 = local.name
  assume_role_policy   = data.aws_iam_policy_document.trust.json
  max_session_duration = var.session_duration_seconds
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

resource "aws_iam_role_policy" "paperclip_deploy" {
  name   = "${local.name}-content"
  role   = aws_iam_role.paperclip_deploy.id
  policy = data.aws_iam_policy_document.deploy.json
}

resource "aws_rolesanywhere_profile" "paperclip" {
  name             = local.name
  enabled          = true
  role_arns        = [aws_iam_role.paperclip_deploy.arn]
  duration_seconds = var.session_duration_seconds
}
