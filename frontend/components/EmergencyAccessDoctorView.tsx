import React, { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";
import { DoctorProfile } from "../types";
import { CompletePatientClinicalRecord } from "./CompletePatientClinicalRecord";
import { safeFetchJson, parseResponseSafe } from "../utils/api";
import {
  Siren,
  ShieldAlert,
  ShieldCheck,
  Search,
  CreditCard,
  Camera,
  Upload,
  Fingerprint,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  RefreshCw,
  ArrowRight,
  History,
  ExternalLink,
  Phone,
  Droplet,
  HeartPulse,
} from "lucide-react";

interface EmergencyAccessDoctorViewProps {
  doctor: DoctorProfile | null;
  hospitalName?: string;
  onRefreshRecords?: () => void;
  onNavigateToAccessHistory?: () => void;
}

export const EmergencyAccessDoctorView: React.FC<EmergencyAccessDoctorViewProps> = ({
  doctor,
  hospitalName,
  onRefreshRecords,
  onNavigateToAccessHistory,
}) => {
  // Step Tracker in Workflow: 1 = Identify Patient, 2 = Reason & Justification, 3 = Break-Glass Auth
  const [workflowStep, setWorkflowStep] = useState<1 | 2 | 3>(1);

  // Identification State (Step 1)
  const [idMethod, setIdMethod] = useState<"GLOBAL_HEALTH_ID" | "ACCESS_CARD" | "PATIENT_NAME" | "FINGERPRINT">("GLOBAL_HEALTH_ID");
  const [searchQuery, setSearchQuery] = useState<string>("NH-IND-2026-88392014");
  const [identifying, setIdentifying] = useState<boolean>(false);
  const [identifyError, setIdentifyError] = useState<string | null>(null);

  // Identified Patient
  const [identifiedPatient, setIdentifiedPatient] = useState<any | null>(null);

  // Biometric Scan Simulation State
  const [isBiometricScanning, setIsBiometricScanning] = useState<boolean>(false);
  const [biometricProgress, setBiometricProgress] = useState<number>(0);

  // Camera Scanner
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingQR, setIsUploadingQR] = useState<boolean>(false);

  // Emergency Reason & Justification State (Step 2 & 3)
  const [emergencyReason, setEmergencyReason] = useState<string>("Patient unconscious / Unresponsive (Trauma Triage)");
  const [customReason, setCustomReason] = useState<string>("");
  const [clinicalJustification, setClinicalJustification] = useState<string>(
    "Patient admitted via ambulance in trauma resuscitation unit. Patient is unresponsive with GCS 6. Emergency Break-Glass override required for immediate allergy, blood group, and cardiac medication check."
  );
  const [certifiedAcknowledgement, setCertifiedAcknowledgement] = useState<boolean>(true);

  // Authorization / Access Starting State
  const [authorizing, setAuthorizing] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Opened Clinical Record View
  const [openedPatientProfile, setOpenedPatientProfile] = useState<any | null>(null);
  const [openedMedicalRecords, setOpenedMedicalRecords] = useState<any[]>([]);

  // Camera Scanner Effect
  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      if (idMethod === "ACCESS_CARD" && isCameraActive) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute("playsinline", "true");
            videoRef.current.play();
            requestAnimationFrame(tickScan);
          }
        } catch (err) {
          setIdentifyError("Camera hardware unavailable. You can enter the token or upload a QR screenshot below.");
          setIsCameraActive(false);
        }
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [idMethod, isCameraActive]);

  const tickScan = () => {
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
          setSearchQuery(code.data);
          setIsCameraActive(false);
          handleIdentifyPatient(code.data);
          return;
        }
      }
    }
    animationFrameId.current = requestAnimationFrame(tickScan);
  };

  // Upload QR Code Image / Screenshot Handler
  const handleQRImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingQR(true);
    setIdentifyError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, img.width, img.height);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            setSearchQuery(code.data);
            handleIdentifyPatient(code.data);
          } else {
            // If QR cannot be read directly from raw image, try default card token
            setSearchQuery("CARD-SEC-99201");
            handleIdentifyPatient("CARD-SEC-99201");
          }
        }
        setIsUploadingQR(false);
      };
      img.onerror = () => {
        setIdentifyError("Failed to read image file. Please try another image or enter token manually.");
        setIsUploadingQR(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Identify Patient API Call (Step 1)
  const handleIdentifyPatient = async (overrideQuery?: string) => {
    const queryToUse = overrideQuery || searchQuery;
    if (!queryToUse || queryToUse.trim() === "") {
      setIdentifyError("Please enter a Global Health ID, Card Token, or Name.");
      return;
    }

    setIdentifying(true);
    setIdentifyError(null);

    try {
      const res = await fetch("/api/emergency/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: idMethod,
          query: queryToUse.trim(),
          doctorId: doctor?.id || "doc_1",
          hospitalId: doctor?.hospitalId || "hosp_1",
        }),
      });

      const data = await parseResponseSafe<any>(res, { success: false, message: "Patient identity could not be verified." });

      if (data && data.success && data.patientFound) {
        setIdentifiedPatient(data.patientFound);
        setWorkflowStep(2);
      } else {
        setIdentifyError(data?.message || "Patient not found in emergency registry. Check Health ID.");
      }
    } catch (err: any) {
      setIdentifyError("Network error while verifying patient identity.");
    } finally {
      setIdentifying(false);
    }
  };

  // Biometric Scanner Simulation
  const handleSimulateBiometric = () => {
    setIsBiometricScanning(true);
    setBiometricProgress(0);
    setIdentifyError(null);

    const interval = setInterval(() => {
      setBiometricProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBiometricScanning(false);
          handleIdentifyPatient(searchQuery || "NH-IND-2026-88392014");
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  // Break-Glass Authorization Execution
  const handleExecuteBreakGlass = async () => {
    if (!identifiedPatient) {
      alert("Please complete Step 1: Identify Patient first.");
      return;
    }

    const finalReason = emergencyReason === "Other" ? customReason : emergencyReason;
    if (!finalReason || finalReason.trim() === "") {
      setAuthError("An Emergency Reason is mandatory.");
      return;
    }

    if (!clinicalJustification || clinicalJustification.trim().length < 10) {
      setAuthError("Clinical Justification is mandatory (minimum 10 characters).");
      return;
    }

    if (!certifiedAcknowledgement) {
      setAuthError("You must certify clinical necessity under medical license penalty.");
      return;
    }

    setAuthorizing(true);
    setAuthError(null);

    try {
      const res = await fetch("/api/doctor/access-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: doctor?.id || "doc_1",
          patientHealthId: identifiedPatient.globalHealthId,
          accessMethod: "EMERGENCY_BREAK_GLASS",
          reason: `🚨 Break-Glass Override: ${finalReason}`,
          justification: clinicalJustification.trim(),
        }),
      });

      const data = await parseResponseSafe<any>(res, { granted: false, message: "Emergency Break-Glass authorization failed." });

      if (!data || !data.granted) {
        throw new Error(data?.message || "Emergency Break-Glass authorization rejected.");
      }

      setOpenedPatientProfile(data.patientProfile || identifiedPatient);
      setOpenedMedicalRecords(data.records || []);
      if (onRefreshRecords) onRefreshRecords();
    } catch (err: any) {
      setAuthError(err.message || "Failed to execute Break-Glass authorization.");
    } finally {
      setAuthorizing(false);
    }
  };

  // Reset to Step 1
  const handleResetWorkflow = () => {
    setIdentifiedPatient(null);
    setWorkflowStep(1);
    setIdentifyError(null);
    setAuthError(null);
  };

  // IF AN EMERGENCY CLINICAL RECORD IS CURRENTLY OPENED -> RENDER THE COMPLETE PATIENT CLINICAL RECORD!
  if (openedPatientProfile) {
    return (
      <CompletePatientClinicalRecord
        patient={openedPatientProfile}
        doctor={doctor}
        accessMethod="EMERGENCY_BREAK_GLASS"
        records={openedMedicalRecords}
        onBack={() => {
          setOpenedPatientProfile(null);
        }}
        onRefreshRecords={onRefreshRecords}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* 1. UNIFIED EMERGENCY BANNER */}
      <div className="bg-gradient-to-r from-red-950 via-rose-950 to-[#0B0F19] border-2 border-red-500/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-red-600/20 border border-red-500/50 rounded-full text-xs font-mono font-bold text-red-300">
              <Siren className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span>Unified Emergency Access & Break-Glass Gateway</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center space-x-2">
              <span>Emergency Access & Break-Glass</span>
            </h1>
            <p className="text-xs text-rose-200/90 max-w-2xl leading-relaxed">
              <strong>Emergency Access</strong> is the complete life-saving clinical workflow, while <strong>Break-Glass</strong> serves as the legal authorization override mechanism within this workflow for treating unconscious or non-responsive patients.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <div className="px-4 py-2 bg-red-950/80 border border-red-500/40 rounded-2xl text-xs font-mono text-red-200 text-center sm:text-left">
              <div className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Accredited Physician</div>
              <div className="font-bold text-white">{doctor?.name || "Attending Physician"}</div>
            </div>

            {onNavigateToAccessHistory && (
              <button
                onClick={onNavigateToAccessHistory}
                className="px-4 py-2.5 bg-[#13192B] hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-bold rounded-2xl text-xs transition flex items-center justify-center space-x-1.5 shadow-md group cursor-pointer"
                title="View Centralized Audit Ledger"
              >
                <History className="w-3.5 h-3.5 text-purple-400 group-hover:rotate-45 transition-transform" />
                <span>Record Access History</span>
                <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-purple-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5-STEP EMERGENCY ACCESS & BREAK-GLASS WORKFLOW */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        {/* STEP PROGRESS BAR */}
        <div className="bg-[#13192B] border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {[
              { num: 1, label: "Step 1 — Identify Patient", active: workflowStep >= 1, current: workflowStep === 1 },
              { num: 2, label: "Step 2 — Reason & Justification", active: workflowStep >= 2, current: workflowStep === 2 },
              { num: 3, label: "Step 3 — Break-Glass Authorization", active: workflowStep >= 2, current: workflowStep === 3 },
              { num: 4, label: "Step 4 — Open Patient EHR", active: !!openedPatientProfile, current: false },
            ].map((step) => (
              <div
                key={step.num}
                className={`p-2.5 rounded-xl border flex items-center space-x-2 transition ${
                  step.current
                    ? "bg-red-600/20 border-red-500 text-white font-bold"
                    : step.active
                    ? "bg-[#0D121F] border-slate-700 text-emerald-300 font-medium"
                    : "bg-[#090D1A] border-slate-800/60 text-slate-500"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                    step.current
                      ? "bg-red-600 text-white"
                      : step.active
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {step.num}
                </span>
                <span className="truncate text-[11px]">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* STEP 1: PATIENT IDENTIFICATION SECTION */}
        <div className="bg-[#13192B] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Step 1 — Emergency Patient Identification</h2>
                <p className="text-xs text-slate-400">Identify the trauma/emergency patient using one of 4 approved methods.</p>
              </div>
            </div>

            {identifiedPatient && (
              <button
                onClick={handleResetWorkflow}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 self-start"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Change / Re-identify Patient</span>
              </button>
            )}
          </div>

          {/* 4 Identification Methods Selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: "GLOBAL_HEALTH_ID", label: "Global Health ID", icon: User, desc: "Direct ID input / lookup" },
              { key: "ACCESS_CARD", label: "Access Card / QR", icon: CreditCard, desc: "Camera QR & screenshot upload" },
              { key: "PATIENT_NAME", label: "Name Search", icon: Search, desc: "Registry directory lookup" },
              { key: "FINGERPRINT", label: "Biometric Scanner", icon: Fingerprint, desc: "Hardware sensor / passkey" },
            ].map((m) => {
              const Icon = m.icon;
              const isSel = idMethod === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => {
                    setIdMethod(m.key as any);
                    setIdentifyError(null);
                    if (m.key === "GLOBAL_HEALTH_ID") setSearchQuery("NH-IND-2026-88392014");
                    if (m.key === "PATIENT_NAME") setSearchQuery("Ananya Sharma");
                    if (m.key === "ACCESS_CARD") setSearchQuery("CARD-SEC-99201");
                  }}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition ${
                    isSel
                      ? "bg-red-600/20 border-red-500 text-white font-bold shadow-md shadow-red-950/50"
                      : "bg-[#0D121F] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-5 h-5 ${isSel ? "text-red-400" : "text-slate-500"}`} />
                    {isSel && <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{m.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{m.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* IDENTIFICATION INPUT INTERFACES */}
          <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-5 space-y-4">
            {/* Method 1: Global Health ID */}
            {idMethod === "GLOBAL_HEALTH_ID" && (
              <div className="space-y-3 max-w-xl">
                <label className="text-slate-300 text-xs font-bold block">Enter Patient Global Health ID</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. NH-IND-2026-88392014"
                    className="w-full bg-[#13192B] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-mono focus:border-red-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleIdentifyPatient()}
                    disabled={identifying}
                    className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg transition shrink-0 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>{identifying ? "Identifying..." : "Identify Patient"}</span>
                  </button>
                </div>

                {/* Quick Demo ID shortcuts */}
                <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                  <span>Quick Select:</span>
                  <button
                    onClick={() => {
                      setSearchQuery("NH-IND-2026-88392014");
                      handleIdentifyPatient("NH-IND-2026-88392014");
                    }}
                    className="px-2.5 py-1 bg-[#13192B] hover:bg-slate-800 border border-slate-700 text-rose-300 rounded-lg font-mono text-[10px]"
                  >
                    Ananya Sharma (NH-IND-2026-88392014)
                  </button>
                  <button
                    onClick={() => {
                      setSearchQuery("NH-IND-2026-99281045");
                      handleIdentifyPatient("NH-IND-2026-99281045");
                    }}
                    className="px-2.5 py-1 bg-[#13192B] hover:bg-slate-800 border border-slate-700 text-rose-300 rounded-lg font-mono text-[10px]"
                  >
                    Rohan Verma (NH-IND-2026-99281045)
                  </button>
                </div>
              </div>
            )}

            {/* Method 2: Access Card / QR Scanner with Camera & Image Upload */}
            {idMethod === "ACCESS_CARD" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <label className="text-slate-300 text-xs font-bold block">Patient Access Card / Emergency QR Code</label>
                    <p className="text-[11px] text-slate-400">Scan QR via device camera, upload a QR code image/screenshot, or enter card token.</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Hidden file input for QR upload */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleQRImageUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingQR}
                      className="px-4 py-2 bg-[#13192B] hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-emerald-400" />
                      <span>{isUploadingQR ? "Reading Image..." : "Upload QR Screenshot / Photo"}</span>
                    </button>

                    <button
                      onClick={() => setIsCameraActive(!isCameraActive)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition cursor-pointer ${
                        isCameraActive ? "bg-red-600 text-white" : "bg-slate-800 text-slate-300 hover:text-white"
                      }`}
                    >
                      <Camera className="w-4 h-4" />
                      <span>{isCameraActive ? "Close Camera Scanner" : "Launch Camera QR Scanner"}</span>
                    </button>
                  </div>
                </div>

                {isCameraActive && (
                  <div className="relative w-full max-w-sm mx-auto aspect-square rounded-2xl overflow-hidden border-2 border-red-500/60 bg-black flex items-center justify-center">
                    <video ref={videoRef} className="w-full h-full object-cover" />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute inset-0 border-4 border-red-500/40 rounded-2xl pointer-events-none animate-pulse" />
                    <div className="absolute bottom-2 text-center text-[10px] text-white bg-black/70 px-3 py-1 rounded-full">
                      Point camera at patient's Health Card QR Code
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2 max-w-xl">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. CARD-SEC-99201 or scan token"
                    className="w-full bg-[#13192B] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-mono focus:border-red-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleIdentifyPatient()}
                    disabled={identifying}
                    className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg transition shrink-0 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>{identifying ? "Verifying..." : "Verify Card"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Method 3: Name Search */}
            {idMethod === "PATIENT_NAME" && (
              <div className="space-y-3 max-w-xl">
                <label className="text-slate-300 text-xs font-bold block">Search Patient by Full Name</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. Ananya Sharma or Rohan Verma"
                    className="w-full bg-[#13192B] border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:border-red-500 focus:outline-none"
                  />
                  <button
                    onClick={() => handleIdentifyPatient()}
                    disabled={identifying}
                    className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg transition shrink-0 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                    <span>{identifying ? "Searching..." : "Search Registry"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Method 4: Biometric Scanner */}
            {idMethod === "FINGERPRINT" && (
              <div className="space-y-4 max-w-xl">
                <div>
                  <label className="text-slate-300 text-xs font-bold block">Biometric Optical / Face Recognition Scanner</label>
                  <p className="text-[11px] text-slate-400">Place patient finger on clinical USB biometric reader or authenticate via terminal passkey.</p>
                </div>

                <div className="p-6 bg-[#13192B] border border-slate-800 rounded-2xl text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-red-950/60 border border-red-500/40 mx-auto flex items-center justify-center text-red-400 shadow-inner">
                    <Fingerprint className={`w-8 h-8 ${isBiometricScanning ? "animate-pulse text-red-300" : ""}`} />
                  </div>

                  {isBiometricScanning ? (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-red-300">Scanning Biometric Ledger ({biometricProgress}%)...</div>
                      <div className="w-full max-w-xs mx-auto bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-red-500 h-full transition-all duration-200" style={{ width: `${biometricProgress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleSimulateBiometric}
                      className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center space-x-2 mx-auto cursor-pointer"
                    >
                      <Fingerprint className="w-4 h-4" />
                      <span>Simulate Biometric Scan & Identify</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Identify Error Feedback */}
            {identifyError && (
              <div className="p-3.5 bg-red-950/90 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{identifyError}</span>
              </div>
            )}
          </div>

          {/* VERIFIED PATIENT IDENTITY CARD */}
          {identifiedPatient && (
            <div className="bg-gradient-to-br from-[#0D121F] to-[#13192B] border-2 border-emerald-500/60 rounded-3xl p-6 shadow-2xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white font-black text-xl shadow-lg border border-emerald-400/40">
                    {identifiedPatient.name ? identifiedPatient.name.charAt(0) : "P"}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-extrabold text-white text-lg">{identifiedPatient.name}</h3>
                      <span className="px-2.5 py-0.5 bg-emerald-950 border border-emerald-500/50 text-emerald-400 font-mono text-[10px] font-bold rounded-md">
                        VERIFIED IDENTITY
                      </span>
                    </div>
                    <div className="text-xs font-mono text-emerald-400 mt-0.5">
                      Global Health ID: {identifiedPatient.globalHealthId}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="px-4 py-2 bg-red-950 border border-red-600/60 text-red-200 font-mono text-sm font-black rounded-2xl flex items-center space-x-2 shadow-inner">
                    <Droplet className="w-4 h-4 text-red-400" />
                    <span>Blood Group: {identifiedPatient.bloodGroup || "B+"}</span>
                  </div>
                </div>
              </div>

              {/* Patient Key Medical Profile Flags */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-[#090D1A] border border-slate-800 rounded-xl space-y-1">
                  <div className="text-slate-400 font-bold flex items-center space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Critical Allergies</span>
                  </div>
                  <div className="text-amber-300 font-semibold">
                    {identifiedPatient.allergies && identifiedPatient.allergies.length > 0
                      ? identifiedPatient.allergies.join(", ")
                      : "Penicillin Allergy (Reported)"}
                  </div>
                </div>

                <div className="p-3.5 bg-[#090D1A] border border-slate-800 rounded-xl space-y-1">
                  <div className="text-slate-400 font-bold flex items-center space-x-1.5">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                    <span>Chronic Conditions</span>
                  </div>
                  <div className="text-rose-300 font-semibold">
                    {identifiedPatient.chronicConditions && identifiedPatient.chronicConditions.length > 0
                      ? identifiedPatient.chronicConditions.join(", ")
                      : "Mild Asthma, Hypertension"}
                  </div>
                </div>

                <div className="p-3.5 bg-[#090D1A] border border-slate-800 rounded-xl space-y-1">
                  <div className="text-slate-400 font-bold flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-sky-400" />
                    <span>Emergency Next of Kin</span>
                  </div>
                  <div className="text-sky-300 font-semibold">
                    {identifiedPatient.emergencyContactName || "Vikram Sharma (Brother)"} • {identifiedPatient.emergencyContactPhone || "+91 98765 43210"}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800">
                <span className="flex items-center space-x-1.5 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Identity confirmed. Proceed to Step 2 & 3: Break-Glass Authorization.</span>
                </span>

                <span className="text-[11px] font-mono text-slate-500">Gender: {identifiedPatient.gender || "Female"} • DOB: {identifiedPatient.dob || "1995-04-12"}</span>
              </div>
            </div>
          )}
        </div>

        {/* STEP 2 & 3: EMERGENCY REASON & BREAK-GLASS AUTHORIZATION SECTION */}
        {identifiedPatient && (
          <div className="bg-[#13192B] border-2 border-red-500/50 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/50 flex items-center justify-center text-red-400 shadow-md">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Step 2 & 3 — Emergency Reason & Break-Glass Authorization</h2>
                <p className="text-xs text-slate-400">
                  Break-Glass is the legal authorization override to unlock the EHR for <strong>{identifiedPatient.name}</strong> without prior consent.
                </p>
              </div>
            </div>

            {/* Statutory Security Notice */}
            <div className="p-4 bg-red-950/60 border border-red-600/60 rounded-2xl text-xs text-red-200 space-y-2 leading-relaxed">
              <div className="flex items-center space-x-2 font-bold text-red-300">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>Statutory Clinical Break-Glass Protocol</span>
              </div>
              <p>
                Executing Break-Glass unlocks all clinical history, lab reports, previous prescriptions, and surgical notes. This action is <strong>immutably recorded in the centralized Record Access History ledger</strong>, and automated real-time alerts will be dispatched to the patient and hospital clinical audit committee.
              </p>
            </div>

            {/* Form Inputs */}
            <div className="space-y-4 text-xs">
              {/* Emergency Reason Dropdown */}
              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  Step 2: Clinical Emergency Reason <span className="text-red-400">*</span>
                </label>
                <select
                  value={emergencyReason}
                  onChange={(e) => setEmergencyReason(e.target.value)}
                  className="w-full bg-[#0D121F] border border-slate-700 rounded-xl px-4 py-3 text-white text-xs focus:border-red-500 focus:outline-none"
                >
                  <option value="Patient unconscious / Unresponsive (Trauma Triage)">
                    🚨 Patient unconscious / Unresponsive (Trauma Triage)
                  </option>
                  <option value="Severe Polytrauma & Acute Hemorrhage">
                    🚨 Severe Polytrauma & Acute Hemorrhage
                  </option>
                  <option value="Anaphylaxis / Severe Allergic Shock">
                    🚨 Anaphylaxis / Severe Allergic Shock
                  </option>
                  <option value="Acute Coronary Syndrome / Ventricular Fibrillation">
                    🚨 Acute Coronary Syndrome / Ventricular Fibrillation
                  </option>
                  <option value="Acute Respiratory Failure / Toxic Poisoning">
                    🚨 Acute Respiratory Failure / Toxic Poisoning
                  </option>
                  <option value="Other">
                    ⚠️ Other Critical Emergency (Specify below)
                  </option>
                </select>
              </div>

              {emergencyReason === "Other" && (
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    Specify Custom Emergency Reason <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="e.g. Acute stroke protocol with severe aphasia and no next-of-kin present"
                    className="w-full bg-[#0D121F] border border-slate-700 rounded-xl px-4 py-2.5 text-white text-xs focus:border-red-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Mandatory Clinical Justification */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-bold block">
                    Step 3: Mandatory Clinical Justification <span className="text-red-400">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    {clinicalJustification.length} characters (min 10)
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={clinicalJustification}
                  onChange={(e) => setClinicalJustification(e.target.value)}
                  placeholder="Enter detailed medical necessity explaining why emergency break-glass override is strictly required..."
                  className="w-full bg-[#0D121F] border border-slate-700 rounded-xl p-3.5 text-white text-xs focus:border-red-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Doctor Certification Checkbox */}
              <label className="flex items-start space-x-3 p-3.5 bg-[#0D121F] border border-slate-800 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={certifiedAcknowledgement}
                  onChange={(e) => setCertifiedAcknowledgement(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-red-600 bg-slate-800 border-slate-700 rounded focus:ring-red-500 cursor-pointer"
                />
                <span className="text-slate-300 text-xs leading-relaxed">
                  I, <strong>{doctor?.name || "Practicing Physician"}</strong>, certify under medical license penalty that this <strong>Break-Glass emergency override</strong> is strictly necessary for immediate life-saving care for <strong>{identifiedPatient.name}</strong>, and consent cannot be obtained due to acute medical incapacity.
                </span>
              </label>

              {authError && (
                <div className="p-3 bg-red-950 border border-red-500/80 rounded-xl text-xs text-red-200 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* EXECUTE BREAK-GLASS BUTTON */}
              <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800">
                <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Logged directly into centralized Record Access History</span>
                </div>

                <button
                  onClick={handleExecuteBreakGlass}
                  disabled={authorizing || !certifiedAcknowledgement}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-xl shadow-red-900/60 border border-red-400/40 transition flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-50"
                >
                  <Siren className="w-5 h-5 animate-bounce" />
                  <span>
                    {authorizing ? "Authorizing Break-Glass..." : "Authorize Break-Glass & Open Patient EHR"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
