import React, { useState } from "react";
import { MedicalRecord, PatientProfile } from "../types";
import { Search, FileText, User, Filter, Eye, ChevronRight, Lock, CheckCircle2 } from "lucide-react";

interface PatientRecordsTableProps {
  records: MedicalRecord[];
  patients: PatientProfile[];
  onSelectRecord?: (record: MedicalRecord) => void;
  doctorName: string;
  isDoctorScoped?: boolean;
}

export const PatientRecordsTable: React.FC<PatientRecordsTableProps> = ({
  records,
  patients,
  onSelectRecord,
  doctorName,
  isDoctorScoped = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [hospitalFilter, setHospitalFilter] = useState("");
  const [patientFilter, setPatientFilter] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [selectedRecordDetail, setSelectedRecordDetail] = useState<MedicalRecord | null>(null);

  const filteredRecords = records.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    const docF = doctorFilter.toLowerCase().trim();
    const hospF = hospitalFilter.toLowerCase().trim();
    const patF = patientFilter.toLowerCase().trim();

    const matchesQuery =
      !q ||
      (r.patientHealthId || "").toLowerCase().includes(q) ||
      (r.patientName || "").toLowerCase().includes(q) ||
      (r.diagnosis || "").toLowerCase().includes(q) ||
      (r.doctorName || "").toLowerCase().includes(q) ||
      (r.hospitalName || "").toLowerCase().includes(q) ||
      (r.notes || "").toLowerCase().includes(q);

    const matchesDoctor = !docF || (r.doctorName || "").toLowerCase().includes(docF);
    const matchesHospital = !hospF || (r.hospitalName || "").toLowerCase().includes(hospF);
    const matchesPatient =
      !patF ||
      (r.patientHealthId || "").toLowerCase().includes(patF) ||
      (r.patientName || "").toLowerCase().includes(patF);

    const matchesCat = filterCategory === "ALL" || (r.category && r.category === filterCategory);

    return matchesQuery && matchesDoctor && matchesHospital && matchesPatient && matchesCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-purple-400" />
            <span>{isDoctorScoped ? "Handled Patient EHR Records Archive" : "Master Patient EHR Database & Records Archive"}</span>
          </h2>
          <p className="text-xs text-slate-400">
            {isDoctorScoped
              ? `EHR consultations, clinical notes, and prescriptions handled and authored by ${doctorName || "Dr. Attending Physician"}`
              : "Searchable table of all consented patient records, lab diagnostic panels, and prescriptions across connected hospitals"}
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-purple-300 bg-purple-950/80 border border-purple-500/30 px-3 py-1.5 rounded-xl">
          <span>{isDoctorScoped ? "Handled Records" : "Accessible Records"}: {filteredRecords.length}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 bg-[#13192B] border border-slate-800 p-4 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Universal Search (Patient Health ID, Name, Diagnosis, Notes, Doctor, Hospital)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0D121F] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-medium outline-none focus:border-purple-500"
            >
              <option value="ALL">All Categories</option>
              <option value="LAB_REPORT">🧪 Lab Reports</option>
              <option value="PRESCRIPTION">💊 Prescriptions</option>
              <option value="IMAGING_SCAN">🩻 Imaging & Scans</option>
              <option value="MANUAL_RECORD">📋 Manual Records</option>
              <option value="Outpatient Consultation">🩺 Outpatient Consultations</option>
            </select>
          </div>
        </div>

        {/* Specific Multi-Column Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/80 text-xs">
          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1">Filter by Doctor Name:</label>
            <input
              type="text"
              placeholder="e.g. Dr. Rajesh Sharma"
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-1.5 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1">Filter by Hospital Facility:</label>
            <input
              type="text"
              placeholder="e.g. Apollo Hospital"
              value={hospitalFilter}
              onChange={(e) => setHospitalFilter(e.target.value)}
              className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-1.5 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-slate-400 mb-1">Filter by Patient Name / Unique Health ID:</label>
            <input
              type="text"
              placeholder="e.g. NH-IND-2026-PAT01 or Ananya"
              value={patientFilter}
              onChange={(e) => setPatientFilter(e.target.value)}
              className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-1.5 text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50"
            />
          </div>
        </div>
      </div>

      {/* Master Table */}
      <div className="bg-[#13192B] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Patient Health ID</th>
                <th className="py-3 px-3">Patient Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Diagnosis / Findings</th>
                <th className="py-3 px-3">Attending Physician</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-[#0D121F] transition">
                  <td className="py-3 px-3 text-slate-400 font-bold">{rec.date}</td>
                  <td className="py-3 px-3 font-bold text-cyan-400">{rec.patientHealthId}</td>
                  <td className="py-3 px-3 font-bold text-white">{rec.patientName || "John Doe"}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 bg-purple-950 border border-purple-500/30 text-purple-300 text-[10px] rounded font-bold">
                      {rec.category || "Consultation"}
                    </span>
                  </td>
                  <td className="py-3 px-3 max-w-xs truncate font-medium text-slate-200">{rec.diagnosis}</td>
                  <td className="py-3 px-3 text-slate-300">{rec.doctorName} ({rec.hospitalName || "Clinic"})</td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => {
                        setSelectedRecordDetail(rec);
                        if (onSelectRecord) onSelectRecord(rec);
                      }}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition text-[11px] inline-flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Record</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No matching patient records found in the database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Inspect Modal */}
      {selectedRecordDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#13192B] border border-purple-500/30 rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative text-white space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <span className="px-2.5 py-1 bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] font-bold rounded-md uppercase">
                  {selectedRecordDetail.category || "Consultation"}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">{selectedRecordDetail.diagnosis}</h3>
                <p className="text-xs text-purple-400 font-mono">Patient Health ID: {selectedRecordDetail.patientHealthId}</p>
              </div>
              <button
                onClick={() => setSelectedRecordDetail(null)}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#0D121F] p-3.5 border border-slate-800 rounded-2xl font-mono">
                <div>Date: <strong className="text-white">{selectedRecordDetail.date}</strong></div>
                <div>Attending Doctor: <strong className="text-white">{selectedRecordDetail.doctorName}</strong></div>
                <div>Facility: <strong className="text-white">{selectedRecordDetail.hospitalName || "Central Hospital"}</strong></div>
                <div>Digital Signature: <strong className="text-emerald-400">VERIFIED CLINICAL SIGN</strong></div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Clinical Symptoms & Findings</span>
                <div className="bg-[#0D121F] p-3 rounded-xl border border-slate-800 text-slate-200">
                  {selectedRecordDetail.symptoms || "Standard outpatient medical review."}
                </div>
              </div>

              {selectedRecordDetail.prescriptions && selectedRecordDetail.prescriptions.length > 0 && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Attached Prescriptions</span>
                  <div className="bg-[#0D121F] p-3 rounded-xl border border-slate-800 space-y-2 font-mono">
                    {selectedRecordDetail.prescriptions.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center border-b border-slate-800/60 pb-1">
                        <span className="text-cyan-300 font-bold">{p.medicationName}</span>
                        <span className="text-slate-400">{p.dosage} ({p.frequency}) - {p.durationDays} days</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRecordDetail.attachmentUrl && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Diagnostic Scan / Document Attachment</span>
                  <div className="rounded-xl overflow-hidden border border-slate-800 max-h-48">
                    <img
                      src={selectedRecordDetail.attachmentUrl}
                      alt="Medical Record Attachment"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRecordDetail(null)}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
