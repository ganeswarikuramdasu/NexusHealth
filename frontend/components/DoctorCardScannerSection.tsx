import React, { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";
import { CardScanResult, DoctorProfile, PatientProfile } from "../types";
import { safeFetchJson, parseResponseSafe } from "../utils/api";
import { MobileCameraBridgeModal } from "./MobileCameraBridgeModal";
import {
  QrCode,
  Camera,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  UserCheck,
  FileText,
  PlusCircle,
  Stethoscope,
  RefreshCw,
  Key,
  History,
  Lock,
  Search,
  Check,
  AlertTriangle,
  X,
  CreditCard,
  User,
  Smartphone,
} from "lucide-react";

interface DoctorCardScannerSectionProps {
  doctor: DoctorProfile | null;
  hospitalName?: string;
  onRefreshRecords?: () => void;
  onSelectPatientForEhr?: (patient: PatientProfile) => void;
}

export const DoctorCardScannerSection: React.FC<DoctorCardScannerSectionProps> = ({
  doctor,
  hospitalName,
  onRefreshRecords,
  onSelectPatientForEhr,
}) => {
  const [scanMode, setScanMode] = useState<"CAMERA" | "MANUAL">("CAMERA");
  const [manualTokenInput, setManualTokenInput] = useState<string>("");
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [scanResult, setScanResult] = useState<CardScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showMobileBridgeModal, setShowMobileBridgeModal] = useState<boolean>(false);

  // Assisted Consent PIN state
  const [pinCodeInput, setPinCodeInput] = useState<string>("");

  // Add Consultation Record State inside Access Card Section
  const [showAddRecordModal, setShowAddRecordModal] = useState<boolean>(false);
  const [recordTitle, setRecordTitle] = useState<string>("Outpatient Consultation");
  const [recordType, setRecordType] = useState<"PRESCRIPTION" | "LAB_REPORT" | "DIAGNOSIS" | "IMAGING_SCAN">("PRESCRIPTION");
  const [diagnosis, setDiagnosis] = useState<string>("");
  const [symptomsInput, setSymptomsInput] = useState<string>("");
  const [doctorNotes, setDoctorNotes] = useState<string>("");
  const [medName, setMedName] = useState<string>("");
  const [medDosage, setMedDosage] = useState<string>("");
  const [medsList, setMedsList] = useState<any[]>([]);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Doctor Scan Logs
  const [recentDoctorLogs, setRecentDoctorLogs] = useState<any[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Load Doctor Card Logs
  const fetchDoctorCardLogs = async () => {
    try {
      const data = await safeFetchJson<any>("/api/card/admin/all-cards", undefined, { success: false, recentAccessLogs: [] });
      if (data?.success && Array.isArray(data.recentAccessLogs)) {
        setRecentDoctorLogs(data.recentAccessLogs.slice(0, 15));
      }
    } catch (err) {
      console.error("Failed to load doctor card logs:", err);
    }
  };

  useEffect(() => {
    fetchDoctorCardLogs();
  }, []);

  // Camera Stream Hook
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        if (scanMode === "CAMERA" && isScanning && !scanResult) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
          });

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.setAttribute("playsinline", "true");
            videoRef.current.play();
            requestAnimationFrame(tickScan);
          }
        }
      } catch (err) {
        console.warn("Camera access unavailable:", err);
        setScanError("Camera device unavailable or permission denied. Switch to Manual Scan mode below.");
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
  }, [scanMode, isScanning, scanResult]);

  // QR Tick Frame Loop
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
          setIsScanning(false);
          handleProcessScannedToken(code.data);
          return;
        }
      }
    }

    if (isScanning && scanMode === "CAMERA" && !scanResult) {
      animationFrameId.current = requestAnimationFrame(tickScan);
    }
  };

  // Submit token to backend API
  const handleProcessScannedToken = async (tokenStr: string) => {
    setLoading(true);
    setScanError(null);

    try {
      const res = await fetch("/api/card/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scannedCode: tokenStr,
          actorId: doctor?.id || "doc_1",
          actorName: doctor?.name || "Dr. Rajesh V. Sharma",
          actorRole: "DOCTOR",
          hospitalId: doctor?.hospitalId || "hosp_1",
          hospitalName: doctor?.hospitalName || hospitalName || "Apollo Multi-Specialty Hospital",
        }),
      });

      const data: CardScanResult = await parseResponseSafe<any>(res, { success: false, message: "Failed to process card scan." });

      if (data && data.success) {
        setScanResult(data);
        fetchDoctorCardLogs();
      } else {
        setScanError(data?.message || "Failed to process card scan.");
      }
    } catch (err) {
      setScanError("Network error verifying patient card token.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Assisted Consent Confirmation
  const handleGrantAssistedConsent = async (usePin: boolean = false) => {
    if (!scanResult || (!scanResult.card && !scanResult.patientBasic)) return;
    setLoading(true);
    try {
      const res = await fetch("/api/card/assisted-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: scanResult.card?.id,
          patientHealthId: scanResult.card?.patientHealthId || scanResult.patientBasic?.globalHealthId,
          doctorId: doctor?.id || "doc_1",
          doctorName: doctor?.name || "Dr. Rajesh V. Sharma",
          hospitalName: doctor?.hospitalName || hospitalName || "Apollo Multi-Specialty Hospital",
          verifiedByPin: usePin,
        }),
      });

      const data = await parseResponseSafe<any>(res, { success: false, message: "Assisted consent verification failed." });
      if (data && data.success) {
        setScanResult({
          ...data,
          authorizationStatus: "AUTHORIZED",
        });
        fetchDoctorCardLogs();
      } else {
        setScanError(data?.message || "Assisted consent verification failed.");
      }
    } catch (err) {
      setScanError("Failed to submit assisted consent approval.");
    } finally {
      setLoading(false);
    }
  };

  // Save Consultation Record
  const handleSaveConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanResult?.patient?.userId && !scanResult?.patient?.globalHealthId) return;

    setSaveStatus("Saving consultation record...");
    try {
      const res = await fetch("/api/patient/add-manual-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: scanResult.patient.userId || scanResult.patient.globalHealthId,
          title: recordTitle,
          recordType,
          date: new Date().toISOString().split("T")[0],
          doctorName: doctor?.name || "Dr. Rajesh V. Sharma",
          hospitalName: doctor?.hospitalName || hospitalName || "Apollo Multi-Specialty Hospital",
          diagnosis,
          symptoms: symptomsInput ? symptomsInput.split(",").map((s) => s.trim()) : ["Outpatient Checkup"],
          doctorNotes,
        }),
      });

      const data = await parseResponseSafe<any>(res, { success: false });
      if (data && data.success) {
        setSaveStatus("Consultation record saved & linked to Patient EHR!");
        setShowAddRecordModal(false);
        if (onRefreshRecords) onRefreshRecords();

        // Refresh scanned record list
        if (scanResult.patient?.userId) {
          const recs = await safeFetchJson<any[]>(`/api/patient/records/${scanResult.patient.userId}`, undefined, []);
          if (Array.isArray(recs)) {
            setScanResult({ ...scanResult, records: recs });
          }
        }
      } else {
        setSaveStatus("Error saving record.");
      }
    } catch (err) {
      setSaveStatus("Error saving consultation record.");
    }
  };

  const handleResetScan = () => {
    setScanResult(null);
    setScanError(null);
    setIsScanning(true);
    setManualTokenInput("");
  };

  return (
    <div className="space-y-6">
      {/* SECTION HEADER */}
      <div className="bg-gradient-to-r from-purple-950/80 via-indigo-950/60 to-slate-950 border border-purple-500/30 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-purple-500/20 border border-purple-500/40 rounded-full text-xs font-mono font-bold text-purple-300 mb-2">
            <CreditCard className="w-3.5 h-3.5 text-purple-400" />
            <span>Card Authentication Terminal</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Patient Access Card Reader</span>
          </h1>
          <p className="text-xs text-slate-300 max-w-xl mt-1">
            Scan physical or digital NexusHealth Patient Access Cards to verify identity, obtain assisted consent, and retrieve authorized EHR medical history.
          </p>
        </div>

        {scanResult && (
          <button
            onClick={handleResetScan}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl text-xs transition flex items-center space-x-2 shadow-md shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Scan Another Card</span>
          </button>
        )}
      </div>

      {/* ERROR DISPLAY */}
      {scanError && (
        <div className="p-4 bg-rose-950/80 border border-rose-500/40 rounded-2xl text-xs font-bold text-rose-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{scanError}</span>
          </div>
          <button onClick={handleResetScan} className="underline text-[11px] text-rose-200">
            Retry
          </button>
        </div>
      )}

      {/* SCAN TERMINAL LAYOUT */}
      {!scanResult ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SCANNER INPUT BOX */}
          <div className="lg:col-span-7 bg-[#13192B] border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            {/* TABS & MOBILE BRIDGE TRIGGER */}
            <div className="space-y-3">
              <button
                onClick={() => setShowMobileBridgeModal(true)}
                className="w-full py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl text-xs transition flex items-center justify-center space-x-2 shadow-xl shadow-purple-600/30 border border-purple-400/40"
              >
                <Smartphone className="w-4 h-4 animate-bounce" />
                <span>📱 Connect Mobile Phone Scanner (Wireless Camera Bridge)</span>
              </button>

              <div className="flex items-center space-x-2 bg-[#0D121F] p-1.5 rounded-2xl border border-slate-800">
                <button
                  onClick={() => {
                    setScanMode("CAMERA");
                    setIsScanning(true);
                  }}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 ${
                    scanMode === "CAMERA"
                      ? "bg-purple-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Laptop Webcam</span>
                </button>

                <button
                  onClick={() => {
                    setScanMode("MANUAL");
                    setIsScanning(false);
                  }}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 ${
                    scanMode === "MANUAL"
                      ? "bg-purple-600 text-white shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Key className="w-4 h-4" />
                  <span>Manual Token Entry</span>
                </button>
              </div>
            </div>

            {/* CAMERA STREAM */}
            {scanMode === "CAMERA" && (
              <div className="space-y-4">
                <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden border-2 border-dashed border-purple-500/50 flex flex-col items-center justify-center shadow-inner">
                  <video ref={videoRef} className="w-full h-full object-cover" />
                  <canvas ref={canvasRef} className="hidden" />

                  <div className="absolute inset-0 border-4 border-purple-500/20 pointer-events-none rounded-3xl flex items-center justify-center">
                    <div className="w-52 h-52 border-2 border-cyan-400 rounded-2xl animate-pulse flex items-center justify-center">
                      <p className="text-[10px] font-mono text-cyan-300 bg-black/80 px-3 py-1 rounded-full shadow">
                        Hold Patient Card QR Here
                      </p>
                    </div>
                  </div>
                </div>

                {loading && (
                  <div className="p-3 text-center text-xs font-mono text-cyan-400 flex items-center justify-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Card Token with NexusHealth Security Gateway...</span>
                  </div>
                )}
              </div>
            )}

            {/* MANUAL ENTRY */}
            {scanMode === "MANUAL" && (
              <div className="space-y-4 bg-[#0D121F] p-6 rounded-3xl border border-slate-800">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block">
                    Enter Secure Card Token or Global Health ID
                  </label>
                  <input
                    type="text"
                    value={manualTokenInput}
                    onChange={(e) => setManualTokenInput(e.target.value)}
                    placeholder="e.g. NXAC-8f92a1b3c4d5e6f70891a2b3 or NH-IND-2026-88392014"
                    className="w-full bg-[#13192B] border border-slate-700 rounded-2xl px-4 py-3 text-xs text-white font-mono outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleProcessScannedToken(manualTokenInput)}
                    disabled={!manualTokenInput || loading}
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl text-xs transition shadow-lg shadow-purple-900/30 disabled:opacity-50"
                  >
                    {loading ? "Verifying Token..." : "Verify & Unlock EHR"}
                  </button>

                  <button
                    onClick={() => handleProcessScannedToken("NXAC-8f92a1b3c4d5e6f70891a2b3")}
                    className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold rounded-2xl text-xs transition border border-slate-700 shrink-0"
                  >
                    ⚡ Test Sample Card Scan
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR: ZERO KNOWLEDGE EXPLANATION & INSTRUCTIONS */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-[#13192B] border border-slate-800 rounded-3xl p-6 space-y-4 text-xs shadow-xl">
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <Lock className="w-4 h-4 text-purple-400" />
                <span>Zero-Knowledge Token Security</span>
              </h3>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                The physical Patient Access Card holds <strong>no readable medical data or personal files</strong> on the plastic substrate. Scanning resolves an encrypted token on the central gateway, unlocking access only after checking authorization.
              </p>

              <div className="space-y-2 pt-2 border-t border-slate-800 text-[11px]">
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-slate-300">Automatic consent check for active appointments today</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-slate-300">Low-literacy assisted physical confirmation for walk-ins</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-slate-300">Real-time SMS audit log sent to patient upon scan</span>
                </div>
              </div>
            </div>

            {/* AUDIT LOG PREVIEW */}
            <div className="bg-[#13192B] border border-slate-800 rounded-3xl p-5 space-y-3 text-xs shadow-xl">
              <h3 className="font-bold text-white text-xs flex items-center space-x-2">
                <History className="w-4 h-4 text-cyan-400" />
                <span>Recent Card Access Audit Logs</span>
              </h3>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {recentDoctorLogs.length === 0 ? (
                  <p className="text-[11px] text-slate-500 p-2">No card scan logs recorded yet.</p>
                ) : (
                  recentDoctorLogs.map((log) => (
                    <div key={log.id} className="bg-[#0D121F] p-2.5 rounded-xl border border-slate-800 space-y-1 text-[11px]">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-200">{log.patientName}</span>
                        <span className={`px-1.5 py-0.5 text-[9px] font-mono rounded font-bold ${
                          log.authorizationStatus === "AUTHORIZED" ? "bg-emerald-950 text-emerald-400" : "bg-rose-950 text-rose-400"
                        }`}>
                          {log.authorizationStatus}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono flex justify-between">
                        <span>{log.actorName}</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* SCAN RESULT / EHR VERIFIED VIEW */
        <div className="space-y-6">
          {scanResult.authorizationStatus === "REQUIRES_PATIENT_CONSENT" ? (
            /* ASSISTED CONSENT SCREEN */
            <div className="bg-gradient-to-b from-[#1E1B4B] to-[#0D121F] border-2 border-amber-500/50 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto">
                <UserCheck className="w-10 h-10" />
              </div>

              <div className="space-y-2 max-w-lg mx-auto">
                <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold rounded-full uppercase border border-amber-500/40">
                  Assisted Patient Access Mode
                </span>
                <h2 className="text-2xl font-extrabold text-white">
                  Patient Identified: {scanResult.patientBasic?.name}
                </h2>
                <p className="text-xs font-mono text-cyan-300">
                  Health ID: {scanResult.patientBasic?.globalHealthId} • Blood Group: {scanResult.patientBasic?.bloodGroup}
                </p>
              </div>

              <div className="bg-[#13192B] p-6 rounded-2xl border-2 border-cyan-500/40 space-y-4 max-w-md mx-auto text-center shadow-xl">
                <Stethoscope className="w-8 h-8 text-cyan-400 mx-auto" />
                <p className="text-base font-extrabold text-white leading-snug">
                  Allow {doctor?.name || "Dr. Rajesh V. Sharma"} to view your medical records for today's consultation?
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => handleGrantAssistedConsent(false)}
                    className="py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm rounded-2xl transition shadow-lg shadow-emerald-900/40 flex items-center justify-center space-x-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>ALLOW ACCESS</span>
                  </button>

                  <button
                    onClick={handleResetScan}
                    className="py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-2xl transition border border-slate-700 flex items-center justify-center space-x-2"
                  >
                    <X className="w-5 h-5" />
                    <span>CANCEL</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 max-w-xs mx-auto text-left space-y-2">
                <label className="text-[10px] font-bold text-slate-400 block">Or Verify via 4-Digit Patient PIN</label>
                <div className="flex space-x-2">
                  <input
                    type="password"
                    maxLength={4}
                    value={pinCodeInput}
                    onChange={(e) => setPinCodeInput(e.target.value)}
                    placeholder="1234"
                    className="bg-[#0D121F] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono text-center outline-none focus:border-cyan-500 w-24"
                  />
                  <button
                    onClick={() => handleGrantAssistedConsent(true)}
                    className="px-3 py-1.5 bg-cyan-600 text-white font-bold text-xs rounded-xl"
                  >
                    Verify PIN
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* FULL UNLOCKED PATIENT EHR SCREEN */
            <div className="space-y-6">
              {/* STATUS BAR */}
              <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-300 font-bold shadow-lg">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Card Scanned & Verified: <strong>{scanResult.patient?.name}</strong></span>
                </div>
                <div className="flex items-center space-x-2 font-mono text-[10px]">
                  <span className="bg-emerald-900/80 px-2.5 py-1 rounded border border-emerald-500/30">
                    ID: {scanResult.patient?.globalHealthId}
                  </span>
                  <button
                    onClick={handleResetScan}
                    className="px-2.5 py-1 bg-slate-800 text-slate-200 rounded border border-slate-700 hover:bg-slate-700"
                  >
                    Scan Another Card
                  </button>
                </div>
              </div>

              {/* PATIENT PROFILE CARD */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#13192B] p-4 rounded-2xl border border-slate-800 space-y-1">
                  <p className="text-[10px] font-mono text-slate-500 uppercase">Age / Gender</p>
                  <p className="text-xs font-bold text-white">{scanResult.patient?.dob} ({scanResult.patient?.gender})</p>
                </div>
                <div className="bg-[#13192B] p-4 rounded-2xl border border-slate-800 space-y-1">
                  <p className="text-[10px] font-mono text-slate-500 uppercase">Blood Group</p>
                  <p className="text-xs font-bold text-rose-400">{scanResult.patient?.bloodGroup}</p>
                </div>
                <div className="bg-[#13192B] p-4 rounded-2xl border border-slate-800 space-y-1">
                  <p className="text-[10px] font-mono text-slate-500 uppercase">Known Allergies</p>
                  <p className="text-xs font-bold text-amber-300 truncate">
                    {scanResult.patient?.allergies?.join(", ") || "None"}
                  </p>
                </div>
                <div className="bg-[#13192B] p-4 rounded-2xl border border-slate-800 space-y-1">
                  <p className="text-[10px] font-mono text-slate-500 uppercase">Emergency Contact</p>
                  <p className="text-[11px] font-bold text-slate-300 truncate">
                    {scanResult.patient?.emergencyContactPhone}
                  </p>
                </div>
              </div>

              {/* MEDICAL RECORDS TABLE / LEDGER */}
              <div className="bg-[#13192B] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="font-bold text-white text-base flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-purple-400" />
                      <span>EHR Medical Record History ({scanResult.records?.length || 0} Records)</span>
                    </h3>
                    <p className="text-xs text-slate-400">Lifelong health ledger linked to Patient Access Card</p>
                  </div>

                  <button
                    onClick={() => setShowAddRecordModal(true)}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-2xl text-xs transition flex items-center space-x-1.5 shadow-lg shadow-purple-900/30"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add Consultation Note / Rx</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {!scanResult.records || scanResult.records.length === 0 ? (
                    <p className="text-xs text-slate-500 p-6 text-center">No previous medical records found for this patient.</p>
                  ) : (
                    scanResult.records.map((rec) => (
                      <div key={rec.id} className="bg-[#0D121F] p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-cyan-300 text-sm">{rec.title}</span>
                            <p className="text-[11px] text-slate-400">{rec.doctorName} • {rec.hospitalName}</p>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{rec.date}</span>
                        </div>
                        <p className="text-slate-200"><strong>Diagnosis:</strong> {rec.diagnosis}</p>
                        <p className="text-slate-400 text-[11px]"><strong>Doctor Advice:</strong> {rec.doctorNotes}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADD CONSULTATION RECORD MODAL */}
      {showAddRecordModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#13192B] border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4 text-slate-100 shadow-2xl relative">
            <button
              onClick={() => setShowAddRecordModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>

            <h3 className="font-bold text-white text-base flex items-center space-x-2 border-b border-slate-800 pb-2">
              <Stethoscope className="w-5 h-5 text-purple-400" />
              <span>Add Outpatient Consultation Record</span>
            </h3>

            {saveStatus && (
              <div className="p-3 bg-purple-950 text-purple-300 rounded-xl text-xs font-bold border border-purple-500/30">
                {saveStatus}
              </div>
            )}

            <form onSubmit={handleSaveConsultation} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Consultation Title</label>
                <input
                  type="text"
                  required
                  value={recordTitle}
                  onChange={(e) => setRecordTitle(e.target.value)}
                  className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Record Type</label>
                  <select
                    value={recordType}
                    onChange={(e) => setRecordType(e.target.value as any)}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white outline-none"
                  >
                    <option value="PRESCRIPTION">Prescription</option>
                    <option value="DIAGNOSIS">Clinical Diagnosis</option>
                    <option value="LAB_REPORT">Lab Test Order</option>
                    <option value="IMAGING_SCAN">Imaging Scan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Symptoms</label>
                  <input
                    type="text"
                    placeholder="e.g. Fever, Cough"
                    value={symptomsInput}
                    onChange={(e) => setSymptomsInput(e.target.value)}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Clinical Diagnosis</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute Upper Respiratory Infection"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Doctor Notes & Advice</label>
                <textarea
                  rows={3}
                  required
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="Prescriptions, dosage instructions, and follow-up advice..."
                  className="w-full bg-[#0D121F] border border-slate-800 rounded-xl p-3 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition text-xs shadow-lg shadow-purple-900/30"
              >
                Save & Link to Patient EHR
              </button>
            </form>
          </div>
        </div>
      )}

      <MobileCameraBridgeModal
        isOpen={showMobileBridgeModal}
        onClose={() => setShowMobileBridgeModal(false)}
        onScanSuccess={(scannedCode, scanType) => {
          handleProcessScannedToken(scannedCode);
        }}
        doctorName={doctor?.name || "Attending Physician"}
      />
    </div>
  );
};
