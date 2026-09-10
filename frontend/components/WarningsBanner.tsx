import React, { useState, useEffect, useCallback } from "react";
import { Megaphone, X } from "lucide-react";
import { safeFetchJson } from "../utils/api";

interface WarningItem {
  id: string;
  targetRole: string;
  targetModule: string;
  warnLevel: "INFO" | "WARNING" | "CRITICAL";
  title: string;
  message: string;
  createdByName: string;
  createdAt: string;
}

interface WarningsBannerProps {
  role: string;
  module?: string;
}

export const WarningsBanner: React.FC<WarningsBannerProps> = ({ role, module }) => {
  const [warnings, setWarnings] = useState<WarningItem[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const fetchWarnings = useCallback(async () => {
    try {
      const query = new URLSearchParams();
      if (role) query.set("role", role);
      if (module) query.set("module", module);
      const data = await safeFetchJson<WarningItem[]>(`/api/warnings?${query.toString()}`, undefined, []);
      setWarnings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load warnings:", err);
    }
  }, [role, module]);

  useEffect(() => {
    fetchWarnings();
  }, [fetchWarnings]);

  const visible = warnings.filter((w) => !dismissed.includes(w.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map((w) => {
        const levelStyle =
          w.warnLevel === "CRITICAL"
            ? "bg-[#FDECE8] border-[#F2603C]/60 text-[#C83E1E]"
            : w.warnLevel === "WARNING"
            ? "bg-amber-50 border-amber-500/50 text-amber-800"
            : "bg-[#E9FBF1] border-[#17C964]/50 text-[#0EA653]";
        return (
          <div key={w.id} className={`relative rounded-2xl border p-4 pr-9 text-left ${levelStyle}`}>
            <button
              onClick={() => setDismissed((prev) => [...prev, w.id])}
              className="absolute top-2.5 right-2.5 text-current opacity-50 hover:opacity-100 p-0.5"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start space-x-2">
              <Megaphone className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="space-y-0.5 text-xs">
                <p className="font-bold text-sm leading-snug">{w.title}</p>
                <p className="leading-relaxed">{w.message}</p>
                <p className="text-[10px] opacity-70 font-mono">
                  {w.createdByName} • {w.createdAt ? new Date(w.createdAt).toLocaleString() : ""}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};