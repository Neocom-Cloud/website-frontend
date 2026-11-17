variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "IAM Roles Anywhere is regional; the stack stays beside the site stack."
}

variable "environment" {
  type        = string
  default     = "preview"
  description = "Which site stack this deploy role publishes to."

  validation {
    condition     = contains(["preview", "production"], var.environment)
    error_message = "environment must be preview or production."
  }
}

variable "project_name" {
  type    = string
  default = "neocom"
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

variable "ca_certificate_file" {
  type        = string
  default     = "./ca.pem"
  description = <<-EOT
    Path to the PUBLIC certificate of the private CA that signs the Paperclip
    client certificate. It is committed as ca.pem. The CA's private key must
    never be in this repository or on the machine that runs this stack.
  EOT
}

variable "client_common_name" {
  type        = string
  default     = "paperclip"
  description = "Subject CN a client certificate must carry to assume the role."
}

variable "session_duration_seconds" {
  type        = number
  default     = 3600
  description = "Lifetime of the temporary credentials (900 to 43200)."

  validation {
    condition     = var.session_duration_seconds >= 900 && var.session_duration_seconds <= 43200
    error_message = "session_duration_seconds must be between 900 and 43200."
  }
}
