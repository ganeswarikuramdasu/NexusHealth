import React, { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { parseResponseSafe } from "../utils/api";
import {
  Smartphone,
  QrCode,
  X,
  CheckCircle2,
  RefreshCw,
  Camera,
  ShieldCheck,
  Zap,
  ArrowRight
} from "lucide-react";

interface MobileCameraBridgeModalProps {
  doctorName?: string;
  hospitalName?: string;
  onClose: () => void;
  onPayloadReceived: (payload: { scannedCode: string; scanType?: string }) => void;
}

export const MobileCameraBridgeModal: React.FC<MobileCameraBridgeModalProps> = ({
  doctorName = "Dr. Rajesh V. Sharma",
  hospitalName = "Apollo Multi-Specialty Hospital",
  onClose,
  onPayloadReceived,
}) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pairingPin, setPairingPin] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [receivedPayload, setReceivedPayload] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Create Bridge Session on Mount
  const createBridgeSession = async () => {
    setIsInitializing(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/card/mobile-bridge/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorName, hospitalName }),
      });
      const data = await parseResponseSafe<any>(res, { success: false });
      if (data && data.success) {
        setSessionId(data.sessionId);
        setPairingPin(data.pairingPin);
        setIsPolling(true);
      } else {
        setErrorMsg("Failed to initialize mobile bridge session.");
      }
    } catch (err) {
      setErrorMsg("Network error starting mobile camera bridge.");
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    createBridgeSession();
  }, []);

  // 2. Poll bridge session status on laptop
  useEffect(() => {
    if (!sessionId || !isPolling) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/card/mobile-bridge/poll/${sessionId}`);
        const data = await parseResponseSafe<any>(res, { success: false });

        if (data && data.success && data.status === "SCANNED" && data.payload) {
          setIsPolling(false);
          setReceivedPayload(data.payload);

          // Auto trigger parent callback after brief success animation
          setTimeout(() => {
            onPayloadReceived(data.payload);
          }, 1200);
        }
      } catch (err) {
        // Silent catch for short polling
      }
    }, 1500);

    return () => clearInterval(pollInterval);
  }, [sessionId, isPolling, onPayloadReceived]);

  const mobileScanUrl = sessionId
    ? `${window.location.origin}/?mobileBridge=${sessionId}`
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-[#0F1524] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 text-xs text-slate-200 relative overflow-hidden">
        {/* Glow Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-purple-950 border border-purple-500/40 rounded-2xl text-purple-300">
              <Smartphone className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Mobile Camera Remote Bridge</h3>
              <p className="text-[11px] text-purple-300 font-mono">
                Use your phone camera as a wireless hardware scanner
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isInitializing ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
            <p className="font-bold text-white">Initializing Mobile Camera Bridge Session...</p>
          </div>
        ) : receivedPayload ? (
          /* Success Transmitted View */
          <div className="p-8 bg-emerald-950/40 border border-emerald-500/40 rounded-3xl text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <div>
              <h4 className="text-lg font-extrabold text-white">Scan Transmitted from Mobile Camera!</h4>
              <p className="text-xs text-emerald-300 font-mono mt-1">
                Token Payload: {receivedPayload.scannedCode}
              </p>
            </div>
            <div className="pt-2 text-slate-400 text-[11px]">
              Verifying patient record & opening clinical chart...
            </div>
          </div>
        ) : (
          /* Pairing QR Code & Instructions View */
          <div className="space-y-5">
            <div className="bg-[#090D18] border border-slate-800/80 rounded-2xl p-5 text-center space-y-4">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                Point Phone Camera at QR Code Below
              </span>

              {/* QR Code Canvas */}
              <div className="p-4 bg-white rounded-2xl inline-block shadow-xl border-4 border-purple-500/30">
                <QRCode value={mobileScanUrl} size={180} level="M" />
              </div>

              <div className="flex items-center justify-center space-x-2 text-[11px] text-purple-300">
                <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                <span>No app download or mobile login needed</span>
              </div>
            </div>

            {/* Direct Link & PIN option */}
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2 text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase">
                Session Sync PIN:
              </div>
              <div className="font-mono text-2xl font-black text-amber-400 tracking-widest">
                {pairingPin || "882041"}
              </div>
              <div className="text-[10px] text-slate-400">
                Or visit on mobile browser: <strong className="text-purple-300 font-mono underline cursor-pointer" onClick={() => window.open(mobileScanUrl, "_blank")}>{mobileScanUrl}</strong>
              </div>
            </div>

            {/* Live Polling Loader Status */}
            <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl flex items-center justify-between text-[11px]">
              <div className="flex items-center space-x-2 text-purple-200 font-mono">
                <RefreshCw className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                <span>Waiting for mobile scan...</span>
              </div>
              <span className="px-2 py-0.5 bg-purple-900/60 text-purple-300 font-mono rounded text-[10px]">
                Session ID: {sessionId}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
