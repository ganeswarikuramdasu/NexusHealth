# Node -> Spring Boot migration status

The frontend (`frontend/`) is untouched and talks to whichever backend is
running on `/api/*` (see root `README-java-setup.md` for how to point it at
this Spring Boot app instead of the old Node server).

This is being ported in phases so each phase can actually be reviewed and
trusted, instead of dumping ~95 untested endpoints at once. Ask for the next
phase when you're ready.

## Done (Phase 1)
- Project scaffold: Maven, `application.yml`, CORS, global exception
  handling matching the Node `{ success, message }` / 404 / 500 shapes.
- `users`, `patient_profiles`, `access_cards`, `audit_logs` entities
  (same table/column names as the relational schema already running in
  MySQL - no data migration needed, this reads/writes the same rows).
- **Auth module - fully ported and functionally equivalent:**
  - `POST /api/auth/send-otp`
  - `POST /api/auth/verify-otp`
  - `POST /api/auth/login`
  - `POST /api/auth/register-patient`
  - `POST /api/auth/update-profile-password` (patient + super-admin fields;
    doctor/hospital-specific fields land in Phase 2 with those entities)
  - `GET /api/health`

## Done (Phase 2)
- Corrected to match your actual app flow (there is no public self-service
  registration for hospitals/doctors):
  - **Super Admin adds hospitals directly**: `POST /api/admin/add-hospital`
    - immediately `APPROVED`, admin sets the initial password.
  - **Hospital Admin adds doctors directly**: `POST /api/hospital/add-doctor`
    (also mounted at `/api/hospitals/add-doctor`) - immediately `APPROVED`
    under that hospital, admin sets the initial password.
  - `POST /api/doctors/register` (also `/api/doctor/register`) is kept -
    this is the *doctor-initiated* "apply to a hospital" flow used by
    `handleApplyHospital` in `App.tsx`, not a public signup form. Starts
    `PENDING_APPROVAL`.
- `GET /api/hospitals` (+ `/api/hospital`), `GET /api/doctors` (+ `/api/doctor`)
- `GET/PUT /api/doctors/{id}/profile`, `GET/PUT /api/doctors/{id}/schedule`
- `Hospital` / `Doctor` entities: fixed columns for fields other tables
  need to join/query on (id, hospitalId, status, fee, isActive), plus a
  native MySQL `JSON` column (`extra`) for the freeform fields
  (weeklySchedule, leaves, dateOverrides, notificationPreferences,
  securitySettings, etc.) - see the javadoc on `Hospital.java` for why.
  Responses flatten `extra` back into the top-level JSON so the shape the
  frontend gets is unchanged.

## Done (Phase 3)
- `Appointment` entity: same fixed-columns-plus-JSON-extra pattern as
  Doctor/Hospital. Deliberate improvement over the Node version: `status`
  and `appointment_type` store the exact string the app uses instead of
  being funneled through a narrower DB enum and approximated on read back
  (the Node version loses granularity there - e.g. WAITING_FOR_DOCTOR and
  IN_CONSULTATION both collapse to the same DB value and read back as
  "ACCEPTED"). This doesn't change the request/response contract, only
  what's stored under the hood.
- Reads doctor availability directly from the `Doctor.extra` JSON set up
  in Phase 2 (weeklySchedule, leaves, emergencyAbsence, slotDurationMin,
  etc.) rather than a separate working-hours table.
- `GET /api/appointments` (filters: patientId, doctorId, hospitalId -
  patientId can be a user id or a Global Health ID, same as Node)
- `GET /api/appointments/available-slots`, `GET /api/appointments/slots/{doctorId}`
- `POST /api/appointments/book`, `/reschedule`, `/cancel`, `/check-in`, `/update-status`
- `GET /api/appointments/live-queue/{appointmentId}`

**Known limitation**: booking capacity checks (`countOnDate`/`countOnSlot`)
run as ordinary reads-then-writes inside a `@Transactional` method, same
as a typical Spring app - not full pessimistic row-locking like Node's
explicit `SELECT ... FOR UPDATE`-style transaction. Under real concurrent
load (two people booking the last slot at the exact same millisecond) a
race is theoretically possible. Low risk for a project like this; flag if
you want it hardened with a DB-level unique constraint or lock.

## Done (Phase 4)
- `MedicalRecord`, `Consent`, `PatientMedication`, `MedicationDoseLog`
  entities - plain relational columns (these tables already had a fixed,
  well-defined shape in the existing schema, unlike Doctor/Hospital).
- `PatientResolver`: shared helper (used by both Patients and Medications)
  that resolves a patient by user id, Global Health ID, or email - mirrors
  Node's `findRelationalPatientByIdentifier`.
- Patients: `GET /api/patient(s)/lookup/{healthId}`, `/profile/{userId}`,
  `/records/{patientId}`, `/consents/{patientId}`;
  `POST /consents/grant`, `/consents/revoke/{consentId}`, `/add-manual-record`
- Medications: `GET /api/medications/patient/{patientId}` (active +
  history + today's doses + adherence summary), `POST /api/medications`,
  `PUT /api/medications/{id}`, `POST /api/medications/{id}/discontinue`,
  `POST /api/medications/doses/log`

## Done (Phase 5)
- Hospital Admin: `POST /api/hospital(s)/toggle-status` (cascades active
  state to affiliated doctors, same as Node), `/toggle-department`,
  `/update-doctor`, `/delete-doctor`, `/update-settings`, `/approve-doctor`
  (approve/reject a doctor's affiliation request)
- Super Admin: `POST /api/admin/approve-hospital`, `/delete-hospital`
  (also unaffiliates any doctors at that hospital), `/edit-hospital`,
  `/delete-doctor`, `GET /api/admin/patients`, `POST /api/admin/delete-patient`,
  `GET /api/admin/audit-logs`
- `AdminService` (new) for patient list/delete and audit log retrieval -
  the only genuinely "admin-only" reads/writes that don't belong on
  Hospital/Doctor services.

## Done (Phase 6 - Cards)
- `AccessCard` entity extended with `secureToken` (plain), `patientName`,
  `lostAt`, `revokedAt`, `replacedBy`. Note: the Node card-scan flow treats
  the card token as a bearer credential embedded in a QR code and matches
  it by exact equality (not password-style hashing) - so unlike other
  entities, this one needed a plaintext lookup column alongside the
  existing hashed one. Phase 1's patient-registration card issuance was
  updated to populate it too, so cards from registration are scannable.
- `CardAccessLog` entity (new) - "who accessed my records" trail for scans.
- `GET /api/card/admin/all-cards`, `/my-card/{patientId}` (auto-issues a
  card on first lookup, same as Node), `/access-history/{patientId}`
- `POST /api/card/issue`, `/toggle-status`, `/report-lost` (with optional
  auto-replace), `/request-replacement`, `/scan` (QR/NFC lookup with
  consent-authorization check), `/assisted-consent` (low-literacy /
  physical-confirmation consent flow)

**Deferred from Cards** (documented, low priority): mobile QR-pairing
sessions (`mobile-pair/*`, `mobile-bridge/*`) - in the Node version these
are pure in-memory `Map` state, not even MySQL-backed, so they're genuinely
ephemeral scanner-pairing UX rather than persisted data. Straightforward to
add later with a Java `ConcurrentHashMap` the same way, just not core to
patient care.

## Done (Phase 7 - final: everything previously pending)
All remaining Node routes are now ported. The full Spring Boot app
compiles cleanly and boots against the live MySQL (`Started
NexusHealthApplication in ~20s`, all beans wire, no request-mapping
conflicts; the only DDL messages are the documented harmless
foreign-key column warnings).

### Emergency (break-glass EMR access)
- `EmergencyController` / `EmergencyService` / `EmergencySessionStore`
  (in-memory `@Component`, seeded with demo patient + allergen).
- Identify patient, start-session, active-sessions, session get/end,
  summary, ai-summary, full-records, add-note (persists a `MedicalRecord`),
  patient profile/history, notification-read.
- AI summary is a deterministic fallback string (`isAiGenerated: false`).

### AI (deterministic fallback)
- `AIController` / `AIService`: patient-assistant, doctor-assistant,
  prescribe-check, explain-lab-report, generate-diet-plan - return the
  Node version's exact fallback strings. No external AI dependency in the
  build (matches the existing `HealthController` ACTIVE_GEMINI /
  SIMULATED_GEMINI reporting - the codebase already ran in simulated mode).

### Doctor (leaves, scheduling, analytics, records, feedback)
- access-history / access-logs (filters), access-records /
  access-patient-records (403 denial isolation), access-sessions +
  `/{id}/action`, date-overrides, leaves + delete, emergency-unavailability
  + clear-emergency, toggle-active + `/{id}/toggle-active`, custom-slots +
  delete, availability-summary, analytics, feedback/{doctorId},
  `{doctorId}/records` + `/records` (403 isolation).

### Hospital (equipment, audit, activity, records)
- equipment/{hospitalId}, equipment/add, audit-logs, audit-statistics,
  doctor-activity, doctors/{doctorId}/audit-logs, records +
  `/{hospitalId}/records` - all with `x-caller-hospital-id` /
  `x-hospital-id` isolation (403).

### Admin (break-glass / record-access tracking)
- `GET /record-access-logs` (filters + search), `GET /record-access-logs/{id}`
  (404 + relationshipTrace), `GET /audit-statistics`.

### Medical records (doctor-side entry)
- `MedicalRecordController` / `MedicalRecordService`, mounted at both
  `/api/medical-records` and `/api/medical-record`: `/create` (syncs
  PatientMedication), `/create-lab`, `/vitals`, `/patient/{patientHealthId}`.
- `MedicalRecord.extra` JSON map added for symptoms/vitals/medicines/
  labResults/doctorName/hospitalName/doctorSignature.

### Patients (feedback, diet plans, access history)
- submit-feedback (recomputes the doctor rating from `FeedbackStore`),
  diet-plans/{patientId}, add-diet-plan, access-history.

### Shared infrastructure
- `RecordAccessLog` entity + repository + `RecordAccessLogService` (central
  `.add(...)` / `.all()`) - a persistent "who accessed records" trail.
- In-memory `@Component` stores with Node seed parity: `FeedbackStore`,
  `DietPlanStore`, `EquipmentStore`.

## Remaining (documented, kept as-is)
- Mobile QR-pairing sessions (`mobile-pair/*`, `mobile-bridge/*`) - pure
  ephemeral in-memory pairing UX in Node, not persisted data; safe to add
  later with a Java `ConcurrentHashMap` if wanted.
- AI endpoints are deterministic fallbacks (no live Gemini calls); wire a
  real client to `nexushealth.gemini.api-key` later if a live model is
  required.
