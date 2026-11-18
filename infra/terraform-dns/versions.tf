terraform {
  required_version = ">= 1.10.0"

  # Configured at init time with -backend-config; see infra/README.md.
  backend "s3" {}

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.24"
    }
  }
}

# The token comes from TF_VAR_cloudflare_api_token so it never reaches a file.
provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
