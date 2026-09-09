-- ============================================================================
-- NexusHealth Database Schema V1
-- Production-grade healthcare identity platform
-- ============================================================================
-- This migration creates all 24 tables with proper foreign keys, indexes,
-- and constraints. Run via Flyway on application startup.
-- ============================================================================

-- ==============================
-- 1. CORE IDENTITY TABLES
-- ==============================

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL,
    phone VARCHAR(20),
    gender VARCHAR(20),
    date_of_birth DATE,
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_role (role),
    INDEX idx_user_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS patient_profiles (
    user_id VARCHAR(64) NOT NULL PRIMARY KEY,
    patient_health_id VARCHAR(64) NOT NULL UNIQUE,
    blood_group VARCHAR(8),
    height_cm DECIMAL(5,1),
    weight_kg DECIMAL(5,1),
    emergency_notes VARCHAR(500),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_pp_health_id (patient_health_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS emergency_contacts (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    patient_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    priority INT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_emerg_contact_patient (patient_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS emergency_profiles (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    patient_id VARCHAR(64) NOT NULL UNIQUE,
    patient_health_id VARCHAR(64) NOT NULL,
    blood_group VARCHAR(8),
    allergies JSON,
    critical_conditions JSON,
    current_medications JSON,
    emergency_notes TEXT,
    primary_physician VARCHAR(255),
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_emerg_profile_health_id (patient_health_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================
-- 2. HOSPITAL TABLES
-- ==============================

CREATE TABLE IF NOT EXISTS hospitals (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    admin_user_id VARCHAR(64),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address VARCHAR(500),
    license_number VARCHAR(100),
    total_beds INT DEFAULT 0,
    available_beds INT DEFAULT 0,
    status VARCHAR(16) NOT NULL DEFAULT 'PENDING_APPROVAL',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    extra JSON,
    FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_hospital_admin (admin_user_id),
    INDEX idx_hospital_status (status),
    INDEX idx_hospital_license (license_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    head_of_department VARCHAR(255),
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    doctor_count INT DEFAULT 0,
    bed_capacity INT DEFAULT 0,
    available_beds INT DEFAULT 0,
    description TEXT,
    emergency_contact VARCHAR(20),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uk_dept_name_hospital (hospital_id, name),
    INDEX idx_dept_hospital_id (hospital_id),
    INDEX idx_dept_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS equipment (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'OPERATIONAL',
    quantity INT NOT NULL DEFAULT 1,
    location VARCHAR(255),
    last_maintenance DATE,
    serial_number VARCHAR(100),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_equipment_hospital_id (hospital_id),
    INDEX idx_equipment_category (category),
    INDEX idx_equipment_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================
-- 3. DOCTOR TABLES
-- ==============================

CREATE TABLE IF NOT EXISTS doctors (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    user_id VARCHAR(64),
    hospital_id VARCHAR(64),
    hospital_name VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    specialization VARCHAR(100),
    medical_license_number VARCHAR(100),
    consultation_fee DECIMAL(10,2) DEFAULT 1000.00,
    status VARCHAR(32) NOT NULL DEFAULT 'APPROVED',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    extra JSON,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_doctor_user_id (user_id),
    INDEX idx_doctor_hospital_id (hospital_id),
    INDEX idx_doctor_status (status),
    INDEX idx_doctor_specialization (specialization),
    INDEX idx_doctor_license (medical_license_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS doctor_schedules (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    doctor_id VARCHAR(64) NOT NULL,
    day_of_week VARCHAR(16) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    slot_duration_min INT DEFAULT 15,
    slot_buffer_min INT DEFAULT 0,
    tokens_per_slot INT DEFAULT 1,
    daily_max_limit INT DEFAULT 50,
    time_slots JSON,
    breaks JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uk_doc_sched_day (doctor_id, day_of_week),
    INDEX idx_doc_sched_doctor (doctor_id),
    INDEX idx_doc_sched_day (day_of_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS doctor_leaves (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    doctor_id VARCHAR(64) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_full_day BOOLEAN NOT NULL DEFAULT TRUE,
    start_time VARCHAR(10),
    end_time VARCHAR(10),
    reason VARCHAR(500),
    category VARCHAR(32) NOT NULL DEFAULT 'PERSONAL',
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_doc_leave_doctor (doctor_id),
    INDEX idx_doc_leave_dates (start_date, end_date),
    INDEX idx_doc_leave_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS date_overrides (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    doctor_id VARCHAR(64) NOT NULL,
    override_date DATE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    time_slots JSON,
    breaks JSON,
    reason VARCHAR(500),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uk_date_override (doctor_id, override_date),
    INDEX idx_date_override_doctor (doctor_id),
    INDEX idx_date_override_date (override_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================
-- 4. MEDICAL RECORDS
-- ==============================

CREATE TABLE IF NOT EXISTS medical_records (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    patient_id VARCHAR(64),
    patient_health_id VARCHAR(64) NOT NULL,
    doctor_id VARCHAR(64),
    hospital_id VARCHAR(64),
    record_type VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    diagnosis VARCHAR(500),
    clinical_notes TEXT,
    description TEXT,
    record_date DATE NOT NULL,
    file_url VARCHAR(500),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    extra JSON,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_medrec_patient_id (patient_id),
    INDEX idx_medrec_health_id (patient_health_id),
    INDEX idx_medrec_doctor_id (doctor_id),
    INDEX idx_medrec_hospital_id (hospital_id),
    INDEX idx_medrec_type (record_type),
    INDEX idx_medrec_date (record_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================
-- 5. PATIENT MEDICATIONS
-- ==============================

CREATE TABLE IF NOT EXISTS patient_medications (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    patient_id VARCHAR(64) NOT NULL,
    patient_health_id VARCHAR(64) NOT NULL,
    prescription_id VARCHAR(64),
    doctor_id VARCHAR(64),
    hospital_id VARCHAR(64),
    medication_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    dosage VARCHAR(100),
    unit VARCHAR(20) NOT NULL DEFAULT 'mg',
    frequency VARCHAR(100),
    route VARCHAR(50) NOT NULL DEFAULT 'Oral',
    timing VARCHAR(100),
    start_date DATE,
    end_date DATE,
    duration VARCHAR(50),
    indication VARCHAR(255),
    instructions VARCHAR(500),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    discontinued_at DATETIME,
    discontinued_by VARCHAR(255),
    discontinuation_reason VARCHAR(500),
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (prescription_id) REFERENCES medical_records(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_med_patient_id (patient_id),
    INDEX idx_med_health_id (patient_health_id),
    INDEX idx_med_doctor_id (doctor_id),
    INDEX idx_med_hospital_id (hospital_id),
    INDEX idx_med_status (status),
    INDEX idx_med_prescription (prescription_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS medication_dose_logs (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    medication_id VARCHAR(64) NOT NULL,
    patient_id VARCHAR(64),
    patient_health_id VARCHAR(64),
    medication_name VARCHAR(255),
    scheduled_date DATE NOT NULL,
    scheduled_time VARCHAR(20) NOT NULL,
    actual_time DATETIME,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (medication_id) REFERENCES patient_medications(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_dose_med_id (medication_id),
    INDEX idx_dose_patient_id (patient_id),
    INDEX idx_dose_health_id (patient_health_id),
    INDEX idx_dose_date (scheduled_date),
    INDEX idx_dose_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================
-- 6. APPOINTMENTS
-- ==============================

CREATE TABLE IF NOT EXISTS appointments (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    patient_id VARCHAR(64) NOT NULL,
    doctor_id VARCHAR(64) NOT NULL,
    hospital_id VARCHAR(64),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    reason VARCHAR(500),
    appointment_type VARCHAR(32) NOT NULL DEFAULT 'ROUTINE_CONSULTATION',
    status VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED',
    doctor_notes VARCHAR(1000),
    cancellation_reason VARCHAR(500),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    extra JSON,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_appt_patient_id (patient_id),
    INDEX idx_appt_doctor_id (doctor_id),
    INDEX idx_appt_hospital_id (hospital_id),
    INDEX idx_appt_date (appointment_date),
    INDEX idx_appt_status (status),
    INDEX idx_appt_doctor_date (doctor_id, appointment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================
-- 7. CONSENTS
-- ==============================

CREATE TABLE IF NOT EXISTS consents (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    patient_id VARCHAR(64) NOT NULL,
    doctor_id VARCHAR(64),
    hospital_id VARCHAR(64),
    consent_type VARCHAR(32) NOT NULL DEFAULT 'TEMPORARY',
    status VARCHAR(16) NOT NULL DEFAULT 'GRANTED',
    granted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATE,
    scope JSON,
    notes VARCHAR(500),
    revoked_at DATETIME,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_consent_patient_id (patient_id),
    INDEX idx_consent_doctor_id (doctor_id),
    INDEX idx_consent_hospital_id (hospital_id),
    INDEX idx_consent_status (status),
    INDEX idx_consent_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================
-- 8. ACCESS CARDS
-- ==============================

CREATE TABLE IF NOT EXISTS access_cards (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    patient_id VARCHAR(64) NOT NULL,
    patient_health_id VARCHAR(64) NOT NULL,
    card_identifier VARCHAR(100) NOT NULL UNIQUE,
    secure_token_hash VARCHAR(255) NOT NULL,
    secure_token VARCHAR(255) UNIQUE,
    patient_name VARCHAR(255),
    lost_at DATETIME,
    revoked_at DATETIME,
    replaced_by VARCHAR(64),
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
    pin_code VARCHAR(16),
    issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activated_at DATETIME,
    qr_code_data VARCHAR(1000),
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_card_patient_id (patient_id),
    INDEX idx_card_health_id (patient_health_id),
    INDEX idx_card_status (status),
    INDEX idx_card_identifier (card_identifier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================
-- 9. ACCESS SESSIONS
-- ==============================

CREATE TABLE IF NOT EXISTS access_sessions (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    doctor_id VARCHAR(64) NOT NULL,
    doctor_name VARCHAR(255),
    hospital_id VARCHAR(64),
    hospital_name VARCHAR(255),
    patient_id VARCHAR(64) NOT NULL,
    patient_health_id VARCHAR(64),
    patient_name VARCHAR(255),
    access_method VARCHAR(64),
    access_type VARCHAR(32),
    reason VARCHAR(500),
    justification VARCHAR(500),
    appointment_id VARCHAR(64),
    access_card_id VARCHAR(64),
    emergency_session_id VARCHAR(64),
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    records_accessed JSON,
    actions_performed JSON,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (access_card_id) REFERENCES access_cards(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_access_session_doctor (doctor_id),
    INDEX idx_access_session_patient (patient_id),
    INDEX idx_access_session_hospital (hospital_id),
    INDEX idx_access_session_status (status),
    INDEX idx_access_session_health_id (patient_health_id),
    INDEX idx_access_session_started (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add FK for emergency_session_id after access_sessions is created
ALTER TABLE access_sessions
    ADD CONSTRAINT fk_access_session_emergency
    FOREIGN KEY (emergency_session_id) REFERENCES emergency_sessions(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ==============================
-- 10. EMERGENCY SESSIONS
-- ==============================

CREATE TABLE IF NOT EXISTS emergency_sessions (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    patient_id VARCHAR(64),
    patient_health_id VARCHAR(64),
    patient_name VARCHAR(255),
    doctor_id VARCHAR(64),
    doctor_name VARCHAR(255),
    hospital_id VARCHAR(64),
    hospital_name VARCHAR(255),
    identification_method VARCHAR(64),
    emergency_reason VARCHAR(500),
    custom_reason VARCHAR(500),
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    ended_at DATETIME,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    records_accessed JSON,
    actions_performed JSON,
    ip_address VARCHAR(64),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_emerg_session_patient (patient_id),
    INDEX idx_emerg_session_doctor (doctor_id),
    INDEX idx_emerg_session_hospital (hospital_id),
    INDEX idx_emerg_session_status (status),
    INDEX idx_emerg_session_health_id (patient_health_id),
    INDEX idx_emerg_session_started (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Now add the FK from access_sessions to emergency_sessions
ALTER TABLE access_sessions
    DROP FOREIGN KEY fk_access_session_emergency;

ALTER TABLE access_sessions
    ADD CONSTRAINT fk_access_session_emergency
    FOREIGN KEY (emergency_session_id) REFERENCES emergency_sessions(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ==============================
-- 11. FEEDBACK & DIET PLANS
-- ==============================

CREATE TABLE IF NOT EXISTS feedbacks (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    patient_id VARCHAR(64) NOT NULL,
    patient_name VARCHAR(255),
    doctor_id VARCHAR(64) NOT NULL,
    doctor_name VARCHAR(255),
    rating INT NOT NULL DEFAULT 5,
    comment TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_feedback_doctor_id (doctor_id),
    INDEX idx_feedback_patient_id (patient_id),
    INDEX idx_feedback_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS diet_plans (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    patient_id VARCHAR(64) NOT NULL,
    patient_health_id VARCHAR(64) NOT NULL,
    doctor_id VARCHAR(64),
    doctor_name VARCHAR(255),
    hospital_name VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    created_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    daily_calories_target VARCHAR(50),
    water_intake_liters DOUBLE,
    meals JSON,
    restricted_foods JSON,
    recommended_foods JSON,
    doctor_advice TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_diet_plan_patient_id (patient_id),
    INDEX idx_diet_plan_doctor_id (doctor_id),
    INDEX idx_diet_plan_health_id (patient_health_id),
    INDEX idx_diet_plan_created (created_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================
-- 12. AUDIT & ACCESS LOGS
-- ==============================

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actor_user_id VARCHAR(64),
    actor_name VARCHAR(255),
    actor_role VARCHAR(32),
    action VARCHAR(128) NOT NULL,
    target_patient_health_id VARCHAR(64),
    details VARCHAR(1000),
    ip_address VARCHAR(64),
    FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_audit_timestamp (timestamp),
    INDEX idx_audit_actor (actor_name),
    INDEX idx_audit_action (action),
    INDEX idx_audit_target (target_patient_health_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS record_access_logs (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    doctor_id VARCHAR(64),
    doctor_name VARCHAR(255),
    patient_id VARCHAR(64),
    patient_health_id VARCHAR(64),
    patient_name VARCHAR(255),
    hospital_id VARCHAR(64),
    hospital_name VARCHAR(255),
    access_method VARCHAR(64),
    access_status VARCHAR(32),
    access_type VARCHAR(64),
    emergency_flag BOOLEAN DEFAULT FALSE,
    reason VARCHAR(500),
    denial_reason VARCHAR(64),
    records_accessed JSON,
    verification_method VARCHAR(64),
    verification_status VARCHAR(32),
    session_id VARCHAR(64),
    appointment_id VARCHAR(64),
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(64),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (session_id) REFERENCES access_sessions(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_ral_doctor_id (doctor_id),
    INDEX idx_ral_patient_id (patient_id),
    INDEX idx_ral_health_id (patient_health_id),
    INDEX idx_ral_hospital_id (hospital_id),
    INDEX idx_ral_session_id (session_id),
    INDEX idx_ral_appointment_id (appointment_id),
    INDEX idx_ral_timestamp (timestamp),
    INDEX idx_ral_access_status (access_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS card_access_logs (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    card_id VARCHAR(64),
    patient_id VARCHAR(64),
    patient_health_id VARCHAR(64),
    patient_name VARCHAR(255),
    actor_id VARCHAR(64),
    actor_name VARCHAR(255),
    actor_role VARCHAR(32),
    hospital_id VARCHAR(64),
    hospital_name VARCHAR(255),
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    access_type VARCHAR(64),
    authorization_status VARCHAR(64),
    records_accessed JSON,
    reason VARCHAR(500),
    ip_address VARCHAR(64),
    FOREIGN KEY (card_id) REFERENCES access_cards(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_cal_card_id (card_id),
    INDEX idx_cal_patient_id (patient_id),
    INDEX idx_cal_health_id (patient_health_id),
    INDEX idx_cal_actor_id (actor_id),
    INDEX idx_cal_hospital_id (hospital_id),
    INDEX idx_cal_timestamp (timestamp),
    INDEX idx_cal_access_type (access_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
