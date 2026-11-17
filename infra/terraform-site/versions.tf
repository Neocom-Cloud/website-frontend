terraform {
  required_version = ">= 1.10.0"

  # Configured at init time with -backend-config; see infra/README.md.
  # The bucket and KMS key come from the terraform-site-bootstrap outputs.
  backend "s3" {}

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = "neocom"
      Surface   = "site"
      ManagedBy = "terraform"
    }
  }
}
