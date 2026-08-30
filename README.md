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
| **Database** | MySQL 8 |
| **AI** | Google Gemini API (optional) |
| **Deploy** | Everything on AWS: S3 + CloudFront (frontend) · EC2 (backend) · RDS (MySQL) · Docker |

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
├── deploy/aws-frontend.sh  # Publish frontend dist/ to S3 + CloudFront
├── vercel.json             # Vercel config (alt. frontend + API proxy)
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

## ☁️ Deployment — Everything on AWS (all free tier)

The full stack runs entirely on **AWS**, all within the free tier. You'll need an AWS account with a card on file (used only for verification — no charge while you stay in the free tier).

| Piece | AWS service | Free tier |
|-------|-------------|-----------|
| **Frontend** (React/Vite) | **S3 static + CloudFront CDN** | ✅ |
| **Backend** (Spring Boot jar) | **EC2 `t2.micro`** + systemd | ✅ 12 months |
| **Database** (MySQL) | **RDS `db.t3.micro`** | ✅ 12 months |
| **Domain / HTTPS** | **CloudFront** (free TLS cert via ACM) / **Route 53** | ✅ |

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

### 🗄️ 1b. Hosted MySQL (RDS or Aiven free)

For a deployed backend you need a reachable MySQL. Easiest free options:
- **Aiven free MySQL** (managed, free tier, web dashboard): create a MySQL service, enable **public access**, and use the host/port/db/user/password in `/opt/nexushealth/.env`.
- Or **AWS RDS MySQL** (free tier for `db.t3.micro`), if you manage it via AWS.

> ⚠️ EC2 can't reach `localhost` on your own machine — the DB must be reachable over the internet.

### 🖥️ 2. Frontend → S3 + CloudFront (static, HTTPS)

With static hosting there is **no server-side proxy**, so the browser must call the EC2 backend directly. The app supports this via the build-time env var `VITE_API_BASE_URL` (all relative `/api/...` calls are rewritten automatically — see `frontend/utils/apiBase.ts`).

1. Build the frontend pointing at your EC2 backend:
   ```bash
   VITE_API_BASE_URL=http://<YOUR_EC2_PUBLIC_DNS>:8080 npm run build
   ```
   → produces `dist/`.

2. **S3 bucket:** create a bucket (names must be globally unique), enable **Static website hosting**, and set **index document** = `index.html`, **error document** = `index.html` (SPA routing).

3. **Upload:** use the AWS CLI / Console to upload `dist/*` into the bucket. Or run the included helper:
   ```bash
   BUCKET=<your-bucket> ./deploy/aws-frontend.sh
   ```

4. **CloudFront:** create a distribution with the S3 bucket as origin, and attach a free **ACM TLS certificate** (AWS Certificate Manager, in `us-east-1`). This gives you an `https://<cloudfront-domain>` URL. Add an invalid config if you use a custom domain via Route 53.

5. Point the backend at your CloudFront domain (so CORS is allowed):
   - Set `CORS_ORIGINS=https://<cloudfront-domain>` in `/opt/nexushealth/.env` on EC2.
   - `sudo systemctl restart nexushealth`.

> **Mixed content:** CloudFront serves `https://` and your EC2 backend is `http://`. Browsers block an `https` page calling an `http` API. Recommended fix — put the EC2 backend behind HTTPS too: add an **AWS Application Load Balancer** with an ACM cert (all free tier), and set `VITE_API_BASE_URL=https://<alb-dns>` in step 1. For a quick demo, you can instead serve both over `http://` (access the S3 website endpoint directly, not CloudFront).

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

**In production on AWS** — if you used **Aiven**, open the Aiven console → your MySQL service → **Service Overview** for the connection string, and **Query Editor / CLI** to inspect the same tables. If you used **AWS RDS**, check the **MySQL client / RDS console** with the endpoint and credentials from `/opt/nexushealth/.env`.

---

## 🛠️ Troubleshooting

- **CORS errors on deployment** → ensure your CloudFront/Vercel domain is in `CORS_ORIGINS` and restart the backend.
- **Backend can't reach the DB** → verify `MYSQL_*` in `/opt/nexushealth/.env`, the DB host must be internet-reachable, and your DB user/IP allowlist must permit EC2's IP.
- **Mixed-content (`https` page calling `http` API)** → put the backend behind HTTPS or serve the frontend over `http` for the demo.
- **`application.yml` holds local dev secrets** → override everything via the `.env` on EC2; rotate/scrub before making the repo public.

---

<div align="center">

Built with ❤️ as a final-year project — secure, consent-first healthcare data for the digital era.

</div>
