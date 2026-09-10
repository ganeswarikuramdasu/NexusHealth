import React, { useState, useEffect, useCallback } from "react";
import { History, UserCheck, MessageSquareWarning, RefreshCw } from "lucide-react";
import { safeFetchJson } from "../utils/api";
import type { LinkedAccessEvent } from "./ComplaintCenter";

interface GrantedAccessRow {
  accessLogId: string;
  accessMethod: string;
  doctorId: string;
  doctorName: string;
  patientId: string;
  patientHealthId: string;
  patientName: string;
  hospitalName: string;
  accessStatus: string;
  reason: string;
  recordsAccessed: string[];
  timestamp: string;
  source: string;
}

interface GrantedAccessListProps {
  patientId: string;
  onRaiseComplaint: (event: LinkedAccessEvent) => void;
}

export const GrantedAccessList: React.FC<GrantedAccessListProps> = ({ patientId, onRaiseComplaint }) => {
  const [events, setEvents] = useState<GrantedAccessRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await safeFetchJson<GrantedAccessRow[]>(`/api/patient/access-events/${patientId}`, undefined, []);
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load granted access events:", err);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-[#17C964]" />
            <span>Granted Access List - Who Accessed You</span>
          </h3>
          <p className="text-xs text-slate-500">
            Every doctor or staff member who accessed your health data through any method (card scan, consent, appointment, emergency break-glass).
          </p>
        </div>
        <button
          onClick={fetchEvents}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-slate-400 text-center py-8">Loading access events...</p>
      ) : events.length === 0 ? (
        <div className="p-8 text-center text-slate-500 bg-[#FFFFFF] border border-slate-200 rounded-2xl text-xs">
          No one has accessed your records yet. Access events from card scans, consents, appointments, and emergency access will appear here.
        </div>
      ) : (
        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
          {events.map((e) => (
            <div key={e.accessLogId} className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-4 space-y-2 text-xs shadow-md">
              <div className="flex justify-between items-start gap-3 flex-wrap">
                <div className="space-y-0.5 min-w-0">
                  <p className="font-bold text-slate-900 text-sm">{e.doctorName || "Unknown accessor"}</p>
                  <p className="text-[10px] text-slate-500">
                    {e.hospitalName || "Healthcare Facility"} • {e.accessMethod || e.source}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    e.accessStatus === "AUTHORIZED" || e.accessStatus === "GRANTED"
                      ? "bg-[#E9FBF1] text-[#17C964] border-[#17C964]/30"
                      : "bg-amber-50 text-amber-700 border-amber-500/30"
                  }`}
                >
                  {e.accessStatus || e.source}
                </span>
              </div>

              <p className="text-slate-700 text-[11px]">{e.reason}</p>

              {e.recordsAccessed && e.recordsAccessed.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {e.recordsAccessed.map((rec, idx) => (
                    <span key={idx} className="bg-[#EDF1F5] text-slate-500 text-[9px] font-mono px-2 py-0.5 rounded-lg border border-slate-200">
                      {rec}
                    </span>
                  ))}
                </div>
              )}

              <div className="pt-1 border-t border-slate-200/60 flex justify-between items-center text-[10px] text-slate-500 font-mono flex-wrap gap-2">
                <span>{e.timestamp ? new Date(e.timestamp).toLocaleString() : ""}</span>
                <button
                  onClick={() =>
                    onRaiseComplaint({
                      accessLogId: e.accessLogId,
                      accessedMethod: e.accessMethod || e.source,
                      doctorId: e.doctorId,
                      doctorName: e.doctorName,
                      patientId: e.patientId,
                      patientHealthId: e.patientHealthId,
                    })
                  }
                  className="px-3 py-1.5 bg-[#FDE9E3] hover:bg-[#F2603C]/20 border border-[#F2603C]/50 text-[#C83E1E] rounded-lg font-bold flex items-center space-x-1.5 transition"
                >
                  <MessageSquareWarning className="w-3.5 h-3.5" />
                  <span>Raise Complaint About This Access</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="p-3 bg-[#EDF1F5] border border-slate-200 rounded-xl text-[10px] text-slate-500 flex items-center space-x-2">
        <History className="w-3.5 h-3.5 text-[#17C964] shrink-0" />
        <span>Card scans are always granted for active cards; every scan is logged here and in the Super Admin audit trail.</span>
      </div>
    </div>
  );
};