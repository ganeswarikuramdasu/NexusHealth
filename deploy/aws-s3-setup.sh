#!/usr/bin/env bash
#
# deploy/aws-s3-setup.sh
# ─────────────────────
# One-time provisioning for CI/CD of the frontend to AWS S3 + CloudFront.
# Creates:
#   - an S3 bucket (static website hosting)
#   - a bucket policy allowing public GET
#   - an IAM user with exactly the permissions the GitHub Actions
#     workflow needs (S3 sync + CloudFront invalidation), with access keys
#   - prints the GitHub secrets/vars to configure
#
# Requires: AWS CLI configured with admin credentials.
#   BUCKET  (required) globally-unique bucket name,
#           e.g. nexushealth-frontend-<yourname>
# ─────────────────────

set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
BUCKET="${BUCKET:?Set BUCKET=<globally-unique-bucket-name>}"
IAM_USER="nexushealth-cicd"

echo ">> Creating S3 bucket: $BUCKET (region $REGION)"
if [ "$REGION" = "us-east-1" ]; then
  aws s3api create-bucket --bucket "$BUCKET" --region "$REGION" >/dev/null
else
  aws s3api create-bucket --bucket "$BUCKET" \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION" >/dev/null
fi

# ---- Static website hosting ----
echo ">> Enabling static website hosting"
aws s3 website "s3://$BUCKET" --index-document index.html --error-document index.html

# ---- Public-read bucket policy ----
echo ">> Applying public-read bucket policy"
POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET/*"
    }
  ]
}
EOF
)
aws s3api put-bucket-policy --bucket "$BUCKET" --policy "$POLICY"

# ---- IAM user for CI/CD ----
echo ">> Creating IAM user: $IAM_USER"
aws iam create-user --user-name "$IAM_USER" >/dev/null 2>&1 || echo "   (user exists)"

# Build the policy document with the real bucket name substituted in.
read -r -d '' IAM_POLICY_DOC <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket","s3:GetObject","s3:PutObject","s3:DeleteObject","s3:GetBucketLocation"],
      "Resource": ["arn:aws:s3:::$BUCKET","arn:aws:s3:::$BUCKET/*"]
    },
    {
      "Effect": "Allow",
      "Action": "cloudfront:CreateInvalidation",
      "Resource": "*"
    }
  ]
}
EOF

IAM_POLICY_ARN=$(aws iam create-policy --policy-name "nexushealth-cicd-policy" \
  --policy-document "$IAM_POLICY_DOC" \
  --query 'Policy.Arn' --output text)
aws iam attach-user-policy --user-name "$IAM_USER" --policy-arn "$IAM_POLICY_ARN"
CREDS=$(aws iam create-access-key --user-name "$IAM_USER" --query 'AccessKey.[AccessKeyId,SecretAccessKey]' --output text)
AKID=$(echo "$CREDS" | awk '{print $1}')
SAK=$(echo "$CREDS" | awk '{print $2}')

# ---- Create a placeholder object so the bucket is non-empty ----
echo "index.html placeholder" > /tmp/nexushealth-index.html
aws s3 cp /tmp/nexushealth-index.html "s3://$BUCKET/index.html"

echo
echo "=============================================================="
echo "✅ Provisioned. Configure these in GitHub (repo -> Settings ->"
echo "   Secrets and variables -> Actions):"
echo "=============================================================="
echo "SECRETS:"
echo "  AWS_ACCESS_KEY_ID     = $AKID"
echo "  AWS_SECRET_ACCESS_KEY = $SAK"
echo
echo "VARIABLES (repo settings):"
echo "  S3_BUCKET             = $BUCKET"
echo "  AWS_REGION            = $REGION"
echo "  VITE_API_BASE_URL     = https://<your-alb-dns>   (or http://<ec2-dns>:8080)"
echo "  CLOUDFRONT_DISTRIBUTION_ID = <from CloudFront console, see below>"
echo
echo "CloudFront (for HTTPS + cache invalidation):"
echo "   1) AWS Console -> CloudFront -> Create Distribution."
echo "   2) Origin domain: <your-bucket>.s3-website-$REGION.amazonaws.com"
echo "      (the S3 static website endpoint, NOT the REST endpoint)."
echo "   3) Origin access: allow public read via the bucket policy (already set)."
echo "   4) Create, then copy the Distribution ID into CLOUDFRONT_DISTRIBUTION_ID."
echo "   5) The distribution gives you an https://<xxx>.cloudfront.net URL."
echo
echo "NOTE: IAM access keys are shown once here. Store them in GitHub now."
