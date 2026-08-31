import React, { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";
import { parseResponseSafe } from "../utils/api";
import {
  Smartphone,
  Camera,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Zap,
  Sparkles
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
    <div className="min-h-screen bg-[#F4F6F8] text-slate-900 flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Header */}
      <div className="text-center pt-4 pb-2 border-b border-slate-200 space-y-1">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#E9FBF1] border border-[#17C964]/40 rounded-full text-xs font-bold text-[#17C964]">
          <Smartphone className="w-3.5 h-3.5 text-[#17C964]" />
          <span>Handheld Mobile Camera Bridge</span>
        </div>
        <h1 className="text-lg font-extrabold text-slate-900">Wireless Patient Card & Face Scanner</h1>
        <p className="text-[11px] text-slate-500 font-mono">Synced to Session ID: {sessionId}</p>
      </div>

      {/* Main Viewport */}
      <div className="flex-1 my-4 flex flex-col items-center justify-center relative">
        {isSuccess ? (
          <div className="p-8 bg-[#E9FBF1] border-2 border-[#17C964] rounded-3xl text-center space-y-4 max-w-sm mx-auto shadow-2xl animate-in zoom-in-90">
            <div className="w-20 h-20 bg-[#E9FBF1] border-2 border-[#17C964] rounded-full flex items-center justify-center mx-auto text-[#17C964]">
              <CheckCircle2 className="w-12 h-12 animate-bounce" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Scan Transmitted!</h2>
              <p className="text-xs text-[#17C964] font-mono mt-2">
                The patient record is now unlocked on your laptop screen.
              </p>
            </div>
            <button
              onClick={() => {
                setIsSuccess(false);
                setIsScanning(true);
              }}
              className="w-full py-3 bg-[#17C964] hover:bg-[#0f172a] text-white font-bold rounded-2xl transition text-xs"
            >
              Scan Another Card / Face
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm h-80 bg-slate-950 border-2 border-[#17C964]/60 rounded-3xl overflow-hidden relative shadow-2xl flex items-center justify-center">
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
            <div className="absolute inset-8 border-2 border-dashed border-[#3CE584]/80 rounded-2xl pointer-events-none flex items-center justify-center">
              <div className="w-full h-0.5 bg-[#17C964]/80 animate-pulse shadow-lg" />
            </div>

            {cameraError && (
              <div className="absolute inset-0 bg-slate-950/90 p-4 text-center flex flex-col items-center justify-center space-y-2 text-xs text-[#F8B4A8]">
                <p className="font-bold">{cameraError}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!isSuccess && (
        <div className="space-y-3 max-w-sm mx-auto w-full pb-4">
          <div className="w-full py-3.5 bg-slate-100 border border-slate-300 rounded-2xl text-center text-xs text-slate-500 font-mono">
            Point the camera at the patient's Physical Health Card QR Code or face to transmit the scan to the connected laptop.
          </div>
        </div>
      )}

      {/* Footer Security Badge */}
      <div className="text-center text-[10px] text-slate-500 font-mono">
        🔒 Encrypted National Health Stack Mobile Camera Tunnel
      </div>
    </div>
  );
};
