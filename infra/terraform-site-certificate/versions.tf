terraform {
  required_version = ">= 1.10.0"

  # Configured at init time with -backend-config; see infra/README.md.
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
      Surface   = "site-certificate"
      ManagedBy = "terraform"
    }
  }
}
