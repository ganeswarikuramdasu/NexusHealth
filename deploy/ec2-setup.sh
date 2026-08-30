#!/usr/bin/env bash
#
# deploy/ec2-setup.sh
# ─────────────────────────────────────────────────────────────
# One-time setup for the NexusHealth backend on an AWS EC2 free-tier
# instance (Amazon Linux 2023 or Ubuntu 22.04/24.04).
#
# Installs OpenJDK 17, copies the backend jar, registers it as a
# systemd service so it auto-starts on boot, and writes a .env
# template for your secrets.
#
# Usage (run as the default ec2-user / ubuntu user):
#   chmod +x deploy/ec2-setup.sh
#   ./deploy/ec2-setup.sh
#
# BEFORE running, make sure a built jar exists in one of:
#   backend-java/target/nexushealth-backend.jar   (built with Maven)
#   ./nexushealth-backend.jar                     (copied to repo root)
# ─────────────────────────────────────────────────────────────

set -e

# ---- Detect default Linux user & package manager ----
if [ -d /home/ubuntu ]; then
  APP_USER="ubuntu"
else
  APP_USER="ec2-user"
fi
APP_HOME="/home/$APP_USER"

if command -v apt-get >/dev/null 2>&1; then INSTALL="apt-get";
elif command -v dnf >/dev/null 2>&1; then INSTALL="dnf";
elif command -v yum >/dev/null 2>&1; then INSTALL="yum";
else echo "Unsupported distro (need apt/dnf/yum)." >&2; exit 1; fi

echo ">> Detected user=$APP_USER  pkg manager=$INSTALL"
sudo "$INSTALL" update -y

# ---- Install OpenJDK 17 (headless JRE is enough to run a jar) ----
echo ">> Installing OpenJDK 17..."
if [ "$INSTALL" = "apt-get" ]; then
  sudo "$INSTALL" install -y openjdk-17-jre-headless
else
  sudo "$INSTALL" install -y java-17-amazon-corretto-headless \
    || sudo "$INSTALL" install -y java-17-openjdk-headless
fi

# ---- Locate the built jar ----
if [ -f "backend-java/target/nexushealth-backend.jar" ]; then
  JAR="backend-java/target/nexushealth-backend.jar"
elif [ -f "nexushealth-backend.jar" ]; then
  JAR="nexushealth-backend.jar"
else
  echo
  echo "!! No prebuilt jar found. Build it, then re-run."
  echo "   mvn -f backend-java/pom.xml clean package -DskipTests"
  echo "   scp -i yourkey.pem backend-java/target/nexushealth-backend.jar $APP_USER@HOST:"
  exit 1
fi

# ---- Create app dir & copy jar ----
APP_DIR="/opt/nexushealth"
echo ">> Installing jar to $APP_DIR"
sudo mkdir -p "$APP_DIR"
sudo cp "$JAR" "$APP_DIR/nexushealth-backend.jar"

# ---- Write an .env template (edit this with your secrets) ----
ENV_FILE="/opt/nexushealth/.env"
echo ">> Writing $ENV_FILE (edit with your values)"
sudo tee "$ENV_FILE" >/dev/null <<'EOF'
# --- Database ---
MYSQL_HOST=YOUR_MYSQL_HOST
MYSQL_PORT=3306
MYSQL_DATABASE=nexushealth
MYSQL_USER=YOUR_DB_USER
MYSQL_PASSWORD=YOUR_DB_PASSWORD
# --- Super admin ---
SUPER_ADMIN_EMAIL=YOUR_EMAIL
SUPER_ADMIN_PASSWORD=YOUR_SUPER_ADMIN_PASSWORD
# --- CORS: your Vercel frontend domain + localhost ---
CORS_ORIGINS="YOUR_VERCEL_URL,http://localhost:5173"
# --- Public URL (your EC2 public DNS, http://) ---
APP_URL=http://YOUR_EC2_PUBLIC_DNS
# --- AI (optional) ---
GEMINI_API_KEY=YOUR_GEMINI_KEY
# --- SMTP (optional) ---
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="NexusHealth Identity <no-reply@nexushealth.gov.in>"
EOF

# ---- Register systemd service ----
SERVICE_FILE=/etc/systemd/system/nexushealth.service
echo ">> Writing systemd service"
sudo tee "$SERVICE_FILE" >/dev/null <<EOF
[Unit]
Description=NexusHealth Spring Boot backend
After=network.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=$APP_DIR/.env
ExecStart=/usr/bin/java -Xmx512m -Xss256k -XX:+UseContainerSupport -jar $APP_DIR/nexushealth-backend.jar
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable nexushealth

echo
echo "✅ Setup complete."
echo
echo "1) Fill in secrets:  sudo nano $ENV_FILE"
echo "2) Tell Spring Boot to read it: the service already points at it."
echo "3) Start:             sudo systemctl start nexushealth"
echo "4) Status/logs:       sudo systemctl status nexushealth"
echo "                      sudo journalctl -u nexushealth -f"
echo "5) Test:              curl http://localhost:8080/api/health"
echo
echo ">> Make sure port 8080 is open in your EC2 Security Group (source = 0.0.0.0/0 or your Vercel IPs),"
echo "   then verify from outside:  curl http://YOUR_PUBLIC_DNS:8080/api/health"