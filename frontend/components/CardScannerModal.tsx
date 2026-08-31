import React, { useState, useEffect, useRef } from "react";
import jsQR from "jsqr";
import { CardScanResult, MedicalRecord, DoctorProfile } from "../types";
import { parseResponseSafe, safeFetchJson } from "../utils/api";
import {
  QrCode,
  Camera,
  X,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  FileText,
  PlusCircle,
  Stethoscope,
  Activity,
  Heart,
  Droplets,
  Calendar,
  Lock,
  RefreshCw,
  Key,
} from "lucide-react";

interface CardScannerModalProps {
  doctor: DoctorProfile | null;
  hospitalName?: string;
  onClose: () => void;
  onRecordAdded?: () => void;
}

export const CardScannerModal: React.FC<CardScannerModalProps> = ({
  doctor,
  hospitalName,
  onClose,
  onRecordAdded,
}) => {
  const [activeTab, setActiveTab] = useState<"CAMERA" | "MANUAL">("CAMERA");
  const [manualTokenInput, setManualTokenInput] = useState<string>("");
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [scanResult, setScanResult] = useState<CardScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Assisted Consent PIN state
  const [pinCodeInput, setPinCodeInput] = useState<string>("");

  // Add Consultation Record State
  const [showAddRecordModal, setShowAddRecordModal] = useState<boolean>(false);
  const [recordTitle, setRecordTitle] = useState<string>("Outpatient Clinical Consultation");
  const [recordType, setRecordType] = useState<"PRESCRIPTION" | "LAB_REPORT" | "DIAGNOSIS" | "IMAGING_SCAN">("PRESCRIPTION");
  const [diagnosis, setDiagnosis] = useState<string>("");
  const [symptomsInput, setSymptomsInput] = useState<string>("");
  const [doctorNotes, setDoctorNotes] = useState<string>("");
  const [medName, setMedName] = useState<string>("");
  const [medDosage, setMedDosage] = useState<string>("");
  const [medsList, setMedsList] = useState<any[]>([]);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Start Video Stream for QR Scanning
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        if (activeTab === "CAMERA" && isScanning) {
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
        console.warn("Camera access unavailable or denied:", err);
        setScanError("Camera access unavailable. Use manual QR token scan below.");
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
  }, [activeTab, isScanning]);

  // Frame tick QR code scanning loop
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
          handleProcessScannedCode(code.data);
          return;
        }
      }
    }

    if (isScanning && activeTab === "CAMERA") {
      animationFrameId.current = requestAnimationFrame(tickScan);
    }
  };

  // Submit scanned code to backend
  const handleProcessScannedCode = async (tokenStr: string) => {
    setLoading(true);
    setScanError(null);
    setScanResult(null);

    try {
      const res = await fetch("/api/card/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scannedCode: tokenStr,
          actorId: doctor?.id || "doc_1",
          actorName: doctor?.name || "",
          actorRole: "DOCTOR",
          hospitalId: doctor?.hospitalId || "hosp_1",
          hospitalName: doctor?.hospitalName || hospitalName || "Apollo Multi-Specialty Hospital",
        }),
      });

      const data: CardScanResult = await parseResponseSafe<any>(res, { success: false, message: "Failed to process card scan." });

      if (data && data.success) {
        setScanResult(data);
      } else {
        setScanError(data?.message || "Failed to process card scan.");
      }
    } catch (err) {
      setScanError("Network error sending card scan verification.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Assisted Consent Approval (Physical / Low Literacy)
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
          doctorName: doctor?.name || "",
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
      } else {
        setScanError(data?.message || "Assisted consent verification failed.");
      }
    } catch (err) {
      setScanError("Failed to submit assisted consent approval.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Add Medicine to Prescription
  const handleAddMedicine = () => {
    if (!medName) return;
    setMedsList([
      ...medsList,
      {
        name: medName,
        dosage: medDosage || "1 Tablet",
        frequency: "Twice Daily",
        durationDays: 5,
        instructions: "After meals",
      },
    ]);
    setMedName("");
    setMedDosage("");
  };

  // Handle Save Consultation Medical Record
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
          doctorName: doctor?.name || "",
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
        if (onRecordAdded) onRecordAdded();

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

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl w-full max-w-3xl p-6 relative space-y-6 text-slate-900 shadow-2xl">
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-500 hover:text-slate-900 p-2 rounded-xl bg-[#EDF1F5] border border-slate-200 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* TITLE HEADER */}
        <div className="flex items-center space-x-3 text-[#17C964] pb-3 border-b border-slate-200">
          <QrCode className="w-7 h-7" />
          <div>
            <h2 className="text-xl font-bold text-slate-900">Scan Patient Access Card</h2>
            <p className="text-xs text-slate-500">
              Identity verification & authorized medical record retrieval
            </p>
          </div>
        </div>

        {/* SCANNER CONTROLS OR SCAN RESULT */}
        {!scanResult ? (
          <div className="space-y-6">
            {/* MODE SWITCH TABS */}
            <div className="flex items-center space-x-2 bg-[#EDF1F5] p-1.5 rounded-2xl border border-slate-200">
              <button
                onClick={() => {
                  setActiveTab("CAMERA");
                  setIsScanning(true);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 ${
                  activeTab === "CAMERA"
                    ? "bg-[#17C964] text-white shadow-md"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Live Camera QR Scanner</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("MANUAL");
                  setIsScanning(false);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-2 ${
                  activeTab === "MANUAL"
                    ? "bg-[#17C964] text-white shadow-md"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Key className="w-4 h-4" />
                <span>Manual Token / ID Scan</span>
              </button>
            </div>

            {/* ERROR DISPLAY */}
            {scanError && (
              <div className="p-4 bg-[#FDE9E3] border border-[#F2603C]/40 rounded-2xl text-xs font-bold text-[#C83E1E] flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-[#F2603C]" />
                <span>{scanError}</span>
              </div>
            )}

            {/* CAMERA SCANNER VIEW */}
            {activeTab === "CAMERA" && (
              <div className="space-y-4">
                <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden border-2 border-dashed border-[#17C964]/50 flex flex-col items-center justify-center">
                  <video ref={videoRef} className="w-full h-full object-cover" />
                  <canvas ref={canvasRef} className="hidden" />

                  {/* OVERLAY FOCUS FRAME */}
                  <div className="absolute inset-0 border-4 border-[#17C964]/30 pointer-events-none rounded-3xl flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-[#17C964] rounded-2xl animate-pulse flex items-center justify-center">
                      <p className="text-[10px] font-mono text-[#3CE584] bg-black/70 px-2 py-1 rounded">
                        Position Card QR Code Here
                      </p>
                    </div>
                  </div>
                </div>

                {loading && (
                  <div className="p-3 text-center text-xs font-mono text-[#17C964] flex items-center justify-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Card Token with NexusHealth Security Gateway...</span>
                  </div>
                )}
              </div>
            )}

            {/* MANUAL TOKEN INPUT VIEW */}
            {activeTab === "MANUAL" && (
              <div className="space-y-4 bg-[#EDF1F5] p-6 rounded-3xl border border-slate-200">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Enter Card Token or Global Health ID
                  </label>
                  <input
                    type="text"
                    value={manualTokenInput}
                    onChange={(e) => setManualTokenInput(e.target.value)}
                    placeholder="e.g. Scan the patient's card or Health ID"
                    className="w-full bg-[#FFFFFF] border border-slate-300 rounded-2xl px-4 py-3 text-xs text-slate-900 font-mono outline-none focus:border-[#17C964]"
                  />
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleProcessScannedCode(manualTokenInput)}
                    disabled={!manualTokenInput || loading}
                    className="flex-1 py-3 bg-[#17C964] hover:bg-[#0EA653] text-white font-bold rounded-2xl text-xs transition shadow-lg shadow-[#17C964]/30 disabled:opacity-50"
                  >
                    {loading ? "Verifying Token..." : "Verify & Process Scan"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* SCAN RESULT SCREEN */
          <div className="space-y-6">
            {/* CASE 1: REQUIRES PATIENT CONSENT (ASSISTED LOW-LITERACY MODE) */}
            {scanResult.authorizationStatus === "REQUIRES_PATIENT_CONSENT" ? (
              <div className="bg-gradient-to-b from-[#0f172a] to-[#EDF1F5] border-2 border-amber-500/50 rounded-3xl p-6 text-center space-y-6 shadow-2xl">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto">
                  <UserCheck className="w-10 h-10" />
                </div>

                <div className="space-y-2 max-w-lg mx-auto">
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold rounded-full uppercase border border-amber-500/40">
                    Assisted Patient Access Mode
                  </span>
                  <h3 className="text-xl font-extrabold text-white">
                    Patient Identified: {scanResult.patientBasic?.name}
                  </h3>
                  <p className="text-xs font-mono text-[#3CE584]">
                    Health ID: {scanResult.patientBasic?.globalHealthId} • Blood Group: {scanResult.patientBasic?.bloodGroup}
                  </p>
                </div>

                {/* HIGH CONTRAST SIMPLE CONFIRMATION BOX FOR ILLITERATE / LOW DIGITAL LITERACY PATIENT */}
                <div className="bg-[#FFFFFF] p-6 rounded-2xl border-2 border-[#17C964]/40 space-y-4 max-w-md mx-auto text-center">
                  <Stethoscope className="w-8 h-8 text-[#17C964] mx-auto" />
                  <p className="text-base font-extrabold text-slate-900 leading-snug">
                    Allow {doctor?.name || "Doctor"} to view your medical records for today's consultation?
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => handleGrantAssistedConsent(false)}
                      className="py-4 bg-[#17C964] hover:bg-[#0EA653] text-white font-extrabold text-sm rounded-2xl transition shadow-lg shadow-[#17C964]/40 flex items-center justify-center space-x-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>ALLOW ACCESS</span>
                    </button>

                    <button
                      onClick={onClose}
                      className="py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-2xl transition border border-slate-300 flex items-center justify-center space-x-2"
                    >
                      <X className="w-5 h-5" />
                      <span>CANCEL</span>
                    </button>
                  </div>
                </div>

                {/* ALTERNATIVE PIN VERIFICATION */}
                <div className="pt-2 border-t border-slate-200 max-w-xs mx-auto text-left space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 block">Or Verify via 4-Digit Patient PIN</label>
                  <div className="flex space-x-2">
                    <input
                      type="password"
                      maxLength={4}
                      value={pinCodeInput}
                      onChange={(e) => setPinCodeInput(e.target.value)}
                      placeholder="1234"
                      className="bg-[#EDF1F5] border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-mono text-center outline-none focus:border-[#17C964] w-24"
                    />
                    <button
                      onClick={() => handleGrantAssistedConsent(true)}
                      className="px-3 py-1.5 bg-[#17C964] text-white font-bold text-xs rounded-xl"
                    >
                      Verify PIN
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* CASE 2: FULL AUTHORIZED PATIENT EHR DISPLAY */
              <div className="space-y-6">
                {/* AUTHORIZED BADGE */}
                <div className="p-4 bg-[#E9FBF1] border border-[#17C964]/40 rounded-2xl flex items-center justify-between text-xs text-[#17C964] font-bold">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-[#17C964]" />
                    <span>Card Validated & Authorized: {scanResult.patient?.name}</span>
                  </div>
                  <span className="font-mono text-[10px] bg-[#D6F5E4] px-2 py-1 rounded">
                    ID: {scanResult.patient?.globalHealthId}
                  </span>
                </div>

                {/* PATIENT OVERVIEW SNAPSHOT */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[#EDF1F5] p-3 rounded-2xl border border-slate-200 space-y-1">
                    <p className="text-[10px] font-mono text-slate-500 uppercase">Age / Gender</p>
                    <p className="text-xs font-bold text-slate-900">{scanResult.patient?.dob} ({scanResult.patient?.gender})</p>
                  </div>
                  <div className="bg-[#EDF1F5] p-3 rounded-2xl border border-slate-200 space-y-1">
                    <p className="text-[10px] font-mono text-slate-500 uppercase">Blood Group</p>
                    <p className="text-xs font-bold text-[#C83E1E]">{scanResult.patient?.bloodGroup}</p>
                  </div>
                  <div className="bg-[#EDF1F5] p-3 rounded-2xl border border-slate-200 space-y-1">
                    <p className="text-[10px] font-mono text-slate-500 uppercase">Known Allergies</p>
                    <p className="text-xs font-bold text-amber-700 truncate">
                      {scanResult.patient?.allergies?.join(", ") || "None"}
                    </p>
                  </div>
                  <div className="bg-[#EDF1F5] p-3 rounded-2xl border border-slate-200 space-y-1">
                    <p className="text-[10px] font-mono text-slate-500 uppercase">Emergency Contact</p>
                    <p className="text-[11px] font-bold text-slate-700 truncate">
                      {scanResult.patient?.emergencyContactPhone}
                    </p>
                  </div>
                </div>

                {/* MEDICAL RECORDS LEDGER */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-[#17C964]" />
                      <span>EHR Medical History ({scanResult.records?.length || 0} Records)</span>
                    </h4>

                    <button
                      onClick={() => setShowAddRecordModal(true)}
                      className="px-3 py-1.5 bg-[#17C964] hover:bg-[#0EA653] text-white font-bold rounded-xl text-xs transition flex items-center space-x-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Add Consultation Note / Prescription</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {!scanResult.records || scanResult.records.length === 0 ? (
                      <p className="text-xs text-slate-500 p-4 text-center">No previous medical records found for this patient.</p>
                    ) : (
                      scanResult.records.map((rec) => (
                        <div key={rec.id} className="bg-[#EDF1F5] p-3.5 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-bold text-[#17C964]">{rec.title}</span>
                              <p className="text-[10px] text-slate-500">{rec.doctorName} • {rec.hospitalName}</p>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">{rec.date}</span>
                          </div>
                          <p className="text-slate-700 text-[11px]"><strong>Diagnosis:</strong> {rec.diagnosis}</p>
                          <p className="text-slate-500 text-[10px]"><strong>Doctor Notes:</strong> {rec.doctorNotes}</p>
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
            <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-4 text-slate-900 shadow-2xl relative">
              <button
                onClick={() => setShowAddRecordModal(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-900"
              >
                ✕
              </button>

              <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2 border-b border-slate-200 pb-2">
                <Stethoscope className="w-5 h-5 text-[#17C964]" />
                <span>Add Outpatient Consultation Record</span>
              </h3>

              {saveStatus && (
                <div className="p-3 bg-[#E9FBF1] text-[#17C964] rounded-xl text-xs font-bold border border-[#17C964]/30">
                  {saveStatus}
                </div>
              )}

              <form onSubmit={handleSaveConsultation} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Consultation Title</label>
                  <input
                    type="text"
                    required
                    value={recordTitle}
                    onChange={(e) => setRecordTitle(e.target.value)}
                    className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none focus:border-[#17C964]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Record Type</label>
                    <select
                      value={recordType}
                      onChange={(e) => setRecordType(e.target.value as any)}
                      className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 outline-none"
                    >
                      <option value="PRESCRIPTION">Prescription</option>
                      <option value="DIAGNOSIS">Clinical Diagnosis</option>
                      <option value="LAB_REPORT">Lab Test Order</option>
                      <option value="IMAGING_SCAN">Imaging Scan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Symptoms</label>
                    <input
                      type="text"
                      placeholder="e.g. Fever, Cough"
                      value={symptomsInput}
                      onChange={(e) => setSymptomsInput(e.target.value)}
className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Clinical Diagnosis</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acute Upper Respiratory Infection"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Doctor Notes & Advice</label>
                  <textarea
                    rows={3}
                    required
                    value={doctorNotes}
                    onChange={(e) => setDoctorNotes(e.target.value)}
                    placeholder="Prescriptions, dosage instructions, and follow-up advice..."
                    className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl p-3 text-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#17C964] hover:bg-[#0EA653] text-white font-bold rounded-xl transition text-xs shadow-lg shadow-[#17C964]/30"
                >
                  Save & Link to Patient EHR
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
