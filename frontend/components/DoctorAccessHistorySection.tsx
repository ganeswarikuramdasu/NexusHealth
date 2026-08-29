import React, { useState, useEffect } from "react";
import { DoctorProfile } from "../types";
import { safeFetchJson } from "../utils/api";
import {
  History,
  Search,
  Calendar,
  User,
  CreditCard,
  ShieldCheck,
  Fingerprint,
  Siren,
  Filter,
  FileSpreadsheet,
  Clock,
  Lock,
} from "lucide-react";

interface DoctorAccessHistorySectionProps {
  doctor: DoctorProfile | any;
}

export const DoctorAccessHistorySection: React.FC<DoctorAccessHistorySectionProps> = ({ doctor }) => {
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const data = await safeFetchJson<any[]>(`/api/doctor/access-history?doctorId=${doctor.id}`, undefined, []);
        if (Array.isArray(data)) {
          setAccessLogs(data);
        }
      } catch (err) {
        console.error("Error loading access history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [doctor.id]);

  const filteredLogs = accessLogs.filter((log) => {
    const matchesSearch =
      !searchQuery ||
      log.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.patientHealthId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.id?.toLowerCase().includes(searchQuery.toLowerCase());

    const isEmergency =
      log.accessMethod === "EMERGENCY" ||
      log.accessMethod === "EMERGENCY_BREAK_GLASS" ||
      log.accessMethod === "EMERGENCY_ACCESS" ||
      Boolean(log.emergencyFlag);

    let matchesMethod = true;
    if (methodFilter === "EMERGENCY" || methodFilter === "EMERGENCY_BREAK_GLASS") {
      matchesMethod = isEmergency;
    } else if (methodFilter === "PATIENT_ACCESS_CARD") {
      matchesMethod = log.accessMethod === "PATIENT_ACCESS_CARD" || log.accessMethod === "ACCESS_CARD";
    } else if (methodFilter === "BIOMETRIC") {
      matchesMethod = log.accessMethod === "BIOMETRIC" || log.accessMethod === "FACE_SCAN";
    } else if (methodFilter === "PATIENT_HEALTH_ID") {
      matchesMethod = log.accessMethod === "PATIENT_HEALTH_ID" || log.accessMethod === "PATIENT_ID";
    } else if (methodFilter !== "ALL") {
      matchesMethod = log.accessMethod === methodFilter;
    }

    return matchesSearch && matchesMethod;
  });

  const getMethodBadge = (method: string) => {
    switch (method) {
      case "APPOINTMENT":
        return { label: "Appointment", color: "bg-blue-950 text-blue-400 border-blue-800", icon: Calendar };
      case "PATIENT_ACCESS_CARD":
      case "ACCESS_CARD":
        return { label: "Access Card", color: "bg-emerald-950 text-emerald-400 border-emerald-800", icon: CreditCard };
      case "BIOMETRIC":
      case "FACE_SCAN":
        return { label: "Biometric", color: "bg-purple-950 text-purple-400 border-purple-800", icon: Fingerprint };
      case "EMERGENCY_BREAK_GLASS":
      case "EMERGENCY":
      case "EMERGENCY_ACCESS":
        return { label: "Emergency", color: "bg-red-950 text-red-400 border-red-800", icon: Siren };
      case "PATIENT_AUTHORIZATION":
        return { label: "Consent Grant", color: "bg-amber-950 text-amber-400 border-amber-800", icon: ShieldCheck };
      default:
        return { label: "Health ID Lookup", color: "bg-indigo-950 text-indigo-400 border-indigo-800", icon: User };
    }
  };

  return (
    <div className="bg-[#13192B] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 text-xs">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-purple-500/20 border border-purple-500/40 rounded-full text-xs font-mono font-bold text-purple-300 mb-1">
            <History className="w-3.5 h-3.5 text-purple-400" />
            <span>Immutable Doctor Access Ledger</span>
          </div>
          <h2 className="text-xl font-black text-white">My Patient Record Access History</h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Complete audit trail of every patient health record accessed by Dr. {doctor.name}.
          </p>
        </div>

        <div className="px-3 py-1.5 bg-[#0D121F] border border-slate-800 rounded-xl font-mono text-emerald-400 font-bold text-xs">
          Total Access Sessions: {accessLogs.length}
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient name, Health ID, reason..."
            className="w-full bg-[#0D121F] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 text-xs focus:border-purple-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
        </div>

        {/* Method Filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {[
            { key: "ALL", label: "All Methods" },
            { key: "APPOINTMENT", label: "Appointment" },
            { key: "PATIENT_HEALTH_ID", label: "Health ID" },
            { key: "PATIENT_ACCESS_CARD", label: "Access Card" },
            { key: "BIOMETRIC", label: "Biometric" },
            { key: "EMERGENCY_BREAK_GLASS", label: "Emergency" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setMethodFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg font-bold text-[11px] whitespace-nowrap transition ${
                methodFilter === f.key
                  ? "bg-purple-600 text-white shadow-md"
                  : "bg-[#0D121F] text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* LOGS LIST */}
      {loading ? (
        <div className="p-8 text-center text-slate-400">Loading access audit logs...</div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-8 text-center text-slate-400 bg-[#0D121F] rounded-2xl border border-slate-800">
          No record access logs found matching filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const badge = getMethodBadge(log.accessMethod);
            const Icon = badge.icon;
            return (
              <div
                key={log.id}
                className="p-4 bg-[#0D121F] border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:border-slate-700"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-bold text-sm text-white">{log.patientName}</span>
                    <span className="text-emerald-400 font-mono text-xs font-bold">({log.patientHealthId})</span>
                    <span className={`px-2 py-0.5 border rounded font-mono text-[10px] font-bold flex items-center space-x-1 ${badge.color}`}>
                      <Icon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  <div className="text-slate-400 text-xs">
                    <strong>Reason / Context:</strong> {log.reason || "Clinical Record Consultation"}
                  </div>

                  {log.justification && (
                    <div className="text-rose-300 text-[11px] bg-red-950/40 p-2 rounded-lg border border-red-900/40 mt-1">
                      <strong>Break-Glass Justification:</strong> {log.justification}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 font-mono pt-1">
                    <span>Session ID: {log.id}</span>
                    <span>•</span>
                    <span>Hospital: {log.hospitalName || "Apollo Speciality Hospital"}</span>
                    <span>•</span>
                    <span>IP: {log.ipAddress || "127.0.0.1"}</span>
                  </div>
                </div>

                <div className="text-right shrink-0 font-mono text-xs text-slate-400">
                  <div>{log.timestamp || log.startedAt || "2026-08-11"}</div>
                  <div className="text-emerald-400 font-bold text-[10px] uppercase mt-0.5">
                    ✓ AUDIT LOGGED
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
