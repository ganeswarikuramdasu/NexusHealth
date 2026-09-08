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
| **Database** | MySQL 8 (Aiven) |
| **AI** | Google Gemini API (optional) |
| **Deploy** | **Vercel** (frontend) · **Render** (backend) · **Aiven MySQL** (database) |

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
├── render.yaml             # Render Blueprint (backend deploy config)
├── deploy/aws-frontend.sh  # (Optional) Publish frontend dist/ to S3 + CloudFront
├── vercel.json             # Vercel config (frontend + /api proxy to Render)
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

## ☁️ Deployment — Vercel + Render + Aiven MySQL

The stack ships across **Vercel** (frontend), **Render** (backend), and **Aiven MySQL** (database) — all on free/cheap tiers:

| Piece | Service | Free tier |
|-------|---------|-----------|
| **Frontend** (React/Vite) | **Vercel** | ✅ (hobby) |
| **Backend** (Spring Boot) | **Render** web service (`render.yaml`) | ✅ (free, sleeps when idle) |
| **Database** (MySQL) | **Aiven MySQL** (Hobbyist) | ✅ (free, managed) |

HTTPS is automatic everywhere (Vercel + Render), so there's **no mixed-content problem** — the Vercel `/api` proxy can call Render directly over `https://`.

### 🗄️ 0. Database → Aiven MySQL (free)

1. Create a free account at **aiven.io** → **Create service** → **MySQL**.
   - Plan: **Hobbyist** (free). Cloud/region: any near you.
2. When it's ready, open **Service Settings** → **Advanced Configuration**:
   - Ensure **Public access** is **enabled** (so Render can reach it).
   - Copy the **Host**, **Port**, and the **service URI** (or user `avnadmin` + password).
3. Create the database (Hibernate auto-creates tables on first boot):
   ```bash
   mysql -h <AIVEN_HOST>.aivencloud.com -P <port> -u avnadmin -p
   CREATE DATABASE IF NOT EXISTS nexushealth;
   ```

> ⚠️ Render can't reach `localhost` — the DB must be the **Aiven public host**, and Aiven must allow connections from Render (public access on). if your Aiven plan requires an **allowlist** for IPs, Render free egress IPs are dynamic — enable public access without a strict allowlist, or add Render's IPs.

### ⚙️ 1. Backend → Render

1. Push this repo to GitHub (the `Dockerfile` + `render.yaml` are included).
2. In **Render** → **New** → **Blueprint** → connect your GitHub repo, or:
   **New → Web Service** → connect repo → **Dockerfile**, region `Singapore`.
3. Add the Render dashboard env vars (values from your Aiven MySQL + secrets):
   ```text
   SERVER_PORT          8080
   MYSQL_HOST           <AIVEN_HOST>.aivencloud.com
   MYSQL_PORT           <AIVEN_PORT>
   MYSQL_DATABASE       nexushealth
   MYSQL_USER           avnadmin
   MYSQL_PASSWORD       <your-aiven-password>
   SUPER_ADMIN_EMAIL    ganeswarikuramdasu@gmail.com
   SUPER_ADMIN_PASSWORD <your-super-admin-password>
   DEMO_SUPER_ADMIN_EMAIL   demo.admin@nexusdemo.in
   DEMO_SUPER_ADMIN_PASSWORD DemoAdmin@2026
   CORS_ORIGINS         https://nexus-health-eight.vercel.app,http://localhost:5173,http://localhost:3000
   APP_URL              https://<your-service>.onrender.com
   GEMINI_API_KEY       <optional>
   BREVO_API_KEY        <your-brevo-key>   # OTP emails over HTTPS (free: 300/day)
   EMAIL_PROVIDER       BREVO
   SMTP_FROM            "NexusHealth Identity <no-reply@nexushealth.in>"
   ```
4. Render gives you a public URL: `https://<your-service>.onrender.com`.
   - Health check: `https://<your-service>.onrender.com/api/health`.
   - Set Render's health check path to `/api/health`.

> Free Render services **spin down after 15 min idle**, so the first request after idle is slow (cold start) — fine for a demo/project.

### 🖥️ 2. Frontend → Vercel (proxy to Render)

The app calls relative `/api/...` which **Vercel rewrites** to your Render backend via `vercel.json`, so **no build-time env is needed** and there's no mixed-content issue (both are `https`).

1. Push this repo to GitHub and import it in **Vercel** (framework: **Vite**).
2. Build command `vite build`, output directory `dist`.
3. In `vercel.json`, replace `https://your-backend.onrender.com` with your **actual Render URL**:
   ```json
   "destination": "https://<your-service>.onrender.com/api/$1"
   ```
4. Redeploy and open your `https://nexus-health-eight.vercel.app`.

> **Alternative — build-time env:** instead of the proxy, bake the Render URL into the build with `VITE_API_BASE_URL=https://<your-service>.onrender.com npm run build`. See `frontend/utils/apiBase.ts`.

### 🔁 One-click Blueprint

A `render.yaml` is included so you can deploy the backend with **Render → New → Blueprint → select repo**. Set the `sync: false` secrets (`MYSQL_PASSWORD`, `SUPER_ADMIN_PASSWORD`, `GEMINI_API_KEY`, `BREVO_API_KEY`) in the Render dashboard after provisioning.

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

**In production on Aiven MySQL** — open the Aiven console → your MySQL service → **Overview** for host/port/user, and use the **Query Editor / CLI** (`mysql -h <host> -P <port> -u avnadmin -p`) to inspect the same tables. The connection details must match the `MYSQL_*` env vars you set on Render.

---

## 🛠️ Troubleshooting

- **CORS errors on deployment** → ensure your Vercel/CloudFront domain is in `CORS_ORIGINS` and redeploy/restart the backend.
- **Backend can't reach the DB** → verify `MYSQL_*` on Render, the Aiven host/port are correct, and **Public access** is enabled on the Aiven service. Render's free service runs outside your VPC, so it must connect via Aiven's public endpoint.
- **`mysql` client access denied** → make sure the Aiven `avnadmin` username/password on Render matches the one in the Aiven console; Hibernate creates/updates the schema automatically via `ddl-auto: update`.
- **Render gets a 502 on `api/health`** → check the Render logs; if it's a cold start, wait a few seconds and retry (free tier spins down after idle).
- **Vercel `/api` returns 404/125** → confirm `vercel.json` `destination` points at your real `https://<your-service>.onrender.com` URL, not the placeholder.

---

<div align="center">

Built with ❤️ as a final-year project — secure, consent-first healthcare data for the digital era.

</div>
