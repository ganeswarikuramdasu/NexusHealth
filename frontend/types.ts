export type UserRole = "PATIENT" | "DOCTOR" | "HOSPITAL_ADMIN" | "SUPER_ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
}

export interface PatientProfile {
  id: string;
  userId: string;
  globalHealthId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gender: string;
  bloodGroup: string;
  dob: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies?: string[];
  chronicConditions?: string[];
}

export interface ScheduleTimeSlot {
  id: string;
  slotName: string; // e.g. "Morning Shift", "Evening Shift"
  startTime: string; // e.g. "09:00 AM" or "09:00"
  endTime: string; // e.g. "01:00 PM" or "13:00"
  tokensPerSlot?: number;
}

export interface ScheduleBreak {
  id: string;
  breakName: string; // e.g. "Lunch Break"
  startTime: string; // "13:00" or "01:00 PM"
  endTime: string; // "14:00" or "02:00 PM"
}

export interface DaySchedule {
  active: boolean;
  slotDurationMin: number; // 10, 15, 20, 30, 45, 60
  slotBufferMin: number; // 0, 5, 10
  tokensPerSlot: number; // Max patients per slot
  dailyMaxLimit: number; // Max daily appointments
  timeSlots: ScheduleTimeSlot[];
  breaks: ScheduleBreak[];
}

export interface DateOverride {
  id: string;
  date: string; // YYYY-MM-DD
  active: boolean;
  timeSlots: ScheduleTimeSlot[];
  breaks: ScheduleBreak[];
  reason?: string;
}

export interface DoctorLeave {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  isFullDay: boolean;
  startTime?: string;
  endTime?: string;
  reason: string;
  category: "PERSONAL" | "MEDICAL" | "CONFERENCE" | "VACATION" | "TRAINING" | "OTHER";
  status: "APPROVED" | "PENDING" | "ACTIVE";
  createdAt: string;
}

export interface EmergencyAbsence {
  active: boolean;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
  affectedAptsCount?: number;
  actionTaken?: "CANCEL" | "RESCHEDULE" | "KEEP" | "CONTACT_ADMIN";
  createdAt?: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  whatsappNotifications: boolean;
  appointmentReminders: boolean;
  emergencyAlerts: boolean;
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  autoLogoutMins: number;
  lastPasswordChange: string;
}

export type DoctorAvailabilityStatus = 
  | "AVAILABLE" 
  | "UNAVAILABLE" 
  | "ON_LEAVE" 
  | "EMERGENCY_UNAVAILABLE" 
  | "HOSPITAL_SUSPENDED" 
  | "ACCOUNT_INACTIVE";

export interface DoctorProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  dob?: string;
  gender?: string;
  profilePhoto?: string;
  bio?: string;
  specialization: string;
  qualification?: string;
  department?: string;
  designation?: string;
  consultationType?: "IN_PERSON";
  licenseNumber: string;
  experienceYears: number;
  hospitalId: string | null;
  hospitalName: string | null;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "SUSPENDED";
  isActive?: boolean;
  fee: number;
  rating: number;
  workingDays: string[];
  slotDurationMin: number;
  slotBufferMin?: number;
  tokensPerSlot?: number;
  dailyMaxAppointments?: number;
  bookingHorizonDays?: number;
  bookingCutoffMins?: number;
  weeklySchedule?: Record<string, DaySchedule>;
  scheduleEffectiveDate?: string;
  dateOverrides?: DateOverride[];
  leaves?: DoctorLeave[];
  emergencyAbsence?: EmergencyAbsence | null;
  availabilityStatus?: DoctorAvailabilityStatus;
  notificationPreferences?: NotificationPreferences;
  securitySettings?: SecuritySettings;
  morningShiftCapacity?: number;
  afternoonShiftCapacity?: number;
}

export interface AvailableSlot {
  timeStr: string; // e.g. "09:00 AM"
  startTime24: string; // "09:00"
  endTime24: string; // "09:15"
  displayWindow: string; // "09:00 AM - 09:15 AM"
  status: "AVAILABLE" | "FULL" | "BREAK" | "LEAVE" | "EMERGENCY_BLOCKED" | "PAST" | "DAILY_MAX_REACHED";
  bookedCount: number;
  maxCapacity: number;
  tokensLeft: number;
}

export interface DoctorFeedback {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface HospitalProfile {
  id: string;
  userId: string;
  name: string;
  licenseNumber: string;
  address: string;
  phone: string;
  email: string;
  departments: string[];
  totalBeds: number;
  availableBeds: number;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "SUSPENDED";
}

export interface ConsentGrant {
  id: string;
  patientId: string;
  patientHealthId?: string;
  doctorId: string;
  doctorName: string;
  hospitalName: string;
  consentType: "TEMPORARY" | "APPOINTMENT_BASED" | "EMERGENCY" | "PERMANENT";
  allowedCategories: string[];
  validUntil: string;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
  grantedAt: string;
}

export interface Appointment {
  id: string;
  tokenNumber: string;
  patientId: string;
  patientName: string;
  patientHealthId: string;
  doctorId: string;
  doctorName: string;
  hospitalId: string | null;
  hospitalName: string | null;
  specialization: string;
  appointmentDate: string;
  slotTime: string;
  status: "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED" | "CANCELLED" | "NO_SHOW" | "REBOOK_REQUESTED";
  symptoms: string;
  priority: "NORMAL" | "URGENT" | "EMERGENCY";
  createdAt: string;
}

export interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions: string;
}

export interface LabResult {
  testName: string;
  resultValue: string;
  normalRange: string;
  status: "NORMAL" | "ELEVATED" | "HIGH" | "OPTIMAL" | "SLIGHTLY HIGH" | "CRITICAL";
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  patientHealthId: string;
  doctorId: string;
  doctorName: string;
  hospitalName: string;
  date: string;
  recordType: "PRESCRIPTION" | "LAB_REPORT" | "IMAGING_SCAN" | "DIAGNOSIS" | "SURGERY_NOTE" | "VACCINATION";
  title: string;
  diagnosis: string;
  symptoms: string[];
  vitals?: {
    bp?: string;
    heartRate?: string;
    spo2?: string;
    temp?: string;
  };
  medicines?: Medicine[];
  labResults?: LabResult[];
  attachmentUrl?: string;
  imagingCategory?: string;
  doctorNotes: string;
  doctorSignature: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetPatientHealthId: string;
  details: string;
  ipAddress: string;
}

export interface BreakGlassLog {
  id: string;
  timestamp: string;
  doctorName: string;
  doctorLicense: string;
  patientHealthId: string;
  reason: string;
  status: string;
}

export interface DietPlan {
  id: string;
  patientId: string;
  patientHealthId: string;
  doctorId?: string;
  doctorName?: string;
  hospitalName?: string;
  title: string;
  category: string;
  createdDate: string;
  dailyCaloriesTarget: string;
  waterIntakeLiters: number;
  meals: {
    breakfast: string;
    lunch: string;
    eveningSnack: string;
    dinner: string;
  };
  restrictedFoods: string[];
  recommendedFoods: string[];
  doctorAdvice: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  status: "OPERATIONAL" | "MAINTENANCE" | "DEFECTIVE";
  quantity: number;
  location: string;
  lastMaintenance: string;
  serialNumber: string;
}

export interface DepartmentInfo {
  name: string;
  headOfDepartment: string;
  status: "ACTIVE" | "INACTIVE";
  doctorCount: number;
  bedCapacity: number;
  availableBeds: number;
  description: string;
  emergencyContact: string;
}

export interface JavaCodeFile {
  service: string;
  fileName: string;
  filePath: string;
  code: string;
  description: string;
}

export type CardStatus =
  | "NOT_ISSUED"
  | "ACTIVE"
  | "TEMPORARILY_BLOCKED"
  | "LOST"
  | "REPLACEMENT_REQUESTED"
  | "REVOKED"
  | "EXPIRED";

export interface AccessCard {
  id: string;
  patientId: string;
  patientHealthId: string;
  patientName: string;
  cardIdentifier: string;
  secureToken: string;
  status: CardStatus;
  issuedAt: string;
  activatedAt?: string;
  revokedAt?: string;
  lostAt?: string;
  replacedBy?: string;
  pinCode?: string;
  qrCodeData: string;
}

export interface CardAccessLog {
  id: string;
  cardId: string;
  patientId: string;
  patientHealthId: string;
  patientName: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  hospitalId: string;
  hospitalName: string;
  timestamp: string;
  accessType: string;
  authorizationStatus: "AUTHORIZED" | "REQUIRES_PATIENT_CONSENT" | "DENIED_CARD_LOST" | "DENIED_CARD_BLOCKED" | "DENIED_UNAUTHORIZED";
  recordsAccessed: string[];
  reason: string;
  ipAddress?: string;
}

export interface CardScanResult {
  success: boolean;
  authorizationStatus?: "AUTHORIZED" | "REQUIRES_PATIENT_CONSENT" | "DENIED_CARD_LOST" | "DENIED_CARD_BLOCKED" | "DENIED_UNAUTHORIZED";
  card?: AccessCard;
  patient?: any;
  patientBasic?: {
    name: string;
    globalHealthId: string;
    bloodGroup: string;
    gender: string;
    emergencyContactPhone: string;
  };
  records?: MedicalRecord[];
  consents?: ConsentGrant[];
  appointment?: Appointment;
  message?: string;
  code?: string;
}

export type EmergencyIdentificationMethod =
  | "GLOBAL_HEALTH_ID"
  | "ACCESS_CARD"
  | "PATIENT_NAME"
  | "FINGERPRINT"
  | "FACE";

export type EmergencySessionStatus = "ACTIVE" | "EXPIRED" | "ENDED";

export interface EmergencyAccessSession {
  id: string;
  patientId: string;
  patientHealthId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  hospitalId: string;
  hospitalName: string;
  identificationMethod: EmergencyIdentificationMethod;
  emergencyReason: string;
  customReason?: string;
  startedAt: string;
  expiresAt: string;
  endedAt?: string | null;
  status: EmergencySessionStatus;
  recordsAccessed: string[];
  actionsPerformed: string[];
  ipAddress?: string;
}

export interface EmergencyContact {
  id: string;
  patientId: string;
  name: string;
  relationship: string;
  phone: string;
  priority: number;
}

export interface EmergencyProfile {
  userId: string;
  patientHealthId: string;
  bloodGroup: string;
  allergies: string[];
  criticalConditions: string[];
  currentMedications: string[];
  emergencyNotes: string;
  primaryPhysician: string;
  updatedAt: string;
}

export interface EmergencyNotification {
  id: string;
  patientId: string;
  sessionId: string;
  doctorName: string;
  hospitalName: string;
  reason: string;
  timestamp: string;
  status: "UNREAD" | "READ";
}

export type RecordAccessMethod = 
  | "APPOINTMENT" 
  | "PATIENT_ID" 
  | "PATIENT_HEALTH_ID" 
  | "ACCESS_CARD" 
  | "PATIENT_ACCESS_CARD" 
  | "QR"
  | "EMERGENCY" 
  | "BIOMETRIC" 
  | "FACE_SCAN";

export type RecordAccessStatus = "SUCCESS" | "DENIED";

export interface AccessSession {
  id: string;
  doctorId: string;
  doctorName: string;
  hospitalId: string;
  hospitalName: string;
  patientId: string;
  patientHealthId: string;
  patientName: string;
  accessMethod: RecordAccessMethod;
  accessType?: "APPOINTMENT" | "EMERGENCY" | "DIRECT";
  reason?: string;
  justification?: string;
  appointmentId?: string | null;
  accessCardId?: string | null;
  emergencySessionId?: string | null;
  startedAt: string;
  endedAt?: string | null;
  status: "ACTIVE" | "EXPIRED" | "ENDED";
  recordsAccessed: string[];
  actionsPerformed: string[];
}

export interface PatientRecordAccessLog {
  id: string;
  doctorId: string;
  doctorName: string;
  patientId: string;
  patientHealthId: string;
  patientName: string;
  hospitalId: string;
  hospitalName: string;
  accessMethod: RecordAccessMethod | string;
  accessType?: "APPOINTMENT" | "EMERGENCY" | "DIRECT" | string;
  accessStatus: RecordAccessStatus;
  timestamp: string;
  reason: string;
  justification?: string;
  appointmentId?: string | null;
  accessCardId?: string | null;
  recordsAccessed: string[];
  emergencyFlag: boolean;
  verificationMethod?: string;
  verificationStatus?: string;
  ipAddress?: string;
  deviceId?: string;
  sessionId?: string;
  denialReason?: string;
}

// NEXUSHEALTH CLINICAL MEDICATION SYSTEM
export type MedicationStatus = "ACTIVE" | "COMPLETED" | "DISCONTINUED";

export interface PatientMedication {
  id: string;
  patientId: string;
  patientHealthId?: string;
  patientName?: string;
  doctorId: string;
  doctorName: string;
  hospitalId?: string;
  hospitalName?: string;
  prescriptionId?: string | null;
  medicationName: string;
  genericName?: string;
  dosage: string;
  unit?: string;
  frequency: string;
  route?: string;
  timing?: string;
  startDate: string;
  endDate: string;
  duration?: string;
  indication?: string;
  instructions?: string;
  specialInstructions?: string;
  notes?: string;
  status: MedicationStatus;
  createdAt: string;
  updatedAt: string;
  discontinuedAt?: string | null;
  discontinuedBy?: string | null;
  discontinuationReason?: string | null;
}

export type DoseStatus = "TAKEN" | "MISSED" | "SKIPPED";

export interface MedicationDoseLog {
  id: string;
  medicationId: string;
  patientId: string;
  patientHealthId?: string;
  medicationName: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // e.g. "08:00 AM" or "Morning"
  actualTime?: string | null;
  status: DoseStatus;
  createdAt: string;
}

export interface MedicationAdherenceSummary {
  todayTaken: number;
  todayTotal: number;
  todayPercentage: number;
  last7DaysPercentage: number;
}


