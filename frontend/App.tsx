/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { UserRole, PatientProfile, DoctorProfile, HospitalProfile, ConsentGrant, Appointment, MedicalRecord, AuditLog } from "./types";
import { PatientView } from "./components/PatientView";
import { DoctorView } from "./components/DoctorView";
import { HospitalAdminView } from "./components/HospitalAdminView";
import { SuperAdminView } from "./components/SuperAdminView";
import { GlobalHealthCardModal } from "./components/GlobalHealthCardModal";

import { LoginPage } from "./components/LoginPage";
import { LandingPage } from "./components/LandingPage";
import { MobileCameraScannerPage } from "./components/MobileCameraScannerPage";
import { safeFetchJson, parseResponseSafe } from "./utils/api";

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const mobileBridgeSessionId = urlParams.get("mobileBridge");

  if (mobileBridgeSessionId) {
    return <MobileCameraScannerPage sessionId={mobileBridgeSessionId} />;
  }
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: UserRole;
    globalHealthId?: string;
  } | null>(null);

  const [viewMode, setViewMode] = useState<"LANDING" | "LOGIN" | "WORKSPACE">("LANDING");
  const [loginInitialRole, setLoginInitialRole] = useState<UserRole>("PATIENT");
  const [loginInitialRegister, setLoginInitialRegister] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  // Modals
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  // Core Data
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [allPatients, setAllPatients] = useState<PatientProfile[]>([]);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [consents, setConsents] = useState<ConsentGrant[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [hospitals, setHospitals] = useState<HospitalProfile[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Load data from Express server on mount and user switch
  const refreshData = async (userToLoad = currentUser) => {
    try {
      const targetPatientId = userToLoad?.role === "PATIENT" ? (userToLoad.id || "") : "";

      let recordUrl = `/api/patient/records/${targetPatientId}`;
      if (userToLoad?.role === "HOSPITAL_ADMIN") {
        recordUrl = `/api/hospitals/${userToLoad.id}/records`;
      } else if (userToLoad?.role === "DOCTOR") {
        recordUrl = `/api/doctors/${userToLoad.id}/records`;
      } else if (userToLoad?.role === "SUPER_ADMIN") {
        recordUrl = `/api/admin/all-records`;
      }

      const isPatient = userToLoad?.role === "PATIENT" && !!targetPatientId;
      const prof = isPatient ? await safeFetchJson<PatientProfile | null>(`/api/patient/profile/${targetPatientId}`, null) : null;
      const con = isPatient ? await safeFetchJson<ConsentGrant[]>(`/api/patient/consents/${targetPatientId}`, []) : [];
      const isPatientAppt = !!targetPatientId ? `/api/appointments?patientId=${targetPatientId}` : "/api/appointments";

      const [rec, doc, hosp, apt, aud, patList] = await Promise.all([
        safeFetchJson<MedicalRecord[]>(recordUrl, []),
        safeFetchJson<DoctorProfile[]>("/api/doctors", []),
        safeFetchJson<HospitalProfile[]>("/api/hospitals", []),
        safeFetchJson<Appointment[]>(isPatientAppt, []),
        safeFetchJson<AuditLog[]>("/api/admin/audit-logs", []),
        safeFetchJson<any[]>("/api/admin/patients", []),
      ]);

      if (prof) setPatientProfile(prof);
      if (Array.isArray(rec)) setRecords(rec);
      if (Array.isArray(con)) setConsents(con);
      if (Array.isArray(doc)) setDoctors(doc);
      if (Array.isArray(hosp)) setHospitals(hosp);
      if (Array.isArray(apt)) setAppointments(apt);
      if (Array.isArray(aud)) setAuditLogs(aud);

      if (Array.isArray(patList)) {
        setAllPatients(
          patList.map((p: any) => ({
            id: p.id,
            userId: p.id,
            globalHealthId: p.globalHealthId || "NH-IND-2026-PAT01",
            name: p.name || "Patient Citizen",
            dob: p.dob || "1994-06-15",
            gender: p.gender || "MALE",
            bloodGroup: p.bloodGroup || "O+",
            phone: "+91 98765 43210",
            email: p.email || "patient@nexushealth.org",
            address: "Healthcare Sector 4, New Delhi",
            emergencyContactName: p.emergencyContactName || "Family Contact",
            emergencyContactPhone: "+91 98000 11111",
            emergencyContactRelation: "Relative",
            allergies: [],
            chronicConditions: [],
            insuranceProvider: p.insuranceProvider || "PM-JAY Universal Insurance",
            insurancePolicyNumber: "PMJAY-2026-901",
            qrCodeData: `NEXUSHEALTH:${p.globalHealthId || "NH-IND-2026-PAT01"}`
          }))
        );
      }

      if (userToLoad && userToLoad.role === "PATIENT" && prof && prof.globalHealthId) {
        if (userToLoad.globalHealthId !== prof.globalHealthId) {
          setCurrentUser(prev => prev ? { ...prev, globalHealthId: prof.globalHealthId } : prev);
        }
      }
    } catch (err) {
      console.error("Failed to load NexusHealth data:", err);
    }
  };

  useEffect(() => {
    refreshData(currentUser);
  }, [currentUser?.id, currentUser?.role]);

  // Handlers
  const handleGrantConsent = async (doctorId: string, consentType: string) => {
    try {
      const targetDoc = doctors.find(d => d.id === doctorId);
      const res = await fetch("/api/patient/consents/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: currentUser?.id || "",
          doctorId,
          consentType: consentType || "TEMPORARY",
          allowedCategories: ["ALL_RECORDS"],
          validUntil: "2027-12-31",
        }),
      });
      const data = await parseResponseSafe<any>(res, { success: false });
      if (data?.success && data.consent) {
        setConsents((prev) => {
          const filtered = prev.filter(
            (c) => c.id !== data.consent.id && c.doctorId !== doctorId && c.doctorName !== targetDoc?.name
          );
          return [data.consent, ...filtered];
        });
      }
    } catch (e) {
      console.error("Failed to grant consent:", e);
    }
    await refreshData(currentUser);
  };

  const handleRevokeConsent = async (consentId: string) => {
    try {
      setConsents((prev) => prev.filter((c) => c.id !== consentId && c.doctorId !== consentId));
      await fetch(`/api/patient/consents/revoke/${consentId}`, { method: "POST" });
    } catch (e) {
      console.error("Failed to revoke consent:", e);
    }
    await refreshData(currentUser);
  };

  const handleBookAppointment = async (
    doctorId: string,
    appointmentDate: string,
    slotTime: string,
    symptoms: string,
    priority: string,
    hospitalId?: string
  ) => {
    try {
      const res = await fetch("/api/appointments/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: currentUser?.id || "",
          patientName: currentUser?.name || "",
          patientHealthId: currentUser?.globalHealthId || patientProfile?.globalHealthId || "",
          doctorId,
          hospitalId,
          appointmentDate,
          slotTime,
          symptoms,
          priority,
        }),
      });
      const data = await parseResponseSafe<any>(res, { success: false, message: "Booking service unavailable." });
      if (!res.ok || !data?.success) {
        alert(data?.message || "Booking failed.");
        return { success: false, message: data?.message || "Booking failed" };
      }
      alert(`Appointment Booked Successfully!\nToken / Queue Number: ${data.appointment.tokenNumber}\nDate: ${data.appointment.appointmentDate} (${data.appointment.slotTime})\nPhysician: ${data.appointment.doctorName}`);
      refreshData();
      return { success: true, appointment: data.appointment };
    } catch (err) {
      alert("Error booking appointment. Please check network connection.");
      return { success: false, message: "Server error" };
    }
  };

  const activeDoctor = (currentUser && doctors.find((d) => d.email === currentUser.email || d.userId === currentUser.id || d.id === currentUser.id)) || {
    id: currentUser?.id || "doc_unassigned",
    userId: currentUser?.id || "u_doc_unassigned",
    name: currentUser?.name || "Practicing Medical Doctor",
    email: currentUser?.email || "doctor@nexushealth.org",
    specialization: "General Medicine",
    licenseNumber: "MCI-2026-REGISTERED",
    experienceYears: 5,
    hospitalId: null,
    hospitalName: "Independent Medical Practice",
    status: "APPROVED",
    fee: 500,
    rating: 5.0,
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    slotDurationMin: 20,
  };

  const activeHospital = (currentUser && hospitals.find((h) => h.email === currentUser.email || h.userId === currentUser.id || h.id === currentUser.id)) || {
    id: currentUser?.id || "hosp_unassigned",
    userId: currentUser?.id || "u_hosp_unassigned",
    name: currentUser?.name || "Registered Specialty Center",
    licenseNumber: "HOSP-IND-DL-2026",
    address: "Central Medical Complex, New Delhi",
    phone: "+91 11 4000 0000",
    email: currentUser?.email || "admin@hospital.org",
    departments: ["General Medicine", "Emergency ER", "Cardiology"],
    totalBeds: 100,
    availableBeds: 20,
    status: "APPROVED",
  };

  // Safe Fallback Profile for Patient Views
  const safePatientProfile: PatientProfile = patientProfile || {
    userId: currentUser?.id || "u_pat_new",
    globalHealthId: currentUser?.globalHealthId || "NH-IND-2026-NEW",
    dob: "2000-01-01",
    gender: "Unspecified",
    bloodGroup: "O+",
    heightCm: 170,
    weightKg: 65,
    organDonor: false,
    insuranceProvider: "Universal Health Insurance",
    insurancePolicyNumber: "POL-2026-NEXUS",
    emergencyContactName: "Primary Contact",
    emergencyContactPhone: "+91 98000 00000",
    emergencyContactRelation: "Family",
    allergies: [],
    chronicConditions: [],
    lifestyle: { smoking: "Never", alcohol: "Never", exerciseDaysPerWeek: 3 },
    qrCodeData: `NEXUSHEALTH:${currentUser?.globalHealthId || "NH-IND-2026-NEW"}:${currentUser?.name || "Patient"}:O+`
  };

  const handleApplyHospital = async (hospitalId: string) => {
    const docToApply = activeDoctor || {
      name: currentUser?.name || "Dr. Physician",
      email: currentUser?.email || "doctor@hospital.org",
      specialization: "General Medicine",
      licenseNumber: `MCI-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      experienceYears: 10,
      fee: 1000
    };

    await fetch("/api/doctors/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: docToApply.name,
        email: docToApply.email,
        specialization: docToApply.specialization,
        licenseNumber: docToApply.licenseNumber,
        experienceYears: docToApply.experienceYears,
        hospitalId,
        fee: docToApply.fee,
      }),
    });
    refreshData();
  };

  const handleCreateRecord = async (recordData: any) => {
    await fetch("/api/medical-records/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...recordData,
        doctorId: activeDoctor?.id || recordData.doctorId || "doc_1"
      }),
    });
    refreshData();
  };

  const handleApproveDoctor = async (doctorId: string, action: "APPROVE" | "REJECT" | "REMOVE") => {
    await fetch("/api/hospitals/approve-doctor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doctorId, action }),
    });
    refreshData();
  };

  const handleDeleteHospital = async (hospitalId: string) => {
    await fetch("/api/admin/delete-hospital", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hospitalId }),
    });
    refreshData();
  };

  const handleBreakGlassGranted = async (patientHealthId: string, reason: string) => {
    await fetch("/api/doctor/access-patient-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId: activeDoctor?.id || "doc_1",
        patientHealthId,
        emergencyReason: reason,
      }),
    });
    refreshData();
  };

  // Render Landing Page if not logged in and in LANDING mode
  if (!currentUser && viewMode === "LANDING") {
    return (
      <LandingPage
        onOpenLogin={(role, reg) => {
          setLoginInitialRole(role || "PATIENT");
          setLoginInitialRegister(!!reg);
          setViewMode("LOGIN");
        }}
      />
    );
  }

  // Render Login Screen if not authenticated or in LOGIN mode
  if (!currentUser || viewMode === "LOGIN") {
    return (
      <LoginPage
        hospitals={hospitals}
        initialRole={loginInitialRole}
        initialRegister={loginInitialRegister}
        onBackToHome={() => setViewMode("LANDING")}
        onLoginSuccess={(user, role) => {
          const newUser = {
            id: user.id || "u_1",
            name: user.name || "User",
            email: user.email || "user@example.com",
            role: role,
            globalHealthId: user.globalHealthId,
          };
          setCurrentUser(newUser);
          setViewMode("WORKSPACE");
          refreshData(newUser);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] text-slate-900 font-sans">

      {currentUser.role === "PATIENT" && (
        <PatientView
          profile={safePatientProfile}
          records={records}
          consents={consents}
          doctors={doctors}
          hospitals={hospitals}
          appointments={appointments}
          onGrantConsent={handleGrantConsent}
          onRevokeConsent={handleRevokeConsent}
          onBookAppointment={handleBookAppointment}
          patientName={currentUser.name}
          appUser={currentUser}
          onLogout={() => {
            setCurrentUser(null);
            setViewMode("LANDING");
          }}
          onGoToHome={() => setViewMode("LANDING")}
        />
      )}

      {currentUser.role === "DOCTOR" && (
        <DoctorView
          doctor={activeDoctor}
          records={records}
          consents={consents}
          patientProfiles={allPatients.length > 0 ? allPatients : (patientProfile ? [patientProfile] : [])}
          hospitals={hospitals}
          appointments={appointments}
          onAddRecord={handleCreateRecord}
          onBreakGlassAccess={handleBreakGlassGranted}
          onUpdateAppointmentStatus={async (aptId, status) => {
            await fetch("/api/appointments/update-status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ appointmentId: aptId, status }),
            });
            refreshData();
          }}
          doctorName={currentUser.name}
          appUser={currentUser}
          onLogout={() => {
            setCurrentUser(null);
            setViewMode("LANDING");
          }}
          onGoToHome={() => setViewMode("LANDING")}
        />
      )}

      {currentUser.role === "HOSPITAL_ADMIN" && (
        <HospitalAdminView
          hospital={activeHospital}
          doctors={doctors}
          records={records}
          patientProfiles={allPatients.length > 0 ? allPatients : (patientProfile ? [patientProfile] : [])}
          onApproveDoctor={handleApproveDoctor}
          onRefreshData={refreshData}
          appUser={currentUser}
          onLogout={() => {
            setCurrentUser(null);
            setViewMode("LANDING");
          }}
          onGoToHome={() => setViewMode("LANDING")}
        />
      )}

      {currentUser.role === "SUPER_ADMIN" && (
        <SuperAdminView
          hospitals={hospitals}
          doctors={doctors}
          auditLogs={auditLogs}
          records={records}
          patientProfiles={allPatients.length > 0 ? allPatients : (patientProfile ? [patientProfile] : [])}
          onDeleteHospital={handleDeleteHospital}
          appUser={currentUser}
          onLogout={() => {
            setCurrentUser(null);
            setViewMode("LANDING");
          }}
          onGoToHome={() => setViewMode("LANDING")}
        />
      )}

      {/* Modals */}
      <GlobalHealthCardModal
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
        profile={safePatientProfile}
        patientName={currentUser.name}
      />
    </div>
  );
}
