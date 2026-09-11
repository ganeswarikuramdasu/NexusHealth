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
  status: "OPEN" | "IN_REVIEW" | "TAKEN_ACTION" | "RESOLVED" | "REJECTED";
  resolutionNote?: string;
  resolvedBy?: string;
  replies?: { id: string; authorId: string; authorName: string; authorRole: string; message: string; timestamp: string }[];
  createdAt: string;
  resolvedAt?: string;
}

interface ComplaintCenterProps {
  appUser: { id: string; name: string; email: string; role: string };
  module: string;
  patientContext?: { patientId: string; patientHealthId: string; patientName?: string };
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
  TAKEN_ACTION: "bg-purple-50 text-purple-700 border-purple-500/40",
  RESOLVED: "bg-[#E9FBF1] text-[#0EA653] border-[#17C964]/40",
  REJECTED: "bg-[#FDE9E3] text-[#C83E1E] border-[#F2603C]/40",
};

export const ComplaintCenter: React.FC<ComplaintCenterProps> = ({
  appUser,
  module,
  patientContext,
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
  const [resolveStatus, setResolveStatus] = useState<string>("IN_REVIEW");
  const [resolutionNote, setResolutionNote] = useState<string>("");
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>("");

  const isSuperAdmin = appUser.role === "SUPER_ADMIN";
  const isDoctor = appUser.role === "DOCTOR";
  const isHospitalAdmin = appUser.role === "HOSPITAL_ADMIN";
  const canRaise = appUser.role === "PATIENT";
  const canResolve = isSuperAdmin || isDoctor || isHospitalAdmin;

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

  useEffect(() => {
    if (canRaise && linkedAccess && (linkedAccess.accessLogId || linkedAccess.doctorName)) {
      setMsg(null);
      setShowForm(true);
    }
  }, [linkedAccess, canRaise]);

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
          authorRole: appUser.role,
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

  const handleReply = async (complaintId: string) => {
    if (!replyText.trim()) return;
    try {
      const res = await fetch(`/api/complaints/${complaintId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolutionNote: replyText.trim(),
          resolvedBy: appUser.id,
          resolvedByName: appUser.name,
          authorRole: appUser.role,
        }),
      });
      const data = await parseResponseSafe<any>(res, { success: false });
      if (data?.success) {
        setMsg({ type: "success", text: "Reply posted successfully." });
        setReplyingToId(null);
        setReplyText("");
        fetchComplaints();
      } else {
        setMsg({ type: "error", text: data?.message || "Failed to post reply." });
      }
    } catch (err) {
      setMsg({ type: "error", text: "Server error posting reply." });
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
            {isSuperAdmin
              ? "Review and handle every complaint raised by patients. Update the status and reply to patients as it is investigated."
              : canRaise
              ? "Raise a complaint about access, treatment, records, or privacy. Reviewed by the support team."
              : "View and respond to patient complaints. Reply to patients and update complaint status."}
          </p>
        </div>
        {canRaise && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="px-4 py-2 bg-[#F2603C] hover:bg-[#E23A2E] text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Raise a Complaint</span>
          </button>
        )}
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

      {canRaise && showForm && (
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
                <span className="font-bold">Status Note: </span>
                {c.resolutionNote}
                {c.resolvedBy ? ` (by ${c.resolvedBy})` : ""}
                {c.resolvedAt ? ` • ${new Date(c.resolvedAt).toLocaleString()}` : ""}
              </div>
            )}

            {c.replies && c.replies.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-700">Replies:</p>
                {c.replies.map((r) => (
                  <div key={r.id} className="p-2.5 bg-[#F8F9FB] border border-slate-200 rounded-xl text-[11px] text-slate-700">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-bold text-slate-900">{r.authorName}</span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-500 font-mono">
                        {r.authorRole}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">{new Date(r.timestamp).toLocaleString()}</span>
                    </div>
                    <p>{r.message}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-1 border-t border-slate-200/60 flex justify-between text-[10px] text-slate-500 font-mono flex-wrap gap-2">
              <span>{c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}</span>

              <span className="flex items-center space-x-2">
                {canResolve && (c.status === "OPEN" || c.status === "IN_REVIEW" || c.status === "TAKEN_ACTION") && (
                  <>
                    <select
                      value={resolvingId === c.id ? resolveStatus : c.status}
                      onChange={(e) => {
                        setResolvingId(c.id);
                        setResolveStatus(e.target.value);
                      }}
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-[10px] font-bold outline-none"
                    >
                      <option value="IN_REVIEW">IN REVIEW</option>
                      <option value="TAKEN_ACTION">TAKEN ACTION</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                    <input
                      value={resolvingId === c.id ? resolutionNote : ""}
                      onChange={(e) => {
                        setResolvingId(c.id);
                        setResolutionNote(e.target.value);
                      }}
                      placeholder="Status note / action taken..."
                      className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-[10px] outline-none w-44"
                    />
                    <button
                      onClick={() => handleResolve(c.id)}
                      className="px-3 py-1.5 bg-[#17C964] hover:bg-[#0EA653] text-white font-bold rounded-lg text-[10px]"
                    >
                      Update
                    </button>
                  </>
                )}
                {canResolve && (c.status === "OPEN" || c.status === "IN_REVIEW" || c.status === "TAKEN_ACTION") && (
                  <>
                    {replyingToId === c.id ? (
                      <span className="flex items-center space-x-1">
                        <input
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Reply to patient..."
                          className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-[10px] outline-none w-44"
                          onKeyDown={(e) => { if (e.key === "Enter") handleReply(c.id); }}
                        />
                        <button
                          onClick={() => handleReply(c.id)}
                          className="px-3 py-1.5 bg-[#17C964] hover:bg-[#0EA653] text-white font-bold rounded-lg text-[10px]"
                        >
                          Send
                        </button>
                        <button
                          onClick={() => { setReplyingToId(null); setReplyText(""); }}
                          className="px-2 py-1 text-slate-400 hover:text-slate-700 text-[10px]"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => { setReplyingToId(c.id); setReplyText(""); }}
                        className="px-3 py-1.5 bg-[#17C964]/10 hover:bg-[#17C964]/20 text-[#17C964] font-bold rounded-lg text-[10px] border border-[#17C964]/30"
                      >
                        Reply
                      </button>
                    )}
                  </>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};