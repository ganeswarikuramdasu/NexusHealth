#!/usr/bin/env bash
#
# deploy/aws-rds-mysql.sh
# ─────────────────────────────────────────────────────────────
# Provisions a free-tier Amazon RDS MySQL database for the
# NexusHealth backend (running on EC2).
#
# NOTE: RDS free tier is limited to 12 months. A "db.t3.micro" (or
# db.t4g.micro) single-AZ instance keeps you within the free tier.
#
# Usage (run on any machine with the AWS CLI configured):
#   ./deploy/aws-rds-mysql.sh
#
# Environment variables you can set (optional, defaults in []):
#   AWS_REGION        [us-east-1]
#   RDS_DB_NAME       [nexushealth]
#   RDS_USER          [nexushealth]
#   RDS_PASSWORD      (REQUIRED - strong password, min 8 chars)
#   RDS_INSTANCE_TYPE [db.t3.micro]
#   RDS_VPC_SG_ID     (REQUIRED - the EC2 backend security group id,
#                      so the EC2 instance can reach MySQL)
# ─────────────────────────────────────────────────────────────

set -euo pipefail

REGION="${AWS_REGION:-us-east-1}"
DB_NAME="${RDS_DB_NAME:-nexushealth}"
DB_USER="${RDS_USER:-nexushealth}"
RDS_PASSWORD="${RDS_PASSWORD:?Set RDS_PASSWORD=... (strong password, >=8 chars)}"
INSTANCE_TYPE="${RDS_INSTANCE_TYPE:-db.t3.micro}"
EC2_SG_ID="${RDS_VPC_SG_ID:?Set RDS_VPC_SG_ID=<your backend EC2 security group id>}"

echo ">> Region=$REGION  DB=$DB_NAME  User=$DB_USER  Type=$INSTANCE_TYPE"

# NOTE: We re-use the EC2 backend's security group ($EC2_SG_ID) directly as the
# RDS instance's VPC security group. RDS therefore only accepts MySQL (3306)
# connections from your backend instance - no public exposure, no extra SG.
#
# Your EC2 SG must allow inbound MySQL (port 3306) from its own SG. Add that rule
# once if it isn't already present:
aws ec2 authorize-security-group-ingress \
  --group-id "$EC2_SG_ID" \
  --protocol tcp --port 3306 --source-group "$EC2_SG_ID" \
  --region "$REGION" 2>/dev/null || true

# ---- Create the RDS MySQL instance (free tier) ----
echo ">> Creating RDS MySQL instance (this takes ~10 minutes)..."
DB_ID="nexushealth-mysql"
aws rds create-db-instance \
  --db-instance-identifier "$DB_ID" \
  --db-name "$DB_NAME" \
  --allocated-storage 20 \
  --db-instance-class "$INSTANCE_TYPE" \
  --engine MySQL \
  --engine-version 8.0 \
  --master-username "$DB_USER" \
  --master-user-password "$RDS_PASSWORD" \
  --backup-retention-period 0 \
  --multi-az false \
  --publicly-accessible false \
  --vpc-security-group-ids "$EC2_SG_ID" \
  --no-auto-minor-version-upgrade \
  --region "$REGION" >/dev/null

echo ">> Provisioning started. Polling for status..."
STATUS=""
while [ "$STATUS" != "available" ]; do
  sleep 30
  STATUS=$(aws rds describe-db-instances \
    --db-instance-identifier "$DB_ID" \
    --query 'DBInstances[0].DBInstanceStatus' --output text --region "$REGION")
  echo "   ... status = $STATUS"
done

ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier "$DB_ID" \
  --query 'DBInstances[0].Endpoint.Address' --output text --region "$REGION")

echo
echo "✅ RDS MySQL is READY."
echo
echo "Connection details for your backend /opt/nexushealth/.env:"
echo "  MYSQL_HOST=$ENDPOINT"
echo "  MYSQL_PORT=3306"
echo "  MYSQL_DATABASE=$DB_NAME"
echo "  MYSQL_USER=$DB_USER"
echo "  MYSQL_PASSWORD=<the RDS_PASSWORD you set>"
echo
echo "Security: the DB is NOT publicly reachable; only your EC2 instance"
echo "security group ($EC2_SG_ID) can connect on port 3306."
echo "Add these to /opt/nexushealth/.env, then:  sudo systemctl restart nexushealth"
echo
echo "Manual (console) alternative steps:"
echo "  - RDS -> Databases -> Create database -> MySQL 8, 'Free tier' template."
echo "  - Master username + password, DB name = nexushealth."
echo "  - Connectivity -> 'Connect to an EC2 compute resource' -> pick your backend instance."
echo "  - Or choose 'Don't connect to EC2' and set a custom VPC security group that allows 3306 from your EC2 SG."
