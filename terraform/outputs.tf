output "ec2_endpoint" {
  value = aws_instance.app_server.public_dns
}

output "ec2_fediverse_server_endpoint" {
  value = aws_instance.fediverse_app_server.public_dns
}