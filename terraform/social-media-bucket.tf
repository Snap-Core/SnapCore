resource "aws_s3_bucket" "social_media_bucket" {
  bucket = "snapcore-social-media-assets"

  tags = {
    Project     = "Snapcore"
    Environment = "dev"
    Purpose     = "SocialMediaAssets"
  }
}

resource "aws_s3_bucket_public_access_block" "block_public_access" {
  bucket = aws_s3_bucket.social_media_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "versioning" {
  bucket = aws_s3_bucket.social_media_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}
