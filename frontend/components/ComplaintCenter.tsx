import React, { useState, useEffect, useCallback } from "react";
import { MessageSquareWarning, Plus, Send, CheckCircle2, AlertTriangle } from "lucide-react";
import { safeFetchJson, parseResponseSafe } from "../utils/api";

export interface LinkedAccessEvent {
  accessLogId?: string;
  accessedMethod?: string;
  doctorId?: string;
  doctorName?: string;
  patientId?: string;
  patientHealthId?: string;
}

interface ComplaintItem {
  id: string;
  complainantRole: string;
  complainantUserId: string;
  complainantName: string;
  module: string;
  category: string;
  title: string;
  description: string;
  relatedPatientId?: string;
  relatedPatientHealthId?: string;
  relatedAccessLogId?: string;
  relatedDoctorId?: string;
  relatedDoctorName?: string;
  accessedMethod?: string;
  status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "REJECTED";
  resolutionNote?: string;
  resolvedBy?: string;
  createdAt: string;
  resolvedAt?: string;
}

interface ComplaintCenterProps {
  appUser: { id: string; name: string; email: string; role: string };
  module: string;
  patientContext?: { patientId: string; patientHealthId: string; patientName?: string };
  canResolve?: boolean;
  linkedAccess?: LinkedAccessEvent | null;
  onLinkedAccessCleared?: () => void;
}

const CATEGORIES = [
  "GENERAL",
  "DATA_PRIVACY",
  "UNHAPPY_WITH_TREATMENT",
  "IMPROPER_CONDUCT",
  "INCORRECT_RECORD",
  "BILLING_INSURANCE",
  "OTHER",
];

const STATUS_STYLE: Record<string, string> = {
  OPEN: "bg-amber-50 text-amber-700 border-amber-500/40",
  IN_REVIEW: "bg-blue-50 text-blue-700 border-blue-500/40",
  RESOLVED: "bg-[#E9FBF1] text-[#0EA653] border-[#17C964]/40",
  REJECTED: "bg-[#FDE9E3] text-[#C83E1E] border-[#F2603C]/40",
};

export const ComplaintCenter: React.FC<ComplaintCenterProps> = ({
  appUser,
  module,
  patientContext,
  canResolve,
  linkedAccess,
  onLinkedAccessCleared,
}) => {
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [category, setCategory] = useState<string>("GENERAL");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveStatus, setResolveStatus] = useState<string>("RESOLVED");
  const [resolutionNote, setResolutionNote] = useState<string>("");

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const data = await safeFetchJson<ComplaintItem[]>(
        `/api/complaints/mine?role=${appUser.role}&userId=${appUser.id}`,
        undefined,
        []
      );
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load complaints:", err);
    } finally {
      setLoading(false);
    }
  }, [appUser.role, appUser.id]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints, linkedAccess]);

  const resetForm = () => {
    setCategory("GENERAL");
    setTitle("");
    setDescription("");
    setShowForm(false);
    if (linkedAccess && onLinkedAccessCleared) onLinkedAccessCleared();
  };

  const handleRaise = async () => {
    if (!title.trim() || !description.trim()) {
      setMsg({ type: "error", text: "Please provide a complaint title and description." });
      return;
    }
    try {
      const res = await fetch("/api/complaints/raise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: appUser.role,
          userId: appUser.id,
          userName: appUser.name,
          module,
          category,
          title: title.trim(),
          description: description.trim(),
          relatedPatientId: patientContext?.patientId || linkedAccess?.patientId,
          relatedPatientHealthId: patientContext?.patientHealthId || linkedAccess?.patientHealthId,
          relatedAccessLogId: linkedAccess?.accessLogId,
          relatedDoctorId: linkedAccess?.doctorId,
          relatedDoctorName: linkedAccess?.doctorName,
          accessedMethod: linkedAccess?.accessedMethod,
        }),
      });
      const data = await parseResponseSafe<any>(res, { success: false });
      if (data?.success) {
        setMsg({ type: "success", text: "Complaint filed successfully. The Super Admin team will review it." });
        resetForm();
        fetchComplaints();
      } else {
        setMsg({ type: "error", text: data?.message || "Failed to file complaint." });
      }
    } catch (err) {
      setMsg({ type: "error", text: "Server error filing complaint." });
    }
  };

  const handleResolve = async (complaintId: string) => {
    try {
      const res = await fetch(`/api/complaints/${complaintId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: resolveStatus,
          resolutionNote: resolutionNote.trim(),
          resolvedBy: appUser.id,
          resolvedByName: appUser.name,
        }),
      });
      const data = await parseResponseSafe<any>(res, { success: false });
      if (data?.success) {
        setMsg({ type: "success", text: "Complaint updated." });
        setResolvingId(null);
        setResolutionNote("");
        fetchComplaints();
      } else {
        setMsg({ type: "error", text: data?.message || "Failed to update complaint." });
      }
    } catch (err) {
      setMsg({ type: "error", text: "Server error updating complaint." });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <MessageSquareWarning className="w-5 h-5 text-[#F2603C]" />
            <span>Complaint Center</span>
          </h3>
          <p className="text-xs text-slate-500">
            Raise a complaint about access, treatment, records, or privacy. Reviewed by the Super Admin team.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-[#F2603C] hover:bg-[#E23A2E] text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Raise a Complaint</span>
        </button>
      </div>

      {msg && (
        <div
          className={`p-3 rounded-2xl border text-xs font-bold flex items-center space-x-2 ${
            msg.type === "success"
              ? "bg-[#E9FBF1] text-[#17C964] border-[#17C964]/40"
              : "bg-[#FDE9E3] text-[#C83E1E] border-[#F2603C]/40"
          }`}
        >
          {msg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {showForm && (
        <div className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-5 space-y-4 shadow-lg">
          {linkedAccess && (linkedAccess.accessLogId || linkedAccess.doctorName) && (
            <div className="p-3 bg-[#EDF1F5] border border-slate-200 rounded-xl text-[11px] text-slate-700">
              <p className="font-bold text-slate-900 mb-1">Related to an access event</p>
              <p>
                {linkedAccess.doctorName ? `Accessor: ${linkedAccess.doctorName}` : "Unknown accessor"}
                {linkedAccess.accessedMethod ? ` • Method: ${linkedAccess.accessedMethod}` : ""}
                {linkedAccess.accessLogId ? ` • Log: ${linkedAccess.accessLogId}` : ""}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 outline-none focus:border-[#F2603C]/50 text-xs font-bold"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={300}
                placeholder="Short summary of your complaint"
                className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 outline-none focus:border-[#F2603C]/50 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="Describe exactly what happened, when, and what outcome you expect."
              className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 outline-none focus:border-[#F2603C]/50 text-xs resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleRaise}
              disabled={!title.trim() || !description.trim()}
              className="px-5 py-2.5 bg-[#F2603C] hover:bg-[#E23A2E] disabled:bg-slate-200 disabled:cursor-not-allowed disabled:text-slate-400 text-white font-bold rounded-xl transition text-xs flex items-center space-x-2 shadow-md"
            >
              <Send className="w-4 h-4" />
              <span>Submit Complaint</span>
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {loading && <p className="text-xs text-slate-400 text-center py-6">Loading complaints...</p>}
        {!loading && complaints.length === 0 && (
          <div className="p-8 text-center text-slate-500 bg-[#FFFFFF] border border-slate-200 rounded-2xl text-xs">
            No complaints filed yet.
          </div>
        )}
        {complaints.map((c) => (
          <div key={c.id} className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-4 space-y-2 text-xs shadow-md">
            <div className="flex justify-between items-start gap-3 flex-wrap">
              <div className="space-y-0.5 min-w-0">
                <p className="font-bold text-slate-900 text-sm">{c.title}</p>
                <p className="text-[10px] text-slate-500">
                  {c.category.replace(/_/g, " ")} • {c.module} • Filed by {c.complainantName}
                  {c.relatedDoctorName ? ` • Regarding ${c.relatedDoctorName}` : ""}
                </p>
                {c.accessedMethod && c.relatedAccessLogId && (
                  <p className="text-[10px] font-mono text-[#17C964]">
                    Linked access: {c.accessedMethod} ({c.relatedAccessLogId})
                  </p>
                )}
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${STATUS_STYLE[c.status] || STATUS_STYLE.OPEN}`}>
                {c.status.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed">{c.description}</p>

            {c.resolutionNote && (
              <div className="p-2.5 bg-[#EDF1F5] border border-slate-200 rounded-xl text-[11px] text-slate-700">
                <span className="font-bold">Resolution: </span>
                {c.resolutionNote}
                {c.resolvedBy ? ` (${c.resolvedBy})` : ""}
              </div>
            )}

            <div className="pt-1 border-t border-slate-200/60 flex justify-between text-[10px] text-slate-500 font-mono flex-wrap gap-2">
              <span>{c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}</span>

              {canResolve && c.status === "OPEN" && (
                <span className="flex items-center space-x-2">
                  <select
                    value={resolveStatus}
                    onChange={(e) => setResolveStatus(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-bold outline-none"
                  >
                    <option value="IN_REVIEW">IN REVIEW</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                  <input
                    value={resolvingId === c.id ? resolutionNote : ""}
                    onChange={(e) => {
                      setResolvingId(c.id);
                      setResolutionNote(e.target.value);
                    }}
                    placeholder="Resolution note..."
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-[10px] outline-none w-40"
                  />
                  <button
                    onClick={() => handleResolve(c.id)}
                    className="px-3 py-1.5 bg-[#17C964] hover:bg-[#0EA653] text-white font-bold rounded-lg text-[10px]"
                  >
                    Update
                  </button>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};