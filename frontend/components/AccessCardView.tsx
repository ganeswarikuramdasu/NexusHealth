import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { AccessCard, CardAccessLog, PatientProfile } from "../types";
import { safeFetchJson, parseResponseSafe } from "../utils/api";
import {
  CreditCard,
  QrCode,
  ShieldAlert,
  ShieldCheck,
  Lock,
  RefreshCw,
  Printer,
  History,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Smartphone,
  PhoneCall,
  Key,
} from "lucide-react";

interface AccessCardViewProps {
  patientProfile: PatientProfile | null;
  currentUser: any;
}

export const AccessCardView: React.FC<AccessCardViewProps> = ({
  patientProfile,
  currentUser,
}) => {
  const [card, setCard] = useState<AccessCard | null>(null);
  const [accessLogs, setAccessLogs] = useState<CardAccessLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMsg, setActionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals
  const [showLostModal, setShowLostModal] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const printCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const targetPatientId = currentUser?.id || "u_pat_1";

  // Fetch card data & access logs
  const fetchCardData = async () => {
    try {
      setLoading(true);
      const [cardData, logData] = await Promise.all([
        safeFetchJson<any>(`/api/card/my-card/${targetPatientId}`, undefined, { success: false, card: null }),
        safeFetchJson<any[]>(`/api/card/access-history/${targetPatientId}`, undefined, []),
      ]);

      if (cardData?.success && cardData.card) {
        setCard(cardData.card);
      } else {
        setCard(null);
      }

      if (Array.isArray(logData)) {
        setAccessLogs(logData);
      }
    } catch (err) {
      console.error("Failed to load card data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCardData();
  }, [targetPatientId]);

  // Render QR Code onto Canvas
  useEffect(() => {
    if (card && card.qrCodeData && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        card.qrCodeData,
        {
          width: 160,
          margin: 1,
          color: {
            dark: "#0F172A",
            light: "#FFFFFF",
          },
        },
        (err) => {
          if (err) console.error("QR Render Error:", err);
        }
      );
    }
  }, [card]);

  // Render QR Code for Printable Card Modal
  useEffect(() => {
    if (showPrintModal && card && card.qrCodeData && printCanvasRef.current) {
      QRCode.toCanvas(
        printCanvasRef.current,
        card.qrCodeData,
        {
          width: 180,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        },
        (err) => {
          if (err) console.error("Print QR Render Error:", err);
        }
      );
    }
  }, [showPrintModal, card]);

  // Handle Issue Card
  const handleIssueCard = async () => {
    try {
      setActionMsg(null);
      const res = await fetch("/api/card/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: targetPatientId,
          pinCode: pinInput || "1234",
        }),
      });
      const data = await parseResponseSafe<any>(res, { success: false });
      if (data && data.success) {
        setCard(data.card);
        setActionMsg({ type: "success", text: "Patient Access Card issued successfully!" });
        fetchCardData();
      } else {
        setActionMsg({ type: "error", text: data?.message || "Failed to issue card." });
      }
    } catch (err) {
      setActionMsg({ type: "error", text: "Server error issuing card." });
    }
  };

  // Handle Toggle Active/Block Status
  const handleToggleStatus = async () => {
    if (!card) return;
    const targetStatus = card.status === "ACTIVE" ? "TEMPORARILY_BLOCKED" : "ACTIVE";
    try {
      setActionMsg(null);
      const res = await fetch("/api/card/toggle-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: card.id,
          targetStatus,
        }),
      });
      const data = await parseResponseSafe<any>(res, { success: false });
      if (data && data.success) {
        setCard(data.card);
        setActionMsg({
          type: "success",
          text: `Card is now ${targetStatus === "ACTIVE" ? "ACTIVE" : "TEMPORARILY BLOCKED"}.`,
        });
        fetchCardData();
      } else {
        setActionMsg({ type: "error", text: data?.message || "Action failed." });
      }
    } catch (err) {
      setActionMsg({ type: "error", text: "Server error changing card status." });
    }
  };

  // Handle Report Card Lost & Issue Replacement
  const handleReportLost = async (autoReplace: boolean) => {
    if (!card) return;
    try {
      setActionMsg(null);
      const res = await fetch("/api/card/report-lost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: card.id,
          patientId: targetPatientId,
          autoReplace,
        }),
      });
      const data = await parseResponseSafe<any>(res, { success: false });
      if (data && data.success) {
        setShowLostModal(false);
        setActionMsg({
          type: "success",
          text: autoReplace
            ? "Old card REVOKED! Replacement card with brand new token issued."
            : "Old card token REVOKED immediately. Medical records remain secure.",
        });
        fetchCardData();
      } else {
        setActionMsg({ type: "error", text: data?.message || "Failed to report lost card." });
      }
    } catch (err) {
      setActionMsg({ type: "error", text: "Error submitting lost card report." });
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-3">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
        <p className="text-xs font-mono">Verifying NexusHealth Card Ledger & Token Security...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <CreditCard className="w-6 h-6 text-purple-400" />
            <span>Secure Patient Access Card</span>
          </h1>
          <p className="text-xs text-slate-400">
            Physical & Digital Identity Card for seamless, smartphone-free hospital consultations
          </p>
        </div>

        {card && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPrintModal(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 border border-slate-700"
            >
              <Printer className="w-4 h-4 text-cyan-400" />
              <span>Print / Download Card</span>
            </button>
            <button
              onClick={() => setShowLostModal(true)}
              className="px-4 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 border border-rose-500/40"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Report Lost Card</span>
            </button>
          </div>
        )}
      </div>

      {/* FEEDBACK STATUS MSG */}
      {actionMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center space-x-2 ${
            actionMsg.type === "success"
              ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
              : "bg-rose-950/80 text-rose-300 border-rose-500/40"
          }`}
        >
          {actionMsg.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* SECURITY MANDATE BANNER */}
      <div className="bg-gradient-to-r from-purple-950/50 via-[#13192B] to-slate-900 border border-purple-500/30 p-4 rounded-2xl text-xs space-y-1.5">
        <div className="flex items-center space-x-2 text-purple-300 font-bold">
          <Lock className="w-4 h-4 text-purple-400" />
          <span>Zero-Knowledge Card Tokenization Protocol</span>
        </div>
        <p className="text-slate-300 leading-relaxed text-[11px]">
          The physical card contains <strong>NO raw medical records, lab reports, diagnoses, or passwords</strong>. It stores a cryptographically generated opaque token (<code>NXAC-...</code>). When scanned by an authorized physician, access is strictly governed by server-side consent rules.
        </p>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: THE PHYSICAL ACCESS CARD DISPLAY */}
        <div className="lg:col-span-6 space-y-6">
          {!card || card.status === "NOT_ISSUED" ? (
            <div className="bg-[#13192B] border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-xl">
              <CreditCard className="w-16 h-16 text-purple-500/40 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">No Active Access Card Issued</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Issue your official NexusHealth Patient Access Card to enable effortless hospital visits without carrying a smartphone.
                </p>
                <p className="text-[10px] text-slate-500">Set a 4-digit Visa PIN for your card. It is required when presenting the card at hospitals.</p>
              </div>

              <div className="relative mx-auto max-w-[220px]">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="Enter 4-digit PIN"
                  className="w-full pl-10 pr-3 py-3 bg-slate-900/70 border border-slate-700 rounded-2xl text-center text-white font-mono text-lg tracking-[0.5em] placeholder:text-slate-600 placeholder:text-sm placeholder:tracking-normal focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
                />
              </div>

              <button
                onClick={handleIssueCard}
                disabled={pinInput.length !== 4}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:cursor-not-allowed disabled:text-slate-400 text-white font-bold rounded-2xl transition text-xs shadow-lg shadow-purple-900/30"
              >
                Issue NexusHealth Access Card Now
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* CARD PREVIEW CONTAINER */}
              <div className="relative w-full aspect-[1.586/1] bg-gradient-to-br from-[#1E1B4B] via-[#0F172A] to-[#1E1B4B] rounded-3xl p-6 border-2 border-purple-500/40 shadow-2xl overflow-hidden flex flex-col justify-between text-white">
                {/* BACKGROUND WATERMARK DECORATION */}
                <div className="absolute -right-12 -bottom-12 w-56 h-56 rounded-full bg-purple-600/10 blur-2xl pointer-events-none" />

                {/* TOP ROW: BRAND & STATUS */}
                <div className="flex justify-between items-start z-10">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center font-black text-white text-sm shadow-md">
                      NH
                    </div>
                    <div>
                      <h4 className="font-extrabold tracking-wider text-sm uppercase">NEXUSHEALTH</h4>
                      <p className="text-[9px] text-purple-300 font-mono tracking-widest uppercase">Global Health Identity Card</p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider shadow-sm ${
                      card.status === "ACTIVE"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                        : card.status === "TEMPORARILY_BLOCKED"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/50"
                    }`}
                  >
                    ● {card.status.replace("_", " ")}
                  </span>
                </div>

                {/* MIDDLE ROW: PATIENT DETAILS & QR */}
                <div className="grid grid-cols-12 gap-3 items-center z-10 py-2">
                  <div className="col-span-7 space-y-2">
                    <div>
                      <p className="text-[9px] text-slate-400 font-mono uppercase">Card Holder Name</p>
                      <p className="text-base font-extrabold text-white tracking-wide truncate">
                        {card.patientName}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[11px]">
                      <div>
                        <p className="text-[9px] text-slate-400 font-mono">GLOBAL HEALTH ID</p>
                        <p className="font-mono font-bold text-cyan-300 truncate">{card.patientHealthId}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-mono">BLOOD GROUP</p>
                        <p className="font-bold text-rose-400">{patientProfile?.bloodGroup || "B+"}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] text-slate-400 font-mono">EMERGENCY CONTACT</p>
                      <p className="text-[10px] text-slate-200 font-medium">
                        {patientProfile?.emergencyContactName || "Relative"}: {patientProfile?.emergencyContactPhone || "+91 98765 43210"}
                      </p>
                    </div>
                  </div>

                  {/* QR CODE CONTAINER */}
                  <div className="col-span-5 flex flex-col items-center justify-center space-y-1">
                    <div className="p-2 bg-white rounded-2xl shadow-lg border border-purple-300">
                      <canvas ref={canvasRef} className="w-28 h-28" />
                    </div>
                    <p className="text-[9px] text-center text-slate-300 font-mono tracking-tight">
                      Scan to access authorized EHR
                    </p>
                  </div>
                </div>

                {/* BOTTOM ROW: CARD NUMBER & CHIP DECORATION */}
                <div className="pt-2 border-t border-slate-700/60 flex justify-between items-center z-10 text-[10px] font-mono text-slate-300">
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-3 bg-amber-400/80 rounded-sm inline-block shadow-inner" />
                    <span>{card.cardIdentifier}</span>
                  </div>
                  <span>Issued: {card.issuedAt?.split("T")[0]}</span>
                </div>
              </div>

              {/* CARD ACTION CONTROLS */}
              <div className="bg-[#13192B] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-2 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-300 font-medium">Status: <strong>{card.status}</strong></span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleToggleStatus}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                      card.status === "ACTIVE"
                        ? "bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-300"
                        : "bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300"
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{card.status === "ACTIVE" ? "Temporarily Block" : "Activate Card"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* LOW DIGITAL LITERACY / ASSISTED PATIENT MODE INFO */}
          <div className="bg-[#13192B] border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span>Assisted Hospital Access (No Smartphone Needed)</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When visiting any hospital or clinic, simply present your physical NexusHealth card. The doctor or reception staff scans your card, and a simple 1-click audio/visual confirmation screen will request your permission before displaying your records.
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Large clear confirmation buttons</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>4-digit PIN verification option</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACCESS AUDIT LOG ("Who Accessed My Records?") */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base flex items-center space-x-2">
              <History className="w-5 h-5 text-cyan-400" />
              <span>Who Accessed My Records?</span>
            </h3>
            <span className="text-[10px] font-mono text-purple-300 bg-purple-950/80 border border-purple-500/30 px-2.5 py-1 rounded-full">
              Card Audit Trail
            </span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {accessLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-[#13192B] border border-slate-800 rounded-2xl text-xs">
                No card scans or record access attempts recorded yet.
              </div>
            ) : (
              accessLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-[#13192B] border border-slate-800 rounded-2xl p-4 space-y-2 text-xs shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-white text-xs">{log.actorName}</p>
                      <p className="text-[10px] text-slate-400">{log.hospitalName} ({log.actorRole})</p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        log.authorizationStatus === "AUTHORIZED"
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-950 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {log.authorizationStatus}
                    </span>
                  </div>

                  <p className="text-slate-300 text-[11px]">{log.reason}</p>

                  {log.recordsAccessed && log.recordsAccessed.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {log.recordsAccessed.map((rec, idx) => (
                        <span key={idx} className="bg-[#0D121F] text-slate-400 text-[9px] font-mono px-2 py-0.5 rounded-lg border border-slate-800">
                          {rec}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-1 border-t border-slate-800/60 flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                    <span>Access Type: {log.accessType}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* REPORT LOST MODAL */}
      {showLostModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#13192B] border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 relative text-slate-100 shadow-2xl">
            <button
              onClick={() => setShowLostModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>

            <div className="flex items-center space-x-3 text-rose-400 pb-2 border-b border-slate-800">
              <ShieldAlert className="w-6 h-6" />
              <div>
                <h3 className="font-bold text-white text-base">Report Card Lost or Stolen</h3>
                <p className="text-xs text-slate-400">Immediate token revocation & security protocol</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Reporting your card as lost will <strong>immediately revoke the old card token</strong>. Any future scan of the lost card will be rejected. Your underlying medical history remains 100% safe.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleReportLost(true)}
                className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl transition text-xs flex items-center justify-center space-x-2 shadow-lg shadow-rose-900/30"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Revoke Old Card & Issue Replacement Card</span>
              </button>

              <button
                onClick={() => handleReportLost(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl transition text-xs border border-slate-700"
              >
                <span>Revoke Card Only (Do Not Issue New Card Yet)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT / DOWNLOAD CARD MODAL */}
      {showPrintModal && card && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#13192B] border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 relative text-slate-100 shadow-2xl">
            <button
              onClick={() => setShowPrintModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>

            <div className="flex items-center space-x-2 text-cyan-400 pb-2 border-b border-slate-800">
              <Printer className="w-5 h-5" />
              <h3 className="font-bold text-white text-base">Print Physical Patient Access Card</h3>
            </div>

            {/* PRINTABLE CARD LAYOUT */}
            <div id="printableCardArea" className="bg-white text-slate-900 p-5 rounded-2xl border-2 border-purple-900 space-y-3 font-sans shadow-lg">
              <div className="flex justify-between items-center border-b border-slate-300 pb-2">
                <span className="font-black text-purple-900 text-sm tracking-wider uppercase">NEXUSHEALTH</span>
                <span className="text-[10px] font-mono text-purple-800 font-bold">GLOBAL HEALTH CARD</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 uppercase font-mono">Patient Name</p>
                  <p className="text-base font-extrabold text-slate-900">{card.patientName}</p>
                  <p className="text-xs font-mono font-bold text-purple-900">ID: {card.patientHealthId}</p>
                  <p className="text-[10px] text-slate-600">Blood Group: <strong>{patientProfile?.bloodGroup || "B+"}</strong></p>
                </div>

                <div className="p-1 bg-white rounded border border-slate-300">
                  <canvas ref={printCanvasRef} className="w-24 h-24" />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 text-[9px] text-center text-slate-600 font-mono">
                Scan to access authorized health records • Emergency: {patientProfile?.emergencyContactPhone || "+91 98765 43210"}
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-2xl transition text-xs flex items-center justify-center space-x-2 shadow-lg"
            >
              <Printer className="w-4 h-4" />
              <span>Print Card / Save as PDF</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
