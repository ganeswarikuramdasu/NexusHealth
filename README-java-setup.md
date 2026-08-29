# Running the frontend against the new Spring Boot backend

The backend is being migrated from Node/Express to Java/Spring Boot in
`backend-java/` (see `backend-java/MIGRATION_STATUS.md` for what's ported
so far). The old Node backend in `backend/` still works and still has every
endpoint - use it for anything not yet ported to Java.

## 1. Database connection

Already configured with defaults matching this project's existing MySQL
setup (same database your Node backend used - no data migration needed).
Nothing to do here unless you're running against a different database or
different machine, in which case set these environment variables to
override the defaults:

```
MYSQL_HOST, MYSQL_PORT, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD
SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD   (optional - OTP emails)
CORS_ORIGINS   (defaults to http://localhost:5173,http://localhost:3000)
```

## 2. Run the Spring Boot backend

Requires JDK 17+ and Maven (or use your IDE's built-in Maven support -
IntelliJ/VS Code will pick up `pom.xml` automatically).

```bash
cd backend-java
mvn spring-boot:run
```

It starts on **http://localhost:8080**. On first run, Hibernate creates any
tables from Phase 1 (`users`, `patient_profiles`, `access_cards`,
`audit_logs`) if they don't already exist - your existing rows are read as-is.

## 3. Run the frontend (now standalone, since Java doesn't serve it)

```bash
npm run dev:frontend
```

This starts Vite on **http://localhost:5173**. `vite.config.ts` now proxies
`/api/*` requests to `http://localhost:8080` (Spring Boot) - the frontend
code itself calls the same relative paths as always
(`fetch("/api/auth/login")`), nothing there changed.

## 4. Anything not yet in Java

Endpoints not listed as "Done" in `backend-java/MIGRATION_STATUS.md` are
still only implemented in the old Node backend. If you need those working
today, run the old all-in-one server instead (`npm run dev`, port 3000) and
point `VITE_API_PROXY_TARGET=http://localhost:3000` - or just keep using
`npm run dev` as before until the next migration phase lands.
