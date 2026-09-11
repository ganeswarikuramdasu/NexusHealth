import React, { useState, useEffect } from "react";
import { HospitalProfile, DoctorProfile, AuditLog, MedicalRecord, PatientProfile, UserRole } from "../types";
import { PatientRecordsTable } from "./PatientRecordsTable";
import { HierarchicalAuditLogViewer } from "./HierarchicalAuditLogViewer";
import { AppShell, NavItem } from "./AppShell";
import { ComplaintCenter } from "./ComplaintCenter";
import { safeFetchJson, parseResponseSafe } from "../utils/api";
import {
  ShieldCheck,
  Building2,
  Stethoscope,
  FileText,
  Trash2,
  CheckCircle,
  XCircle,
  Users,
  Activity,
  KeyRound,
  Settings,
  X,
  Eye,
  EyeOff,
  Plus,
  BarChart3,
  Globe,
  Lock,
  Search,
  Filter,
  MessageSquareWarning,
  AlertTriangle,
  LayoutDashboard,
} from "lucide-react";

interface SuperAdminViewProps {
  hospitals: HospitalProfile[];
  doctors: DoctorProfile[];
  auditLogs: AuditLog[];
  records?: MedicalRecord[];
  patientProfiles?: PatientProfile[];
  onDeleteHospital: (hospitalId: string) => void;
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

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({
  hospitals,
  doctors,
  auditLogs,
  records = [],
  patientProfiles = [],
  onDeleteHospital,
  appUser,
  onLogout,
  onGoToHome,
}) => {
  const SUPER_ADMIN_TABS = ["DASHBOARD", "HOSPITALS", "DOCTORS", "AUDIT_LOGS", "PATIENTS", "RECORDS", "COMPLAINTS", "MALPRACTICES"];

  const [activeTab, setActiveTab] = useState<"DASHBOARD" | "HOSPITALS" | "DOCTORS" | "AUDIT_LOGS" | "PATIENTS" | "RECORDS" | "COMPLAINTS" | "MALPRACTICES">(() => {
    const saved = localStorage.getItem("nexushealth_tab_SUPER_ADMIN");
    return saved && SUPER_ADMIN_TABS.includes(saved) ? (saved as any) : "DASHBOARD";
  });

  useEffect(() => {
    try {
      localStorage.setItem("nexushealth_tab_SUPER_ADMIN", activeTab);
    } catch {
      // storage unavailable
    }
  }, [activeTab]);
  const [patientsList, setPatientsList] = useState<any[]>([]);
  const [selectedHospForDetail, setSelectedHospForDetail] = useState<HospitalProfile | null>(null);

  // Search & Filter States
  const [hospSearch, setHospSearch] = useState("");
  const [docSearch, setDocSearch] = useState("");
  const [patSearch, setPatSearch] = useState("");
  const [auditSearch, setAuditSearch] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("ALL");

  // Edit Hospital Modal State
  const [editingHospital, setEditingHospital] = useState<HospitalProfile | null>(null);
  const [editHospName, setEditHospName] = useState("");
  const [editHospEmail, setEditHospEmail] = useState("");
  const [editHospLicense, setEditHospLicense] = useState("");
  const [editHospAddress, setEditHospAddress] = useState("");
  const [editHospPhone, setEditHospPhone] = useState("");
  const [editHospCity, setEditHospCity] = useState("");
  const [editHospState, setEditHospState] = useState("");
  const [editHospPincode, setEditHospPincode] = useState("");
  const [editHospLat, setEditHospLat] = useState("");
  const [editHospLng, setEditHospLng] = useState("");
  const [editHospStatusMsg, setEditHospStatusMsg] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Hospital Provisioning Modal State
  const [showAddHospModal, setShowAddHospModal] = useState(false);
  const [newHospName, setNewHospName] = useState("");
  const [newHospEmail, setNewHospEmail] = useState("");
  const [newHospPassword, setNewHospPassword] = useState("");
  const [newHospLicense, setNewHospLicense] = useState("");
  const [newHospPhone, setNewHospPhone] = useState("");
  const [newHospCity, setNewHospCity] = useState("");
  const [newHospState, setNewHospState] = useState("");
  const [newHospPincode, setNewHospPincode] = useState("");
  const [newHospLat, setNewHospLat] = useState("");
  const [newHospLng, setNewHospLng] = useState("");
  const [addHospStatus, setAddHospStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Malpractice Tracker State
  const [malpracticeDoctors, setMalpracticeDoctors] = useState<any[]>([]);
  const [malpracticeLoading, setMalpracticeLoading] = useState(false);
  const [malpracticeError, setMalpracticeError] = useState<string | null>(null);
  const [incrementTarget, setIncrementTarget] = useState<string | null>(null);
  const [incrementReason, setIncrementReason] = useState("");
  const [incrementStatus, setIncrementStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchMalpracticeDoctors = async () => {
    setMalpracticeLoading(true);
    setMalpracticeError(null);
    try {
      const data = await safeFetchJson<any[]>("/api/admin/malpractice-doctors", undefined, []);
      setMalpracticeDoctors(Array.isArray(data) ? data : []);
    } catch (err) {
      setMalpracticeError("Failed to load malpractice data.");
    } finally {
      setMalpracticeLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "MALPRACTICES") fetchMalpracticeDoctors();
  }, [activeTab]);

  const handleIncrementMalpractice = async (doctorUserId: string) => {
    setIncrementStatus(null);
    try {
      const res = await fetch("/api/admin/malpractice-increment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorUserId,
          adminName: appUser?.name || "Super Admin",
          reason: incrementReason.trim() || undefined,
        }),
      });
      const data = await parseResponseSafe<any>(res, { success: false });
      if (data?.success) {
        setIncrementStatus({ type: "success", msg: data.message || "Malpractice count incremented." });
        setIncrementTarget(null);
        setIncrementReason("");
        fetchMalpracticeDoctors();
      } else {
        setIncrementStatus({ type: "error", msg: data?.message || "Failed to increment malpractice." });
      }
    } catch (err) {
      setIncrementStatus({ type: "error", msg: "Server error." });
    }
  };

  const handleResetMalpractice = async (doctorUserId: string) => {
    setIncrementStatus(null);
    try {
      const res = await fetch("/api/admin/malpractice-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorUserId,
          adminName: appUser?.name || "Super Admin",
        }),
      });
      const data = await parseResponseSafe<any>(res, { success: false });
      if (data?.success) {
        setIncrementStatus({ type: "success", msg: data.message || "Malpractice count reset." });
        fetchMalpracticeDoctors();
      } else {
        setIncrementStatus({ type: "error", msg: data?.message || "Failed to reset malpractice." });
      }
    } catch (err) {
      setIncrementStatus({ type: "error", msg: "Server error." });
    }
  };

  const openEditHospitalModal = (hosp: HospitalProfile) => {
    setEditingHospital(hosp);
    setEditHospName(hosp.name || "");
    setEditHospEmail(hosp.email || "");
    setEditHospLicense(hosp.licenseNumber || "");
    setEditHospAddress(hosp.address || "");
    setEditHospPhone(hosp.phone || "");
    setEditHospCity(hosp.city || "");
    setEditHospState(hosp.state || "");
    setEditHospPincode(hosp.pincode || "");
    setEditHospLat(hosp.latitude != null ? String(hosp.latitude) : "");
    setEditHospLng(hosp.longitude != null ? String(hosp.longitude) : "");
    setEditHospStatusMsg(null);
  };

  const handleSaveEditHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHospital) return;
    setEditHospStatusMsg(null);
    try {
      const res = await fetch("/api/admin/edit-hospital", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalId: editingHospital.id,
          name: editHospName,
          email: editHospEmail,
          licenseNumber: editHospLicense,
          address: editHospAddress,
          phone: editHospPhone,
          location: editHospCity,
          city: editHospCity,
          state: editHospState,
          pincode: editHospPincode,
          latitude: editHospLat ? Number(editHospLat) : undefined,
          longitude: editHospLng ? Number(editHospLng) : undefined,
        }),
      });
      const data = await parseResponseSafe<any>(res, { success: false, message: "Failed to update hospital." });
      if (!res.ok || !data || !data.success) {
        setEditHospStatusMsg({ type: "error", msg: data?.message || "Failed to update hospital." });
        return;
      }
      setEditHospStatusMsg({ type: "success", msg: "Hospital updated successfully!" });
      editingHospital.name = editHospName;
      editingHospital.email = editHospEmail;
      editingHospital.licenseNumber = editHospLicense;
      editingHospital.address = editHospAddress;
      editingHospital.phone = editHospPhone;
      editingHospital.location = editHospCity;
      editingHospital.city = editHospCity;
      editingHospital.state = editHospState;
      editingHospital.pincode = editHospPincode;
      editingHospital.latitude = editHospLat ? Number(editHospLat) : undefined;
      editingHospital.longitude = editHospLng ? Number(editHospLng) : undefined;
      setTimeout(() => {
        setEditingHospital(null);
        setEditHospStatusMsg(null);
      }, 1200);
    } catch (err) {
      setEditHospStatusMsg({ type: "error", msg: "Server communication error." });
    }
  };

  const handleDeleteDoctor = async (doctorId: string, doctorName: string) => {
    if (!window.confirm(`Are you sure you want to delete physician '${doctorName}' from the master register?`)) return;
    try {
      const res = await fetch("/api/admin/delete-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId }),
      });
      const data = await parseResponseSafe<any>(res, { success: false, message: "Failed to delete physician." });
      if (data && data.success) {
        const idx = doctors.findIndex((d) => d.id === doctorId);
        if (idx !== -1) doctors.splice(idx, 1);
        alert(`Physician '${doctorName}' removed successfully.`);
      } else {
        alert(data?.message || "Failed to delete physician.");
      }
    } catch (err) {
      alert("Error communicating with server.");
    }
  };

  const handleProvisionHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddHospStatus(null);
    try {
      const res = await fetch("/api/admin/add-hospital", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newHospName,
          email: newHospEmail,
          password: newHospPassword,
          licenseNumber: newHospLicense || undefined,
          phone: newHospPhone || undefined,
          city: newHospCity || undefined,
          state: newHospState || undefined,
          pincode: newHospPincode || undefined,
          latitude: newHospLat ? Number(newHospLat) : undefined,
          longitude: newHospLng ? Number(newHospLng) : undefined,
        }),
      });
      const data = await parseResponseSafe<any>(res, { success: false, message: "Failed to provision hospital." });
      if (!res.ok || !data || !data.success) {
        setAddHospStatus({ type: "error", msg: data?.message || "Failed to provision hospital." });
        return;
      }
      setAddHospStatus({ type: "success", msg: data.message || `Hospital '${newHospName}' provisioned!` });
      if (data.hospital) {
        hospitals.unshift(data.hospital);
      }
      setTimeout(() => {
        setShowAddHospModal(false);
        setNewHospName("");
        setNewHospEmail("");
        setAddHospStatus(null);
      }, 1800);
    } catch (err) {
      setAddHospStatus({ type: "error", msg: "Server communication error." });
    }
  };

  const fetchPatients = async () => {
    try {
      const data = await safeFetchJson<any[]>("/api/admin/patients", undefined, []);
      setPatientsList(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === "PATIENTS") {
      fetchPatients();
    }
  }, [activeTab]);

  const navTabs = [
    { key: "DASHBOARD", label: "Dashboard", icon: LayoutDashboard },
    { key: "HOSPITALS", label: "Hospitals", icon: Building2, count: (hospitals || []).length },
    { key: "DOCTORS", label: "Licensed Physicians", icon: Stethoscope, count: (doctors || []).length },
    { key: "PATIENTS", label: "Registered Citizens", icon: Users },
    { key: "RECORDS", label: "Global EHR & Lab Ledger", icon: FileText, badge: "Global" },
    { key: "AUDIT_LOGS", label: "256-Bit System Audit Ledger", icon: Lock, badge: "Immutable" },
    { key: "COMPLAINTS", label: "Complaints Hub", icon: MessageSquareWarning, badge: "Handle" },
    { key: "MALPRACTICES", label: "Malpractice Tracker", icon: AlertTriangle, badge: "CRITICAL" },
  ];

  const navItems: NavItem[] = navTabs.map((t) => ({
    id: t.key as string,
    label: t.label,
    icon: t.icon,
    count: t.count,
    badge: t.badge,
  }));

  const shellUser = appUser || {
    id: "super_admin",
    name: "Super Admin",
    email: "superadmin@nexushealth.org",
    role: "SUPER_ADMIN" as UserRole,
  };

  return (
    <>
      <AppShell
        user={shellUser}
        roleLabel="Root Governance"
        subtitle="National Gateway"
        navItems={navItems}
        active={activeTab}
        onSelect={(k) => setActiveTab(k as any)}
        onLogout={onLogout}
        onGoToHome={onGoToHome}
      >

        {/* DASHBOARD TAB */}
        {activeTab === "DASHBOARD" && (
          <div className="space-y-6">
            {/* Network Hero Header */}
            <div className="bg-gradient-to-r from-[#17C964] via-[#0f172a] to-[#0f172a] border border-[#17C964]/30 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-white/10 border border-white/40 rounded-full text-xs font-mono font-bold text-white">
                  <Globe className="w-3.5 h-3.5" />
                  <span>NATIONAL HEALTH NETWORK ONLINE</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Super Admin Command Center: <span className="bg-gradient-to-r from-[#3CE584] to-[#17C964] bg-clip-text text-transparent">{appUser?.name || "NexusHealth"}</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-200 max-w-xl">
                  Govern the whole NexusHealth network: hospitals, licensed physicians, patients, the global EHR ledger, audit trails, complaints, and the malpractice tracker.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("MALPRACTICES")}
                className="px-5 py-3 bg-[#F2603C] hover:bg-[#E23A2E] text-white font-bold rounded-2xl shadow-lg shadow-[#F2603C]/40 text-xs transition flex items-center space-x-2 border border-[#F2603C]/40"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Open Malpractice Tracker</span>
              </button>
            </div>

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-5 space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 font-bold">Registered Hospitals</p>
                  <Building2 className="w-5 h-5 text-[#17C964]" />
                </div>
                <p className="text-3xl font-black text-slate-900">{(hospitals || []).length}</p>
                <p className="text-[10px] text-slate-400 font-mono">{(hospitals || []).filter((h) => h.status === "APPROVED").length} APPROVED</p>
              </div>
              <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-5 space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 font-bold">Licensed Physicians</p>
                  <Stethoscope className="w-5 h-5 text-[#17C964]" />
                </div>
                <p className="text-3xl font-black text-slate-900">{(doctors || []).length}</p>
                <p className="text-[10px] text-slate-400 font-mono">{(doctors || []).filter((d) => d.status === "APPROVED").length} APPROVED</p>
              </div>
              <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-5 space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 font-bold">Registered Patients</p>
                  <Users className="w-5 h-5 text-[#17C964]" />
                </div>
                <p className="text-3xl font-black text-slate-900">{patientProfiles?.length || 0}</p>
                <p className="text-[10px] text-slate-400 font-mono">PORTABLE CITIZEN EHR</p>
              </div>
              <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-5 space-y-2 shadow-md">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 font-bold">Malpractice Flags</p>
                  <AlertTriangle className="w-5 h-5 text-[#E23A2E]" />
                </div>
                <p className="text-3xl font-black text-slate-900">{(doctors || []).filter((d) => (d.malpracticeCount || 0) > 0).length}</p>
                <p className="text-[10px] text-slate-400 font-mono">{(doctors || []).filter((d) => (d.malpracticeCount || 0) >= 3).length} ACCOUNTS DELETED</p>
              </div>
            </div>

            {/* Middle Row: Records + Audit + Complaints Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-5 shadow-md flex items-start space-x-3">
                <FileText className="w-5 h-5 text-[#17C964] shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-500">Global EHR & Lab Ledger</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{(records || []).length}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">MEDICAL RECORDS</p>
                  <button onClick={() => setActiveTab("RECORDS")} className="text-[10px] text-[#17C964] font-bold mt-2 hover:underline">
                    Browse Global EHR Ledger →
                  </button>
                </div>
              </div>
              <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-5 shadow-md flex items-start space-x-3">
                <Lock className="w-5 h-5 text-[#17C964] shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-500">Immutamble Audit Ledger</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{(auditLogs || []).length}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">AUDIT EVENTS</p>
                  <button onClick={() => setActiveTab("AUDIT_LOGS")} className="text-[10px] text-[#17C964] font-bold mt-2 hover:underline">
                    Open 256-Bit Audit Ledger →
                  </button>
                </div>
              </div>
              <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-5 shadow-md flex items-start space-x-3">
                <MessageSquareWarning className="w-5 h-5 text-[#17C964] shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-500">Complaints Hub</p>
                  <p className="text-[11px] text-slate-500 mt-1">Handle incoming patient complaints, update status, and reply to patients.</p>
                  <button onClick={() => setActiveTab("COMPLAINTS")} className="text-[10px] text-[#17C964] font-bold mt-2 hover:underline">
                    Open Complaints Hub →
                  </button>
                </div>
              </div>
            </div>

            {/* Quick navigation tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button onClick={() => setActiveTab("HOSPITALS")} className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-4 shadow-md hover:border-[#17C964]/40 transition flex items-center space-x-3 text-left">
                <Building2 className="w-5 h-5 text-[#17C964]" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Hospitals</p>
                  <p className="text-[9px] text-slate-400 font-mono">APPROVE / EDIT</p>
                </div>
              </button>
              <button onClick={() => setActiveTab("DOCTORS")} className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-4 shadow-md hover:border-[#17C964]/40 transition flex items-center space-x-3 text-left">
                <Stethoscope className="w-5 h-5 text-[#17C964]" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Physicians</p>
                  <p className="text-[9px] text-slate-400 font-mono">MASTER DIRECTORY</p>
                </div>
              </button>
              <button onClick={() => setActiveTab("PATIENTS")} className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-4 shadow-md hover:border-[#17C964]/40 transition flex items-center space-x-3 text-left">
                <Users className="w-5 h-5 text-[#17C964]" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Patients</p>
                  <p className="text-[9px] text-slate-400 font-mono">REGISTERED CITIZENS</p>
                </div>
              </button>
              <button onClick={() => setActiveTab("MALPRACTICES")} className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-4 shadow-md hover:border-red-300 transition flex items-center space-x-3 text-left">
                <AlertTriangle className="w-5 h-5 text-[#E23A2E]" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Malpractice Tracker</p>
                  <p className="text-[9px] text-slate-400 font-mono">3+ = ACCOUNT DELETED</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* HOSPITALS TAB */}
        {activeTab === "HOSPITALS" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-[#17C964]" />
                  <span>National Health Hospital Nodes</span>
                </h2>
                <p className="text-xs text-slate-500">Accredited hospital networks and specialty clinics</p>
              </div>

              <button
                onClick={() => setShowAddHospModal(true)}
                className="px-4 py-2.5 bg-[#17C964] hover:bg-[#0f172a] text-white font-bold rounded-xl text-xs transition flex items-center space-x-2 shadow-md shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Provision New Hospital</span>
              </button>
            </div>

            {/* Hospital Search Bar */}
            <div className="relative w-full bg-[#FFFFFF] border border-slate-200 p-3 rounded-2xl">
              <Search className="w-4 h-4 text-slate-500 absolute left-6 top-5" />
              <input
                type="text"
                placeholder="Search hospitals by Name, License Number, Address, or Email..."
                value={hospSearch}
                onChange={(e) => setHospSearch(e.target.value)}
                className="w-full bg-[#EDF1F5] border border-slate-200                             rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#17C964]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(hospitals || [])
                .filter((hosp) => {
                  const q = (hospSearch || "").toLowerCase();
                  return (
                    !q ||
                    (hosp.name || "").toLowerCase().includes(q) ||
                    (hosp.licenseNumber || "").toLowerCase().includes(q) ||
                    (hosp.address || "").toLowerCase().includes(q) ||
                    (hosp.email || "").toLowerCase().includes(q)
                  );
                })
                .map((hosp) => (
                  <div key={hosp.id} className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-5 space-y-3 shadow-md hover:border-[#17C964]/40 transition">
                    <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-[#17C964]/15 border border-[#17C964]/40 flex items-center justify-center text-[#17C964] font-bold text-sm">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900">{hosp.name}</h3>
                          <p className="text-xs text-[#17C964] font-mono">{hosp.email}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-[#E9FBF1] border border-[#17C964]/40 text-[#17C964] text-[10px] font-mono font-bold rounded-lg">
                        {hosp.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 font-mono">
                      <div>License: <strong className="text-[#17C964]">{hosp.licenseNumber}</strong></div>
                      <div>Phone: <strong className="text-[#17C964]">{hosp.phone || "N/A"}</strong></div>
                      <div className="col-span-2 text-slate-500 text-[10px]">{hosp.city || ""}{hosp.state ? `, ${hosp.state}` : ""}{hosp.pincode ? ` - ${hosp.pincode}` : ""}</div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center gap-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedHospForDetail(hosp)}
                          className="px-3 py-1.5 bg-[#17C964] hover:bg-[#0f172a] text-white font-bold rounded-xl text-xs transition flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>

                        <button
                          onClick={() => openEditHospitalModal(hosp)}
                          className="px-3 py-1.5 bg-[#17C964] hover:bg-[#0f172a] text-white font-bold rounded-xl text-xs transition flex items-center space-x-1"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>

                      <button
                        onClick={() => onDeleteHospital(hosp.id)}
                        className="px-3 py-1.5 bg-[#FDECE8] hover:bg-[#FBE0DA] border border-[#F2603C]/40 text-[#E23A2E] text-xs font-bold rounded-xl transition flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Decommission</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* DOCTORS TAB */}
        {activeTab === "DOCTORS" && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <Stethoscope className="w-5 h-5 text-[#17C964]" />
                <span>All Licensed Physicians Across Network</span>
              </h2>
              <p className="text-xs text-slate-500">Master physician directory, licensures, and clinical specializations</p>
            </div>

            {/* Doctor Search Bar */}
            <div className="relative w-full bg-[#FFFFFF] border border-slate-200 p-3 rounded-2xl">
              <Search className="w-4 h-4 text-slate-500 absolute left-6 top-5" />
              <input
                type="text"
                placeholder="Search doctors by Name, Specialization, MCI License, or Hospital..."
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                className="w-full bg-[#EDF1F5] border border-slate-200                             rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#17C964]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(doctors || [])
                .filter((doc) => {
                  const q = (docSearch || "").toLowerCase();
                  return (
                    !q ||
                    (doc.name || "").toLowerCase().includes(q) ||
                    (doc.specialization || "").toLowerCase().includes(q) ||
                    (doc.licenseNumber || "").toLowerCase().includes(q) ||
                    (doc.hospitalName || "").toLowerCase().includes(q)
                  );
                })
                .map((doc) => (
                  <div key={doc.id} className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-5 space-y-3 shadow-md hover:border-[#17C964]/40 transition">
                    <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{doc.name}</h3>
                        <p className="text-xs text-[#17C964] font-mono">{doc.specialization}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-[#E9FBF1] border border-[#17C964]/40 text-[#17C964] text-[10px] font-mono rounded">
                        {doc.status}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs font-mono text-slate-700">
                      <div>License: <strong className="text-[#17C964]">{doc.licenseNumber}</strong></div>
                      <div>Hospital: <strong className="text-slate-900">{doc.hospitalName || "Independent"}</strong></div>
                      <div>Experience: <strong className="text-[#17C964]">{doc.experienceYears} Years</strong></div>
                      <div>Fee: <strong className="text-[#17C964]">₹{doc.fee}</strong></div>
                      {(doc.malpracticeCount ?? 0) > 0 && (
                        <div className="flex items-center space-x-1">
                          <span>Malpractice:</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            (doc.malpracticeCount ?? 0) >= 3
                              ? "bg-red-100 text-red-700 border border-red-300"
                              : "bg-amber-50 text-amber-700 border border-amber-300"
                          }`}>
                            {doc.malpracticeCount}
                          </span>
                          {(doc.malpracticeCount ?? 0) >= 3 && (
                            <span className="text-[9px] text-red-600 font-bold">ACCOUNT DELETED</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-end">
                      <button
                        onClick={() => handleDeleteDoctor(doc.id, doc.name)}
                        className="px-3 py-1.5 bg-[#FDECE8] hover:bg-[#FBE0DA] border border-[#F2603C]/40 text-[#E23A2E] text-xs font-bold rounded-xl transition flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Physician</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* PATIENTS TAB */}
        {activeTab === "PATIENTS" && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <Users className="w-5 h-5 text-[#17C964]" />
                <span>Registered Citizens & Universal Health Profiles</span>
              </h2>
              <p className="text-xs text-slate-500">Citizens with registered lifelong Health IDs</p>
            </div>

            <div className="relative w-full bg-[#FFFFFF] border border-slate-200 p-3 rounded-2xl">
              <Search className="w-4 h-4 text-slate-500 absolute left-6 top-5" />
              <input
                type="text"
                placeholder="Search citizens by Name, Health ID, or Email..."
                value={patSearch}
                onChange={(e) => setPatSearch(e.target.value)}
                className="w-full bg-[#EDF1F5] border border-slate-200                             rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#17C964]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {patientsList
                .filter((p) => {
                  return (
                    (p.name && p.name.toLowerCase().includes(patSearch.toLowerCase())) ||
                    (p.globalHealthId && p.globalHealthId.toLowerCase().includes(patSearch.toLowerCase())) ||
                    (p.email && p.email.toLowerCase().includes(patSearch.toLowerCase()))
                  );
                })
                .map((p, idx) => (
                  <div key={idx} className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-5 space-y-2 shadow-md">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <h3 className="font-bold text-slate-900 text-sm">{p.name || "Patient Citizen"}</h3>
                      <span className="px-2 py-0.5 bg-[#E9FBF1] border border-[#17C964]/40 text-[#17C964] text-[10px] font-mono rounded">
                        {p.globalHealthId || "NH-IND-2026-PAT01"}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-500 space-y-1">
                      <div>Email: <strong className="text-slate-800">{p.email || "patient@nexushealth.org"}</strong></div>
                      <div>Role: <strong className="text-[#17C964]">PATIENT CITIZEN</strong></div>
                    </div>
                  </div>
                ))}

              {patientsList.length === 0 && (
                <div className="col-span-full bg-[#FFFFFF] p-8 text-center text-xs text-slate-500 border border-slate-200 rounded-2xl">
                  Loading citizen profiles registry...
                </div>
              )}
            </div>
          </div>
        )}

        {/* GLOBAL EHR & LAB LEDGER TAB */}
        {activeTab === "RECORDS" && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-[#17C964]" />
                <span>Global Health System EHR Ledger & Diagnostic Records</span>
              </h2>
              <p className="text-xs text-slate-500">Master repository of all electronic health records, prescriptions & lab reports</p>
            </div>

            <PatientRecordsTable
              records={records}
              patients={patientProfiles}
              doctorName="Super Admin Master Governance"
            />
          </div>
        )}

        {/* AUDIT LOGS TAB */}
        {activeTab === "AUDIT_LOGS" && (
          <HierarchicalAuditLogViewer viewMode="SUPER_ADMIN" />
        )}

        {/* COMPLAINTS HUB TAB */}
        {activeTab === "COMPLAINTS" && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <MessageSquareWarning className="w-5 h-5 text-[#F2603C]" />
                <span>National Complaints Hub</span>
              </h2>
              <p className="text-xs text-slate-500">
                Every complaint raised by patients, doctors, and hospital admins across all modules. Resolve with an official note.
              </p>
            </div>
            <ComplaintCenter
              appUser={{
                id: appUser?.id || "super_admin",
                name: appUser?.name || "Super Admin",
                email: appUser?.email || "superadmin@nexushealth.org",
                role: appUser?.role || "SUPER_ADMIN",
              }}
              module="SUPER_ADMIN"
            />
          </div>
        )}

        {/* MALPRACTICES TAB */}
        {activeTab === "MALPRACTICES" && (
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-[#E23A2E]" />
                <span>Malpractice Tracker</span>
              </h2>
              <p className="text-xs text-slate-500">Doctors with confirmed patient complaints. At 3 malpractices, accounts are automatically deleted.</p>
            </div>

            {incrementStatus && (
              <div className={`p-3 rounded-xl border text-xs font-medium flex items-center space-x-2 ${
                incrementStatus.type === "success"
                  ? "bg-[#E9FBF1] text-[#0EA653] border-[#17C964]/30"
                  : "bg-[#FDECE8] text-[#E23A2E] border-[#F2603C]/30"
              }`}>
                <span>{incrementStatus.msg}</span>
              </div>
            )}

            {malpracticeLoading ? (
              <div className="p-8 text-center text-slate-500 text-sm">Loading malpractice data...</div>
            ) : malpracticeError ? (
              <div className="p-8 text-center text-[#E23A2E] text-sm">{malpracticeError}</div>
            ) : malpracticeDoctors.length === 0 ? (
              <div className="p-8 bg-[#FFFFFF] border border-slate-200 rounded-2xl text-center">
                <CheckCircle className="w-12 h-12 text-[#17C964] mx-auto mb-3" />
                <p className="text-slate-900 font-bold">No Malpractice Records</p>
                <p className="text-xs text-slate-500">No doctors currently have malpractice counts. All physicians are in good standing.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {malpracticeDoctors.map((doc) => (
                  <div key={doc.id} className={`bg-[#FFFFFF] border rounded-2xl p-5 space-y-3 shadow-md transition ${
                    doc.status === "DELETED"
                      ? "border-red-300 bg-red-50/30"
                      : doc.malpracticeCount >= 2
                      ? "border-amber-300 bg-amber-50/30"
                      : "border-slate-200"
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{doc.name}</h3>
                        <p className="text-xs text-slate-500">{doc.email}</p>
                        <p className="text-xs text-[#17C964] font-mono">{doc.specialization} at {doc.hospitalName}</p>
                      </div>
                      <div className="text-right">
                        <div className={`px-3 py-1 rounded-xl text-sm font-bold border ${
                          doc.malpracticeCount >= 3
                            ? "bg-red-100 text-red-700 border-red-300"
                            : doc.malpracticeCount >= 2
                            ? "bg-amber-100 text-amber-700 border-amber-300"
                            : "bg-orange-100 text-orange-700 border-orange-300"
                        }`}>
                          {doc.malpracticeCount} Malpractice{doc.malpracticeCount !== 1 ? "s" : ""}
                        </div>
                        {doc.status === "DELETED" && (
                          <span className="mt-1 inline-block px-2 py-0.5 bg-red-100 text-red-700 border border-red-300 rounded text-[9px] font-bold">
                            ACCOUNT DELETED
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2 border-t border-slate-200">
                      {incrementTarget === doc.id ? (
                        <span className="flex items-center space-x-2 w-full">
                          <input
                            value={incrementReason}
                            onChange={(e) => setIncrementReason(e.target.value)}
                            placeholder="Reason for malpractice (optional)..."
                            className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs outline-none"
                            onKeyDown={(e) => { if (e.key === "Enter") handleIncrementMalpractice(doc.id); }}
                          />
                          <button
                            onClick={() => handleIncrementMalpractice(doc.id)}
                            className="px-3 py-1.5 bg-[#E23A2E] hover:bg-red-700 text-white font-bold rounded-lg text-[10px]"
                          >
                            Confirm +1
                          </button>
                          <button
                            onClick={() => { setIncrementTarget(null); setIncrementReason(""); }}
                            className="px-2 py-1.5 text-slate-400 hover:text-slate-700 text-[10px]"
                          >
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <>
                          {doc.status !== "DELETED" && (
                            <button
                              onClick={() => { setIncrementTarget(doc.id); setIncrementReason(""); }}
                              className="px-3 py-1.5 bg-[#FDECE8] hover:bg-[#FBE0DA] border border-[#F2603C]/40 text-[#E23A2E] text-xs font-bold rounded-xl transition"
                            >
                              +1 Malpractice
                            </button>
                          )}
                          {doc.malpracticeCount > 0 && (
                            <button
                              onClick={() => handleResetMalpractice(doc.id)}
                              className="px-3 py-1.5 bg-[#E9FBF1] hover:bg-[#D7F6E5] border border-[#17C964]/40 text-[#0EA653] text-xs font-bold rounded-xl transition"
                            >
                              Reset to 0{doc.status === "DELETED" ? " & Reactivate" : ""}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </AppShell>

      {/* PROVISION HOSPITAL MODAL */}
      {showAddHospModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative space-y-4 text-slate-900">
            <button
              onClick={() => setShowAddHospModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 p-1 rounded-xl bg-[#EDF1F5]"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 text-[#17C964] pb-2 border-b border-slate-200">
              <Building2 className="w-6 h-6" />
              <div>
                <h3 className="font-bold text-slate-900 text-base">Provision New Hospital Node</h3>
                <p className="text-xs text-slate-500">Connect specialty hospital to National Health Gateway</p>
              </div>
            </div>

            {addHospStatus && (
              <div className={`p-3 rounded-xl text-xs font-bold ${
                addHospStatus.type === "success" ? "bg-[#E9FBF1] text-[#17C964] border border-[#17C964]/40" : "bg-[#FDECE8] text-[#E23A2E] border border-[#F2603C]/40"
              }`}>
                {addHospStatus.msg}
              </div>
            )}

            <form onSubmit={handleProvisionHospital} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Hospital Name</label>
                <input
                  type="text"
                  required
                  value={newHospName}
                  onChange={(e) => setNewHospName(e.target.value)}
                  placeholder="Max Super Speciality Hospital"
                  className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-[#17C964]/50"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Hospital Admin Email</label>
                <input
                  type="email"
                  required
                  value={newHospEmail}
                  onChange={(e) => setNewHospEmail(e.target.value)}
                  placeholder="admin@maxhealth.org"
                  className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-[#17C964]/50"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Admin Password</label>
                <input
                  type="text"
                  required
                  value={newHospPassword}
                  onChange={(e) => setNewHospPassword(e.target.value)}
                  className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">License Number</label>
                  <input
                    type="text"
                    required
                    value={newHospLicense}
                    onChange={(e) => setNewHospLicense(e.target.value)}
                    placeholder="e.g. HOSP-2026-DL-801"
                    className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono outline-none focus:border-[#17C964]/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Landline / Phone</label>
                  <input
                    type="text"
                    required
                    value={newHospPhone}
                    onChange={(e) => setNewHospPhone(e.target.value)}
                    placeholder="e.g. +91 11 4000 7000"
                    className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono outline-none focus:border-[#17C964]/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">City / Area</label>
                  <input
                    type="text"
                    value={newHospCity}
                    onChange={(e) => setNewHospCity(e.target.value)}
                    placeholder="e.g. Banjara Hills, Hyderabad"
                    className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-[#17C964]/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">State</label>
                  <input
                    type="text"
                    value={newHospState}
                    onChange={(e) => setNewHospState(e.target.value)}
                    placeholder="e.g. Telangana"
                    className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-[#17C964]/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Pincode</label>
                  <input
                    type="text"
                    value={newHospPincode}
                    onChange={(e) => setNewHospPincode(e.target.value)}
                    placeholder="500034"
                    className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-[#17C964]/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={newHospLat}
                    onChange={(e) => setNewHospLat(e.target.value)}
                    placeholder="17.3850"
                    className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-[#17C964]/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={newHospLng}
                    onChange={(e) => setNewHospLng(e.target.value)}
                    placeholder="78.4867"
                    className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-[#17C964]/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#17C964] hover:bg-[#0EA653] text-white font-bold rounded-xl transition shadow-lg shadow-[#17C964]/30 text-xs"
              >
                Provision Node & Connect Stack
              </button>
            </form>
          </div>
        </div>
      )}

      {/* HOSPITAL INSPECT FULL DETAILS MODAL */}
      {selectedHospForDetail && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#17C964]/30 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative space-y-4 text-slate-900">
            <button
              onClick={() => setSelectedHospForDetail(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 p-1 rounded-xl bg-[#EDF1F5]"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 text-[#17C964] pb-2 border-b border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-[#17C964]/15 border border-[#17C964]/40 flex items-center justify-center text-[#17C964] font-bold text-lg">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{selectedHospForDetail.name}</h3>
                <p className="text-xs text-[#17C964] font-mono">License: {selectedHospForDetail.licenseNumber} • Status: {selectedHospForDetail.status}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="bg-[#EDF1F5] p-4 rounded-2xl border border-slate-200 space-y-2">
                <div>Hospital Admin Login: <strong className="text-[#17C964]">{selectedHospForDetail.email}</strong></div>
                {selectedHospForDetail.phone && <div>Landline / Phone: <strong className="text-[#17C964]">{selectedHospForDetail.phone}</strong></div>}
                {selectedHospForDetail.city && <div>City: <strong className="text-slate-800">{selectedHospForDetail.city}</strong></div>}
                {selectedHospForDetail.state && <div>State: <strong className="text-slate-800">{selectedHospForDetail.state}</strong></div>}
                {selectedHospForDetail.pincode && <div>Pincode: <strong className="text-slate-800">{selectedHospForDetail.pincode}</strong></div>}
              </div>

              <div className="bg-[#EDF1F5] p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-[#17C964] uppercase text-[10px]">Active Hospital Departments</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {((selectedHospForDetail as any).departments || []).length > 0 ? (
                    ((selectedHospForDetail as any).departments || []).map((dept: string, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 bg-[#E9FBF1] border border-[#17C964]/40 text-[#17C964] rounded-lg text-[10px]">
                        {dept}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No departments added yet</span>
                  )}
                </div>
              </div>

              <div className="bg-[#EDF1F5] p-4 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-[#17C964] uppercase text-[10px]">Affiliated Doctors Count</span>
                <div className="text-sm font-bold text-slate-900">
                  {doctors.filter((d) => d.hospitalId === selectedHospForDetail.id || d.hospitalName === selectedHospForDetail.name).length} Accredited Physicians On Roster
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedHospForDetail(null)}
              className="w-full py-2.5 bg-[#17C964] hover:bg-[#0f172a] text-white font-bold rounded-xl transition text-xs"
            >
              Close Hospital Profile
            </button>
          </div>
        </div>
      )}

      {/* EDIT HOSPITAL MODAL */}
      {editingHospital && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative space-y-4 text-slate-900">
            <button
              onClick={() => setEditingHospital(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 p-1 rounded-xl bg-[#EDF1F5]"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 text-[#17C964] pb-2 border-b border-slate-200">
              <Building2 className="w-6 h-6" />
              <div>
                <h3 className="font-bold text-slate-900 text-base">Edit Hospital Profile & Contact</h3>
                <p className="text-xs text-slate-500">Update node metadata, licensure, and contact details</p>
              </div>
            </div>

            {editHospStatusMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold ${
                  editHospStatusMsg.type === "success"
                    ? "bg-[#E9FBF1] text-[#17C964] border border-[#17C964]/40"
                    : "bg-[#FDECE8] text-[#E23A2E] border border-[#F2603C]/40"
                }`}
              >
                {editHospStatusMsg.msg}
              </div>
            )}

            <form onSubmit={handleSaveEditHospital} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Hospital Name</label>
                <input
                  type="text"
                  required
                  value={editHospName}
                  onChange={(e) => setEditHospName(e.target.value)}
                  className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-[#17C964]/50"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Hospital Admin Email</label>
                <input
                  type="email"
                  required
                  value={editHospEmail}
                  onChange={(e) => setEditHospEmail(e.target.value)}
                  className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-[#17C964]/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">License Number</label>
                  <input
                    type="text"
                    required
                    value={editHospLicense}
                    onChange={(e) => setEditHospLicense(e.target.value)}
                    className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Helpline Phone</label>
                  <input
                    type="text"
                    required
                    value={editHospPhone}
                    onChange={(e) => setEditHospPhone(e.target.value)}
                    className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Physical Address</label>
                <input
                  type="text"
                  required
                  value={editHospAddress}
                  onChange={(e) => setEditHospAddress(e.target.value)}
                  className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">City / Area</label>
                  <input
                    type="text"
                    value={editHospCity}
                    onChange={(e) => setEditHospCity(e.target.value)}
                    placeholder="e.g. Banjara Hills, Hyderabad"
                    className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">State</label>
                  <input
                    type="text"
                    value={editHospState}
                    onChange={(e) => setEditHospState(e.target.value)}
                    placeholder="e.g. Telangana"
                    className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Pincode</label>
                  <input
                    type="text"
                    value={editHospPincode}
                    onChange={(e) => setEditHospPincode(e.target.value)}
                    placeholder="500034"
                    className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={editHospLat}
                    onChange={(e) => setEditHospLat(e.target.value)}
                    placeholder="17.3850"
                    className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={editHospLng}
                    onChange={(e) => setEditHospLng(e.target.value)}
                    placeholder="78.4867"
                    className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#17C964] hover:bg-[#0f172a] text-white font-bold rounded-xl transition text-xs"
              >
                Save Hospital Profile Changes
              </button>
            </form>
          </div>
        </div>
      )}

    </>
  );
};
