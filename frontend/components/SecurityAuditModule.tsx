import React, { useState, useEffect } from "react";
import { AuditLog } from "../types";
import { safeFetchJson } from "../utils/api";
import { ShieldCheck, Eye, Lock, AlertTriangle, Clock, RefreshCw } from "lucide-react";

interface SecurityAuditModuleProps {
  patientHealthId: string;
}

export const SecurityAuditModule: React.FC<SecurityAuditModuleProps> = ({ patientHealthId }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      // Try to fetch patient specific record access history endpoint
      const accessData = await safeFetchJson<any[]>(`/api/patients/access-history/${patientHealthId}`, undefined, []);
      if (Array.isArray(accessData) && accessData.length > 0) {
        const formattedLogs: AuditLog[] = accessData.map((l: any) => ({
          id: l.id,
          timestamp: new Date(l.timestamp).toLocaleString("en-IN"),
          actorName: `${l.doctorName} (${l.hospitalName || "Hospital"})`,
          actorRole: "DOCTOR",
          action: `${l.accessMethod} - ${l.accessStatus}`,
          targetPatientHealthId: l.patientHealthId,
          details: l.reason || `Accessed EHR records: ${l.recordsAccessed?.join(", ")}`,
          ipAddress: l.ipAddress || "127.0.0.1"
        }));
        setLogs(formattedLogs);
        return;
      }

      // Fallback to general audit logs
      const data = await safeFetchJson<AuditLog[]>("/api/admin/audit-logs", undefined, []);
      if (Array.isArray(data)) {
        const relevant = data.filter(
          (l) => l.targetPatientHealthId === patientHealthId || l.targetPatientHealthId === "N/A" || l.action.includes("ACCESS")
        );
        setLogs(relevant.length > 0 ? relevant : data.slice(0, 8));
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [patientHealthId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-[#17C964]" />
            <span>Medical Record Access Audit Vault</span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time immutable security logs of every physician, hospital, and administrator who queried your record ({patientHealthId})
          </p>
        </div>

        <button
          onClick={fetchAuditLogs}
          disabled={isLoading}
          className="px-4 py-2 bg-[#FFFFFF] hover:bg-slate-100 border border-slate-300/80 rounded-xl text-slate-700 text-xs font-bold transition flex items-center space-x-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#17C964]" : ""}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Accessor Name</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Authorization Source</th>
                <th className="py-3 px-3">Details / Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 text-slate-800">
              {logs.map((log) => {
                const isBreakGlass = log.action.includes("EMERGENCY") || log.action.includes("BREAK_GLASS");
                const isDenied = log.action.includes("DENIED") || log.action.includes("BLOCKED");

                return (
                  <tr key={log.id} className="hover:bg-[#EDF1F5]">
                    <td className="py-3 px-3 text-slate-500">{log.timestamp}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{log.actorName}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-[#E9FBF1] border border-[#17C964]/30 text-[#17C964] text-[10px] rounded">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isBreakGlass
                            ? "bg-[#FDECE8] border-[#F2603C]/50 text-[#E23A2E]"
                            : isDenied
                            ? "bg-[#FDECE8] border-[#F2603C]/50 text-[#E23A2E]"
                            : "bg-[#E9FBF1] border-[#17C964]/50 text-[#17C964]"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#17C964] font-bold">
                      {isBreakGlass ? "⚠️ Emergency Override" : "✓ Active Consent"}
                    </td>
                    <td className="py-3 px-3 text-slate-700 max-w-xs truncate">{log.details}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
