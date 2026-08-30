#!/usr/bin/env bash
#
# deploy/aws-frontend.sh
# ─────────────────────
# Publish the built React frontend (dist/) to an AWS S3 bucket
# configured for static hosting, served over HTTPS by CloudFront.
#
# Prereqs:
#   - AWS CLI installed & configured  (aws configure)
#   - S3 bucket created, public-read + static website hosting enabled
#   - CloudFront distribution pointed at the bucket (origin = bucket
#     website endpoint), with an Origin Access Control / public access
#   - You have already run:  npm run build  (creates dist/)
#
# Usage:
#   BUCKET=my-nexushealth-frontend CLOUDFRONT_ID=E1234567890ABC \
#     ./deploy/aws-frontend.sh
# ─────────────────────

set -euo pipefail

BUCKET="${BUCKET:?Set BUCKET=<your-s3-bucket-name>}"
DIST="${CLOUDFRONT_ID:-}"

if [ ! -d dist ]; then
  echo "!! No dist/ found. Run  npm run build  first." >&2
  exit 1
fi

echo ">> Syncing dist/ to s3://$BUCKET ..."
aws s3 sync dist/ "s3://$BUCKET" \
  --delete \
  --exclude "*.map" \
  --cache-control "public, max-age=31536000, immutable" \
  --cache-control "no-cache" --exclude "index.html"

# index.html must not be cached so new deploys are picked up.
aws s3 cp dist/index.html "s3://$BUCKET/index.html" \
  --cache-control "no-cache, no-store, must-revalidate"

echo ">> Enabling public read + static website hosting ..."
aws s3 website "s3://$BUCKET" --index-document index.html --error-document index.html

if [ -n "$DIST" ]; then
  echo ">> Invalidating CloudFront cache ($DIST) ..."
  aws cloudfront create-invalidation --distribution-id "$DIST" --paths "/*" \
    --output json | jq -r '.Invalidation.Id' | xargs -I{} echo "Invalidation id: {}"
fi

echo
echo "✅ Frontend published to S3 bucket: $BUCKET"
if [ -n "$DIST" ]; then echo "   CloudFront domain will serve it once the invalidation completes."; fi
echo "   If the backend is at HTTP (EC2), see README about mixed-content / HTTPS."
