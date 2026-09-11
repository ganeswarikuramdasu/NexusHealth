# Session Summary

## Objective
- Fix all four doctor-module bugs in the NexusHealth Phase 6 Java migration (Spring Boot 3.3.4 backend + React 19/Vite frontend):
  1. Dashboard patient record lookup by ID — user enters a valid health ID and gets "Patient Not Found" + "An unexpected server error occurred. Please try again."
  2. Patient Access Center — accessing patient records via health ID or access card always shows "An unexpected server error occurred. Please try again." (should show records if access granted, else an "access permission is not given" style message).
  3. Patient access card method must accept ONLY access-card-related identifiers (card id / cardIdentifier / secureToken) — never raw patient IDs or health IDs.
  4. Emergency Access & Break Glass — identifying a patient works (name shows) but authorize + see-records fails with the generic 500 message.
- Expected behavior everywhere: if access permission/consent/card/appointment exists → show records; otherwise → a clear "access permission is not given" (or similar) message. NEVER the generic "An unexpected server error occurred. Please try again."
- After all fixes: build/verify then commit and push to the user's GitHub repo (used previously: user's own repo).

## Important Details
- Repo root `C:\Users\ganes\Downloads\nexushealth-java-migration-phase6` (git repo). Monorepo: `backend-java/` (Java 17, Spring Boot 3.3.4, MySQL, package `com.nexushealth` — NOT `com.nxushealth`) + `frontend/` (React 19, Vite, TypeScript, Tailwind). Backend on :8080, dev server on :5173.
- "An unexpected server error occurred. Please try again." is `GlobalExceptionHandler.handleGeneric` (HTTP 500) → the failing paths throw an UNHANDLED runtime exception, NOT an `ApiException`. Use `ApiException.badRequest/notFound/unauthorized/forbidden` for business-rule failures; `handleApiException` turns them into `{success:false, message}` with proper status.
- Frontend `safeFetchJson`/`parseResponseSafe` (frontend/utils/api.ts) never throw — they return the JSON error body or a fallback. So "unexpected server error" text comes from the backend 500 body (GlobalExceptionHandler), which the frontend then displays.
- Dashboard lookup flow: `DoctorView.tsx` `handlePatientLookup` → `POST /api/doctor/access-records` with `{doctorId, doctorName, patientHealthId}` → `DoctorService.accessPatientRecords()`. Frontend checks `data.success && data.patient`, else shows `data?.message` or the "Patient Not Found..." fallback.
- Patient Access Center flow: `DoctorPatientAccessCenter.tsx` `startSessionAndOpenRecord` → `POST /api/doctor/access-sessions` with `{doctorId, patientHealthId, accessMethod, reason, justification, appointmentId, accessCardId}` → `DoctorService.createAccessSession()`. Frontend requires `data.granted === true`, builds session/profile/records, else throws with `data?.message`.
- Emergency flow: `EmergencyAccessDoctorView.tsx` → `/api/emergency/identify` works (patient name shown); then `POST /api/doctor/access-sessions` with `accessMethod: "EMERGENCY_BREAK_GLASS"` fails.
- **"id must be 16" is a FALSE/static frontend hint**: `DoctorView.tsx:501` shows `Enter a valid 16-character Global Unique Health ID...` — it is purely cosmetic placeholder text, NOT real validation. Backend `User.id` is `@Column(length = 64)`. Real-doctor/patient IDs are `doc_...`/`u_...`/`mhid_...` style and NOT 16 chars.
- **Strongest 500 root-cause hypothesis**: `RecordAccessLogService.add()` and `AuditLogService.log()` swallow exceptions from `repository.save()` (best-effort logging). But the enclosing methods (`accessPatientRecords`, `createAccessSession`, EmergencyService flows) are `@Transactional`; a failed JPA flush marks the tx rollback-only, and Spring then throws `UnexpectedRollbackException`/`TransactionSystemException` at COMMIT time — which the inner catch cannot swallow → generic 500. Confirmed the swallow pattern exists; need to confirm `@Transactional` on the failing methods and then fix (e.g., `Propagation.REQUIRES_NEW` on the logger service, or ensure log fields never violate DB/constraints).
- `RecordAccessLog`/`AuditLog` entities use the fragile pattern `@ManyToOne fetch=LAZY` + mirrored `@Column(insertable=false, updatable=false)` string FKs (e.g., `doctor_id`, `actor_user_id`). If the relationship reference is null, the FK column is written as NULL by the persisted relationship, not by the mirrored field.
- `EmergencySessionStore` is purely in-memory (ConcurrentHashMap/CopyOnWriteArrayList) — emergency sessions do NOT persist to DB, so session-creation 500s are not caused by missing DB tables for sessions.
- `AppointmentRepository.search(...)` and `MedicalRecordRepository.findForPatient(...)` are NULL-tolerant JPQL (`:param IS NULL OR ...`) — not the 500 source. `ConsentRepository.findFirstByPatientIdAndDoctorIdOrderByGrantedAtDesc` + `findActiveForPatient` used for the consent gate.
- `AccessCardRepository.findAllByAnyIdentifier(token)` matches `secureToken OR patientHealthId OR cardIdentifier` — for task 3 it must only be allowed to match card identifiers (cardIdentifier / secureToken), never treat arbitrary input (like a raw health ID / patient ID) as a valid card credential.
- Relevant DB tables: access_cards, consents, appointments, medical_records, access_sessions (persisted? verify), record_access_logs, audit_logs. `ddl-auto: update` creates tables.

## Work State
### Completed
- Explored frontend + backend structure; mapped the 4 bug flows to exact endpoints/services/controllers:
  - Dashboard: `POST /api/doctor/access-records` → `DoctorService.accessPatientRecords()` (DoctorController + DoctorView.tsx)
  - Patient Access Center: `POST /api/doctor/access-sessions` → `DoctorService.createAccessSession()` (DoctorController + DoctorPatientAccessCenter.tsx)
  - Access-card method: `createAccessSession` + `AccessCardRepository.findAllByAnyIdentifier`
  - Emergency/Break-Glass: `EmergencyController.identify` (works) + `DoctorService.createAccessSession` with `EMERGENCY_BREAK_GLASS` (fails)
- Read files (full or partial): DoctorController, DoctorService (partial), EmergencyController, EmergencyService (partial), PatientController, PatientService, GlobalExceptionHandler, ApiResponse, ApiException, PatientResolver, DoctorRequests, AccessCard, AccessCardRepository, PatientProfile, AccessSession, AccessSessionRepository, RecordAccessLog, RecordAccessLogService, User, DoctorView.tsx (partial), DoctorPatientAccessCenter.tsx (partial), EmergencyAccessDoctorView.tsx (partial).
- In this segment additionally read/verified: `AuditLogService.java` (best-effort `log()` catch), `AuditLog.java` (mirrored-FK entity pattern), `EmergencySessionStore.java` (in-memory sessions), `frontend/utils/api.ts` (no-throw fetch utils), `AppointmentRepository.java`, `MedicalRecordRepository.java`, `ConsentRepository.java` (NULL-tolerant queries).
- Confirmed "id must be 16" is a static frontend hint (DoctorView.tsx:501) with no enforcing logic.
- Identified broken-mirrored-FK entity design and swallowed-exception + @Transactional rollback-only pattern as the primary 500 suspect.

### Completed
- ALL FOUR BUGS FIXED, committed in `48ffd02`, and pushed to origin/main:
  1. Dashboard lookup → `POST /api/doctor/access-records` returns granted records (consent) or clean 403/404.
  2. Patient Access Center → `createAccessSession` returns granted session + records, or clean 403 "Access permission is not given..." / 404 "Patient record not found".
  3. Card method → patient resolved ONLY via `AccessCardRepository.findAllByCardIdentifier` (cardIdentifier/secureToken); a raw health ID used as a card credential → 403 "not an active patient access card".
  4. Emergency/Break-Glass → identify + `EMERGENCY_BREAK_GLASS` session both work (HTTP 200 granted), no generic 500.
- Backend fixes applied: `ApiException.badRequest/notFound/forbidden` for all business-rule failures (never proceed on unresolved/null data); `@Transactional(REQUIRES_NEW)` on `RecordAccessLogService.add` and `AuditLogService.log` so best-effort logs can no longer poison an outer tx; `null` sessionId passed to the access-session success log; card-only token resolution for `PATIENT_ACCESS_CARD`.
- Frontend polish done: the misleading "16-character Global Unique Health ID" hint replaced with accurate consent/appointment/break-glass guidance (DoctorView.tsx:501); backend `message` surfaces in all error boxes.
- Verified end-to-end against a fresh local `nexushealth` DB — 18 replay tests mirroring exact frontend payloads (health-id, card id/secureToken, card-with-health-id→403, appointment, break-glass, biometric, unknown patient→404, missing doctorId→400, session action/end, medications fetch) all pass with zero backend stack traces.
- Builds verified: `mvn -DskipTests package` (backend), `npm run lint` (tsc --noEmit), `npm run build` (vite) — all clean.
- Working tree clean except this file; repo `main` in sync with `origin/main` at `48ffd02`.

### Blocked
- (none)

## Next Move
- None — all four doctor-module bugs are fixed, verified, committed (`48ffd02`) and pushed to `https://github.com/ganeswarikuramdasu/NexusHealth.git`.
- Remaining note for the user: the persistent 500s were environmental (stale DB schema / old backend build). To apply the fix: `git pull`, stop the old app, drop/recreate the local `nexushealth` DB (or let `ddl-auto: update` rebuild it), and restart the backend from the latest build.

## Relevant Files
- `backend-java/src/main/java/com/nexushealth/service/DoctorService.java` — core of tasks 1–3 (`accessPatientRecords`, `createAccessSession`, card/consent logic).
- `backend-java/src/main/java/com/nexushealth/service/EmergencyService.java` — task 4 (`identify`, start-session/break-glass, records).
- `backend-java/src/main/java/com/nexushealth/service/RecordAccessLogService.java` — swallowed-exception log save (500 candidate); possibly needs REQUIRES_NEW.
- `backend-java/src/main/java/com/nexushealth/service/AuditLogService.java` (line 37) — best-effort log (same tx-poison risk if outer @Transactional).
- `backend-java/src/main/java/com/nexushealth/service/PatientResolver.java` — patient resolution by id / health id / email (null returns must be handled).
- `backend-java/src/main/java/com/nexushealth/repository/AccessCardRepository.java` — `findAllByAnyIdentifier` must be restricted to card identifiers for task 3.
- `backend-java/src/main/java/com/nexushealth/entity/RecordAccessLog.java` / `AuditLog.java` / `AccessSession.java` — fragile mirrored-FK entity pattern.
- `backend-java/src/main/java/com/nexushealth/common/GlobalExceptionHandler.java` — source of the generic 500 message; `ApiException` handler is correct path.
- `frontend/components/DoctorView.tsx` — dashboard lookup UI; line 501 has the false "16-character" hint; `handlePatientLookup` messages.
- `frontend/components/DoctorPatientAccessCenter.tsx` — access-center UI (health ID / access card / appointment flows).
- `frontend/components/EmergencyAccessDoctorView.tsx` — emergency/break-glass UI (identify works, authorize fails).
- `frontend/utils/api.ts` — safe fetch wrappers (never throw; return error body/fallback).
- `backend-java/src/main/java/com/nexushealth/repository/{AppointmentRepository,MedicalRecordRepository,ConsentRepository}.java` — NULL-tolerant queries used by the flows.
## Current Live State (2026-09-11)
- All four doctor-module bugs AND all remaining latent 500 paths are fixed and pushed (commits 48ffd02, 305ed35). Latest: 305ed35 "harden doctor access flows against remaining 500s".
- Fixes in 305ed35: new CardAccessLogService (best-effort REQUIRES_NEW card-log tx - card-scan logging can never roll back a grant); card credentials rejected with 403 BEFORE token can be misread as a patient ID (404); consent/appointment matching uses the resolved Doctor entity id so userId/email login forms grant correctly; EmergencyService.identifyByCard null-guard; AppointmentService reschedule date parse -> 400 + weeklySchedule instanceof guard; GlobalExceptionHandler parses DateTimeParseException/IllegalArgumentException -> 400; frontend reads data.message (not data.error) in CompletePatientClinicalRecord/PatientView and ends emergency sessions via /api/doctor/access-sessions/{id}/end.
- Verified: 20-test API suite on a live MySQL nexushealth DB - granted flows returns 200, denied -> 403 clean, unknown patient -> 404, bad/missing input -> 400, card flow 403 for non-card tokens, no backend stack traces. Backend mvn -DskipTests package exit 0; frontend 
pm run lint + 
pm run build clean.
- LOCAL DEMO ACCOUNTS (seeded MySQL, BCrypt cost-12 hashes; login sends ole field):
  - Dr. Anand Rao: doctorA@nexus.in / Doctor@123 (DOCTOR). Patient Ananya Sharma: ananya@nexus.in / Patient@123 (PATIENT). Dr. No Perm (no consent): doctorB@nexus.in / Doctor@123.
  - demo data: health ID NH-IND-2026-88392014; access card NX-CARD-88392014-01 / NXAC-TOKEN-1 ACTIVE; consent cons_pat u_pat->docA GRANTED to 2026-10-11; appointment apt_pat_test ACCEPTED with extra patient JSON.
- IMPORTANT: demo users/card/consent/appointment live ONLY in the local DB (schema migration V1 is tables-only, no seed rows). Dropping the DB wipes the demo accounts; re-seed manually. Passwords used to be 4-char stubs (broken login) - fixed to real BCrypt.
- Both dev servers currently running: backend jar target/nexushealth-backend.jar on 8080 (env MYSQL_* overrides); frontend vite on 127.0.0.1:5173 (IPv4 only; vite's ::1-only binding is unreachable on this box - launch with 
px vite --host 127.0.0.1 --port 5173 --strictPort).
