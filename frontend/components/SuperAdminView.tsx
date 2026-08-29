import React, { useState, useEffect } from "react";
import { HospitalProfile, DoctorProfile, AuditLog, MedicalRecord, PatientProfile } from "../types";
import { PatientRecordsTable } from "./PatientRecordsTable";
import { HierarchicalAuditLogViewer } from "./HierarchicalAuditLogViewer";
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
} from "lucide-react";

interface SuperAdminViewProps {
  hospitals: HospitalProfile[];
  doctors: DoctorProfile[];
  auditLogs: AuditLog[];
  records?: MedicalRecord[];
  patientProfiles?: PatientProfile[];
  onDeleteHospital: (hospitalId: string) => void;
}

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({
  hospitals,
  doctors,
  auditLogs,
  records = [],
  patientProfiles = [],
  onDeleteHospital,
}) => {
  const [activeTab, setActiveTab] = useState<"HOSPITALS" | "DOCTORS" | "AUDIT_LOGS" | "PATIENTS" | "RECORDS">("HOSPITALS");
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
  const [editHospTotalBeds, setEditHospTotalBeds] = useState(150);
  const [editHospAvailBeds, setEditHospAvailBeds] = useState(30);
  const [editHospStatusMsg, setEditHospStatusMsg] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Hospital Provisioning Modal State
  const [showAddHospModal, setShowAddHospModal] = useState(false);
  const [newHospName, setNewHospName] = useState("");
  const [newHospEmail, setNewHospEmail] = useState("");
  const [newHospPassword, setNewHospPassword] = useState("HospitalPass123!");
  const [newHospLicense, setNewHospLicense] = useState("HOSP-2026-DL-801");
  const [newHospAddress, setNewHospAddress] = useState("Central Medical Enclave, Health City");
  const [newHospPhone, setNewHospPhone] = useState("+91 11 4000 7000");
  const [newHospBeds, setNewHospBeds] = useState(200);
  const [addHospStatus, setAddHospStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const openEditHospitalModal = (hosp: HospitalProfile) => {
    setEditingHospital(hosp);
    setEditHospName(hosp.name || "");
    setEditHospEmail(hosp.email || "");
    setEditHospLicense(hosp.licenseNumber || "");
    setEditHospAddress(hosp.address || "");
    setEditHospPhone(hosp.phone || "");
    setEditHospTotalBeds(hosp.totalBeds || 150);
    setEditHospAvailBeds(hosp.availableBeds || 30);
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
          totalBeds: editHospTotalBeds,
          availableBeds: editHospAvailBeds,
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
      editingHospital.totalBeds = editHospTotalBeds;
      editingHospital.availableBeds = editHospAvailBeds;
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
          licenseNumber: newHospLicense,
          address: newHospAddress,
          phone: newHospPhone,
          totalBeds: newHospBeds,
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
    { key: "HOSPITALS", label: "Hospitals", icon: Building2, count: (hospitals || []).length },
    { key: "DOCTORS", label: "Licensed Physicians", icon: Stethoscope, count: (doctors || []).length },
    { key: "PATIENTS", label: "Registered Citizens", icon: Users },
    { key: "RECORDS", label: "Global EHR & Lab Ledger", icon: FileText, badge: "Global" },
    { key: "AUDIT_LOGS", label: "256-Bit System Audit Ledger", icon: Lock, badge: "Immutable" },
  ];

  return (
    <div className="bg-[#090D1A] border border-slate-800 rounded-3xl shadow-2xl flex flex-col lg:flex-row w-full overflow-hidden text-slate-100 min-h-[800px]">
      
      {/* Left Sidebar Navigation */}
      <aside className="w-full lg:w-64 bg-[#0D121F] border-r border-slate-800/80 p-5 flex flex-col shrink-0 justify-between space-y-6">
        
        <div className="space-y-6">
          {/* Super Admin Header Box */}
          <div className="space-y-3 bg-[#13192B] border border-slate-800 p-4 rounded-2xl shadow-md">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-rose-600 border border-purple-400/40 flex items-center justify-center text-white font-black text-sm shadow-md">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="truncate">
                <h1 className="font-bold text-white text-sm leading-tight truncate">Super Admin</h1>
                <span className="px-2 py-0.5 bg-purple-950/80 border border-purple-500/40 text-purple-300 text-[9px] font-mono font-bold rounded-md uppercase">
                  ROOT GOVERNANCE
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-mono space-y-1 pt-1 border-t border-slate-800">
              <div className="text-purple-300 font-bold truncate">National Digital Stack</div>
              <div className="text-emerald-400 font-bold text-[10px]">100% Interoperable</div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1 text-xs font-medium">
            {navTabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition duration-150 ${
                    isActive
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 font-bold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span className="truncate">{t.label}</span>
                  </div>

                  {t.badge && (
                    <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded ${
                      isActive ? "bg-white/20 text-white" : "bg-purple-950 border border-purple-500/40 text-purple-300"
                    }`}>
                      {t.badge}
                    </span>
                  )}

                  {t.count !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                      isActive ? "bg-purple-800 text-white font-bold" : "bg-slate-800 text-slate-400"
                    }`}>
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Provision Hospital Button */}
        <button
          onClick={() => setShowAddHospModal(true)}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-purple-600/30 text-xs transition flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Provision Hospital Node</span>
        </button>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 p-6 space-y-6 overflow-y-auto bg-[#090D1A]">

        {/* HOSPITALS TAB */}
        {activeTab === "HOSPITALS" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-purple-400" />
                  <span>National Health Hospital Nodes</span>
                </h2>
                <p className="text-xs text-slate-400">Accredited hospital networks and specialty clinics</p>
              </div>

              <button
                onClick={() => setShowAddHospModal(true)}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition flex items-center space-x-2 shadow-md shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Provision New Hospital</span>
              </button>
            </div>

            {/* Hospital Search Bar */}
            <div className="relative w-full bg-[#13192B] border border-slate-800 p-3 rounded-2xl">
              <Search className="w-4 h-4 text-slate-400 absolute left-6 top-5" />
              <input
                type="text"
                placeholder="Search hospitals by Name, License Number, Address, or Email..."
                value={hospSearch}
                onChange={(e) => setHospSearch(e.target.value)}
                className="w-full bg-[#0D121F] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
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
                  <div key={hosp.id} className="bg-[#13192B] border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md hover:border-purple-500/40 transition">
                    <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold text-sm">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white">{hosp.name}</h3>
                          <p className="text-xs text-purple-400 font-mono">{hosp.email}</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold rounded-lg">
                        {hosp.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 font-mono">
                      <div>License: <strong className="text-cyan-300">{hosp.licenseNumber}</strong></div>
                      <div>Capacity: <strong className="text-emerald-400">{hosp.availableBeds}/{hosp.totalBeds} Beds</strong></div>
                      <div className="col-span-2 text-slate-400 text-[10px]">{hosp.address}</div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex justify-between items-center gap-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedHospForDetail(hosp)}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>

                        <button
                          onClick={() => openEditHospitalModal(hosp)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>

                      <button
                        onClick={() => onDeleteHospital(hosp.id)}
                        className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold rounded-xl transition flex items-center space-x-1"
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
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Stethoscope className="w-5 h-5 text-purple-400" />
                <span>All Licensed Physicians Across Network</span>
              </h2>
              <p className="text-xs text-slate-400">Master physician directory, licensures, and clinical specializations</p>
            </div>

            {/* Doctor Search Bar */}
            <div className="relative w-full bg-[#13192B] border border-slate-800 p-3 rounded-2xl">
              <Search className="w-4 h-4 text-slate-400 absolute left-6 top-5" />
              <input
                type="text"
                placeholder="Search doctors by Name, Specialization, MCI License, or Hospital..."
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                className="w-full bg-[#0D121F] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
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
                  <div key={doc.id} className="bg-[#13192B] border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md hover:border-purple-500/40 transition">
                    <div className="flex justify-between items-start border-b border-slate-800 pb-2">
                      <div>
                        <h3 className="font-bold text-white text-base">{doc.name}</h3>
                        <p className="text-xs text-purple-400 font-mono">{doc.specialization}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono rounded">
                        {doc.status}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs font-mono text-slate-300">
                      <div>License: <strong className="text-cyan-300">{doc.licenseNumber}</strong></div>
                      <div>Hospital: <strong className="text-white">{doc.hospitalName || "Independent"}</strong></div>
                      <div>Experience: <strong className="text-amber-400">{doc.experienceYears} Years</strong></div>
                      <div>Fee: <strong className="text-emerald-400">₹{doc.fee}</strong></div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex justify-end">
                      <button
                        onClick={() => handleDeleteDoctor(doc.id, doc.name)}
                        className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold rounded-xl transition flex items-center space-x-1"
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
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span>Registered Citizens & Universal Health Profiles</span>
              </h2>
              <p className="text-xs text-slate-400">Citizens with registered lifelong Health IDs</p>
            </div>

            <div className="relative w-full bg-[#13192B] border border-slate-800 p-3 rounded-2xl">
              <Search className="w-4 h-4 text-slate-400 absolute left-6 top-5" />
              <input
                type="text"
                placeholder="Search citizens by Name, Health ID, or Email..."
                value={patSearch}
                onChange={(e) => setPatSearch(e.target.value)}
                className="w-full bg-[#0D121F] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
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
                  <div key={idx} className="bg-[#13192B] border border-slate-800 rounded-2xl p-5 space-y-2 shadow-md">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <h3 className="font-bold text-white text-sm">{p.name || "Ananya Sharma"}</h3>
                      <span className="px-2 py-0.5 bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono rounded">
                        {p.globalHealthId || "NH-IND-2026-PAT01"}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-400 space-y-1">
                      <div>Email: <strong className="text-slate-200">{p.email || "patient@nexushealth.org"}</strong></div>
                      <div>Role: <strong className="text-purple-300">PATIENT CITIZEN</strong></div>
                    </div>
                  </div>
                ))}

              {patientsList.length === 0 && (
                <div className="col-span-full bg-[#13192B] p-8 text-center text-xs text-slate-400 border border-slate-800 rounded-2xl">
                  Loading citizen profiles registry...
                </div>
              )}
            </div>
          </div>
        )}

        {/* GLOBAL EHR & LAB LEDGER TAB */}
        {activeTab === "RECORDS" && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <span>Global Health System EHR Ledger & Diagnostic Records</span>
              </h2>
              <p className="text-xs text-slate-400">Master repository of all electronic health records, prescriptions & lab reports</p>
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

      </main>

      {/* PROVISION HOSPITAL MODAL */}
      {showAddHospModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#13192B] border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative space-y-4 text-slate-100">
            <button
              onClick={() => setShowAddHospModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl bg-[#0D121F]"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 text-purple-400 pb-2 border-b border-slate-800">
              <Building2 className="w-6 h-6" />
              <div>
                <h3 className="font-bold text-white text-base">Provision New Hospital Node</h3>
                <p className="text-xs text-slate-400">Connect specialty hospital to National Health Gateway</p>
              </div>
            </div>

            {addHospStatus && (
              <div className={`p-3 rounded-xl text-xs font-bold ${
                addHospStatus.type === "success" ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40" : "bg-rose-950 text-rose-400 border border-rose-500/40"
              }`}>
                {addHospStatus.msg}
              </div>
            )}

            <form onSubmit={handleProvisionHospital} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Hospital Name</label>
                <input
                  type="text"
                  required
                  value={newHospName}
                  onChange={(e) => setNewHospName(e.target.value)}
                  placeholder="Max Super Speciality Hospital"
                  className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Hospital Admin Email</label>
                <input
                  type="email"
                  required
                  value={newHospEmail}
                  onChange={(e) => setNewHospEmail(e.target.value)}
                  placeholder="admin@maxhealth.org"
                  className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Admin Password</label>
                <input
                  type="text"
                  required
                  value={newHospPassword}
                  onChange={(e) => setNewHospPassword(e.target.value)}
                  className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition shadow-lg shadow-purple-600/30 text-xs"
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
          <div className="bg-[#13192B] border border-purple-500/30 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative space-y-4 text-slate-100">
            <button
              onClick={() => setSelectedHospForDetail(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl bg-[#0D121F]"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 text-purple-400 pb-2 border-b border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold text-lg">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">{selectedHospForDetail.name}</h3>
                <p className="text-xs text-purple-400 font-mono">License: {selectedHospForDetail.licenseNumber} • Status: {selectedHospForDetail.status}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="bg-[#0D121F] p-4 rounded-2xl border border-slate-800 space-y-2">
                <div>Hospital Admin Login: <strong className="text-cyan-300">{selectedHospForDetail.email}</strong></div>
                <div>Emergency Helpline: <strong className="text-emerald-400">{selectedHospForDetail.phone || "+91 1800-425-9999"}</strong></div>
                <div>Physical Address: <strong className="text-slate-200">{selectedHospForDetail.address}</strong></div>
                <div>Total Bed Capacity: <strong className="text-white">{selectedHospForDetail.totalBeds} Beds</strong></div>
                <div>Currently Vacant Beds: <strong className="text-emerald-400">{selectedHospForDetail.availableBeds} Available</strong></div>
              </div>

              <div className="bg-[#0D121F] p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="font-bold text-purple-300 uppercase text-[10px]">Active Hospital Departments</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(selectedHospForDetail.departments || ["Cardiology", "Neurology", "Emergency Trauma", "Pediatrics", "Orthopedics"]).map((dept, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-purple-950 border border-purple-500/40 text-purple-300 rounded-lg text-[10px]">
                      {dept}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-[#0D121F] p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="font-bold text-purple-300 uppercase text-[10px]">Affiliated Doctors Count</span>
                <div className="text-sm font-bold text-white">
                  {doctors.filter((d) => d.hospitalId === selectedHospForDetail.id || d.hospitalName === selectedHospForDetail.name).length} Accredited Physicians On Roster
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedHospForDetail(null)}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition text-xs"
            >
              Close Hospital Profile
            </button>
          </div>
        </div>
      )}

      {/* EDIT HOSPITAL MODAL */}
      {editingHospital && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#13192B] border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative space-y-4 text-slate-100">
            <button
              onClick={() => setEditingHospital(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl bg-[#0D121F]"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 text-indigo-400 pb-2 border-b border-slate-800">
              <Building2 className="w-6 h-6" />
              <div>
                <h3 className="font-bold text-white text-base">Edit Hospital Profile & Capacity</h3>
                <p className="text-xs text-slate-400">Update node metadata, licensure, and bed allocation</p>
              </div>
            </div>

            {editHospStatusMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-bold ${
                  editHospStatusMsg.type === "success"
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40"
                    : "bg-rose-950 text-rose-400 border border-rose-500/40"
                }`}
              >
                {editHospStatusMsg.msg}
              </div>
            )}

            <form onSubmit={handleSaveEditHospital} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Hospital Name</label>
                <input
                  type="text"
                  required
                  value={editHospName}
                  onChange={(e) => setEditHospName(e.target.value)}
                  className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Hospital Admin Email</label>
                <input
                  type="email"
                  required
                  value={editHospEmail}
                  onChange={(e) => setEditHospEmail(e.target.value)}
                  className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">License Number</label>
                  <input
                    type="text"
                    required
                    value={editHospLicense}
                    onChange={(e) => setEditHospLicense(e.target.value)}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Helpline Phone</label>
                  <input
                    type="text"
                    required
                    value={editHospPhone}
                    onChange={(e) => setEditHospPhone(e.target.value)}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Physical Address</label>
                <input
                  type="text"
                  required
                  value={editHospAddress}
                  onChange={(e) => setEditHospAddress(e.target.value)}
                  className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Total Bed Capacity</label>
                  <input
                    type="number"
                    required
                    value={editHospTotalBeds}
                    onChange={(e) => setEditHospTotalBeds(Number(e.target.value))}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Vacant / Available Beds</label>
                  <input
                    type="number"
                    required
                    value={editHospAvailBeds}
                    onChange={(e) => setEditHospAvailBeds(Number(e.target.value))}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition text-xs"
              >
                Save Hospital Profile Changes
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
