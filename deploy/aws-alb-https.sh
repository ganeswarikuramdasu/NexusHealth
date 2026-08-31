#!/usr/bin/env bash
#
# deploy/aws-alb-https.sh
# ─────────────────────
# Puts the NexusHealth backend behind an AWS Application Load Balancer
# (ALB) with a free ACM TLS certificate, so it's served over HTTPS.
# This fully solves the mixed-content problem when the frontend is on
# HTTPS (CloudFront).
#
# Run with the AWS CLI (aws configure first) to automate the setup, or
# follow the "Manual (console) steps" at the bottom.
#
# Prereqs:
#   - EC2 instance already running the backend on port 8080 (ec2-setup.sh)
#   - AWS CLI installed & configured
#   - EXPECT: EC2_ID, VPC_ID, EC2_SG_ID (the backend's security group),
#     and either ACM_CERT_ARN or a cert you can attach in the console.
# ─────────────────────

set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
EC2_ID="${EC2_ID:?Set EC2_ID=<ec2 instance id>}"
VPC_ID="${VPC_ID:?Set VPC_ID=<vpc id>}"
EC2_SG_ID="${EC2_SG_ID:?Set EC2_SG_ID=<backend security group id>}"

echo ">> Region=$REGION Instance=$EC2_ID"

# ---- 1. Create a dedicated security group for the ALB ----
ALB_SG_NAME="nexushealth-alb-sg"
ALB_SG_ID=$(aws ec2 create-security-group \
  --group-name "$ALB_SG_NAME" \
  --description "Allow inbound 80/443 for NexusHealth ALB" \
  --vpc-id "$VPC_ID" \
  --region "$REGION" \
  --query 'GroupId' --output text)
# Allow inbound 80 and 443 from the internet
aws ec2 authorize-security-group-ingress --group-id "$ALB_SG_ID" \
  --protocol tcp --port 80 --cidr 0.0.0.0/0 --region "$REGION"
aws ec2 authorize-security-group-ingress --group-id "$ALB_SG_ID" \
  --protocol tcp --port 443 --cidr 0.0.0.0/0 --region "$REGION"
echo "   ALB security group: $ALB_SG_ID"

# ---- 2. Allow the ALB to reach the EC2 instance on 8080 ----
aws ec2 authorize-security-group-ingress --group-id "$EC2_SG_ID" \
  --protocol tcp --port 8080 --source-group "$ALB_SG_ID" --region "$REGION" || true
echo "   EC2 SG ($EC2_SG_ID) now allows 8080 from ALB."

# ---- 3. Create the ALB ----
ALB_NAME="nexushealth-alb"
SUBNET_IDS=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[?DefaultForAz==`true`].SubnetId' \
  --output text | tr -s ' ')
ALB_ARN=$(aws elbv2 create-load-balancer \
  --name "$ALB_NAME" \
  --subnets $SUBNET_IDS \
  --security-groups "$ALB_SG_ID" \
  --scheme internet-facing \
  --type application \
  --region "$REGION" \
  --query 'LoadBalancers[0].LoadBalancerArn' --output text)
echo "   ALB ARN: $ALB_ARN"

# ---- 4. Target group -> register EC2 ----
TG_ARN=$(aws elbv2 create-target-group \
  --name "nexushealth-tg" \
  --protocol HTTP --port 8080 \
  --vpc-id "$VPC_ID" \
  --target-type instance \
  --health-check-protocol HTTP --health-check-path /api/health \
  --region "$REGION" \
  --query 'TargetGroups[0].TargetGroupArn' --output text)
aws elbv2 register-targets --target-group-arn "$TG_ARN" \
  --targets "Id=$EC2_ID" --region "$REGION"
echo "   Target group: $TG_ARN"

# ---- 5. HTTPS listener (uses your ACM cert) ----
if [ -n "${ACM_CERT_ARN:-}" ]; then
  aws elbv2 create-listener \
    --load-balancer-arn "$ALB_ARN" --protocol HTTPS --port 443 \
    --certificates "CertificateArn=$ACM_CERT_ARN" \
    --default-actions Type=forward,TargetGroupArn="$TG_ARN" \
    --region "$REGION" >/dev/null
  echo "   HTTPS listener created with ACM cert."
else
  echo "   NOTE: ACM_CERT_ARN not set. Create the HTTPS listener in the console"
  echo "   (EC2 -> Load Balancers -> $ALB_NAME -> Listeners -> Add listener,"
  echo "   protocol HTTPS 443, forward to nexushealth-tg) after requesting a cert."
fi

# HTTP -> HTTPS redirect (only if the cert/listener path completed)
if [ -n "${ACM_CERT_ARN:-}" ]; then
  aws elbv2 create-listener \
    --load-balancer-arn "$ALB_ARN" --protocol HTTP --port 80 \
    --default-actions Type=redirect,RedirectConfig='{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}' \
    --region "$REGION" >/dev/null && echo "   HTTP -> HTTPS redirect created."
fi

echo
echo "✅ ALB + HTTPS setup. Next steps:"
echo "   1) DNS:  ALB DNS name  (EC2 -> Load Balancers -> $ALB_NAME)"
echo "   2) Frontend build:  VITE_API_BASE_URL=https://<ALB_DNS> npm run build"
echo "   3) Deploy dist/ to S3 + CloudFront:  BUCKET=... ./deploy/aws-frontend.sh"
echo "   4) CORS on backend:  in /opt/nexushealth/.env set"
echo "        CORS_ORIGINS=https://<cloudfront-domain>"
echo "      then:  sudo systemctl restart nexushealth"
echo
echo "Manual (console) steps instead of this script:"
echo "  - Certificate Manager -> Request public cert -> DNS validate in Route 53."
echo "  - EC2 -> Load Balancers -> Create ALB (internet-facing, HTTP:8080 target)."
echo "  - EC2 -> Target Groups -> create tg -> target your instance, health /api/health."
echo "  - Create listener HTTPS:443 -> attach the ACM cert -> forward to target group."
echo "  - Add listener HTTP:80 -> redirect to 443."
echo "  - Security: your EC2 SG must allow 8080 from the ALB SG."
