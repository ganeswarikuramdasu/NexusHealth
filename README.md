<div align="center">

# 🏥 NexusHealth

### A Blockchain-Inspired Digital Health Identity & Smart Healthcare Platform

A full-stack final-year project that gives every citizen a unique **Global Health ID** tied to a smart **Access Card** — giving patients full control over their medical data while letting doctors, hospitals, and emergency responders securely access it with consent.

</div>

---

## ✨ Features

### 🪪 Global Health Identity
- Every patient gets a unique health ID (e.g. `NH-IND-2026-88392014`)
- Digital access card with generated token + PIN for offline verification
- Scan a card (QR / 4-digit PIN) to instantly load a patient's consent-gated record

### 🧑‍⚕️ Role-Based Access
| Role | What they can do |
|------|------------------|
| **Patient** | Own & manage your Full Clinical Record, consent controls, diet plans, AI assistant, medication tracker |
| **Doctor** | Scan/access patients with consent, manage appointments & schedule, verify prescriptions & contraindications |
| **Hospital Admin** | Manage doctors, view all patient records, audit access logs |
| **Super Admin** | Platform-wide control, security audit, system overview |

### 🔐 Consent & Security
- Every record access/scan is logged in an immutable-style **audit trail**
- Hierarchical audit log viewer with full visibility
- Emergency access mode with patient absence profiles
- Manual record upload & lab-report AI explanation

### 🤖 AI Clinical Assistant
- Medication contraindication & prescription safety checks
- Lab report & scan explanation assist
- Diet plan generation based on blood group & health profile
- Synthetic patient-data viewer (no live health-data risk)

### 📱 Mobile Camera Bridge
- Pair a phone to scan cards/mobile-camera flow when no scanner is attached

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19 · Vite · TypeScript · Tailwind CSS 4 |
| **Backend** | Java 17 · Spring Boot 3.3 · Spring Data JPA · Hibernate |
| **Database** | MySQL 8 (AWS RDS free tier) |
| **AI** | Google Gemini API (optional) |
| **Deploy** | **Vercel** (frontend) · **AWS EC2** (backend) · **AWS RDS MySQL** (database) · Docker |

---

## 📁 Project Structure

```
nexushealth/
├── frontend/               # React + Vite + Tailwind UI
│   └── components/         # All feature views & modals
├── backend-java/           # Spring Boot backend (single backend)
│   └── src/main/java/com/nexushealth/
│       ├── config/         # Cors, DataSeeder, security constants
│       ├── controller/     # REST endpoints
│       ├── service/        # Business logic
│       ├── repository/     # Spring Data JPA repositories
│       ├── entity/         # JPA entities
│       ├── dto/            # Request/response objects
│       └── common/         # ApiResponse, exceptions, validation
├── Dockerfile              # Backend container image
├── deploy/ec2-setup.sh     # AWS EC2 one-time setup (backend)
├── deploy/aws-rds-mysql.sh # Provision AWS RDS MySQL free tier (database)
├── deploy/aws-alb-https.sh # Put EC2 backend behind HTTPS (ALB + ACM)
├── deploy/aws-frontend.sh  # Publish frontend dist/ to S3 + CloudFront
├── vercel.json             # Vercel config (frontend + optional API proxy)
└── .env.example            # Sample environment variables
```

---

## 🚀 Run Locally

### Prerequisites
- **Node.js** 18+ (frontend)
- **JDK 17+** and **Maven** (backend)
- **MySQL 8** running locally

### 1. Database
Create a database (the backend creates tables automatically on first boot):

```sql
CREATE DATABASE IF NOT EXISTS nexushealth;
```

### 2. Backend (Spring Boot)

```bash
cd backend-java
mvn spring-boot:run
```

Starts on **http://localhost:8080** · Health check: `http://localhost:8080/api/health`

> On first run, the **`DataSeeder`** automatically creates demo doctors, hospitals, patients, cards, and medical records — so the app is instantly usable.

### 3. Frontend (React + Vite)

```bash
npm install
npm run dev
```

Opens on **http://localhost:5173**. Vite proxies `/api/*` to the backend on `:8080`.

> Run `npm run build` for a production build (`npx vite preview` to serve `dist/`).

### 🔑 Environment Variables
Copy `.env.example` → `.env` and fill in values. The backend defaults to common dev values, so it runs out-of-the-box on a local MySQL with `root`.

---

## 👤 Demo Accounts

The seeder builds these accounts (also shown as one-click buttons on the login page):

| Role | Email | Password |
|------|-------|----------|
| **Patient** | `ananya.sharma@nexus.org` | `PatientPass123!` |
| **Patient** | `rohan.verma@nexus.org` | `PatientPass123!` |
| **Doctor** | `dr.rajesh@apollo.org` | `DoctorPass123!` |
| **Doctor** | `dr.priya@maxhealth.org` | `DoctorPass123!` |
| **Doctor** | `dr.vikram@apollo.org` | `DoctorPass123!` |
| **Hospital Admin** | `admin@apollo.org` | `HospitalPass123!` |
| **Hospital Admin** | `admin@maxhealth.org` | `HospitalPass123!` |
| **Super Admin** | `ganeswarikuramdasu@gmail.com` | `Admin@Nexus2026!` |

**Sample Patient Health IDs:**
- `NH-IND-2026-88392014` — Ananya Sharma
- `NH-IND-2026-99281045` — Rohan Verma

Access-card PINs are seeded (`4412` / `8819`) and shown in the patient's card view for demo purposes.

---

## 📡 API Overview (base: `/api`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health & status |
| `POST` | `/auth/login` | Login (patient/doctor/hospital/super) |
| `GET` | `/patient/profile`, `/patient/records` | Patient data |
| `GET` | `/doctors` | Doctor directory |
| `POST` | `/card/mobile-bridge/create` | Pair a phone for card scanning |
| `GET` | `/admin/all-records` | All patient records (admin) |
| `POST` | `/access-sessions/{id}/end` | End an active access session |
| `GET` | `/audit` | Security / audit trail |

All responses are wrapped in the standard `ApiResponse` envelope.

---

## ☁️ Deployment — Vercel + AWS EC2 + AWS RDS

The stack ships across **Vercel** (frontend), **AWS EC2** (backend), and **AWS RDS MySQL** (database). An AWS account with a card on file is needed only for verification — staying in the free tier keeps it at $0.

| Piece | Service | Free tier |
|-------|---------|-----------|
| **Frontend** (React/Vite) | **Vercel** | ✅ (hobby) |
| **Backend** (Spring Boot jar) | **AWS EC2 `t2.micro`** + systemd | ✅ 12 months |
| **Database** (MySQL) | **AWS RDS `db.t3.micro`** | ✅ 12 months |
| **HTTPS for API** | **AWS ALB + ACM** cert (recommended) | ✅ 12 months |

### ⚙️ 1. Backend → AWS EC2 (Free Tier)

1. Build the backend jar locally:
   ```bash
   mvn -f backend-java/pom.xml clean package -DskipTests
   ```
   → produces `backend-java/target/nexushealth-backend.jar`.

2. In the **AWS Console** → **EC2** → **Launch Instance**:
   - Name: `nexushealth-backend`
   - AMI: **Amazon Linux 2023** (free tier eligible)
   - Instance type: **`t2.micro`** (or `t3.micro`) — free tier eligible
   - Key pair: create/download your `.pem`
   - **Security Group** → add a rule: **Type = Custom TCP, Port `8080`, Source `0.0.0.0/0`**
   - Launch the instance.

3. Copy your jar + the deploy script up to the instance:
   ```bash
   scp -i yourkey.pem backend-java/target/nexushealth-backend.jar ec2-user@YOUR_PUBLIC_DNS:~/
   scp -i yourkey.pem deploy/ec2-setup.sh ec2-user@YOUR_PUBLIC_DNS:~/
   ```

4. SSH in and run the one-time setup:
   ```bash
   ssh -i yourkey.pem ec2-user@YOUR_PUBLIC_DNS
   chmod +x ec2-setup.sh
   ./ec2-setup.sh
   ```

5. Fill in your secrets, then start:
   ```bash
   sudo nano /opt/nexushealth/.env     # DB, super-admin, CORS, APP_URL
   sudo systemctl start nexushealth
   sudo systemctl status nexushealth
   curl http://localhost:8080/api/health
   ```
   The backend is a **systemd service**, so it auto-starts on reboot and restarts on crash.

### 🗄️ 1b. Database → AWS RDS MySQL (Free Tier)

Your EC2 backend reads the DB location from `/opt/nexushealth/.env` (env vars `MYSQL_HOST` etc.). Provision a free-tier RDS MySQL:

**Option A — helper script (recommended):**
```bash
RDS_PASSWORD='YourStrongPass!123' \
RDS_VPC_SG_ID='sg-<your-backend-ec2-sg>' \
./deploy/aws-rds-mysql.sh
```
This creates a `db.t3.micro` MySQL 8 instance, waits until it's available, prints the endpoint + connection vars, and locks the DB so **only your EC2 security group** can reach it on port 3306.

**Option B — AWS Console:**
1. **RDS → Create database → MySQL 8**, template **Free tier** (`db.t3.micro`, 20 GB).
2. Set master username + password, DB name = `nexushealth`.
3. Connectivity → **"Connect to an EC2 compute resource"** → pick your `nexushealth-backend` instance.

Then fill these into `/opt/nexushealth/.env` and restart:
```bash
sudo nano /opt/nexushealth/.env
   MYSQL_HOST=<your-rds-endpoint>.rds.amazonaws.com
   MYSQL_PORT=3306
   MYSQL_DATABASE=nexushealth
   MYSQL_USER=<db-user>
   MYSQL_PASSWORD=<db-password>
sudo systemctl restart nexushealth
```

> ⚠️ EC2 can't reach `localhost` on your own machine — the DB must be a reachable host like RDS, and your EC2 security group must allow inbound `3306`.

### 🖥️ 2. Frontend → Vercel

The backend's **HTTPS API URL** is defined by `VITE_API_BASE_URL` (all relative `/api/...` calls are rewritten — see `frontend/utils/apiBase.ts`). Set it to your EC2/ALB domain **before** building, or use the `vercel.json` `/api/*` proxy rewrite.

**Recommended (proxy via vercel.json):** the checked-in `vercel.json` rewrites `/api/*` to your backend domain, so no build-time env is needed and there's no mixed-content issue:
1. Push this repo to GitHub and import it in **Vercel** (framework: **Vite**).
2. Set the build command `vite build` and output dir `dist`.
3. In `vercel.json`, replace `https://api.your-domain.com` with your backend URL (e.g. `https://<alb-dns>.amazonaws.com`), and add your Vercel URL to `CORS_ORIGINS` on EC2.
4. Redeploy and visit your `*.vercel.app` URL.

> **Mixed-content note:** Vercel serves `https://`. If your EC2 backend is plain `http://`, browsers block the calls. Fix by putting the backend behind an **AWS Application Load Balancer with a free ACM cert** (see `deploy/aws-alb-https.sh`), then set `VITE_API_BASE_URL=https://<alb-dns>` (or the `vercel.json` proxy destination accordingly).

**Alternative — build-time env + S3/CloudFront:** for a fully static S3 + CloudFront frontend instead, build with `VITE_API_BASE_URL=https://<alb-dns> npm run build` and publish `dist/` with `deploy/aws-frontend.sh`.

---

## 🗄️ Where to Check Your Database

**Locally** — connect any MySQL client to `localhost:3306`, database `nexushealth`:
- CLI: `mysql -u root -p nexushealth`
- GUI: **MySQL Workbench**, **DataGrip**, or **DBeaver** (`localhost:3306`, user `root`)

Key tables the app creates:
| Table | Contents |
|-------|----------|
| `users` | All accounts (patients, doctors, hospital admins, super admin) |
| `patient_profiles` | Health IDs, personal & clinical profile data |
| `medical_records` | Patient records incl. symptoms & lab results (JSON) |
| `access_cards` | Smart access cards + tokens + PIN hashes |
| `consents` | Consent grants |
| `audit_logs` | Access / activity audit trail |
| `record_access_logs` | Per-record access history |

**In production on AWS RDS** — connect your MySQL client with the endpoint + credentials from `/opt/nexushealth/.env`. To inspect from a browser, use the **RDS → Databases → your instance → Query Editor** (aws user), or `mysql -h <endpoint> -u <db-user> -p <nexushealth>` from your EC2 instance (your EC2 SG has access).

---

## 🛠️ Troubleshooting

- **CORS errors on deployment** → ensure your Vercel/CloudFront domain is in `CORS_ORIGINS` and restart the backend.
- **Backend can't reach the DB** → verify `MYSQL_*` in `/opt/nexushealth/.env`, the RDS endpoint is correct, and the EC2 security group allows inbound port `3306` from the EC2 instance (RDS is private by default).
- **`mysql` client access denied** → make sure the RDS master username/password in the `.env` matches the one you created the instance with; RDS resets schema here via Hibernate `ddl-auto: update`.

---

<div align="center">

Built with ❤️ as a final-year project — secure, consent-first healthcare data for the digital era.

</div>
