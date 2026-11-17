variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type        = string
  default     = "preview"
  description = "Which site stack this deploy policy publishes to."

  validation {
    condition     = contains(["preview", "production"], var.environment)
    error_message = "environment must be preview or production."
  }
}

variable "project_name" {
  type    = string
  default = "neocom"
}

variable "iam_user_name" {
  type        = string
  default     = "paperclip"
  description = "Existing IAM user that receives the deploy policy."
}

variable "state_bucket_name" {
  type        = string
  description = "Bucket created by terraform-site-bootstrap, where the site stack's state lives."
}

variable "site_state_key" {
  type        = string
  default     = ""
  description = "State key of the site stack. Defaults to site/<environment>.tfstate."
}

variable "state_kms_key_arn" {
  type        = string
  description = "KMS key that encrypts the state bucket (state_kms_key_arn output of the bootstrap)."
}
