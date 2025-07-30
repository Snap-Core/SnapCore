# terraform backend
terraform {
  backend "s3" {
    bucket  = "levelup-snapcore-terraform-state"
    key     = "terraform.tfstate"
    region  = "af-south-1"
  }
}
