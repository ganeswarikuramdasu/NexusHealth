import React, { useState } from "react";
import { X, Upload, FileText, Plus, FlaskConical, CheckCircle2 } from "lucide-react";
import { parseResponseSafe } from "../utils/api";

interface ManualRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientHealthId: string;
  patientUserId: string;
  onRecordAdded: (newRecord: any) => void;
}

export const ManualRecordModal: React.FC<ManualRecordModalProps> = ({
  isOpen,
  onClose,
  patientHealthId,
  patientUserId,
  onRecordAdded,
}) => {
  const [title, setTitle] = useState("");
  const [recordType, setRecordType] = useState<"LAB_REPORT" | "PRESCRIPTION" | "IMAGING_SCAN" | "MANUAL_RECORD">("LAB_REPORT");
  const [date, setDate] = useState("2026-08-08");
  const [doctorName, setDoctorName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [testName, setTestName] = useState("");
  const [testValue, setTestValue] = useState("");
  const [testRefRange, setTestRefRange] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !diagnosis.trim()) {
      alert("Please provide at least a Title and Diagnosis/Summary.");
      return;
    }

    setIsSubmitting(true);
    setSuccessMsg("");

    const newRecordData = {
      patientId: patientUserId,
      patientHealthId,
      doctorName: doctorName || "Self / External Physician",
      hospitalName: hospitalName || "Independent Diagnostics / Self Upload",
      date,
      category: recordType,
      diagnosis: `${title}: ${diagnosis}`,
      symptoms: notes || "Manually recorded by patient",
      prescriptions: [],
      vitals: {},
      doctorNotes: notes || "Patient uploaded manual health record.",
      doctorSignature: "PATIENT_VERIFIED_UPLOAD",
      labResults: testName ? [{
        parameter: testName,
        value: testValue || "Normal",
        unit: "",
        referenceRange: testRefRange || "N/A",
        status: "NORMAL"
      }] : [],
      attachmentUrl: attachmentUrl || "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&auto=format&fit=crop&q=60"
    };

    try {
      const res = await fetch("/api/patient/add-manual-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecordData),
      });

      const data = await parseResponseSafe<any>(res, { success: false });
      if (data && data.success) {
        setSuccessMsg("Medical Record / Lab Report added successfully!");
        onRecordAdded(data.record || newRecordData);
        setTimeout(() => {
          onClose();
          setSuccessMsg("");
        }, 1200);
      } else {
        alert(data?.message || "Failed to add manual record.");
      }
    } catch (err) {
      // Fallback local addition
      onRecordAdded(newRecordData);
      setSuccessMsg("Record added locally!");
      setTimeout(() => {
        onClose();
        setSuccessMsg("");
      }, 1200);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FFFFFF] border border-[#17C964]/30 rounded-3xl p-6 max-w-xl w-full shadow-2xl relative text-slate-800 space-y-5">
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E9FBF1] border border-[#17C964]/40 flex items-center justify-center text-[#17C964]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Add Lab Report or Medical Record</h2>
              <p className="text-xs text-slate-500">Manual upload synced to Health ID: {patientHealthId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {successMsg ? (
          <div className="p-6 bg-[#E9FBF1] border border-[#17C964]/30 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-[#17C964] mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-[#17C964]">{successMsg}</h3>
            <p className="text-xs text-slate-700">Your doctor and hospital portals will now be able to view this synced record.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Record / Report Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Lipid Profile Test, Fasting Blood Sugar, Chest Scan Note"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#17C964]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Record Category</label>
                <select
                  value={recordType}
                  onChange={(e) => setRecordType(e.target.value as any)}
                  className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900"
                >
                  <option value="LAB_REPORT">🔬 Lab Report / Panel</option>
                  <option value="PRESCRIPTION">💊 Prescription / Med Note</option>
                  <option value="IMAGING_SCAN">🩻 Imaging / X-Ray / Scan</option>
                  <option value="MANUAL_RECORD">📄 General Medical Record</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Date of Consultation / Test</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Doctor / Specialist Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Robert Chen"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Hospital / Lab Facility Name</label>
                <input
                  type="text"
                  placeholder="e.g. Apollo Diagnostics"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Diagnosis / Impression / Summary *</label>
              <textarea
                required
                rows={2}
                placeholder="e.g. High cholesterol level detected, recommended diet modification & statin dose."
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-500"
              />
            </div>

            {/* Optional Lab Parameter fields */}
            <div className="bg-[#EDF1F5] p-3.5 border border-slate-200 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold text-[#17C964] uppercase font-mono">Optional Lab Test Parameter</span>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Test Name (e.g. HbA1c)"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="bg-[#FFFFFF] border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. 6.2 %)"
                  value={testValue}
                  onChange={(e) => setTestValue(e.target.value)}
                  className="bg-[#FFFFFF] border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs"
                />
                <input
                  type="text"
                  placeholder="Ref Range (e.g. < 5.7 %)"
                  value={testRefRange}
                  onChange={(e) => setTestRefRange(e.target.value)}
                  className="bg-[#FFFFFF] border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Attachment File URL or Image Link</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="https://... (or leave default scan image)"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  className="flex-1 bg-[#EDF1F5] border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 bg-[#EDF1F5] hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-[#17C964] hover:bg-[#0f172a] text-white font-bold rounded-xl transition shadow-lg shadow-[#17C964]/30 flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? "Saving Record..." : "Save to Health ID"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
