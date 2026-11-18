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

data "aws_iam_policy_document" "github_site" {
  for_each = local.environments

  statement {
    sid = "TerraformStateBucket"
    actions = [
      "s3:GetBucketLocation",
      "s3:ListBucket"
    ]
    resources = [aws_s3_bucket.terraform_state.arn]
  }

  statement {
    sid = "TerraformStateObjects"
    actions = [
      "s3:DeleteObject",
      "s3:GetObject",
      "s3:PutObject"
    ]
    resources = ["${aws_s3_bucket.terraform_state.arn}/site/${each.key}.tfstate*"]
  }

  statement {
    sid = "TerraformStateEncryption"
    actions = [
      "kms:Decrypt",
      "kms:DescribeKey",
      "kms:Encrypt",
      "kms:GenerateDataKey"
    ]
    resources = [aws_kms_key.terraform_state.arn]
  }

  # The AWS provider reads every bucket sub-resource on refresh, so an action
  # allowlist is brittle. This bucket is dedicated to the site, so scope by ARN
  # and allow the service, as the DevRecord stack does.
  #
  # The bucket name must match the naming convention used in terraform-site:
  # local.name = "${var.project_name}-site-${var.environment}",
  # which defaults to "neocom-site-<environment>", matching site_bucket_prefix
  # here. If terraform-site's project_name or naming changes, these ARNs must
  # be updated to stay in sync.
  statement {
    sid     = "SiteS3"
    actions = ["s3:*"]
    resources = [
      "arn:${local.partition}:s3:::${var.site_bucket_prefix}-${each.key}",
      "arn:${local.partition}:s3:::${var.site_bucket_prefix}-${each.key}/*"
    ]
  }

  # CloudFront distribution IDs are allocated on creation, so they cannot be
  # fully named ahead of time. However, we restrict mutations (DeleteDistribution,
  # UpdateDistribution) to distributions tagged with the environment they manage.
  # Read-only actions and creates remain account-wide since the API does not
  # support resource-level conditions on all operations.
  #
  # The site stack tags distributions with Environment=preview or Environment=production;
  # mutations on the wrong environment are blocked by the tag condition.
  statement {
    sid = "SiteCloudFrontReadAndCreate"
    actions = [
      "cloudfront:CreateDistribution",
      "cloudfront:CreateFunction",
      "cloudfront:CreateInvalidation",
      "cloudfront:CreateOriginAccessControl",
      "cloudfront:DescribeFunction",
      "cloudfront:GetDistribution",
      "cloudfront:GetDistributionConfig",
      "cloudfront:GetFunction",
      "cloudfront:GetInvalidation",
      "cloudfront:GetOriginAccessControl",
      "cloudfront:ListDistributions",
      "cloudfront:ListFunctions",
      "cloudfront:ListOriginAccessControls",
      "cloudfront:ListTagsForResource",
      "cloudfront:PublishFunction",
      "cloudfront:TagResource"
    ]
    resources = ["*"]
  }

  statement {
    sid = "SiteCloudFrontMutate"
    actions = [
      "cloudfront:DeleteDistribution",
      "cloudfront:DeleteFunction",
      "cloudfront:DeleteOriginAccessControl",
      "cloudfront:UntagResource",
      "cloudfront:UpdateDistribution",
      "cloudfront:UpdateFunction",
      "cloudfront:UpdateOriginAccessControl"
    ]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/Environment"
      values   = [each.key]
    }
  }

  # Only needed once the distribution carries a custom domain. Certificate
  # ARNs are allocated on request, so these cannot be resource-scoped either.
  statement {
    sid = "SiteCertificates"
    actions = [
      "acm:DeleteCertificate",
      "acm:DescribeCertificate",
      "acm:ListCertificates",
      "acm:ListTagsForCertificate",
      "acm:RequestCertificate"
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "github_site" {
  for_each = local.environments

  name   = "${var.site_bucket_prefix}-${each.key}-deployment"
  role   = aws_iam_role.github_site[each.key].id
  policy = data.aws_iam_policy_document.github_site[each.key].json
}
