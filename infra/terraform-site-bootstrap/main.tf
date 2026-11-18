data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

locals {
  account_id        = data.aws_caller_identity.current.account_id
  partition         = data.aws_partition.current.partition
  state_bucket_name = var.state_bucket_name != "" ? var.state_bucket_name : "neocom-tfstate-${local.account_id}-${var.aws_region}"
  oidc_provider_arn = "arn:${local.partition}:iam::${local.account_id}:oidc-provider/token.actions.githubusercontent.com"
  environments      = toset(["preview", "production"])
}

resource "aws_iam_openid_connect_provider" "github" {
  count = var.create_github_oidc_provider ? 1 : 0

  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

resource "aws_kms_key" "terraform_state" {
  description             = "NeoCom site Terraform state"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_kms_alias" "terraform_state" {
  name          = "alias/neocom-site-terraform-state"
  target_key_id = aws_kms_key.terraform_state.key_id
}

resource "aws_s3_bucket" "terraform_state" {
  bucket = local.state_bucket_name

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_ownership_controls" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket                  = aws_s3_bucket.terraform_state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  rule {
    bucket_key_enabled = true
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.terraform_state.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_policy" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.terraform_state.arn,
          "${aws_s3_bucket.terraform_state.arn}/*"
        ]
        Condition = { Bool = { "aws:SecureTransport" = "false" } }
      },
      {
        Sid       = "DenyUnencryptedObjectUploads"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.terraform_state.arn}/*"
        Condition = { StringNotEquals = { "s3:x-amz-server-side-encryption" = "aws:kms" } }
      }
    ]
  })
}

data "aws_iam_policy_document" "github_trust" {
  for_each = local.environments

  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [local.oidc_provider_arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    # IAM refuses a GitHub OIDC trust policy that does not constrain `sub`
    # or `job_workflow_ref` — repository_id and environment alone are
    # rejected with MalformedPolicyDocument. (The DevRecord roles predate that
    # validation and would not be creatable as written today.)
    #
    # The pattern is deliberately loose on the two segments that differ
    # between subject-claim templates: the default is
    # repo:OWNER/REPO:environment:NAME and this organisation may use
    # repo:OWNER@owner_id/REPO@repo_id:environment:NAME. Precision comes from
    # the repository_id and environment conditions below, which are exact.
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_owner}*/${var.github_repository}*:environment:site-${each.key}"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:repository_id"
      values   = [var.github_repository_id]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:environment"
      values   = ["site-${each.key}"]
    }
  }

  depends_on = [aws_iam_openid_connect_provider.github]
}

resource "aws_iam_role" "github_site" {
  for_each = local.environments

  name               = "${var.site_bucket_prefix}-${each.key}-github"
  assume_role_policy = data.aws_iam_policy_document.github_trust[each.key].json
}

# What the publish workflow runs, and nothing else: `aws s3 sync` against one
# bucket, then `aws cloudfront create-invalidation` and its wait. Terraform is
# applied by the owner from a workstation, so these roles hold no Terraform
# state, KMS, ACM or distribution-management permission. A run on `develop`
# therefore cannot touch production, whatever its code does.
data "aws_iam_policy_document" "github_site" {
  for_each = local.environments

  statement {
    sid = "SiteBucketList"
    actions = [
      "s3:GetBucketLocation",
      "s3:ListBucket",
      "s3:ListBucketMultipartUploads"
    ]
    resources = ["arn:${local.partition}:s3:::${var.site_bucket_prefix}-${each.key}"]
  }

  # No s3:GetObject: sync compares the listing, it does not read objects.
  statement {
    sid = "SiteBucketObjects"
    actions = [
      "s3:AbortMultipartUpload",
      "s3:DeleteObject",
      "s3:PutObject"
    ]
    resources = ["arn:${local.partition}:s3:::${var.site_bucket_prefix}-${each.key}/*"]
  }

  # Invalidating is the only CloudFront call, and it is scoped to this
  # environment's distribution by ARN. The bucket name above follows
  # terraform-site (local.name); distribution_ids follows its output.
  statement {
    sid = "SiteInvalidate"
    actions = [
      "cloudfront:CreateInvalidation",
      "cloudfront:GetInvalidation"
    ]
    resources = ["arn:${local.partition}:cloudfront::${local.account_id}:distribution/${var.distribution_ids[each.key]}"]
  }
}

resource "aws_iam_role_policy" "github_site" {
  for_each = local.environments

  name   = "${var.site_bucket_prefix}-${each.key}-deployment"
  role   = aws_iam_role.github_site[each.key].id
  policy = data.aws_iam_policy_document.github_site[each.key].json
}
