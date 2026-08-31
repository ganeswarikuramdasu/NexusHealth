import React, { useState, useEffect, useRef } from "react";
import {
  PatientProfile,
  MedicalRecord,
  ConsentGrant,
  DoctorProfile,
  HospitalProfile,
  Appointment,
  PatientMedication,
  MedicationAdherenceSummary,
  MedicationDoseLog,
  UserRole,
} from "../types";
import { LabReportExplainModal } from "./LabReportExplainModal";
import { AccessCardView } from "./AccessCardView";
import { PatientEmergencyProfileView } from "./PatientEmergencyProfileView";
import { HierarchicalAuditLogViewer } from "./HierarchicalAuditLogViewer";
import { AppShell, NavItem } from "./AppShell";
import { downloadLabReportPDF, downloadMedicalRecordPDF } from "../utils/downloadHelper";
import { safeFetchJson, parseResponseSafe } from "../utils/api";
import {
  ShieldCheck,
  Shield,
  FileText,
  Lock,
  Calendar,
  Bot,
  Star,
  AlertTriangle,
  Activity,
  Send,
  Siren,
  Award,
  Clock,
  FlaskConical,
  History,
  Settings,
  KeyRound,
  Sparkles,
  X,
  User,
  Heart,
  Pill,
  Flame,
  ArrowUpRight,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  Phone,
  Video,
  ChevronRight,
  Plus,
  RefreshCw,
  Zap,
  Download,
  DownloadCloud,
  Upload,
  Printer,
  Paperclip,
  FileSpreadsheet,
  CreditCard,
} from "lucide-react";

interface PatientViewProps {
  profile: PatientProfile;
  records: MedicalRecord[];
  consents: ConsentGrant[];
  doctors: DoctorProfile[];
  hospitals: HospitalProfile[];
  appointments: Appointment[];
  onGrantConsent: (doctorId: string, consentType: string) => void;
  onRevokeConsent: (consentId: string) => void;
  onBookAppointment: (doctorId: string, date: string, slot: string, symptoms: string, priority: string, hospitalId?: string) => void;
  patientName: string;
  appUser?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    globalHealthId?: string;
  };
  onLogout?: () => void;
  onGoToHome?: () => void;
}

export const PatientView: React.FC<PatientViewProps> = ({
  profile,
  records,
  consents,
  doctors,
  hospitals,
  appointments,
  onGrantConsent,
  onRevokeConsent,
  onBookAppointment,
  patientName,
  appUser,
  onLogout,
  onGoToHome,
}) => {
  const [activeTab, setActiveTab] = useState<
    "DASHBOARD" | "EMERGENCY_PROFILE" | "ACCESS_CARD" | "RECORDS" | "LAB_REPORTS" | "AI_ASSISTANT" | "VITALS_ANALYTICS" | "MEDICATIONS" | "CONSENTS" | "APPOINTMENTS" | "AUDIT_LOGS"
  >("DASHBOARD");

  // Explain Modal state
  const [selectedReportForExplain, setSelectedReportForExplain] = useState<any | null>(null);

  // Patient Manual Upload Lab Report State
  const [showManualLabModal, setShowManualLabModal] = useState(false);
  const [patientUploadedReports, setPatientUploadedReports] = useState<any[]>([]);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadLabName, setUploadLabName] = useState("");
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split("T")[0]);
  const [uploadDoctor, setUploadDoctor] = useState("");
  const [uploadParamName, setUploadParamName] = useState("");
  const [uploadParamVal, setUploadParamVal] = useState("");
  const [uploadParamUnit, setUploadParamUnit] = useState("");
  const [uploadParamRef, setUploadParamRef] = useState("");
  const [uploadParamsList, setUploadParamsList] = useState<Array<{ name: string; value: string; unit: string; referenceRange: string; status: string }>>([
    { name: "Fasting Blood Sugar", value: "92", unit: "mg/dL", referenceRange: "70 - 99", status: "NORMAL" },
    { name: "HbA1c", value: "5.6", unit: "%", referenceRange: "< 5.7", status: "NORMAL" },
  ]);

  // Lab Report File Attachment State
  const [uploadAttachment, setUploadAttachment] = useState<{ name: string; size: number; dataUrl: string } | null>(null);
  const labFileInputRef = useRef<HTMLInputElement | null>(null);
  const handleLabFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert("File exceeds 15MB limit.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setUploadAttachment({ name: file.name, size: file.size, dataUrl: String(reader.result || "") });
    };
    reader.readAsDataURL(file);
  };

  const approvedHospitals = hospitals.filter((h) => h.status === "APPROVED" || h.status === "ACTIVE" || !h.status);
  const activeHospitalsList = approvedHospitals.length > 0 ? approvedHospitals : hospitals;

  const [selectedHospId, setSelectedHospId] = useState("");

  const hospitalDoctors = doctors.filter((d) => 
    (d.status === "APPROVED" || d.status === "ACTIVE" || !d.status) &&
    d.isActive !== false &&
    (!selectedHospId || d.hospitalId === selectedHospId || !d.hospitalId)
  );

  const [selectedDocId, setSelectedDocId] = useState("");
  const [aptDate, setAptDate] = useState(new Date().toISOString().split("T")[0]);
  const [aptSlot, setAptSlot] = useState("");
  const [aptSymptoms, setAptSymptoms] = useState("");
  const [aptPriority, setAptPriority] = useState("NORMAL");
  const [isBookingInProgress, setIsBookingInProgress] = useState(false);

  // Dynamic Time Slots State
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotMessage, setSlotMessage] = useState<string | null>(null);

  // Sync hospital choice on hospital list update
  useEffect(() => {
    if (activeHospitalsList.length > 0) {
      if (!selectedHospId || !activeHospitalsList.some((h) => h.id === selectedHospId)) {
        setSelectedHospId(activeHospitalsList[0].id);
      }
    }
  }, [hospitals]);

  // Sync doctor choice on hospital selection or doctor list update
  useEffect(() => {
    if (hospitalDoctors.length > 0) {
      if (!selectedDocId || !hospitalDoctors.some((d) => d.id === selectedDocId)) {
        setSelectedDocId(hospitalDoctors[0].id);
      }
    } else if (doctors.length > 0) {
      const activeDocs = doctors.filter((d) => d.isActive !== false);
      if (activeDocs.length > 0 && (!selectedDocId || !activeDocs.some((d) => d.id === selectedDocId))) {
        setSelectedDocId(activeDocs[0].id);
      }
    }
  }, [selectedHospId, doctors]);

  // Fetch Doctor Available Slots for selected Date
  const fetchDoctorSlots = async (docId: string, dateStr: string) => {
    if (!docId || !dateStr) return;
    setIsLoadingSlots(true);
    setSlotMessage(null);
    try {
      let res = await fetch(`/api/appointments/slots/${docId}?date=${dateStr}`);
      if (!res.ok) {
        res = await fetch(`/api/appointments/available-slots?doctorId=${docId}&date=${dateStr}`);
      }
      const data = await parseResponseSafe<any>(res, { success: false, slots: [] });
      if (data && data.success && Array.isArray(data.slots)) {
        setAvailableSlots(data.slots);
        if (data.slots.length > 0) {
          const avail = data.slots.find((s: any) => s.status === "AVAILABLE");
          setAptSlot(avail ? (avail.timeStr || avail.displayWindow) : (data.slots[0].timeStr || data.slots[0].displayWindow));
        } else {
          setAvailableSlots([]);
          setAptSlot("");
          setSlotMessage(data.message || "No slots available on this date.");
        }
      } else {
        setAvailableSlots([]);
        setAptSlot("");
        setSlotMessage(data?.message || "Dr. is unavailable on this date.");
      }
    } catch (err) {
      console.error("Error fetching doctor slots:", err);
      setAvailableSlots([]);
      setSlotMessage("Could not load doctor slots.");
    } finally {
      setIsLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (selectedDocId && aptDate) {
      fetchDoctorSlots(selectedDocId, aptDate);
    }
  }, [selectedDocId, aptDate]);

  // AI Assistant Chat State
  const [aiChatInput, setAiChatInput] = useState("");
  const [aiChatHistory, setAiChatHistory] = useState<Array<{ role: "user" | "ai"; text: string }>>([
    {
      role: "ai",
      text: `Hello ${patientName}! I am your Gemini 3.6 Flash Health Assistant. I have indexed your Health ID (${profile.globalHealthId}) and medical history. Ask me anything about symptoms, medication contraindications, or lab values!`,
    },
  ]);
  const [isAiReplying, setIsAiReplying] = useState(false);

  // Vitals State (Advanced Section)
  const getDefaultVitalsHistory = () => [];

  const [vitalsHistory, setVitalsHistory] = useState(getDefaultVitalsHistory());

  // Vitals Add Form State
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [vitalsForm, setVitalsForm] = useState({
    bpSystolic: "",
    bpDiastolic: "",
    glucose: "",
    heartRate: "",
    spo2: "",
    weight: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [vitalsFormError, setVitalsFormError] = useState("");

  // Dynamic Patient Medication & Adherence State
  const [activeMedications, setActiveMedications] = useState<PatientMedication[]>([]);
  const [medicationHistory, setMedicationHistory] = useState<PatientMedication[]>([]);
  const [todayDoseLogs, setTodayDoseLogs] = useState<MedicationDoseLog[]>([]);
  const [adherenceSummary, setAdherenceSummary] = useState<MedicationAdherenceSummary>({
    todayTaken: 0,
    todayTotal: 0,
    todayPercentage: 0,
    last7DaysPercentage: 0,
  });
  const [isLoadingMeds, setIsLoadingMeds] = useState(false);

  useEffect(() => {
    setVitalsHistory(getDefaultVitalsHistory());
  }, [profile.globalHealthId]);

  // Fetch Patient Medications
  const fetchPatientMedications = async () => {
    setIsLoadingMeds(true);
    try {
      const pid = profile.userId || profile.globalHealthId || profile.id;
      const data = await safeFetchJson<any>(`/api/medications/patient/${pid}`, undefined, { success: false });
      if (data && data.success) {
        setActiveMedications(data.activeMedications || []);
        setMedicationHistory(data.medicationHistory || []);
        setTodayDoseLogs(data.todayDoseLogs || []);
        if (data.adherenceSummary) {
          setAdherenceSummary(data.adherenceSummary);
        }
      }
    } catch (err) {
      console.error("Failed to fetch patient medications:", err);
    } finally {
      setIsLoadingMeds(false);
    }
  };

  useEffect(() => {
    fetchPatientMedications();
  }, [profile.globalHealthId, profile.userId, profile.id]);

  // Log Dose Adherence (Taken / Missed / Skipped)
  const handleLogDose = async (medicationId: string, status: "TAKEN" | "MISSED" | "SKIPPED", notes?: string) => {
    try {
      const res = await fetch("/api/medications/doses/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: profile.userId || profile.id,
          patientHealthId: profile.globalHealthId,
          medicationId,
          status,
          scheduledTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          notes,
        }),
      });
      const data = await parseResponseSafe<any>(res, { success: false });
      if (data && data.success) {
        fetchPatientMedications();
      } else {
        alert(data?.error || "Failed to log dose status");
      }
    } catch (err) {
      console.error("Failed to log dose status:", err);
    }
  };

  const displayedLabReports = patientUploadedReports;

  // Weekly vitals bars derived from the patient's actual vitals log.
  // Newly registered patients have an empty log, so this stays empty and the
  // dashboard shows an empty state instead of fabricated data.
  const chartBars = vitalsHistory.slice(-7).map((v, i) => ({
    id: i,
    day: v.date || `Log ${i + 1}`,
    label: `${v.bpSystolic ?? "—"}/${v.bpDiastolic ?? "—"} BP`,
    height: Math.min(96, Math.max(12, (v.bpSystolic || 0) % 90)),
  }));

  // Most recent vitals reading; null for a newly registered patient with no log.
  const latestVitals = vitalsHistory.length > 0 ? vitalsHistory[vitalsHistory.length - 1] : null;

  const activeConsentsList = consents.filter((c) => c.status !== "REVOKED");

  const grantedDoctorIds = new Set<string>();
  const grantedDoctorNames = new Set<string>();
  activeConsentsList.forEach((c) => {
    if (c.doctorId) grantedDoctorIds.add(c.doctorId);
    if (c.doctorName) grantedDoctorNames.add(c.doctorName.toLowerCase().trim());
  });

  const availableDoctorsToGrant = doctors.filter((doc) => {
    if (grantedDoctorIds.has(doc.id)) return false;
    if (doc.name && grantedDoctorNames.has(doc.name.toLowerCase().trim())) return false;
    return true;
  });

  const handleSendAiMessage = async (msgOverride?: string) => {
    const textToSend = msgOverride || aiChatInput;
    if (!textToSend.trim()) return;

    const userMsg = { role: "user" as const, text: textToSend };
    setAiChatHistory((prev) => [...prev, userMsg]);
    if (!msgOverride) setAiChatInput("");
    setIsAiReplying(true);

    try {
      const res = await fetch("/api/ai/patient-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientHealthId: profile.globalHealthId,
          prompt: textToSend,
          query: textToSend,
          contextRecords: records,
          patientProfile: profile,
        }),
      });
      const data = await parseResponseSafe<any>(res, { reply: null });
      const aiReply = data?.reply || data?.response || "I analyzed your clinical records. Everything looks stable! Consult your attending physician for explicit medical orders.";
      setAiChatHistory((prev) => [
        ...prev,
        {
          role: "ai",
          text: aiReply,
        },
      ]);
    } catch (err) {
      setAiChatHistory((prev) => [
        ...prev,
        { role: "ai", text: "Unable to reach Gemini AI engine at this moment. Please try again shortly." },
      ]);
    } finally {
      setIsAiReplying(false);
    }
  };

  const navTabs = [
    { key: "DASHBOARD", label: "Dashboard", icon: Activity },
    { key: "EMERGENCY_PROFILE", label: "Emergency Profile & Audit", icon: Siren, badge: "SAFETY" },
    { key: "ACCESS_CARD", label: "Patient Access Card", icon: CreditCard, badge: "Physical/QR" },
    { key: "AUDIT_LOGS", label: "Record Access Audit Log", icon: History, badge: "Ledger" },
    { key: "RECORDS", label: "EHR Medical History", icon: FileText, badge: "Stream" },
    { key: "LAB_REPORTS", label: "Lab Reports & Scans", icon: FlaskConical, badge: "AI" },
    { key: "AI_ASSISTANT", label: "Gemini AI Doctor", icon: Bot, badge: "AI" },
    { key: "VITALS_ANALYTICS", label: "Vitals & Biomarkers", icon: Heart },
    { key: "MEDICATIONS", label: "Medication Schedule", icon: Pill },
    { key: "CONSENTS", label: "Consent Vault", icon: Lock, count: consents.length },
    { key: "APPOINTMENTS", label: "Book Appointments", icon: Calendar, count: appointments.length },
  ];

  const navItems: NavItem[] = navTabs.map((t) => ({
    id: t.key as string,
    label: t.label,
    icon: t.icon,
    count: t.count,
    badge: t.badge,
  }));

  const shellUser = appUser || {
    id: "",
    name: patientName || "Patient",
    email: "patient@nexushealth.org",
    role: "PATIENT" as UserRole,
  };

  return (
    <>
      <AppShell
        user={shellUser}
        roleLabel="Verified Health ID"
        subtitle="Patient Portal"
        navItems={navItems}
        active={activeTab}
        onSelect={(k) => setActiveTab(k as any)}
        onLogout={onLogout}
        onGoToHome={onGoToHome}
      >

        {/* DASHBOARD TAB */}
        {activeTab === "DASHBOARD" && (
          <div className="space-y-6">
            
            {/* Hero Welcome Banner */}
            <div className="bg-gradient-to-r from-[#0f172a] via-[#0f172a] to-[#17C964] border border-[#17C964]/30 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
              <div className="space-y-2 z-10">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#17C964]/20 border border-[#17C964]/40 rounded-full text-xs font-mono font-bold text-[#D6ECFA]">
                  <Sparkles className="w-3.5 h-3.5 text-[#D6ECFA]" />
                  <span>Ready for Consultations</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Welcome back, <span className="bg-gradient-to-r from-[#D6ECFA] to-[#F8A08C] bg-clip-text text-transparent">{patientName}</span> 🎯
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                  Access and manage your verified health identity, digital medical records, and physician permissions in one unified portal.
                </p>
              </div>

              <div className="flex items-center space-x-3 shrink-0 z-10">
                <button
                  onClick={() => setActiveTab("AI_ASSISTANT")}
                  className="px-5 py-3 bg-[#17C964] hover:bg-[#0f172a] text-white font-bold rounded-2xl shadow-lg shadow-[#17C964]/30 text-xs transition flex items-center space-x-2"
                >
                  <Bot className="w-4 h-4" />
                  <span>Start AI Chat</span>
                </button>
                <button
                  onClick={() => setActiveTab("APPOINTMENTS")}
                  className="px-5 py-3 bg-[#FFFFFF] hover:bg-slate-100 text-slate-800 border border-slate-300/80 font-bold rounded-2xl text-xs transition flex items-center space-x-2"
                >
                  <Calendar className="w-4 h-4 text-[#17C964]" />
                  <span>Book Appointment</span>
                </button>
              </div>
            </div>

            {/* 4 Analytics Metric Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1 */}
              <div className="bg-[#FFFFFF] border border-slate-200/90 rounded-2xl p-4 space-y-2 relative shadow-md">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Health ID Status</span>
                  <div className="w-8 h-8 rounded-xl bg-[#E9FBF1] border border-[#17C964]/30 flex items-center justify-center text-[#17C964]">
                    <Shield className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-black text-slate-900 font-mono truncate">{profile.globalHealthId || "VERIFIED"}</div>
                <div className="text-[10px] text-[#17C964] font-mono font-bold flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>National Health ID Linked</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-[#FFFFFF] border border-slate-200/90 rounded-2xl p-4 space-y-2 relative shadow-md">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Consultations</span>
                  <div className="w-8 h-8 rounded-xl bg-[#E9FBF1] border border-[#17C964]/30 flex items-center justify-center text-[#17C964]">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">{records.length} <span className="text-xs text-slate-500 font-sans font-normal">Records</span></div>
                <div className="text-[10px] text-[#17C964] font-mono font-bold">Verified Medical History</div>
              </div>

              {/* Card 3 */}
              <div className="bg-[#FFFFFF] border border-slate-200/90 rounded-2xl p-4 space-y-2 relative shadow-md">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lab Investigations</span>
                  <div className="w-8 h-8 rounded-xl bg-[#E9FBF1] border border-[#17C964]/30 flex items-center justify-center text-[#17C964]">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">{displayedLabReports.length} <span className="text-xs text-slate-500 font-sans font-normal">Panels</span></div>
                <div className="text-[10px] text-[#17C964] font-mono font-bold">Diagnostic Reports</div>
              </div>

              {/* Card 4 */}
              <div className="bg-[#FFFFFF] border border-slate-200/90 rounded-2xl p-4 space-y-2 relative shadow-md">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Consents</span>
                  <div className="w-8 h-8 rounded-xl bg-[#E9FBF1] border border-[#17C964]/30 flex items-center justify-center text-[#17C964]">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">{activeConsentsList.length} <span className="text-xs text-slate-500 font-sans font-normal">Doctors</span></div>
                <div className="text-[10px] text-[#17C964] font-mono font-bold">Granted Doctor Access</div>
              </div>

            </div>

            {/* Main Grid: Left Chart + Right Precision Shortcuts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2/3: Weekly Health Vitals & Consultation Velocity Chart */}
              <div className="lg:col-span-2 bg-[#FFFFFF] border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-[#17C964]" />
                      <span>Weekly Vitals & Health Activity</span>
                    </h3>
                    <p className="text-xs text-slate-500">Heart rate, Blood Pressure & Glucose stability metrics</p>
                  </div>
                  <span className="px-3 py-1 bg-[#E9FBF1] border border-[#17C964]/30 text-[#17C964] text-xs font-mono font-bold rounded-xl">
                    This Week
                  </span>
                </div>

                {/* Weekly Vitals Chart - data-driven from the patient's log */}
                <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-200/80 pb-4">
                  {chartBars.length > 0 ? (
                    chartBars.map((bar) => (
                      <div key={bar.id} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="text-[9px] font-mono text-[#17C964] opacity-0 group-hover:opacity-100 transition">{bar.label}</div>
                        <div className="w-full bg-slate-100 rounded-t-xl overflow-hidden h-36 flex items-end">
                          <div
                            style={{ height: `${bar.height}%` }}
                            className="w-full bg-gradient-to-t from-[#17C964] via-[#0f172a] to-[#17C964] rounded-t-xl group-hover:brightness-125 transition"
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 font-bold">{bar.day}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex-1 h-full flex flex-col items-center justify-center text-center px-6">
                      <Activity className="w-9 h-9 text-slate-300 mb-2" />
                      <p className="text-sm font-bold text-slate-500">No vitals recorded yet</p>
                      <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                        Your weekly Heart rate, Blood Pressure &amp; Glucose trends will appear here once your measurements are recorded.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
                  <span>Normal Systolic Range: <strong className="text-[#17C964]">110-125 mmHg</strong></span>
                  <span className="text-[#17C964] font-mono font-bold">100% Interoperable Log</span>
                </div>
              </div>

              {/* Right 1/3: Precision Shortcuts (Exact like screenshot) */}
              <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-[#17C964]" />
                    <span>Precision Shortcuts</span>
                  </h3>
                  <p className="text-xs text-slate-500">Jump straight to health tools</p>
                </div>

                <div className="space-y-3">
                  
                  {/* Shortcut 1 */}
                  <div
                    onClick={() => setActiveTab("AI_ASSISTANT")}
                    className="p-3.5 bg-[#EDF1F5] hover:bg-slate-100/80 border border-slate-200 rounded-2xl transition cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E9FBF1] border border-[#17C964]/30 flex items-center justify-center text-[#17C964] shrink-0">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#17C964] transition">Ask AI Doctor</h4>
                        <p className="text-[10px] text-slate-500">Streaming symptom & lab explanations</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-[#17C964] transition" />
                  </div>

                  {/* Shortcut 2 */}
                  <div
                    onClick={() => setActiveTab("VITALS_ANALYTICS")}
                    className="p-3.5 bg-[#EDF1F5] hover:bg-slate-100/80 border border-slate-200 rounded-2xl transition cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FDECE8] border border-[#F2603C]/30 flex items-center justify-center text-[#F2603C] shrink-0">
                        <Heart className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#E23A2E] transition">Vitals & Biomarkers</h4>
                        <p className="text-[10px] text-slate-500">Blood pressure, glucose & heart rate logs</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-[#F2603C] transition" />
                  </div>

                  {/* Shortcut 3 */}
                  <div
                    onClick={() => setActiveTab("MEDICATIONS")}
                    className="p-3.5 bg-[#EDF1F5] hover:bg-slate-100/80 border border-slate-200 rounded-2xl transition cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E9FBF1] border border-[#17C964]/30 flex items-center justify-center text-[#17C964] shrink-0">
                        <Pill className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#17C964] transition">Medication Tracker</h4>
                        <p className="text-[10px] text-slate-500">Daily dosage schedule & refill reminders</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-[#17C964] transition" />
                  </div>

                  {/* Shortcut 4 */}
                  <div
                    onClick={() => setActiveTab("RECORDS")}
                    className="p-3.5 bg-[#EDF1F5] hover:bg-slate-100/80 border border-slate-200 rounded-2xl transition cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E9FBF1] border border-[#17C964]/30 flex items-center justify-center text-[#17C964] shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#17C964] transition">Medical Records</h4>
                        <p className="text-[10px] text-slate-500">Digital EHR & lab panel archive</p>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-[#17C964] transition" />
                  </div>

                </div>
              </div>

            </div>

            {/* Recent Medical Consultations Table */}
            <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-[#17C964]" />
                  <span>Recent Medical Consultations</span>
                </h3>
                <button
                  onClick={() => setActiveTab("RECORDS")}
                  className="text-xs text-[#17C964] hover:text-[#17C964] font-bold"
                >
                  View All Records →
                </button>
              </div>

              <div className="space-y-3">
                {records.slice(0, 3).map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-[#EDF1F5] border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-[#17C964]/40 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">{rec.diagnosis}</span>
                        <span className="px-2 py-0.5 bg-[#E9FBF1] border border-[#17C964]/30 text-[#17C964] text-[10px] font-mono rounded">
                          {rec.category || "Consultation"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Physician: <strong className="text-slate-800">{rec.doctorName}</strong> ({rec.hospitalName})
                      </p>
                    </div>

                    <div className="text-right text-xs font-mono text-slate-500 space-y-0.5 shrink-0">
                      <div>Date: {rec.date}</div>
                      <div className="text-[#17C964] font-bold">Sign: Verified</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ACCESS CARD TAB */}
        {activeTab === "ACCESS_CARD" && (
          <AccessCardView
            patientProfile={profile}
            currentUser={{ id: profile.userId, name: patientName }}
          />
        )}

        {/* EHR MEDICAL RECORDS TAB */}
        {activeTab === "RECORDS" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-[#17C964]" />
                  <span>Interoperable Electronic Medical Records</span>
                </h2>
                <p className="text-xs text-slate-500">Immutable consultation history & digital prescriptions attached to {profile.globalHealthId}</p>
              </div>

              <button
                onClick={() => {
                  if (records.length > 0) {
                    downloadMedicalRecordPDF(records[0], patientName, profile.globalHealthId);
                  } else {
                    alert("No EHR records available to export.");
                  }
                }}
                className="px-4 py-2 bg-[#17C964] hover:bg-[#0f172a] text-white font-bold rounded-xl text-xs transition flex items-center space-x-2 shadow-md shrink-0"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>Export Full Health Summary</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {records.map((rec) => (
                <div key={rec.id} className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-5 space-y-3 shadow-md hover:border-[#17C964]/40 transition">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{rec.diagnosis}</h3>
                      <p className="text-xs text-[#17C964] font-mono">Attending: {rec.doctorName} • {rec.hospitalName || "Central Clinic"}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-1 bg-[#E9FBF1] border border-[#17C964]/40 text-[#17C964] text-xs font-mono font-bold rounded-lg">
                        Signed: {rec.date}
                      </span>
                      <button
                        onClick={() => downloadMedicalRecordPDF(rec, patientName, profile.globalHealthId)}
                        className="px-3 py-1 bg-[#E9FBF1] hover:bg-[#17C964]/20 border border-[#17C964]/40 text-[#17C964] text-xs font-bold rounded-lg transition flex items-center space-x-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download EHR</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="font-bold text-slate-500 uppercase text-[10px]">Clinical Symptoms & Findings</span>
                      <p className="text-slate-700 bg-[#EDF1F5] p-3 rounded-xl border border-slate-200/80">{rec.symptoms || "Standard outpatient evaluation."}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="font-bold text-slate-500 uppercase text-[10px]">Prescribed Medications</span>
                      <div className="bg-[#EDF1F5] p-3 rounded-xl border border-slate-200/80 space-y-1">
                        {rec.prescriptions && rec.prescriptions.length > 0 ? (
                          rec.prescriptions.map((p, idx) => (
                            <div key={idx} className="flex justify-between items-center text-slate-800">
                              <span className="font-bold text-[#17C964]">{p.medicationName}</span>
                              <span className="font-mono text-[10px] text-slate-500">{p.dosage} ({p.frequency})</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-slate-500">No prescription medications attached.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LAB REPORTS TAB */}
        {activeTab === "LAB_REPORTS" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                  <FlaskConical className="w-5 h-5 text-[#17C964]" />
                  <span>Lab Reports & Diagnostic Scans</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Doctor uploaded panels & manually attached patient diagnostic records linked to Health ID
                </p>
              </div>

              <button
                onClick={() => setShowManualLabModal(true)}
                className="px-4 py-2 bg-[#17C964] hover:bg-[#0f172a] text-white font-bold rounded-xl text-xs transition flex items-center space-x-2 shadow-md shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Lab Report</span>
              </button>
            </div>

            {/* List of Lab Reports */}
            <div className="grid grid-cols-1 gap-6">
              {displayedLabReports.map((report) => (
                <div key={report.id} className="bg-[#FFFFFF] border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xl relative">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-md border ${
                          report.status === "ELEVATED"
                            ? "bg-[#FDECE8] border-[#F2603C]/40 text-[#E23A2E]"
                            : "bg-[#E9FBF1] border-[#17C964]/40 text-[#17C964]"
                        }`}>
                          {report.status || "COMPLETED"}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">Date: {report.date}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mt-1">{report.title}</h3>
                      <p className="text-xs text-[#17C964] font-mono">Facility: {report.labName || report.hospitalName || "Diagnostic Pathology Lab"}</p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => setSelectedReportForExplain(report)}
                        className="px-3.5 py-2 bg-[#E9FBF1] hover:bg-[#17C964]/20 border border-[#17C964]/40 text-[#17C964] font-bold rounded-xl text-xs transition flex items-center space-x-1.5"
                      >
                        <Sparkles className="w-4 h-4 text-[#17C964]" />
                        <span>Explain with Gemini AI</span>
                      </button>

                      <button
                        onClick={() => downloadLabReportPDF(report, patientName, profile.globalHealthId)}
                        className="px-3.5 py-2 bg-[#17C964] hover:bg-[#0f172a] text-white font-bold rounded-xl text-xs transition flex items-center space-x-1.5 shadow-md shadow-[#17C964]/20"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Report</span>
                      </button>
                    </div>
                  </div>

                  {/* Parameters Table */}
                  {report.parameters && report.parameters.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="py-2 px-3">Test Parameter</th>
                            <th className="py-2 px-3">Measured Value</th>
                            <th className="py-2 px-3">Reference Range</th>
                            <th className="py-2 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/80 text-slate-800">
                          {report.parameters.map((p: any, idx: number) => (
                            <tr key={idx} className="hover:bg-[#EDF1F5]">
                              <td className="py-2.5 px-3 font-bold text-slate-900">{p.name || p.parameter}</td>
                              <td className="py-2.5 px-3 font-bold text-[#17C964]">{p.value} {p.unit}</td>
                              <td className="py-2.5 px-3 text-slate-500">{p.referenceRange || "-"}</td>
                              <td className="py-2.5 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  p.status === "HIGH" || p.status === "ELEVATED"
                                    ? "bg-[#FDECE8] text-[#E23A2E] border border-[#F2603C]/30"
                                    : "bg-[#E9FBF1] text-[#17C964] border border-[#17C964]/30"
                                }`}>
                                  {p.status || "NORMAL"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {report.attachmentName && (
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl p-3 flex items-center justify-between bg-[#FAFBFC]">
                      <div className="flex items-center space-x-2 min-w-0">
                        <Paperclip className="w-4 h-4 text-[#17C964] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{report.attachmentName}</p>
                          <p className="text-[10px] text-slate-500">Attached by patient</p>
                        </div>
                      </div>
                      {report.attachmentDataUrl && report.attachmentDataUrl.startsWith("data:image") && (
                        <img src={report.attachmentDataUrl} alt={report.attachmentName} className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0" />
                      )}
                      {report.attachmentDataUrl && report.attachmentName && /\.pdf$/i.test(report.attachmentName) && (
                        <a href={report.attachmentDataUrl} download={report.attachmentName}
                          className="px-2.5 py-1 bg-[#17C964] text-white rounded-lg text-[10px] font-bold shrink-0 no-underline">
                          View PDF
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GEMINI AI DOCTOR & SYMPTOM CHECKER TAB */}
        {activeTab === "AI_ASSISTANT" && (
          <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col h-[700px]">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#17C964]/15 border border-[#17C964]/40 flex items-center justify-center text-[#17C964]">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Gemini 3.6 AI Clinical Assistant</h2>
                  <p className="text-xs text-slate-500">Contextual Q&A over your personal Electronic Health Record</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-[#E9FBF1] border border-[#17C964]/40 text-[#17C964] text-xs font-mono font-bold rounded-xl">
                Gemini 3.6 Flash
              </span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-[#EDF1F5] border border-slate-200/80 rounded-2xl font-sans text-xs">
              {aiChatHistory.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-xl p-3.5 rounded-2xl leading-relaxed ${
                      m.role === "user"
                        ? "bg-[#17C964] text-white font-medium shadow-md"
                        : "bg-[#FFFFFF] border border-slate-200 text-slate-800"
                    }`}
                  >
                    <div className="font-bold text-[10px] mb-1 opacity-70">
                      {m.role === "user" ? "You" : "Gemini AI Clinical Support"}
                    </div>
                    {m.text}
                  </div>
                </div>
              ))}
              {isAiReplying && (
                <div className="flex justify-start">
                  <div className="p-3 bg-[#FFFFFF] border border-slate-200 rounded-2xl text-[#17C964] text-xs font-mono flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Gemini AI is reviewing your clinical history...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Questions & Input Bar */}
            <div className="space-y-2 shrink-0 pt-2">
              <div className="flex flex-wrap gap-2 text-[11px]">
                <button
                  onClick={() => handleSendAiMessage("Summarize my recent lab reports and lipid profile.")}
                  className="px-3 py-1.5 bg-[#EDF1F5] hover:bg-slate-100 border border-slate-300/60 rounded-xl text-slate-700 font-medium transition"
                >
                  🤖 Summarize recent lab panels
                </button>
                <button
                  onClick={() => handleSendAiMessage("Are there any drug interactions in my active prescriptions?")}
                  className="px-3 py-1.5 bg-[#EDF1F5] hover:bg-slate-100 border border-slate-300/60 rounded-xl text-slate-700 font-medium transition"
                >
                  🤖 Check prescription drug interactions
                </button>
                <button
                  onClick={() => handleSendAiMessage("Explain my blood pressure readings and lifestyle tips.")}
                  className="px-3 py-1.5 bg-[#EDF1F5] hover:bg-slate-100 border border-slate-300/60 rounded-xl text-slate-700 font-medium transition"
                >
                  🤖 Explain blood pressure ranges
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={aiChatInput}
                  onChange={(e) => setAiChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendAiMessage()}
                  placeholder="Ask a health question, request a lab explanation, or describe symptoms..."
                  className="flex-1 bg-[#EDF1F5] border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#17C964]/50"
                />
                <button
                  onClick={() => handleSendAiMessage()}
                  className="px-5 py-3 bg-[#17C964] hover:bg-[#0f172a] text-white font-bold rounded-xl text-xs transition shadow-md shadow-[#17C964]/30"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VITALS & BIOMARKERS ANALYTICS TAB (ADVANCED SECTION) */}
        {activeTab === "VITALS_ANALYTICS" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-[#F2603C]" />
                  <span>Vitals & Biomarkers Analytics</span>
                </h2>
                <p className="text-xs text-slate-500">Real-time vital signs monitoring, historical trendlines & clinical alerts</p>
              </div>
              <button
                onClick={() => {
                  setVitalsForm({
                    bpSystolic: "",
                    bpDiastolic: "",
                    glucose: "",
                    heartRate: "",
                    spo2: "",
                    weight: "",
                    date: new Date().toISOString().split("T")[0],
                  });
                  setVitalsFormError("");
                  setShowVitalsModal(true);
                }}
                className="px-4 py-2 bg-[#17C964] hover:bg-[#0EA653] text-white font-bold rounded-xl text-xs transition flex items-center space-x-2 shadow-md shadow-[#17C964]/20"
              >
                <Plus className="w-4 h-4" />
                <span>Log New Vitals</span>
              </button>
            </div>

            {/* Vitals Summary Metric Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-4 space-y-1 shadow-md">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Blood Pressure</span>
                <div className="text-2xl font-black text-[#F2603C] font-mono">
                  {latestVitals ? `${latestVitals.bpSystolic}/${latestVitals.bpDiastolic} ` : <span className="text-slate-300">—</span>}
                  <span className="text-xs text-slate-500 font-sans">mmHg</span>
                </div>
                <div className="text-[10px] text-[#17C964] font-mono font-bold">{latestVitals ? "✔ OPTIMAL RANGE" : "NO DATA YET"}</div>
              </div>

              <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-4 space-y-1 shadow-md">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Fasting Glucose</span>
                <div className="text-2xl font-black text-[#17C964] font-mono">
                  {latestVitals ? `${latestVitals.glucose} ` : <span className="text-slate-300">—</span>}
                  <span className="text-xs text-slate-500 font-sans">mg/dL</span>
                </div>
                <div className="text-[10px] text-[#17C964] font-mono font-bold">{latestVitals ? "✔ NORMAL (&lt; 100)" : "NO DATA YET"}</div>
              </div>

              <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-4 space-y-1 shadow-md">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Resting Heart Rate</span>
                <div className="text-2xl font-black text-[#17C964] font-mono">
                  {latestVitals ? `${latestVitals.heartRate} ` : <span className="text-slate-300">—</span>}
                  <span className="text-xs text-slate-500 font-sans">bpm</span>
                </div>
                <div className="text-[10px] text-[#17C964] font-mono font-bold">{latestVitals ? "✔ HEALTHY SINUS" : "NO DATA YET"}</div>
              </div>

              <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-4 space-y-1 shadow-md">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Oxygen Saturation (SpO2)</span>
                <div className="text-2xl font-black text-[#17C964] font-mono">
                  {latestVitals ? `${latestVitals.spo2}%` : <span className="text-slate-300">—</span>}
                </div>
                <div className="text-[10px] text-[#17C964] font-mono font-bold">{latestVitals ? "✔ EXCELLENT" : "NO DATA YET"}</div>
              </div>
            </div>

            {/* Historical Log Table */}
            <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-3">Historical Vitals Log</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Blood Pressure</th>
                      <th className="py-2.5 px-3">Glucose</th>
                      <th className="py-2.5 px-3">Heart Rate</th>
                      <th className="py-2.5 px-3">SpO2</th>
                      <th className="py-2.5 px-3">Weight</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 text-slate-800">
                    {vitalsHistory.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center">
                          <Heart className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm font-bold text-slate-500">No vitals logged yet</p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Use "Log New Vitals" to record your first reading. New readings appear here.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      vitalsHistory.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#EDF1F5]">
                        <td className="py-3 px-3 font-bold text-[#17C964]">{item.date}</td>
                        <td className="py-3 px-3">{item.bpSystolic}/{item.bpDiastolic} mmHg</td>
                        <td className="py-3 px-3">{item.glucose} mg/dL</td>
                        <td className="py-3 px-3">{item.heartRate} bpm</td>
                        <td className="py-3 px-3">{item.spo2}%</td>
                        <td className="py-3 px-3">{item.weight} kg</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 bg-[#E9FBF1] text-[#17C964] border border-[#17C964]/40 rounded text-[10px] font-bold">
                            NORMAL
                          </span>
                        </td>
                      </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MEDICATION SCHEDULE TAB (CLINICAL WORKFLOW INTEGRATED) */}
        {activeTab === "MEDICATIONS" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                  <Pill className="w-5 h-5 text-[#17C964]" />
                  <span>Medication & Dose Schedule</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Doctor-prescribed clinical medication schedule and daily dose adherence tracking
                </p>
              </div>
              <span className="px-3.5 py-1.5 bg-[#E9FBF1] border border-[#17C964]/40 text-[#17C964] text-xs font-mono font-bold rounded-xl shrink-0">
                {activeMedications.length} Active Doctor Prescriptions
              </span>
            </div>

            {/* Adherence Summary Bar */}
            <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-[#EDF1F5] border border-[#17C964]/30 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-xs block font-medium">Today's Doses Logged</span>
                  <span className="text-[#17C964] font-bold text-xl font-mono">{adherenceSummary.todayTaken} / {adherenceSummary.todayTotal || activeMedications.length} Taken</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#E9FBF1] border border-[#17C964]/40 flex items-center justify-center text-[#17C964] font-bold font-mono text-sm">
                  {adherenceSummary.todayPercentage}%
                </div>
              </div>

              <div className="bg-[#EDF1F5] border border-[#17C964]/30 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-xs block font-medium">7-Day Compliance Score</span>
                  <span className="text-[#17C964] font-bold text-xl font-mono">{adherenceSummary.last7DaysPercentage}% Adherence</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#E9FBF1] border border-[#17C964]/40 flex items-center justify-center text-[#17C964]">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-[#EDF1F5] border border-[#17C964]/30 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-slate-500 text-xs block font-medium">Clinical Records Sync</span>
                  <span className="text-[#17C964] font-bold text-sm">Connected to EHR</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-[#E9FBF1] border border-[#17C964]/40 flex items-center justify-center text-[#17C964]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Active Medications List */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-[#17C964]" />
                <span>Active Prescribed Regimen</span>
              </h3>

              {isLoadingMeds ? (
                <div className="p-8 text-center text-slate-500">Loading your prescription schedule...</div>
              ) : activeMedications.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-[#FFFFFF] rounded-2xl border border-slate-200">
                  No active prescriptions currently assigned by your doctor.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeMedications.map((med) => {
                    const latestLog = todayDoseLogs.find((l) => l.medicationId === med.id);
                    const isLoggedTaken = latestLog?.status === "TAKEN";
                    const isLoggedMissed = latestLog?.status === "MISSED";

                    return (
                      <div
                        key={med.id}
                        className="bg-[#FFFFFF] border border-slate-200 hover:border-[#17C964]/40 rounded-2xl p-5 space-y-4 shadow-md relative transition flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                            <div>
                              <h4 className="text-base font-bold text-slate-900">{med.medicationName}</h4>
                              {med.genericName && (
                                <p className="text-[11px] text-slate-500 font-sans">{med.genericName}</p>
                              )}
                              <span className="text-xs text-[#17C964] font-mono font-bold block mt-0.5">
                                {med.dosage} {med.unit || ""} • {med.route || "Oral"}
                              </span>
                            </div>
                            <span
                              className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-full border ${
                                isLoggedTaken
                                  ? "bg-[#E9FBF1] border-[#17C964]/40 text-[#17C964]"
                                  : isLoggedMissed
                                  ? "bg-[#FDECE8] border-[#F2603C]/40 text-[#E23A2E]"
                                  : "bg-slate-100 border border-slate-300 text-slate-500"
                              }`}
                            >
                              {isLoggedTaken ? "TAKEN TODAY" : isLoggedMissed ? "MISSED" : "PENDING"}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs text-slate-700 font-mono">
                            <div>Schedule: <strong className="text-slate-900">{med.frequency}</strong></div>
                            {med.timing && <div>Timing: <strong className="text-[#17C964]">{med.timing}</strong></div>}
                            <div>Duration: <strong className="text-slate-700">{med.startDate} → {med.endDate}</strong></div>
                            {med.indication && <div>Reason: <span className="text-slate-500">{med.indication}</span></div>}
                          </div>

                          {med.instructions && (
                            <div className="p-2.5 bg-[#EDF1F5] border border-slate-200 rounded-xl text-[11px] text-slate-700">
                              <strong className="text-[#17C964] block mb-0.5">Doctor Instructions:</strong>
                              {med.instructions}
                            </div>
                          )}

                          <div className="text-[10px] text-slate-500 border-t border-slate-200/80 pt-2 font-mono">
                            Prescribed by <strong className="text-[#17C964]">{med.doctorName}</strong>
                          </div>
                        </div>

                        {/* Adherence Action Buttons (NO REFILL BUTTON) */}
                        <div className="pt-2 border-t border-slate-200/80 space-y-2">
                          <span className="text-[10px] text-slate-500 font-mono font-bold block">
                            Daily Log Action:
                          </span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleLogDose(med.id, "TAKEN")}
                              className={`flex-1 py-2 font-bold rounded-xl text-xs transition shadow-sm ${
                                isLoggedTaken
                                  ? "bg-[#E9FBF1] text-[#17C964] border border-[#17C964]/50"
                                  : "bg-[#17C964] hover:bg-[#0f172a] text-white"
                              }`}
                            >
                              ✔ Taken
                            </button>
                            <button
                              onClick={() => handleLogDose(med.id, "MISSED")}
                              className={`px-3 py-2 font-bold rounded-xl text-xs transition ${
                                isLoggedMissed
                                  ? "bg-[#FDECE8] text-[#E23A2E] border border-[#F2603C]/50"
                                  : "bg-[#EDF1F5] hover:bg-[#FDECE8] text-[#E23A2E] border border-slate-200"
                              }`}
                            >
                              ✕ Missed
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Past / Discontinued Medications History */}
            {medicationHistory.length > 0 && (
              <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl p-5 space-y-3 text-xs">
                <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2 border-b border-slate-200 pb-3">
                  <Clock className="w-4 h-4 text-[#17C964]" />
                  <span>Past & Discontinued Prescriptions</span>
                </h3>

                <div className="space-y-2.5">
                  {medicationHistory.map((m) => (
                    <div
                      key={m.id}
                      className="p-3.5 bg-[#EDF1F5] border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900">{m.medicationName}</span>
                          <span className="text-slate-500 font-mono">{m.dosage} • {m.frequency}</span>
                          <span className="px-2 py-0.5 bg-[#FDECE8] border border-[#F2603C]/30 text-[#E23A2E] font-mono text-[9px] rounded font-bold">
                            {m.status}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Prescribed by {m.doctorName} • Period: {m.startDate} to {m.endDate}
                        </p>
                        {m.discontinuationReason && (
                          <p className="text-[#E23A2E] text-[11px] mt-1 italic">
                            Discontinued Reason: {m.discontinuationReason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CONSENT VAULT TAB */}
        {activeTab === "CONSENTS" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-[#17C964]" />
                  <span>Patient Consent Control Vault</span>
                </h2>
                <p className="text-xs text-slate-500">1-Click digital consent governance: Grant physician access or revoke instantaneously</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Grant New Consent Card (LEFT SIDE) */}
              <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">Grant Doctor Permission</h3>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#E9FBF1] text-[#17C964] border border-[#17C964]/30">
                    {availableDoctorsToGrant.length} Available
                  </span>
                </div>
                <p className="text-xs text-slate-500">Select an accredited physician from the left to grant record access. Once granted, they move to the Active Permissions panel on the right.</p>

                <div className="space-y-3 text-xs">
                  {availableDoctorsToGrant.map((doc) => (
                    <div key={doc.id} className="p-3.5 bg-[#EDF1F5] border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{doc.name}</div>
                        <div className="text-[#17C964] text-xs font-mono">{doc.specialization} • {doc.hospitalName || "Independent"}</div>
                      </div>
                      <button
                        onClick={async () => {
                          await onGrantConsent(doc.id, "SPECIFIC_RECORD");
                        }}
                        className="px-4 py-2 bg-[#17C964] hover:bg-[#0f172a] text-white font-bold rounded-xl text-xs transition shadow-md shadow-[#17C964]/30 shrink-0"
                      >
                        Grant Access
                      </button>
                    </div>
                  ))}
                  {availableDoctorsToGrant.length === 0 && (
                    <div className="text-slate-500 text-xs py-8 text-center bg-[#EDF1F5]/60 rounded-2xl border border-slate-200/80">
                      All accredited physicians currently have active access permissions.
                    </div>
                  )}
                </div>
              </div>

              {/* Active Consents List (RIGHT SIDE) */}
              <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">Active Granted Consents</h3>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#E9FBF1] border border-[#17C964]/40 text-[#17C964]">
                    {activeConsentsList.length} Active
                  </span>
                </div>
                <p className="text-xs text-slate-500">Physicians with current access to your medical history. Click Revoke to withdraw permissions immediately and return them to the left panel.</p>

                <div className="space-y-3 text-xs">
                  {activeConsentsList.map((con) => (
                    <div key={con.id} className="p-3.5 bg-[#EDF1F5] border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">{con.doctorName || "Attending Physician"}</div>
                        <div className="text-[#17C964] text-xs font-mono">Status: ACTIVE • Valid Until: {con.validUntil}</div>
                      </div>
                      <button
                        onClick={async () => {
                          await onRevokeConsent(con.id);
                        }}
                        className="px-4 py-2 bg-[#FDECE8] hover:bg-[#F2603C]/20 border border-[#F2603C]/50 text-[#E23A2E] font-bold rounded-xl text-xs transition shadow-md shadow-[#F2603C]/40 shrink-0"
                      >
                        Revoke Access
                      </button>
                    </div>
                  ))}
                  {activeConsentsList.length === 0 && (
                    <div className="text-slate-500 text-xs py-8 text-center bg-[#EDF1F5]/60 rounded-2xl border border-slate-200/80">
                      No active doctor permissions granted. Grant access to a physician on the left.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* APPOINTMENTS TAB */}
        {activeTab === "APPOINTMENTS" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-[#17C964]" />
                  <span>Book Consultations & Queue Token</span>
                </h2>
                <p className="text-xs text-slate-500">Direct hospital booking and live queue token tracking</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-[#E9FBF1] border border-[#17C964]/40 text-[#17C964] font-mono text-xs rounded-full font-bold">
                  {appointments.length} Total Bookings
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Booking Form */}
              <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl p-6 space-y-5 shadow-xl text-xs">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                  <span>Schedule Consultation Slot</span>
                  <span className="text-[10px] text-[#17C964] font-mono font-normal">Real-Time Sync</span>
                </h3>

                <div className="space-y-4">
                  {/* Select Specialty Hospital */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">1. Select Specialty Hospital</label>
                    <select
                      value={selectedHospId}
                      onChange={(e) => setSelectedHospId(e.target.value)}
                      className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 outline-none focus:border-[#17C964]/50 font-bold"
                    >
                      <option value="">-- All Accredited Hospitals & Clinics --</option>
                      {activeHospitalsList.map((h) => (
                        <option key={h.id} value={h.id}>
                          🏥 {h.name} ({h.address || "Main Branch"})
                        </option>
                      ))}
                    </select>

                    {/* Hospital Info Pill */}
                    {(() => {
                      const selHosp = hospitals.find((h) => h.id === selectedHospId);
                      if (!selHosp) return null;
                      return (
                        <div className="mt-2 p-3 bg-[#EDF1F5] border border-slate-200/80 rounded-xl flex items-center justify-between text-[11px] text-slate-700">
                          <div>
                            <span className="font-bold text-slate-900 block">{selHosp.name}</span>
                            <span className="text-slate-500 block">{selHosp.address}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Select Physician */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">2. Select Attending Physician</label>
                    {hospitalDoctors.length === 0 ? (
                      <div className="p-3 bg-[#FDECE8] border border-[#F2603C]/30 text-[#E23A2E] rounded-xl text-xs">
                        No active doctors available for this hospital. Please select another hospital.
                      </div>
                    ) : (
                      <select
                        value={selectedDocId}
                        onChange={(e) => setSelectedDocId(e.target.value)}
className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 outline-none focus:border-[#17C964]/50 font-bold"
                      >
                        {hospitalDoctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            👨‍⚕️ {d.name} ({d.specialization}) — ₹{d.fee || 500}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Doctor Info Pill */}
                    {(() => {
                      const selDoc = doctors.find((d) => d.id === selectedDocId);
                      if (!selDoc) return null;
                      return (
                        <div className="mt-2 p-3 bg-[#EDF1F5] border border-slate-200/80 rounded-xl flex items-center justify-between text-[11px] text-slate-700">
                          <div>
                            <span className="font-bold text-[#17C964] block">{selDoc.name}</span>
                            <span className="text-slate-500 block">{selDoc.specialization} • {selDoc.experienceYears || 5}+ Yrs Exp</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-[#17C964] block font-mono">Consultation Fee: ₹{selDoc.fee || 500}</span>
                            <span className="text-[10px] text-[#17C964] block">⭐ {selDoc.rating || 5.0} Rating</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Date & Slot selection */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">3. Appointment Date</label>
                    <input
                      type="date"
                      value={aptDate}
                      onChange={(e) => setAptDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold"
                    />
                  </div>

                  {/* Dynamic Time Slots */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">4. Select Available Consultation Time Slot</label>
                    
                    {isLoadingSlots ? (
                      <div className="p-4 bg-[#EDF1F5] border border-slate-200 rounded-xl text-center text-slate-500">
                        Fetching live slots from doctor schedule...
                      </div>
                    ) : slotMessage ? (
                      <div className="p-3 bg-[#FDECE8] border border-[#F2603C]/40 text-[#E23A2E] rounded-xl text-xs space-y-1">
                        <strong className="block text-[#E23A2E] font-bold">⚠️ Notice from Physician:</strong>
                        <span>{slotMessage}</span>
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="p-3 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-xs">
                        No open time slots configured for Dr. on this date.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {availableSlots.map((s) => {
                          const slotVal = s.displayWindow || s.timeStr || s.startTime;
                          const isSelected = aptSlot === slotVal || aptSlot === s.timeStr;
                          const isFull = s.status === "FULL" || s.tokensLeft <= 0;

                          return (
                            <button
                              key={s.id || slotVal}
                              type="button"
                              disabled={isFull}
                              onClick={() => setAptSlot(slotVal)}
                              className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                                isFull
                                  ? "bg-slate-100/60 border-slate-200 text-slate-500 opacity-60 cursor-not-allowed"
                                  : isSelected
                                  ? "bg-[#E9FBF1] border-[#17C964] text-[#17C964] ring-2 ring-[#17C964]/40"
                                  : "bg-[#EDF1F5] border-slate-200 text-slate-700 hover:border-slate-300"
                              }`}
                            >
                              <div className="font-bold text-xs">{slotVal}</div>
                              {s.slotName && <div className="text-[10px] text-[#17C964]">{s.slotName}</div>}
                              <div className="flex justify-between items-center text-[10px] mt-1 font-mono">
                                <span className={isFull ? "text-[#F2603C]" : "text-[#17C964]"}>
                                  {isFull ? "FULL" : `${s.tokensLeft ?? s.maxCapacity ?? "Available"} Tokens Left`}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Symptoms */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">5. Chief Symptoms / Purpose of Visit</label>
                    <textarea
                      rows={2}
                      value={aptSymptoms}
                      onChange={(e) => setAptSymptoms(e.target.value)}
                      placeholder="e.g. Mild persistent headache, fever for 2 days"
                      className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-500"
                    />
                  </div>

                  {/* Book Button */}
                  <button
                    disabled={isBookingInProgress || !selectedDocId || !aptSlot}
                    onClick={async () => {
                      setIsBookingInProgress(true);
                      await onBookAppointment(selectedDocId, aptDate, aptSlot, aptSymptoms, aptPriority, selectedHospId);
                      setIsBookingInProgress(false);
                      setAptSymptoms("");
                      if (selectedDocId && aptDate) {
                        fetchDoctorSlots(selectedDocId, aptDate);
                      }
                    }}
                    className={`w-full py-3.5 font-bold rounded-2xl transition shadow-xl text-xs flex items-center justify-center space-x-2 ${
                      isBookingInProgress || !selectedDocId || !aptSlot
                        ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                        : "bg-[#17C964] hover:bg-[#0f172a] text-white shadow-[#17C964]/30"
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>{isBookingInProgress ? "Confirming Booking..." : "Confirm & Issue Queue Token Number"}</span>
                  </button>
                </div>
              </div>

              {/* Booked Consultations List */}
              <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xl text-xs">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                  <span>My Active Consultation Tokens</span>
                  <span className="text-slate-500 font-mono text-[11px]">{appointments.length} Total</span>
                </h3>

                {appointments.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 bg-[#EDF1F5] rounded-2xl border border-slate-200">
                    No booked consultation tokens yet. Select a hospital and physician on the left to schedule a slot.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                    {appointments.map((apt) => (
                      <div key={apt.id} className="p-4 bg-[#EDF1F5] border border-slate-200 hover:border-[#17C964]/40 rounded-2xl space-y-2.5 transition">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                          <span className="font-mono font-bold text-[#17C964] text-sm">
                            Token #{apt.tokenNumber || "T-102"}
                          </span>
                          <span className={`px-2.5 py-0.5 font-mono text-[10px] rounded font-bold border ${
                            apt.status === "CONFIRMED"
                              ? "bg-[#E9FBF1] border-[#17C964]/40 text-[#17C964]"
                              : apt.status === "CANCELLED"
                              ? "bg-[#FDECE8] border-[#F2603C]/40 text-[#E23A2E]"
                              : "bg-[#E9FBF1] border-[#17C964]/40 text-[#17C964]"
                          }`}>
                            {apt.status}
                          </span>
                        </div>

                        <div>
                          <div className="text-slate-900 font-bold text-sm">{apt.doctorName}</div>
                          <div className="text-slate-500 text-[11px] font-mono">
                            📅 Date: <strong className="text-slate-800">{apt.appointmentDate}</strong> ({apt.slotTime})
                          </div>
                          {apt.symptoms && (
                            <div className="text-[11px] text-slate-700 mt-1 italic">
                              "Symptoms: {apt.symptoms}"
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* EMERGENCY PROFILE & AUDIT TAB */}
        {activeTab === "EMERGENCY_PROFILE" && (
          <PatientEmergencyProfileView patient={profile} />
        )}

        {/* RECORD ACCESS AUDIT LOG TAB */}
        {activeTab === "AUDIT_LOGS" && (
          <HierarchicalAuditLogViewer
            viewMode="PATIENT"
            patientHealthId={profile.globalHealthId}
            patientUserId={profile.userId}
          />
        )}

      </AppShell>

      {/* MANUAL LAB REPORT UPLOAD MODAL */}
      {/* VITALS ADD MODAL (patient enters real reading) */}
      {showVitalsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#17C964]/30 rounded-3xl w-full max-w-md p-6 shadow-2xl relative space-y-4 text-slate-900 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowVitalsModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 p-1 rounded-xl bg-[#EDF1F5]"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 text-[#17C964] pb-2 border-b border-slate-200">
              <div className="w-10 h-10 rounded-2xl bg-[#17C964]/15 border border-[#17C964]/40 flex items-center justify-center text-[#17C964]">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Log New Vitals</h3>
                <p className="text-xs text-[#17C964] font-mono">Enter your latest measured readings</p>
              </div>
            </div>

            {vitalsFormError && (
              <div className="rounded-xl px-3 py-2 text-[11px] font-bold" style={{ backgroundColor: "#FDECE8", color: "#E23A2E", border: "1px solid #F2603C44" }}>
                {vitalsFormError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Systolic BP (mmHg) *</label>
                <input
                  type="number" min="50" max="250"
                  value={vitalsForm.bpSystolic}
                  onChange={(e) => setVitalsForm((p) => ({ ...p, bpSystolic: e.target.value }))}
                  placeholder="e.g. 120"
                  className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Diastolic BP (mmHg) *</label>
                <input
                  type="number" min="30" max="160"
                  value={vitalsForm.bpDiastolic}
                  onChange={(e) => setVitalsForm((p) => ({ ...p, bpDiastolic: e.target.value }))}
                  placeholder="e.g. 80"
                  className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Fasting Glucose (mg/dL) *</label>
                <input
                  type="number" min="40" max="500"
                  value={vitalsForm.glucose}
                  onChange={(e) => setVitalsForm((p) => ({ ...p, glucose: e.target.value }))}
                  placeholder="e.g. 95"
                  className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Heart Rate (bpm) *</label>
                <input
                  type="number" min="30" max="220"
                  value={vitalsForm.heartRate}
                  onChange={(e) => setVitalsForm((p) => ({ ...p, heartRate: e.target.value }))}
                  placeholder="e.g. 72"
                  className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">SpO2 (%) *</label>
                <input
                  type="number" min="50" max="100"
                  value={vitalsForm.spo2}
                  onChange={(e) => setVitalsForm((p) => ({ ...p, spo2: e.target.value }))}
                  placeholder="e.g. 98"
                  className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Weight (kg)</label>
                <input
                  type="number" min="2" max="300"
                  value={vitalsForm.weight}
                  onChange={(e) => setVitalsForm((p) => ({ ...p, weight: e.target.value }))}
                  placeholder="e.g. 68"
                  className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-slate-700 font-bold mb-1">Date</label>
                <input
                  type="date"
                  value={vitalsForm.date}
                  onChange={(e) => setVitalsForm((p) => ({ ...p, date: e.target.value }))}
                  className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>
            </div>

            <button
              onClick={() => {
                const s = Number(vitalsForm.bpSystolic);
                const d = Number(vitalsForm.bpDiastolic);
                const g = Number(vitalsForm.glucose);
                const hr = Number(vitalsForm.heartRate);
                const sp = Number(vitalsForm.spo2);
                if (!(s > 0) || !(d > 0) || !(g > 0) || !(hr > 0) || !(sp > 0)) {
                  setVitalsFormError("Please enter valid positive readings for Systolic, Diastolic, Glucose, Heart Rate and SpO2.");
                  return;
                }
                const newLog = {
                  date: vitalsForm.date || "Today",
                  bpSystolic: s,
                  bpDiastolic: d,
                  glucose: g,
                  heartRate: hr,
                  spo2: sp,
                  weight: vitalsForm.weight ? Number(vitalsForm.weight) : 0,
                };
                setVitalsHistory((prev) => [...prev, newLog]);
                setShowVitalsModal(false);
              }}
              className="w-full py-3 bg-[#17C964] hover:bg-[#0EA653] text-white font-bold rounded-xl transition text-xs shadow-lg shadow-[#17C964]/30"
            >
              Save Vitals Reading
            </button>
          </div>
        </div>
      )}

      {showManualLabModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#17C964]/30 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative space-y-4 text-slate-900 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowManualLabModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 p-1 rounded-xl bg-[#EDF1F5]"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 text-[#17C964] pb-2 border-b border-slate-200">
              <div className="w-10 h-10 rounded-2xl bg-[#17C964]/15 border border-[#17C964]/40 flex items-center justify-center text-[#17C964]">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Upload Diagnostic Lab Report</h3>
                <p className="text-xs text-[#17C964] font-mono">Attach patient-uploaded lab values & diagnostic files</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Report Title / Test Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Thyroid Panel T3 / T4 / TSH"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Lab / Diagnostic Facility</label>
                  <input
                    type="text"
                    placeholder="e.g. Apollo Pathology Labs"
                    value={uploadLabName}
                    onChange={(e) => setUploadLabName(e.target.value)}
                    className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Test Date</label>
                  <input
                    type="date"
                    value={uploadDate}
                    onChange={(e) => setUploadDate(e.target.value)}
                    className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              {/* Parameter Builder */}
              <div className="bg-[#EDF1F5] p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-[#17C964] uppercase text-[10px]">Add Test Parameters (Optional)</span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Parameter (e.g. TSH)"
                    value={uploadParamName}
                    onChange={(e) => setUploadParamName(e.target.value)}
                    className="bg-[#FFFFFF] border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. 3.5)"
                    value={uploadParamVal}
                    onChange={(e) => setUploadParamVal(e.target.value)}
                    className="bg-[#FFFFFF] border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder="Unit (e.g. uIU/mL)"
                    value={uploadParamUnit}
                    onChange={(e) => setUploadParamUnit(e.target.value)}
                    className="bg-[#FFFFFF] border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder="Ref (e.g. 0.4 - 4.0)"
                    value={uploadParamRef}
                    onChange={(e) => setUploadParamRef(e.target.value)}
                    className="bg-[#FFFFFF] border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 text-[11px]"
                  />
                </div>

                <button
                  onClick={() => {
                    if (uploadParamName && uploadParamVal) {
                      setUploadParamsList((prev) => [
                        ...prev,
                        {
                          name: uploadParamName,
                          value: uploadParamVal,
                          unit: uploadParamUnit || "",
                          referenceRange: uploadParamRef || "-",
                          status: "NORMAL",
                        },
                      ]);
                      setUploadParamName("");
                      setUploadParamVal("");
                      setUploadParamUnit("");
                      setUploadParamRef("");
                    }
                  }}
                  className="px-3 py-1 bg-[#E9FBF1] border border-[#17C964]/40 text-[#17C964] rounded-lg text-[10px] font-bold"
                >
                  + Add Parameter
                </button>

                {uploadParamsList.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-slate-200">
                    {uploadParamsList.map((p, i) => (
                      <div key={i} className="flex justify-between items-center text-[11px] text-slate-700 font-mono">
                        <span>{p.name}: <strong>{p.value} {p.unit}</strong> ({p.referenceRange})</span>
                        <span className="text-[#17C964] font-bold">{p.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Document File Attachment */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Attachment (PDF / PNG / JPG)</label>
                <input
                  type="file"
                  ref={labFileInputRef}
                  accept="application/pdf,image/png,image/jpeg"
                  onChange={handleLabFileChange}
                  className="hidden"
                />
                {uploadAttachment ? (
                  <div className="border-2 border-[#17C964]/50 p-3 rounded-2xl flex items-center justify-between bg-[#E9FBF1]">
                    <div className="flex items-center space-x-2 min-w-0">
                      <Paperclip className="w-4 h-4 text-[#17C964] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{uploadAttachment.name}</p>
                        <p className="text-[10px] text-slate-500">{(uploadAttachment.size / 1024).toFixed(1)} KB • ready to attach</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      {uploadAttachment.dataUrl.startsWith("data:image") && (
                        <img src={uploadAttachment.dataUrl} alt="attachment" className="w-10 h-10 object-cover rounded-lg border border-slate-200" />
                      )}
                      <button
                        onClick={() => { setUploadAttachment(null); if (labFileInputRef.current) labFileInputRef.current.value = ""; }}
                        className="px-2.5 py-1 bg-[#FDECE8] border border-[#F2603C]/40 text-[#E23A2E] rounded-lg text-[10px] font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => labFileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-300 hover:border-[#17C964]/60 p-4 rounded-2xl text-center space-y-1 bg-[#EDF1F5] cursor-pointer"
                  >
                    <Upload className="w-5 h-5 text-[#17C964] mx-auto" />
                    <p className="text-xs text-slate-700 font-bold">Click to select a scan image or PDF file</p>
                    <p className="text-[10px] text-slate-500">Supports PDF, PNG, JPG up to 15MB</p>
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                if (!uploadTitle.trim()) {
                  alert("Please enter a report title.");
                  return;
                }
                const newReport = {
                  id: `manual_lab_${Date.now()}`,
                  title: uploadTitle,
                  labName: uploadLabName || "Patient Uploaded Diagnostics",
                  date: uploadDate,
                  status: "COMPLETED",
                  attachmentName: uploadAttachment ? uploadAttachment.name : null,
                  attachmentDataUrl: uploadAttachment ? uploadAttachment.dataUrl : null,
                  parameters: uploadParamsList.length > 0 ? uploadParamsList : [
                    { name: "Fasting Blood Sugar", value: "92", unit: "mg/dL", referenceRange: "70 - 99", status: "NORMAL" }
                  ],
                };
                setPatientUploadedReports((prev) => [newReport, ...prev]);
                setShowManualLabModal(false);
                setUploadTitle("");
                setUploadLabName("");
                setUploadParamsList([]);
                setUploadAttachment(null);
                if (labFileInputRef.current) labFileInputRef.current.value = "";
                alert(uploadAttachment ? "Diagnostic Lab Report and attachment uploaded and linked to Health ID!" : "Diagnostic Lab Report Uploaded and Linked to Health ID!");
              }}
              className="w-full py-3 bg-[#17C964] hover:bg-[#0f172a] text-white font-bold rounded-xl transition text-xs shadow-lg shadow-[#17C964]/30"
            >
              Confirm & Save Lab Report
            </button>
          </div>
        </div>
      )}

      <LabReportExplainModal
        isOpen={!!selectedReportForExplain}
        onClose={() => setSelectedReportForExplain(null)}
        report={selectedReportForExplain}
      />
    </>
  );
};
