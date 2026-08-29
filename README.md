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
| **Deploy** | Vercel (frontend) · Render (backend) · Docker |

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
├── render.yaml             # Render blueprint (backend)
├── vercel.json             # Vercel config (frontend + API proxy)
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

## 🌐 Deployment

### Backend → Render
1. Push this repo to GitHub.
2. In [Render](https://render.com), **New → Blueprint** and connect the repo.
3. Render reads **`render.yaml`** and creates a Docker web service (`nexushealth-backend`).
4. Add a hosted MySQL (e.g. **Aiven**, **Clever Cloud**, **Railway**, or **DigitalOcean** managed MySQL).
5. Set the database env vars in Render's dashboard (`MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`) plus `SERVER_PORT=8080` and any SMTP / `GEMINI_API_KEY`.
6. Deploy. You'll get a URL like `https://nexushealth-backend.onrender.com`.

### Frontend → Vercel
1. In [Vercel](https://vercel.com), **Import Project** from the same GitHub repo.
2. Framework preset **Vite**, build `vite build`, output `dist`.
3. Set the API proxy in **`vercel.json`** to your Render URL:
   ```json
   {
     "rewrites": [
       { "source": "/api/(.*)", "destination": "https://<YOUR-RENDER-URL>/api/$1" },
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
4. Deploy. Vercel hosts the SPA and rewrites `/api/*` to Render.

> **Tip:** In `CORS_ORIGINS` add your Vercel domain.

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

**On Render / production** — the hosted MySQL provider gives you a connection string and a web dashboard (Aiven console, Render's own PostgreSQL/MySQL dashboard if used, etc.) to inspect the same tables.

---

## 🛠️ Troubleshooting

- **CORS errors on deployment** → ensure your Vercel domain is in `CORS_ORIGINS`.
- **Backend won't connect to DB** → verify `MYSQL_*` env vars and that the host is reachable (Render can't reach `localhost` on your machine).
- **`application.yml` holds local dev secrets** → override everything via env vars on Render; rotate/secrets-scrub before making the repo public.

---

<div align="center">

Built with ❤️ as a final-year project — secure, consent-first healthcare data for the digital era.

</div>
