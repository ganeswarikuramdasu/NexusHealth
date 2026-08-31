import React, { useState, useEffect } from "react";
import { PatientRecordAccessLog, RecordAccessMethod, RecordAccessStatus } from "../types";
import {
  ShieldCheck,
  Lock,
  Eye,
  AlertTriangle,
  Search,
  Filter,
  Clock,
  RefreshCw,
  FileText,
  Building2,
  Stethoscope,
  User,
  CheckCircle2,
  XCircle,
  CreditCard,
  Fingerprint,
  ScanFace,
  Calendar,
  ChevronRight,
  Info,
  ShieldAlert,
  Laptop,
  Check,
  X,
  Activity
} from "lucide-react";

interface HierarchicalAuditLogViewerProps {
  viewMode: "SUPER_ADMIN" | "HOSPITAL_ADMIN" | "PATIENT";
  hospitalId?: string;
  hospitalName?: string;
  patientHealthId?: string;
  patientUserId?: string;
}

export const HierarchicalAuditLogViewer: React.FC<HierarchicalAuditLogViewerProps> = ({
  viewMode,
  hospitalId = "hosp_1",
  hospitalName = "Apollo Multi-Specialty Hospital",
  patientHealthId,
  patientUserId,
}) => {
  const [logs, setLogs] = useState<PatientRecordAccessLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [doctorActivity, setDoctorActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLogForTrace, setSelectedLogForTrace] = useState<PatientRecordAccessLog | null>(null);

  // Filter States
  const [search, setSearch] = useState("");
  const [selectedHospitalFilter, setSelectedHospitalFilter] = useState("ALL");
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState("ALL");
  const [selectedMethodFilter, setSelectedMethodFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<"ALL_LOGS" | "DOCTOR_ACTIVITY" | "SUSPICIOUS">("ALL_LOGS");

  const fetchAuditData = async () => {
    setIsLoading(true);
    try {
      const parseSafeJson = async (res: Response, fallback: any) => {
        if (!res.ok) return fallback;
        const ct = res.headers.get("content-type");
        if (!ct || !ct.includes("application/json")) return fallback;
        try {
          return await res.json();
        } catch {
          return fallback;
        }
      };

      if (viewMode === "SUPER_ADMIN") {
        let url = `/api/admin/record-access-logs?search=${encodeURIComponent(search)}`;
        if (selectedHospitalFilter !== "ALL") url += `&hospitalId=${selectedHospitalFilter}`;
        if (selectedDoctorFilter !== "ALL") url += `&doctorId=${selectedDoctorFilter}`;
        if (selectedMethodFilter !== "ALL") url += `&accessMethod=${selectedMethodFilter}`;
        if (selectedStatusFilter !== "ALL") url += `&accessStatus=${selectedStatusFilter}`;
        if (emergencyOnly) url += `&emergencyFlag=true`;

        const [resLogs, resStats] = await Promise.all([
          fetch(url),
          fetch("/api/admin/audit-statistics")
        ]);

        const logsData = await parseSafeJson(resLogs, []);
        const statsData = await parseSafeJson(resStats, null);

        setLogs(Array.isArray(logsData) ? logsData : []);
        setStats(statsData || null);
      } else if (viewMode === "PATIENT") {
        // PATIENT Mode - Strictly scoped to patientHealthId / patientUserId
        const targetPid = patientHealthId || patientUserId || "";
        let url = `/api/admin/record-access-logs?patientId=${encodeURIComponent(targetPid)}&search=${encodeURIComponent(search)}`;
        if (selectedMethodFilter !== "ALL") url += `&accessMethod=${selectedMethodFilter}`;
        if (selectedStatusFilter !== "ALL") url += `&accessStatus=${selectedStatusFilter}`;
        if (emergencyOnly) url += `&emergencyFlag=true`;

        const resLogs = await fetch(url);
        const logsData = await parseSafeJson(resLogs, []);
        const pLogs = Array.isArray(logsData) ? logsData : [];

        setLogs(pLogs);
        setStats({
          totalAccesses: pLogs.length,
          successfulAccesses: pLogs.filter((l: any) => l.accessStatus === "SUCCESS").length,
          deniedAccesses: pLogs.filter((l: any) => l.accessStatus === "DENIED").length,
          emergencyAccesses: pLogs.filter((l: any) => l.emergencyFlag || l.accessMethod === "EMERGENCY").length,
          cardAccesses: pLogs.filter((l: any) => l.accessMethod === "ACCESS_CARD").length,
          biometricAccesses: pLogs.filter((l: any) => l.accessMethod === "BIOMETRIC").length,
          faceScanAccesses: pLogs.filter((l: any) => l.accessMethod === "FACE_SCAN").length,
        });
      } else {
        // HOSPITAL_ADMIN Mode - Scoped to hospitalId
        let url = `/api/hospital/audit-logs?hospitalId=${encodeURIComponent(hospitalId)}&search=${encodeURIComponent(search)}`;
        if (selectedDoctorFilter !== "ALL") url += `&doctorId=${selectedDoctorFilter}`;
        if (selectedMethodFilter !== "ALL") url += `&accessMethod=${selectedMethodFilter}`;
        if (selectedStatusFilter !== "ALL") url += `&accessStatus=${selectedStatusFilter}`;
        if (emergencyOnly) url += `&emergencyFlag=true`;

        const headers = {
          "x-hospital-id": hospitalId,
          "x-caller-hospital-id": hospitalId
        };

        const [resLogs, resStats, resDocAct] = await Promise.all([
          fetch(url, { headers }),
          fetch(`/api/hospital/audit-statistics?hospitalId=${hospitalId}`, { headers }),
          fetch(`/api/hospital/doctor-activity?hospitalId=${hospitalId}`, { headers })
        ]);

        if (resLogs.status === 403) {
          alert("Forbidden: Hospital Admin is restricted strictly to their own hospital records.");
          return;
        }

        const logsData = await parseSafeJson(resLogs, []);
        const statsData = await parseSafeJson(resStats, null);
        const docActData = await parseSafeJson(resDocAct, []);

        setLogs(Array.isArray(logsData) ? logsData : []);
        setStats(statsData || null);
        setDoctorActivity(Array.isArray(docActData) ? docActData : []);
      }
    } catch (err) {
      console.error("Failed to load hierarchical audit logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [
    viewMode,
    hospitalId,
    patientHealthId,
    patientUserId,
    selectedHospitalFilter,
    selectedDoctorFilter,
    selectedMethodFilter,
    selectedStatusFilter,
    emergencyOnly,
    search,
  ]);

  const renderMethodBadge = (method: RecordAccessMethod) => {
    switch (method) {
      case "EMERGENCY":
        return (
          <span className="px-2.5 py-1 bg-[#FDECE8] border border-[#F2603C]/30 text-[#E23A2E] text-[11px] font-bold rounded-lg flex items-center space-x-1">
            <AlertTriangle className="w-3.5 h-3.5 text-[#E23A2E]" />
            <span>🚨 ER Emergency</span>
          </span>
        );
      case "ACCESS_CARD":
        return (
          <span className="px-2.5 py-1 bg-[#E9FBF1] border border-[#17C964]/40 text-[#17C964] text-[11px] font-bold rounded-lg flex items-center space-x-1">
            <CreditCard className="w-3.5 h-3.5 text-[#17C964]" />
            <span>Health Card Scan</span>
          </span>
        );
      case "APPOINTMENT":
        return (
          <span className="px-2.5 py-1 bg-[#E9FBF1] border border-[#17C964]/40 text-[#17C964] text-[11px] font-bold rounded-lg flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-[#17C964]" />
            <span>Appointment</span>
          </span>
        );
      case "BIOMETRIC":
        return (
          <span className="px-2.5 py-1 bg-[#E9FBF1] border border-[#17C964]/40 text-[#17C964] text-[11px] font-bold rounded-lg flex items-center space-x-1">
            <Fingerprint className="w-3.5 h-3.5 text-[#17C964]" />
            <span>Fingerprint Touch</span>
          </span>
        );
      case "FACE_SCAN":
        return (
          <span className="px-2.5 py-1 bg-[#E9FBF1] border border-[#17C964]/40 text-[#17C964] text-[11px] font-bold rounded-lg flex items-center space-x-1">
            <ScanFace className="w-3.5 h-3.5 text-[#17C964]" />
            <span>Face Recognition</span>
          </span>
        );
      case "PATIENT_ID":
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-100 border border-slate-300 text-slate-700 text-[11px] font-bold rounded-lg flex items-center space-x-1">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <span>Direct Health ID</span>
          </span>
        );
    }
  };

  const renderStatusBadge = (status: RecordAccessStatus) => {
    if (status === "SUCCESS") {
      return (
        <span className="px-2.5 py-1 bg-[#E9FBF1] border border-[#17C964]/30 text-[#17C964] text-[11px] font-bold rounded-lg flex items-center space-x-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#17C964]" />
          <span>GRANTED</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 bg-[#FDECE8] border border-[#F2603C]/30 text-[#E23A2E] text-[11px] font-bold rounded-lg flex items-center space-x-1 animate-pulse">
        <XCircle className="w-3.5 h-3.5 text-[#E23A2E]" />
        <span>DENIED / BLOCKED</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-[#17C964]" />
            <h2 className="text-xl font-extrabold text-slate-900">
              {viewMode === "SUPER_ADMIN"
                ? "Global Hierarchical Patient Record Access Audit Tracking System"
                : viewMode === "PATIENT"
                ? "My Personal Health Record Access Audit Vault"
                : `${hospitalName} - Patient Record Access Audit Vault`}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {viewMode === "SUPER_ADMIN"
              ? "Immutable global audit log tracking physician accesses across all connected national hospitals"
              : viewMode === "PATIENT"
              ? "Complete immutable ledger tracking all doctor, hospital, access card, and emergency accesses to your health records"
              : `Strict hospital-level access isolation ledger enforcing full audit logging for ${hospitalName}`}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchAuditData}
            disabled={isLoading}
            className="px-4 py-2 bg-[#FFFFFF] hover:bg-slate-100 border border-slate-300/80 rounded-xl text-slate-800 text-xs font-bold transition flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#17C964]" : ""}`} />
            <span>Refresh Audit Ledger</span>
          </button>
        </div>
      </div>

      {/* Stats Metric Cards Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Total Accesses</span>
            <div className="text-2xl font-black text-slate-900">{stats.totalAccesses || 0}</div>
            <span className="text-[10px] text-[#17C964] font-mono">100% Logged</span>
          </div>

          <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Granted Accesses</span>
            <div className="text-2xl font-black text-[#17C964]">{stats.successfulAccesses || 0}</div>
            <span className="text-[10px] text-slate-500 font-mono">Authorized EHR</span>
          </div>

          <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Denied / Blocked</span>
            <div className="text-2xl font-black text-[#E23A2E]">{stats.deniedAccesses || 0}</div>
            <span className="text-[10px] text-[#E23A2E] font-mono">Unconsented Block</span>
          </div>

          <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-500 block">ER Emergency</span>
            <div className="text-2xl font-black text-[#F2603C]">{stats.emergencyAccesses || 0}</div>
            <span className="text-[10px] text-[#E23A2E] font-mono">Break-Glass Overrides</span>
          </div>

          <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Health Card Scans</span>
            <div className="text-2xl font-black text-[#17C964]">{stats.cardAccesses || 0}</div>
            <span className="text-[10px] text-[#17C964] font-mono">Physical Token</span>
          </div>

          <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Biometric / Face</span>
            <div className="text-2xl font-black text-[#17C964]">
              {(stats.biometricAccesses || 0) + (stats.faceScanAccesses || 0)}
            </div>
            <span className="text-[10px] text-[#17C964] font-mono">Touch & Kiosk Scan</span>
          </div>
        </div>
      )}

      {/* Tabs Switcher (ALL_LOGS vs DOCTOR_ACTIVITY vs SUSPICIOUS) */}
      <div className="flex items-center space-x-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("ALL_LOGS")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center space-x-2 ${
            activeTab === "ALL_LOGS"
              ? "bg-[#17C964] text-white border border-[#17C964]/50"
              : "bg-[#FFFFFF] text-slate-500 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Patient Record Access Logs ({logs.length})</span>
        </button>

        {viewMode === "HOSPITAL_ADMIN" && (
          <button
            onClick={() => setActiveTab("DOCTOR_ACTIVITY")}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center space-x-2 ${
              activeTab === "DOCTOR_ACTIVITY"
                ? "bg-[#17C964] text-white border border-[#17C964]/50"
                : "bg-[#FFFFFF] text-slate-500 hover:text-slate-900 border border-slate-200"
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Hospital Doctor Activity Breakdown ({doctorActivity.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab("SUSPICIOUS")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center space-x-2 ${
            activeTab === "SUSPICIOUS"
              ? "bg-[#FDECE8] text-[#E23A2E] border border-[#F2603C]/50"
              : "bg-[#FFFFFF] text-slate-500 hover:text-slate-900 border border-slate-200"
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-[#E23A2E]" />
          <span>Denied Attempts & Emergency Audit ({logs.filter(l => l.accessStatus === "DENIED" || l.emergencyFlag).length})</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      {activeTab === "ALL_LOGS" && (
        <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-4 space-y-3 shadow-lg">
          <div className="flex flex-col lg:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search logs by Doctor, Patient, Health ID, Hospital, or Reason..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#17C964]"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {viewMode === "SUPER_ADMIN" && (
                <select
                  value={selectedHospitalFilter}
                  onChange={(e) => setSelectedHospitalFilter(e.target.value)}
                  className="bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium outline-none focus:border-[#17C964]"
                >
                  <option value="ALL">🔍 All Hospitals</option>
                  <option value="hosp_1">Apollo Multi-Specialty Hospital</option>
                  <option value="hosp_2">Max Super Specialty Hospital</option>
                </select>
              )}

              <select
                value={selectedMethodFilter}
                onChange={(e) => setSelectedMethodFilter(e.target.value)}
                className="bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium outline-none focus:border-[#17C964]"
              >
                <option value="ALL">🔍 All Access Methods</option>
                <option value="APPOINTMENT">🔑 Scheduled Appointment</option>
                <option value="ACCESS_CARD">🔑 Health Access Card</option>
                <option value="EMERGENCY">🔑 ER Emergency Break-Glass</option>
                <option value="BIOMETRIC">🔑 Biometric Fingerprint</option>
                <option value="FACE_SCAN">🔑 Facial Recognition</option>
                <option value="PATIENT_ID">🔑 Direct Health ID Lookup</option>
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium outline-none focus:border-[#17C964]"
              >
                <option value="ALL">🔍 All Statuses</option>
                <option value="SUCCESS">🔓 Access Granted</option>
                <option value="DENIED">🔒 Access Denied / Blocked</option>
              </select>

              <button
                onClick={() => setEmergencyOnly(!emergencyOnly)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                  emergencyOnly
                    ? "bg-[#FDECE8] text-[#E23A2E] border border-[#F2603C]/60"
                    : "bg-[#EDF1F5] text-slate-500 border border-slate-200 hover:text-slate-900"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Emergency Only</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALL LOGS TABLE */}
      {activeTab === "ALL_LOGS" && (
        <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-3 px-3">Log ID</th>
                  <th className="py-3 px-3">Physician / Hospital</th>
                  <th className="py-3 px-3">Patient Citizen</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#EDF1F5] transition">
                    <td className="py-3 px-3 font-bold text-[#17C964]">{log.id}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 text-sm">{log.doctorName}</div>
                      <div className="text-[10px] text-[#17C964] flex items-center space-x-1">
                        <Building2 className="w-3 h-3 text-[#17C964]" />
                        <span>{log.hospitalName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{log.patientName}</div>
                      <div className="text-[10px] text-[#17C964] font-mono">{log.patientHealthId}</div>
                    </td>
                    <td className="py-3 px-3">{renderMethodBadge(log.accessMethod)}</td>
                    <td className="py-3 px-3">{renderStatusBadge(log.accessStatus)}</td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {new Date(log.timestamp).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedLogForTrace(log)}
                        className="px-3 py-1.5 bg-[#E9FBF1] hover:bg-[#17C964]/10 border border-[#17C964]/40 text-[#17C964] text-xs font-bold rounded-xl transition flex items-center space-x-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Trace</span>
                      </button>
                    </td>
                  </tr>
                ))}

                {logs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No record access audit entries found matching the active filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DOCTOR ACTIVITY TAB */}
      {activeTab === "DOCTOR_ACTIVITY" && viewMode === "HOSPITAL_ADMIN" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctorActivity.map((doc) => (
            <div key={doc.doctorId} className="bg-[#FFFFFF] border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{doc.doctorName}</h3>
                  <p className="text-xs text-[#17C964]">{doc.specialization} ({doc.department})</p>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                  doc.isActive ? "bg-[#E9FBF1] border-[#17C964]/40 text-[#17C964]" : "bg-[#FDECE8] border-[#F2603C]/40 text-[#E23A2E]"
                }`}>
                  {doc.isActive ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-[#EDF1F5] p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Total Accesses</span>
                  <strong className="text-slate-900 text-base">{doc.totalAccesses}</strong>
                </div>
                <div className="bg-[#EDF1F5] p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Appointments</span>
                  <strong className="text-[#17C964] text-base">{doc.appointmentAccesses}</strong>
                </div>
                <div className="bg-[#EDF1F5] p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">ER Emergency</span>
                  <strong className="text-[#F2603C] text-base">{doc.emergencyAccesses}</strong>
                </div>
                <div className="bg-[#EDF1F5] p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Denied Attempts</span>
                  <strong className="text-[#E23A2E] text-base">{doc.deniedAttempts}</strong>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1">Recent Access Activity</span>
                <div className="space-y-1.5 text-[11px] font-mono">
                  {doc.recentLogs.map((l: any) => (
                    <div key={l.id} className="p-2 bg-[#EDF1F5] border border-slate-200 rounded-xl flex items-center justify-between">
                      <span className="text-slate-900 font-bold">{l.patientName}</span>
                      {renderMethodBadge(l.accessMethod)}
                    </div>
                  ))}
                  {doc.recentLogs.length === 0 && (
                    <span className="text-[10px] text-slate-500 italic block">No recent access logs.</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUSPICIOUS TAB */}
      {activeTab === "SUSPICIOUS" && (
        <div className="space-y-4">
          <div className="bg-[#FDECE8] border border-[#F2603C]/40 rounded-2xl p-4 text-xs text-[#E23A2E] flex items-center space-x-3">
            <ShieldAlert className="w-5 h-5 text-[#E23A2E] shrink-0" />
            <div>
              <strong className="font-bold text-[#E23A2E] block">Audit Security Monitor</strong>
              Displays unconsented direct lookup attempts, invalid PIN entry rejections, and critical emergency break-glass overrides requiring administrator review.
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-3 px-3">Log ID</th>
                    <th className="py-3 px-3">Doctor</th>
                    <th className="py-3 px-3">Patient</th>
                    <th className="py-3 px-3">Reason / Incident Detail</th>
                    <th className="py-3 px-3">Method</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-800">
                  {logs
                    .filter((l) => l.accessStatus === "DENIED" || l.emergencyFlag)
                    .map((log) => (
                      <tr key={log.id} className="hover:bg-[#EDF1F5]">
                        <td className="py-3 px-3 font-bold text-[#E23A2E]">{log.id}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{log.doctorName}</td>
                        <td className="py-3 px-3 text-[#17C964]">{log.patientName} ({log.patientHealthId})</td>
                        <td className="py-3 px-3 text-slate-700">{log.reason}</td>
                        <td className="py-3 px-3">{renderMethodBadge(log.accessMethod)}</td>
                        <td className="py-3 px-3">{renderStatusBadge(log.accessStatus)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT LOG RELATIONSHIP TRACE MODAL */}
      {selectedLogForTrace && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-6 text-slate-900 relative">
            <button
              onClick={() => setSelectedLogForTrace(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 p-1.5 rounded-xl bg-[#EDF1F5]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 text-[#17C964] border-b border-slate-200 pb-3">
              <ShieldCheck className="w-6 h-6 text-[#17C964]" />
              <div>
                <h3 className="font-bold text-slate-900 text-base">Hierarchical Access Relationship Trace</h3>
                <p className="text-xs text-slate-500">Cryptographically immutable audit node log #{selectedLogForTrace.id}</p>
              </div>
            </div>

            {/* Hierarchical Relationship Tree Trace View */}
            <div className="bg-[#EDF1F5] border border-slate-200 p-4 rounded-2xl space-y-3">
              <div className="text-xs font-mono text-[#17C964] font-bold uppercase tracking-wider">Access Authorization Flow Tree</div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center text-xs font-mono">
                {/* Doctor Node */}
                <div className="bg-[#FFFFFF] border border-[#17C964]/40 p-3 rounded-xl space-y-1">
                  <div className="text-[10px] text-[#17C964] font-bold flex items-center space-x-1">
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>PHYSICIAN NODE</span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{selectedLogForTrace.doctorName}</div>
                  <div className="text-[10px] text-slate-500">ID: {selectedLogForTrace.doctorId}</div>
                </div>

                {/* Arrow -> Hospital */}
                <div className="bg-[#FFFFFF] border border-[#17C964]/40 p-3 rounded-xl space-y-1">
                  <div className="text-[10px] text-[#17C964] font-bold flex items-center space-x-1">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>HOSPITAL FACILITY</span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{selectedLogForTrace.hospitalName}</div>
                  <div className="text-[10px] text-slate-500">ID: {selectedLogForTrace.hospitalId}</div>
                </div>

                {/* Arrow -> Patient */}
                <div className="bg-[#FFFFFF] border border-[#17C964]/40 p-3 rounded-xl space-y-1">
                  <div className="text-[10px] text-[#17C964] font-bold flex items-center space-x-1">
                    <User className="w-3.5 h-3.5" />
                    <span>PATIENT CITIZEN</span>
                  </div>
                  <div className="font-bold text-slate-900 text-sm">{selectedLogForTrace.patientName}</div>
                  <div className="text-[10px] text-[#17C964]">{selectedLogForTrace.patientHealthId}</div>
                </div>
              </div>
            </div>

            {/* Complete Metadata Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-[#EDF1F5] p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px] block">ACCESS METHOD</span>
                <div className="mt-1">{renderMethodBadge(selectedLogForTrace.accessMethod)}</div>
              </div>

              <div className="bg-[#EDF1F5] p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px] block">AUTHORIZATION STATUS</span>
                <div className="mt-1">{renderStatusBadge(selectedLogForTrace.accessStatus)}</div>
              </div>

              <div className="bg-[#EDF1F5] p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px] block">VERIFICATION METHOD</span>
                <strong className="text-[#17C964] font-bold">{selectedLogForTrace.verificationMethod || "N/A"}</strong>
              </div>

              <div className="bg-[#EDF1F5] p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px] block">TIMESTAMP</span>
                <strong className="text-slate-900">{new Date(selectedLogForTrace.timestamp).toLocaleString("en-IN")}</strong>
              </div>

              <div className="col-span-2 bg-[#EDF1F5] p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 text-[10px] block">ACCESS REASON / CLINICAL JUSTIFICATION</span>
                <p className="text-slate-900 font-bold">{selectedLogForTrace.reason}</p>
              </div>

              <div className="col-span-2 bg-[#EDF1F5] p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 text-[10px] block">RECORDS ACCESSED</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedLogForTrace.recordsAccessed && selectedLogForTrace.recordsAccessed.length > 0 ? (
                    selectedLogForTrace.recordsAccessed.map((rec, i) => (
                      <span key={i} className="px-2 py-0.5 bg-[#E9FBF1] border border-[#17C964]/30 text-[#17C964] text-[10px] rounded">
                        {rec}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 text-[10px] italic">No medical records released (Access Denied / Blocked)</span>
                  )}
                </div>
              </div>

              <div className="bg-[#EDF1F5] p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px] block">TERMINAL IP ADDRESS</span>
                <strong className="text-[#E23A2E]">{selectedLogForTrace.ipAddress || "127.0.0.1"}</strong>
              </div>

              <div className="bg-[#EDF1F5] p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 text-[10px] block">TERMINAL DEVICE ID</span>
                <strong className="text-slate-700">{selectedLogForTrace.deviceId || "DEV-DESK-OPD-01"}</strong>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                onClick={() => setSelectedLogForTrace(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs rounded-xl transition"
              >
                Close Audit Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
