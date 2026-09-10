import React, { useState, useEffect, useCallback } from "react";
import { Megaphone, Send, CheckCircle2, AlertTriangle, Power } from "lucide-react";
import { safeFetchJson, parseResponseSafe } from "../utils/api";

interface WarningItem {
  id: string;
  targetRole: string;
  targetModule: string;
  warnLevel: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  message: string;
  createdByName: string;
  active: boolean;
  createdAt: string;
  expiresAt?: string;
}

interface WarningComposerProps {
  appUser: { id: string; name: string; email: string; role: string };
}

const ROLES = ["ALL", "PATIENT", "DOCTOR", "HOSPITAL_ADMIN", "SUPER_ADMIN"];
const MODULES = ["GENERAL", "PATIENT", "DOCTOR", "HOSPITAL_ADMIN", "SUPER_ADMIN"];

export const WarningComposer: React.FC<WarningComposerProps> = ({ appUser }) => {
  const [warnings, setWarnings] = useState<WarningItem[]>([]);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [targetRole, setTargetRole] = useState("ALL");
  const [targetModule, setTargetModule] = useState("GENERAL");
  const [warnLevel, setWarnLevel] = useState<"INFO" | "WARNING" | "CRITICAL">("WARNING");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const fetchWarnings = useCallback(async () => {
    try {
      const data = await safeFetchJson<WarningItem[]>("/api/warnings/all", undefined, []);
      setWarnings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load warnings:", err);
    }
  }, []);

  useEffect(() => {
    fetchWarnings();
  }, [fetchWarnings]);

  const handlePublish = async () => {
    if (!title.trim() || !message.trim()) {
      setMsg({ type: "error", text: "Warning title and message are required." });
      return;
    }
    try {
      const res = await fetch("/api/warnings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole,
          targetModule,
          warnLevel,
          title: title.trim(),
          message: message.trim(),
          createdBy: appUser.id,
          createdByName: appUser.name,
        }),
      });
      const data = await parseResponseSafe<any>(res, { success: false });
      if (data?.success) {
        setMsg({ type: "success", text: "Warning published. It is now visible to the targeted role/module." });
        setTitle("");
        setMessage("");
        fetchWarnings();
      } else {
        setMsg({ type: "error", text: data?.message || "Failed to publish warning." });
      }
    } catch (err) {
      setMsg({ type: "error", text: "Server error publishing warning." });
    }
  };

  const handleDeactivate = async (warningId: string) => {
    try {
      await fetch(`/api/warnings/${warningId}/deactivate`, { method: "POST" });
      fetchWarnings();
    } catch (err) {
      console.error("Failed to deactivate warning:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="border-b border-slate-200 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Megaphone className="w-5 h-5 text-[#F2603C]" />
            <span>Publish Warning / Announcement</span>
          </h3>
          <p className="text-xs text-slate-500">Broadcast a targeted notice to a specific role and module. Everyone in the chosen audience sees it on their dashboard.</p>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Role</label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 outline-none text-xs font-bold"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Target Module</label>
            <select
              value={targetModule}
              onChange={(e) => setTargetModule(e.target.value)}
              className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 outline-none text-xs font-bold"
            >
              {MODULES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Severity</label>
            <select
              value={warnLevel}
              onChange={(e) => setWarnLevel(e.target.value as any)}
              className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 outline-none text-xs font-bold"
            >
              <option value="INFO">INFO</option>
              <option value="WARNING">WARNING</option>
              <option value="CRITICAL">CRITICAL</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="e.g. Mandatory EHR encryption audit on Saturday 2 AM - 6 AM"
            className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 outline-none text-xs"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="Full announcement text..."
            className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 outline-none text-xs resize-none"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handlePublish}
            disabled={!title.trim() || !message.trim()}
            className="px-5 py-2.5 bg-[#F2603C] hover:bg-[#E23A2E] disabled:bg-slate-200 disabled:cursor-not-allowed disabled:text-slate-400 text-white font-bold rounded-xl transition text-xs flex items-center space-x-2 shadow-md"
          >
            <Send className="w-4 h-4" />
            <span>Publish Announcement</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">Published Announcements</p>
        {warnings.length === 0 && (
          <div className="p-8 text-center text-slate-500 bg-[#FFFFFF] border border-slate-200 rounded-2xl text-xs">
            No warnings published yet.
          </div>
        )}
        {warnings.map((w) => (
          <div key={w.id} className="bg-[#FFFFFF] border border-slate-200 rounded-2xl p-4 space-y-2 text-xs shadow-md">
            <div className="flex justify-between items-start gap-3 flex-wrap">
              <div className="space-y-0.5 min-w-0">
                <p className="font-bold text-slate-900 text-sm">{w.title}</p>
                <p className="text-[10px] text-slate-500 font-mono">
                  {w.targetRole} • {w.targetModule} • {w.warnLevel}
                  {w.expiresAt ? ` • Expires ${new Date(w.expiresAt).toLocaleString()}` : " • No expiry"}
                </p>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                  w.active ? "bg-[#E9FBF1] text-[#17C964] border-[#17C964]/30" : "bg-slate-100 text-slate-500 border-slate-300"
                }`}
              >
                {w.active ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed">{w.message}</p>
            <div className="pt-1 border-t border-slate-200/60 flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span>By {w.createdByName} at {w.createdAt ? new Date(w.createdAt).toLocaleString() : ""}</span>
              {w.active && (
                <button
                  onClick={() => handleDeactivate(w.id)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg font-bold flex items-center space-x-1.5 transition"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>Deactivate</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};