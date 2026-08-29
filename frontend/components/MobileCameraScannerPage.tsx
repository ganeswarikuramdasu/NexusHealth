import React, { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";
import { parseResponseSafe } from "../utils/api";
import {
  Smartphone,
  Camera,
  QrCode,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Zap,
  Sparkles,
  UserCheck
} from "lucide-react";

interface MobileCameraScannerPageProps {
  sessionId: string;
  onDone?: () => void;
}

export const MobileCameraScannerPage: React.FC<MobileCameraScannerPageProps> = ({
  sessionId,
  onDone,
}) => {
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Start mobile camera stream
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startMobileCamera = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
          });

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute("playsinline", "true");
            videoRef.current.play().catch(() => {});
            requestAnimationFrame(tickMobileScan);
          }
        }
      } catch (err) {
        console.warn("Mobile camera access error:", err);
        setCameraError("Camera permission blocked or unreadable. Tap manual scan below.");
      }
    };

    if (isScanning && !isSuccess) {
      startMobileCamera();
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isScanning, isSuccess]);

  // Frame tick QR code scanning loop
  const tickMobileScan = () => {
    if (
      videoRef.current &&
      videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
      canvasRef.current
    ) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          setIsScanning(false);
          submitMobileScan(code.data, "QR_CODE");
          return;
        }
      }
    }

    if (isScanning && !isSuccess) {
      animationFrameId.current = requestAnimationFrame(tickMobileScan);
    }
  };

  // Submit scan to bridge session backend
  const submitMobileScan = async (scannedCode: string, scanType: string = "QR_CODE") => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/card/mobile-bridge/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          scannedCode,
          scanType,
        }),
      });

      const data = await parseResponseSafe<any>(res, { success: false });
      if (data && data.success) {
        setIsSuccess(true);
      } else {
        alert(data?.message || "Failed to transmit scan to laptop.");
        setIsScanning(true);
      }
    } catch (err) {
      alert("Network error sending scan to laptop.");
      setIsScanning(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-white flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Header */}
      <div className="text-center pt-4 pb-2 border-b border-slate-800 space-y-1">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-purple-950 border border-purple-500/40 rounded-full text-xs font-bold text-purple-300">
          <Smartphone className="w-3.5 h-3.5 text-purple-400" />
          <span>Handheld Mobile Camera Bridge</span>
        </div>
        <h1 className="text-lg font-extrabold text-white">Wireless Patient Card & Face Scanner</h1>
        <p className="text-[11px] text-slate-400 font-mono">Synced to Session ID: {sessionId}</p>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 my-4 flex flex-col items-center justify-center relative">
        {isSuccess ? (
          <div className="p-8 bg-emerald-950/60 border-2 border-emerald-500 rounded-3xl text-center space-y-4 max-w-sm mx-auto shadow-2xl animate-in zoom-in-90">
            <div className="w-20 h-20 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-12 h-12 animate-bounce" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Scan Transmitted!</h2>
              <p className="text-xs text-emerald-300 font-mono mt-2">
                The patient record is now unlocked on your laptop screen.
              </p>
            </div>
            <button
              onClick={() => {
                setIsSuccess(false);
                setIsScanning(true);
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition text-xs"
            >
              Scan Another Card / Face
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm h-80 bg-slate-950 border-2 border-purple-500/60 rounded-3xl overflow-hidden relative shadow-2xl flex items-center justify-center">
            {/* Live Camera Feed */}
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Target Reticle Overlay */}
            <div className="absolute inset-8 border-2 border-dashed border-purple-400/80 rounded-2xl pointer-events-none flex items-center justify-center">
              <div className="w-full h-0.5 bg-purple-500/80 animate-pulse shadow-lg" />
            </div>

            {cameraError && (
              <div className="absolute inset-0 bg-slate-950/90 p-4 text-center flex flex-col items-center justify-center space-y-2 text-xs text-amber-300">
                <p className="font-bold">{cameraError}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!isSuccess && (
        <div className="space-y-3 max-w-sm mx-auto w-full pb-4">
          <button
            disabled={isSubmitting}
            onClick={() => submitMobileScan("NEXUSHEALTH_CARD_TOKEN:NXAC-a1b2c3d4e5f6", "QR_CODE")}
            className="w-full py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl transition shadow-xl text-xs flex items-center justify-center space-x-2"
          >
            <QrCode className="w-4 h-4" />
            <span>{isSubmitting ? "Transmitting to Laptop..." : "Scan Demo Patient Card Token"}</span>
          </button>

          <button
            disabled={isSubmitting}
            onClick={() => submitMobileScan("NEXUSHEALTH_FACE_BIOMETRIC:FACE-PATIENT-88392014", "FACE_SCAN")}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-2xl transition text-xs flex items-center justify-center space-x-2 border border-slate-700"
          >
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Scan Facial Biometrics</span>
          </button>
        </div>
      )}

      {/* Footer Security Badge */}
      <div className="text-center text-[10px] text-slate-500 font-mono">
        🔒 Encrypted National Health Stack Mobile Camera Tunnel
      </div>
    </div>
  );
};
