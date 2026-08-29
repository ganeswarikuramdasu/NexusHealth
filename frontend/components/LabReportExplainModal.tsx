import React, { useState, useEffect } from "react";
import { X, Bot, Sparkles, RefreshCw, FileText, CheckCircle2 } from "lucide-react";
import { parseResponseSafe } from "../utils/api";

interface LabReportExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: any;
}

export const LabReportExplainModal: React.FC<LabReportExplainModalProps> = ({ isOpen, onClose, report }) => {
  const [explanation, setExplanation] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && report) {
      explainReport();
    }
  }, [isOpen, report]);

  const explainReport = async () => {
    setIsLoading(true);
    setExplanation("");
    try {
      const res = await fetch("/api/ai/explain-lab-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          labReport: report,
          userQuestion: "Explain these test results in plain language, highlight any values outside the normal range, and tell me what they mean for my health.",
        }),
      });

      const data = await parseResponseSafe<any>(res, { success: false });
      if (data && data.success && data.explanation) {
        setExplanation(data.explanation);
      } else {
        setExplanation("Unable to generate AI explanation. Please discuss these test results directly with your physician.");
      }
    } catch (err) {
      setExplanation("Gemini AI Engine unreachable. Please verify network or try again shortly.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#13192B] border border-purple-500/30 rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative text-white space-y-5">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Gemini AI Lab & Scan Explanation</h2>
              <p className="text-xs text-slate-400">Plain-language clinical analysis for {report.title || report.diagnosis || "Medical Record"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
            <p className="text-xs text-slate-300 font-mono">Gemini 3.6 Flash is analyzing parameters & clinical range deviations...</p>
          </div>
        ) : (
          <div className="space-y-4 text-xs leading-relaxed max-h-[60vh] overflow-y-auto p-4 bg-[#0D121F] border border-slate-800 rounded-2xl">
            <div className="whitespace-pre-wrap text-slate-200">{explanation}</div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-purple-600/30"
          >
            Close Explanation
          </button>
        </div>
      </div>
    </div>
  );
};
