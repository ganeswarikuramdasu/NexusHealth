import React, { useState } from "react";
import { HospitalProfile, DoctorProfile, MedicalRecord, PatientProfile } from "../types";
import { PatientRecordsTable } from "./PatientRecordsTable";
import { HierarchicalAuditLogViewer } from "./HierarchicalAuditLogViewer";
import { parseResponseSafe } from "../utils/api";
import {
  Building2,
  Stethoscope,
  AlertTriangle,
  Check,
  X,
  ShieldCheck,
  Edit3,
  Layers,
  PhoneCall,
  KeyRound,
  Save,
  Activity,
  Eye,
  Plus,
  Users,
  Settings,
  Search,
  FileText,
  Trash2,
  Lock,
  Mail,
  MapPin,
  Clock,
  Award,
  Sparkles,
} from "lucide-react";

interface HospitalAdminViewProps {
  hospital: HospitalProfile;
  doctors: DoctorProfile[];
  records?: MedicalRecord[];
  patientProfiles?: PatientProfile[];
  onApproveDoctor: (doctorId: string, action: "APPROVE" | "REJECT" | "REMOVE") => void;
  onRefreshData?: () => void;
}

export const HospitalAdminView: React.FC<HospitalAdminViewProps> = ({
  hospital,
  doctors,
  records = [],
  patientProfiles = [],
  onApproveDoctor,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<"ROSTER" | "DEPARTMENTS" | "PATIENT_RECORDS" | "AUDIT_LOGS" | "SETTINGS">("ROSTER");

  // Search & Filter States
  const [docSearch, setDocSearch] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string | null>(null);

  // Selection Detail Modals State
  const [selectedDocForDetail, setSelectedDocForDetail] = useState<DoctorProfile | null>(null);
  const [selectedDocForEdit, setSelectedDocForEdit] = useState<DoctorProfile | null>(null);
  const [selectedDeptForDetail, setSelectedDeptForDetail] = useState<string | null>(null);

  // Hospital Settings & Info State
  const [hospEmail, setHospEmail] = useState(hospital.email || "admin@hospital.org");
  const [hospPassword, setHospPassword] = useState("");
  const [hospAddress, setHospAddress] = useState(hospital.address || "");
  const [hospPhone, setHospPhone] = useState(hospital.phone || "+91 11 4000 0000");
  const [emergencyPhone, setEmergencyPhone] = useState("+91 1800-425-9999");
  const [settingsStatus, setSettingsStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Departments State
  const defaultDepts = ["Cardiology", "Neurology", "Orthopedics", "Emergency ER", "General Medicine", "Pediatrics", "Oncology", "Surgery"];
  const [departments, setDepartments] = useState<string[]>(
    hospital.departments && hospital.departments.length > 0 ? hospital.departments : defaultDepts
  );
  const [deptStatuses, setDeptStatuses] = useState<Record<string, "ACTIVE" | "INACTIVE">>(hospital.departmentStatuses || {});
  const [newDeptName, setNewDeptName] = useState("");
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);

  // Provision New Doctor Form State
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newDocEmail, setNewDocEmail] = useState("");
  const [newDocPassword, setNewDocPassword] = useState("DoctorPass123!");
  const [newDocSpec, setNewDocSpec] = useState("Cardiology");
  const [newDocDept, setNewDocDept] = useState("Cardiology");
  const [newDocLicense, setNewDocLicense] = useState(`MCI-2026-${Math.floor(10000 + Math.random() * 90000)}`);
  const [newDocExp, setNewDocExp] = useState(6);
  const [newDocFee, setNewDocFee] = useState(800);
  const [newDocPhone, setNewDocPhone] = useState("+91 98765 43210");
  const [newDocQualification, setNewDocQualification] = useState("MBBS, MD, DM");
  const [newDocWorkingDays, setNewDocWorkingDays] = useState<string[]>(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  const [addDocStatus, setAddDocStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Edit Doctor Form State
  const [editDocName, setEditDocName] = useState("");
  const [editDocSpec, setEditDocSpec] = useState("");
  const [editDocDept, setEditDocDept] = useState("");
  const [editDocFee, setEditDocFee] = useState(800);
  const [editDocExp, setEditDocExp] = useState(5);
  const [editDocLicense, setEditDocLicense] = useState("");
  const [editDocPhone, setEditDocPhone] = useState("");
  const [editDocQualification, setEditDocQualification] = useState("");
  const [editDocWorkingDays, setEditDocWorkingDays] = useState<string[]>([]);
  const [editDocStatusMsg, setEditDocStatusMsg] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const availableDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Provision Doctor Handler
  const handleProvisionDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddDocStatus(null);
    try {
      const res = await fetch("/api/hospital/add-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalId: hospital.id,
          hospitalName: hospital.name,
          name: newDocName,
          email: newDocEmail,
          password: newDocPassword,
          specialization: newDocSpec,
          department: newDocDept || newDocSpec,
          licenseNumber: newDocLicense,
          experienceYears: newDocExp,
          fee: newDocFee,
          phone: newDocPhone,
          qualification: newDocQualification,
          workingDays: newDocWorkingDays,
        }),
      });
      const data = await parseResponseSafe<any>(res, { success: false, message: "Failed to provision doctor account." });
      if (!res.ok || !data || !data.success) {
        setAddDocStatus({ type: "error", msg: data?.message || "Failed to provision doctor account." });
        return;
      }
      setAddDocStatus({ type: "success", msg: data.message || `Dr. ${newDocName} provisioned successfully!` });
      if (data.doctor) {
        doctors.unshift(data.doctor);
        if (onRefreshData) onRefreshData();
      }
      setTimeout(() => {
        setShowAddDocModal(false);
        setNewDocName("");
        setNewDocEmail("");
        setAddDocStatus(null);
      }, 1500);
    } catch (err) {
      setAddDocStatus({ type: "error", msg: "Server communication error." });
    }
  };

  // Open Edit Doctor Modal
  const handleOpenEditDoc = (doc: DoctorProfile) => {
    setSelectedDocForEdit(doc);
    setEditDocName(doc.name);
    setEditDocSpec(doc.specialization);
    setEditDocDept((doc as any).department || doc.specialization);
    setEditDocFee(doc.fee);
    setEditDocExp(doc.experienceYears);
    setEditDocLicense(doc.licenseNumber);
    setEditDocPhone((doc as any).phone || "+91 98765 00000");
    setEditDocQualification((doc as any).qualification || "MBBS, MD");
    setEditDocWorkingDays(doc.workingDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
    setEditDocStatusMsg(null);
  };

  // Save Doctor Edits Handler
  const handleSaveDocEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocForEdit) return;
    setEditDocStatusMsg(null);
    try {
      const res = await fetch("/api/hospital/update-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: selectedDocForEdit.id,
          name: editDocName,
          specialization: editDocSpec,
          department: editDocDept,
          fee: editDocFee,
          experienceYears: editDocExp,
          licenseNumber: editDocLicense,
          phone: editDocPhone,
          qualification: editDocQualification,
          workingDays: editDocWorkingDays,
        }),
      });
      const data = await parseResponseSafe<any>(res, { success: false, message: "Failed to update doctor info." });
      if (!res.ok || !data || !data.success) {
        setEditDocStatusMsg({ type: "error", msg: data?.message || "Failed to update doctor info." });
        return;
      }
      setEditDocStatusMsg({ type: "success", msg: `Updated Dr. ${editDocName}'s profile successfully!` });
      
      // Update local state
      const target = doctors.find((d) => d.id === selectedDocForEdit.id);
      if (target) {
        target.name = editDocName;
        target.specialization = editDocSpec;
        (target as any).department = editDocDept;
        target.fee = editDocFee;
        target.experienceYears = editDocExp;
        target.licenseNumber = editDocLicense;
        (target as any).phone = editDocPhone;
        (target as any).qualification = editDocQualification;
        target.workingDays = editDocWorkingDays;
      }
      if (onRefreshData) onRefreshData();

      setTimeout(() => {
        setSelectedDocForEdit(null);
        setEditDocStatusMsg(null);
      }, 1500);
    } catch (err) {
      setEditDocStatusMsg({ type: "error", msg: "Server communication error." });
    }
  };

  // Delete Doctor Handler
  const handleDeleteDoctor = async (doctorId: string, docName: string) => {
    if (!window.confirm(`Are you sure you want to decommission and delete Dr. ${docName}'s account from ${hospital.name}?`)) {
      return;
    }
    try {
      const res = await fetch("/api/hospital/delete-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId }),
      });
      const data = await parseResponseSafe<any>(res, { success: false, message: "Failed to delete doctor." });
      if (res.ok && data?.success) {
        const idx = doctors.findIndex((d) => d.id === doctorId);
        if (idx !== -1) doctors.splice(idx, 1);
        if (onRefreshData) onRefreshData();
        alert(`Physician Dr. ${docName} deleted successfully.`);
      } else {
        alert(data?.message || "Failed to delete doctor.");
      }
    } catch (err) {
      alert("Error communicating with backend.");
    }
  };

  // Toggle Department Active/Inactive Status
  const handleToggleDepartment = async (deptName: string) => {
    try {
      const current = deptStatuses[deptName] || "ACTIVE";
      const nextStatus = current === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      const res = await fetch("/api/hospital/toggle-department", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalId: hospital.id,
          departmentName: deptName,
          status: nextStatus,
        }),
      });
      const data = await parseResponseSafe<any>(res, { success: false });
      if (res.ok && data?.success) {
        setDeptStatuses((prev) => ({ ...prev, [deptName]: nextStatus }));
      }
    } catch (err) {
      console.error("Failed to toggle department", err);
    }
  };

  // Add New Custom Department
  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    const cleanName = newDeptName.trim();
    if (departments.includes(cleanName)) {
      alert("Department already exists!");
      return;
    }
    setDepartments((prev) => [...prev, cleanName]);
    setDeptStatuses((prev) => ({ ...prev, [cleanName]: "ACTIVE" }));
    setNewDeptName("");
    setShowAddDeptModal(false);
  };

  // Save Hospital Settings Handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsStatus(null);
    try {
      const res = await fetch("/api/hospital/update-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalId: hospital.id,
          email: hospEmail,
          newPassword: hospPassword,
          phone: hospPhone,
          address: hospAddress,
          emergencyPhone: emergencyPhone,
        }),
      });
      const data = await parseResponseSafe<any>(res, { success: false, message: "Failed to update hospital settings." });
      if (!res.ok || !data || !data.success) {
        setSettingsStatus({ type: "error", msg: data?.message || "Failed to update hospital settings." });
        return;
      }
      setSettingsStatus({ type: "success", msg: "Hospital profile and security credentials updated successfully!" });
      setHospPassword("");
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setSettingsStatus({ type: "error", msg: "Server communication error." });
    }
  };

  const affiliatedDoctors = doctors.filter((d) => d.hospitalId === hospital.id || d.hospitalName === hospital.name);
  const pendingApprovals = doctors.filter(
    (d) => (d.hospitalId === hospital.id || d.hospitalName === hospital.name) && d.status === "PENDING_APPROVAL"
  );

  const navTabs = [
    { key: "ROSTER", label: "Doctors & Physicians Info", icon: Stethoscope, count: affiliatedDoctors.length },
    { key: "DEPARTMENTS", label: "Departments Details", icon: Layers, count: departments.length },
    { key: "PATIENT_RECORDS", label: "Hospital EHR & Patient Records", icon: FileText, badge: "EHR" },
    { key: "AUDIT_LOGS", label: "Patient Record Access Audit Logs", icon: ShieldCheck, badge: "SECURITY" },
    { key: "SETTINGS", label: "Hospital Settings & Security", icon: Settings },
  ];

  return (
    <div className="bg-[#090D1A] border border-slate-800 rounded-3xl shadow-2xl flex flex-col lg:flex-row w-full overflow-hidden text-slate-100 min-h-[800px]">
      
      {/* Left Sidebar Navigation */}
      <aside className="w-full lg:w-64 bg-[#0D121F] border-r border-slate-800/80 p-5 flex flex-col shrink-0 justify-between space-y-6">
        
        <div className="space-y-6">
          {/* Hospital Profile Header Box */}
          <div className="space-y-3 bg-[#13192B] border border-slate-800 p-4 rounded-2xl shadow-md">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 border border-purple-400/40 flex items-center justify-center text-white font-black text-sm shadow-md">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="truncate">
                <h1 className="font-bold text-white text-sm leading-tight truncate">{hospital.name}</h1>
                <span className="px-2 py-0.5 bg-purple-950/80 border border-purple-500/40 text-purple-300 text-[9px] font-mono font-bold rounded-md uppercase">
                  ACCREDITED NODE
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 font-mono space-y-1 pt-1 border-t border-slate-800">
              <div className="text-cyan-400 font-bold truncate">License: {hospital.licenseNumber}</div>
              <div className="text-emerald-400 font-bold text-[10px]">Affiliated Doctors: {affiliatedDoctors.length}</div>
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
                  onClick={() => {
                    setActiveTab(t.key as any);
                    setSelectedDeptFilter(null);
                  }}
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

        {/* Provision Doctor Button Widget */}
        <button
          onClick={() => setShowAddDocModal(true)}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-purple-600/30 text-xs transition flex items-center justify-center space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Doctor</span>
        </button>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 p-6 space-y-6 overflow-y-auto bg-[#090D1A]">

        {/* DOCTORS & PHYSICIANS ROSTER TAB */}
        {activeTab === "ROSTER" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Stethoscope className="w-5 h-5 text-purple-400" />
                  <span>Doctors & Physicians Directory</span>
                </h2>
                <p className="text-xs text-slate-400">Add, edit, manage, and audit clinical record access histories for all hospital physicians</p>
              </div>

              <button
                onClick={() => setShowAddDocModal(true)}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition flex items-center space-x-2 shadow-md shadow-purple-600/30 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Doctor</span>
              </button>
            </div>

            {/* Doctor Search & Department Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 relative bg-[#13192B] border border-slate-800 p-2.5 rounded-2xl flex items-center">
                <Search className="w-4 h-4 text-slate-400 ml-2.5 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Search doctors by Name, Specialization, Email, or MCI License..."
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="bg-[#13192B] border border-slate-800 p-2.5 rounded-2xl">
                <select
                  value={selectedDeptFilter || ""}
                  onChange={(e) => setSelectedDeptFilter(e.target.value || null)}
                  className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                >
                  <option value="">All Departments ({departments.length})</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pending Approvals Section */}
            {pendingApprovals.length > 0 && (
              <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex items-center space-x-2 text-amber-300 font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{pendingApprovals.length} Doctor Affiliation Requests Pending Verification</span>
                </div>
                {pendingApprovals.map((doc) => (
                  <div key={doc.id} className="bg-[#13192B] border border-slate-800 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-white">{doc.name}</div>
                      <div className="text-amber-400 text-[10px] font-mono">{doc.specialization} • License: {doc.licenseNumber}</div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onApproveDoctor(doc.id, "APPROVE")}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => onApproveDoctor(doc.id, "REJECT")}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Active Doctors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {affiliatedDoctors
                .filter((doc) => {
                  const matchSearch =
                    doc.name.toLowerCase().includes(docSearch.toLowerCase()) ||
                    doc.specialization.toLowerCase().includes(docSearch.toLowerCase()) ||
                    doc.email.toLowerCase().includes(docSearch.toLowerCase()) ||
                    doc.licenseNumber.toLowerCase().includes(docSearch.toLowerCase());
                  const docDept = (doc as any).department || doc.specialization;
                  const matchDept = selectedDeptFilter ? docDept.toLowerCase() === selectedDeptFilter.toLowerCase() : true;
                  return matchSearch && matchDept;
                })
                .map((doc) => {
                  const docDept = (doc as any).department || doc.specialization;
                  const docPhone = (doc as any).phone || "+91 98765 00000";
                  const docQual = (doc as any).qualification || "MBBS, MD";
                  const accessedRecords = records.filter(
                    (r) => r.doctorId === doc.id || r.doctorName.toLowerCase() === doc.name.toLowerCase()
                  );

                  return (
                    <div key={doc.id} className="bg-[#13192B] border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md hover:border-purple-500/40 transition flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold text-sm">
                              DR
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-white">{doc.name}</h3>
                              <p className="text-xs text-purple-400 font-mono font-bold">{doc.specialization} • {docDept}</p>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border ${
                            doc.status === "APPROVED" ? "bg-emerald-950 border-emerald-500/40 text-emerald-400" : "bg-amber-950 border-amber-500/40 text-amber-300"
                          }`}>
                            {doc.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 font-mono">
                          <div>Qualification: <strong className="text-slate-100">{docQual}</strong></div>
                          <div>License: <strong className="text-cyan-300">{doc.licenseNumber}</strong></div>
                          <div>Email: <strong className="text-slate-200">{doc.email}</strong></div>
                          <div>Phone: <strong className="text-slate-200">{docPhone}</strong></div>
                          <div>Experience: <strong className="text-purple-300">{doc.experienceYears} Years</strong></div>
                          <div>Consultation Fee: <strong className="text-emerald-400">₹{doc.fee}</strong></div>
                        </div>

                        {/* Record Access Metric Badge */}
                        <div className="bg-[#0D121F] border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between text-xs">
                          <span className="text-slate-400 text-[11px] font-medium flex items-center space-x-1.5">
                            <FileText className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Patient Records Accessed:</span>
                          </span>
                          <span className="px-2 py-0.5 bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[11px] font-bold font-mono rounded">
                            {accessedRecords.length} Consultations
                          </span>
                        </div>
                      </div>

                      {/* Card Action Controls */}
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <button
                          onClick={() => setSelectedDocForDetail(doc)}
                          className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Info & EHR Logs</span>
                        </button>

                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEditDoc(doc)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                            title="Edit Doctor Info"
                          >
                            <Edit3 className="w-4 h-4 text-cyan-300" />
                          </button>
                          <button
                            onClick={() => handleDeleteDoctor(doc.id, doc.name)}
                            className="p-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-500/40 text-rose-300 rounded-lg transition"
                            title="Decommission & Delete Doctor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {affiliatedDoctors.length === 0 && (
                <div className="col-span-full bg-[#13192B] border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs">
                  No physicians currently registered for {hospital.name}. Click <strong>"Add New Doctor"</strong> to provision doctor accounts.
                </div>
              )}
            </div>
          </div>
        )}

        {/* DEPARTMENTS DETAILS TAB */}
        {activeTab === "DEPARTMENTS" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  <span>Hospital Clinical Departments</span>
                </h2>
                <p className="text-xs text-slate-400">View department details, toggle active operational status, and inspect specialized physicians</p>
              </div>

              <button
                onClick={() => setShowAddDeptModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center space-x-2 shadow-md shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Department</span>
              </button>
            </div>

            {/* Department Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((deptName) => {
                const status = deptStatuses[deptName] || "ACTIVE";
                const deptDoctors = affiliatedDoctors.filter((d) => {
                  const dDept = (d as any).department || d.specialization;
                  return dDept.toLowerCase() === deptName.toLowerCase();
                });

                return (
                  <div
                    key={deptName}
                    className="bg-[#13192B] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md hover:border-indigo-500/40 transition relative"
                  >
                    <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="text-base font-bold text-white">{deptName} Department</h3>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{deptDoctors.length} Accredited Physicians</p>
                      </div>

                      <button
                        onClick={() => handleToggleDepartment(deptName)}
                        className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg border transition ${
                          status === "ACTIVE"
                            ? "bg-emerald-950 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900"
                            : "bg-rose-950 border-rose-500/40 text-rose-300 hover:bg-rose-900"
                        }`}
                      >
                        {status}
                      </button>
                    </div>

                    {/* Doctors in this Department Preview */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Specialized Physicians</span>
                      {deptDoctors.length > 0 ? (
                        <div className="space-y-1.5">
                          {deptDoctors.slice(0, 3).map((d) => (
                            <button
                              key={d.id}
                              onClick={() => setSelectedDocForDetail(d)}
                              className="w-full text-left bg-[#0D121F] hover:bg-slate-800 border border-slate-800/80 p-2 rounded-xl flex justify-between items-center transition"
                            >
                              <div>
                                <div className="text-xs font-bold text-white">{d.name}</div>
                                <div className="text-[10px] text-purple-400 font-mono">{d.specialization}</div>
                              </div>
                              <Eye className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                          ))}
                          {deptDoctors.length > 3 && (
                            <div className="text-[10px] text-indigo-300 text-center font-mono">
                              +{deptDoctors.length - 3} more doctor(s)
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-[#0D121F] p-3 rounded-xl border border-slate-800/80 text-[11px] text-slate-500 text-center italic">
                          No doctors currently assigned to {deptName}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                      <button
                        onClick={() => {
                          setSelectedDeptFilter(deptName);
                          setActiveTab("ROSTER");
                        }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center space-x-1"
                      >
                        <span>Filter Roster by {deptName}</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* HOSPITAL EHR & PATIENT RECORDS TAB */}
        {activeTab === "PATIENT_RECORDS" && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <span>Hospital Patient EHR Ledger & Diagnostic Reports</span>
              </h2>
              <p className="text-xs text-slate-400">Searchable repository of all diagnostic reports, prescriptions, and clinical encounters across {hospital.name}</p>
            </div>

            <PatientRecordsTable
              records={records}
              patients={patientProfiles}
              doctorName={hospital.name}
            />
          </div>
        )}

        {/* HOSPITAL SETTINGS & SECURITY TAB */}
        {activeTab === "SETTINGS" && (
          <div className="space-y-6 max-w-3xl">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <Settings className="w-5 h-5 text-purple-400" />
                <span>Hospital Profile Settings & Security Credentials</span>
              </h2>
              <p className="text-xs text-slate-400">Update official contact details, physical address, ER emergency hotline, and login password</p>
            </div>

            {settingsStatus && (
              <div className={`p-4 rounded-2xl text-xs font-bold ${
                settingsStatus.type === "success" ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40" : "bg-rose-950 text-rose-400 border border-rose-500/40"
              }`}>
                {settingsStatus.msg}
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="bg-[#13192B] border border-slate-800 rounded-3xl p-6 space-y-5 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Hospital Name</label>
                  <input
                    type="text"
                    disabled
                    value={hospital.name}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-slate-400 cursor-not-allowed font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">National License Number</label>
                  <input
                    type="text"
                    disabled
                    value={hospital.licenseNumber}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-cyan-300 cursor-not-allowed font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Admin Contact Email</label>
                  <input
                    type="email"
                    required
                    value={hospEmail}
                    onChange={(e) => setHospEmail(e.target.value)}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Update Admin Password (Optional)</label>
                  <input
                    type="password"
                    placeholder="Leave blank to keep current password"
                    value={hospPassword}
                    onChange={(e) => setHospPassword(e.target.value)}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Hospital Primary Phone</label>
                  <input
                    type="text"
                    required
                    value={hospPhone}
                    onChange={(e) => setHospPhone(e.target.value)}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Emergency ER Helpline Hotline</label>
                  <input
                    type="text"
                    required
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Hospital Complex Address</label>
                <textarea
                  rows={2}
                  required
                  value={hospAddress}
                  onChange={(e) => setHospAddress(e.target.value)}
                  className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition shadow-lg shadow-purple-600/30 text-xs flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Settings & Update Credentials</span>
              </button>
            </form>
          </div>
        )}

        {/* AUDIT LOGS TAB */}
        {activeTab === "AUDIT_LOGS" && (
          <HierarchicalAuditLogViewer
            viewMode="HOSPITAL_ADMIN"
            hospitalId={hospital.id}
            hospitalName={hospital.name}
          />
        )}

      </main>

      {/* PROVISION NEW DOCTOR MODAL */}
      {showAddDocModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#13192B] border border-purple-500/30 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative space-y-4 text-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddDocModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl bg-[#0D121F]"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 text-purple-400 pb-2 border-b border-slate-800">
              <Stethoscope className="w-6 h-6" />
              <div>
                <h3 className="font-bold text-white text-base">Provision New Doctor Account</h3>
                <p className="text-xs text-slate-400">Generate accredited login & profile for {hospital.name}</p>
              </div>
            </div>

            {addDocStatus && (
              <div className={`p-3 rounded-xl text-xs font-bold ${
                addDocStatus.type === "success" ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40" : "bg-rose-950 text-rose-400 border border-rose-500/40"
              }`}>
                {addDocStatus.msg}
              </div>
            )}

            <form onSubmit={handleProvisionDoctor} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Doctor Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    placeholder="Dr. Vikram Seth"
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Official Email *</label>
                  <input
                    type="email"
                    required
                    value={newDocEmail}
                    onChange={(e) => setNewDocEmail(e.target.value)}
                    placeholder="dr.vikram@apollo.org"
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Initial Login Password *</label>
                  <input
                    type="text"
                    required
                    value={newDocPassword}
                    onChange={(e) => setNewDocPassword(e.target.value)}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Qualifications / Degrees</label>
                  <input
                    type="text"
                    required
                    value={newDocQualification}
                    onChange={(e) => setNewDocQualification(e.target.value)}
                    placeholder="MBBS, MD, DM Cardiology"
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Clinical Specialization *</label>
                  <input
                    type="text"
                    required
                    value={newDocSpec}
                    onChange={(e) => {
                      setNewDocSpec(e.target.value);
                      setNewDocDept(e.target.value);
                    }}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Department</label>
                  <select
                    value={newDocDept}
                    onChange={(e) => setNewDocDept(e.target.value)}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">MCI License #</label>
                  <input
                    type="text"
                    required
                    value={newDocLicense}
                    onChange={(e) => setNewDocLicense(e.target.value)}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-cyan-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Experience (Yrs)</label>
                  <input
                    type="number"
                    required
                    value={newDocExp}
                    onChange={(e) => setNewDocExp(parseInt(e.target.value) || 1)}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Fee (₹)</label>
                  <input
                    type="number"
                    required
                    value={newDocFee}
                    onChange={(e) => setNewDocFee(parseInt(e.target.value) || 500)}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={newDocPhone}
                  onChange={(e) => setNewDocPhone(e.target.value)}
                  className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">OPD Consultation Days</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {availableDays.map((day) => {
                    const isChecked = newDocWorkingDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            setNewDocWorkingDays(newDocWorkingDays.filter((d) => d !== day));
                          } else {
                            setNewDocWorkingDays([...newDocWorkingDays, day]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                          isChecked
                            ? "bg-purple-600 text-white border-purple-500"
                            : "bg-[#0D121F] text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition shadow-lg shadow-purple-600/30 text-xs"
              >
                Provision Account & Create Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DOCTOR MODAL */}
      {selectedDocForEdit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#13192B] border border-cyan-500/30 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative space-y-4 text-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedDocForEdit(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl bg-[#0D121F]"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 text-cyan-400 pb-2 border-b border-slate-800">
              <Edit3 className="w-6 h-6" />
              <div>
                <h3 className="font-bold text-white text-base">Edit Physician Profile & Credentials</h3>
                <p className="text-xs text-slate-400">Dr. {selectedDocForEdit.name} ({selectedDocForEdit.email})</p>
              </div>
            </div>

            {editDocStatusMsg && (
              <div className={`p-3 rounded-xl text-xs font-bold ${
                editDocStatusMsg.type === "success" ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40" : "bg-rose-950 text-rose-400 border border-rose-500/40"
              }`}>
                {editDocStatusMsg.msg}
              </div>
            )}

            <form onSubmit={handleSaveDocEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Doctor Name</label>
                  <input
                    type="text"
                    required
                    value={editDocName}
                    onChange={(e) => setEditDocName(e.target.value)}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Degrees / Qualifications</label>
                  <input
                    type="text"
                    required
                    value={editDocQualification}
                    onChange={(e) => setEditDocQualification(e.target.value)}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Specialization</label>
                  <input
                    type="text"
                    required
                    value={editDocSpec}
                    onChange={(e) => setEditDocSpec(e.target.value)}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Department</label>
                  <select
                    value={editDocDept}
                    onChange={(e) => setEditDocDept(e.target.value)}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">MCI License #</label>
                  <input
                    type="text"
                    required
                    value={editDocLicense}
                    onChange={(e) => setEditDocLicense(e.target.value)}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-cyan-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Experience (Yrs)</label>
                  <input
                    type="number"
                    required
                    value={editDocExp}
                    onChange={(e) => setEditDocExp(parseInt(e.target.value) || 1)}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Fee (₹)</label>
                  <input
                    type="number"
                    required
                    value={editDocFee}
                    onChange={(e) => setEditDocFee(parseInt(e.target.value) || 500)}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Contact Phone</label>
                <input
                  type="text"
                  required
                  value={editDocPhone}
                  onChange={(e) => setEditDocPhone(e.target.value)}
                  className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">OPD Consultation Days</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {availableDays.map((day) => {
                    const isChecked = editDocWorkingDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            setEditDocWorkingDays(editDocWorkingDays.filter((d) => d !== day));
                          } else {
                            setEditDocWorkingDays([...editDocWorkingDays, day]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                          isChecked
                            ? "bg-cyan-600 text-white border-cyan-500"
                            : "bg-[#0D121F] text-slate-400 border-slate-800 hover:text-white"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition shadow-lg shadow-cyan-600/30 text-xs"
              >
                Save Physician Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DOCTOR DETAIL & PATIENT ACCESSED RECORDS MODAL */}
      {selectedDocForDetail && (() => {
        const docDept = (selectedDocForDetail as any).department || selectedDocForDetail.specialization;
        const docPhone = (selectedDocForDetail as any).phone || "+91 98765 00000";
        const docQual = (selectedDocForDetail as any).qualification || "MBBS, MD";

        // Filter medical records accessed / authored by this doctor
        const accessedRecords = records.filter(
          (r) => r.doctorId === selectedDocForDetail.id || r.doctorName.toLowerCase() === selectedDocForDetail.name.toLowerCase()
        );

        return (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#13192B] border border-purple-500/40 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative space-y-5 text-slate-100 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setSelectedDocForDetail(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl bg-[#0D121F]"
              >
                ✕
              </button>

              {/* Header */}
              <div className="flex items-center space-x-3 text-purple-400 pb-3 border-b border-slate-800">
                <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold text-lg shrink-0">
                  DR
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{selectedDocForDetail.name}</h3>
                  <p className="text-xs text-purple-400 font-mono font-bold">{selectedDocForDetail.specialization} • {docDept}</p>
                </div>
              </div>

              {/* Doctor Details Grid */}
              <div className="bg-[#0D121F] p-4 rounded-2xl border border-slate-800 grid grid-cols-2 gap-3 text-xs font-mono">
                <div>Hospital Node: <strong className="text-white">{selectedDocForDetail.hospitalName || hospital.name}</strong></div>
                <div>Login Email: <strong className="text-cyan-300">{selectedDocForDetail.email}</strong></div>
                <div>License #: <strong className="text-cyan-300">{selectedDocForDetail.licenseNumber}</strong></div>
                <div>Phone: <strong className="text-slate-200">{docPhone}</strong></div>
                <div>Qualification: <strong className="text-slate-200">{docQual}</strong></div>
                <div>Clinical Experience: <strong className="text-amber-400">{selectedDocForDetail.experienceYears} Years</strong></div>
                <div>Consultation Fee: <strong className="text-emerald-400">₹{selectedDocForDetail.fee}</strong></div>
                <div>Account Status: <strong className="text-emerald-400">{selectedDocForDetail.status}</strong></div>
              </div>

              {/* Working Schedule */}
              <div className="bg-[#0D121F] p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                <span className="font-bold text-purple-300 uppercase text-[10px]">Weekly Consultation OPD Schedule</span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {(selectedDocForDetail.workingDays || ["Monday", "Wednesday", "Friday"]).map((day, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-purple-950 border border-purple-500/40 text-purple-300 rounded-lg text-[10px] font-bold font-mono">
                      {day}
                    </span>
                  ))}
                </div>
              </div>

              {/* ACCESSED PATIENT MEDICAL RECORDS SECTION */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <span>Patient Medical Records Accessed & Authored ({accessedRecords.length})</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Audit Access Ledger</span>
                </div>

                {accessedRecords.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {accessedRecords.map((rec) => (
                      <div key={rec.id} className="bg-[#0D121F] border border-slate-800 p-3 rounded-xl space-y-1 text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-white">{rec.title}</span>
                            <div className="text-[10px] text-cyan-400 font-mono">
                              Patient Health ID: <strong className="text-white">{rec.patientHealthId}</strong>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 bg-purple-950 border border-purple-500/40 text-purple-300 text-[10px] font-mono font-bold rounded">
                            {rec.recordType}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 line-clamp-1">{rec.diagnosis || rec.doctorNotes}</p>
                        <div className="text-[10px] text-slate-500 font-mono flex justify-between pt-1 border-t border-slate-800/60">
                          <span>Date: {rec.date}</span>
                          <span>Signed: {rec.doctorSignature || rec.doctorName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#0D121F] border border-slate-800 p-4 rounded-2xl text-center text-xs text-slate-400 italic">
                    No clinical medical records or consultations logged by Dr. {selectedDocForDetail.name} yet.
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedDocForDetail(null)}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition text-xs"
              >
                Close Physician Audit Detail
              </button>
            </div>
          </div>
        );
      })()}

      {/* ADD DEPARTMENT MODAL */}
      {showAddDeptModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#13192B] border border-indigo-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl relative space-y-4 text-slate-100">
            <button
              onClick={() => setShowAddDeptModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl bg-[#0D121F]"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 text-indigo-400 pb-2 border-b border-slate-800">
              <Layers className="w-6 h-6" />
              <div>
                <h3 className="font-bold text-white text-base">Add Clinical Department</h3>
                <p className="text-xs text-slate-400">Establish new department wing in {hospital.name}</p>
              </div>
            </div>

            <form onSubmit={handleAddDepartment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="e.g. Dermatology / Nephrology"
                  className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition text-xs"
              >
                Create Department
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
