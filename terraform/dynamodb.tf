resource "aws_dynamodb_table" "accounts_table" {
  name           = "accounts"
  billing_mode   = "PAY_PER_REQUEST"

  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Environment = "dev"
    Project     = "Snapcore"
  }
}
