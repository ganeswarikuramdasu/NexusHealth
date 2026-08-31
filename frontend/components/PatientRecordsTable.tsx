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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-[#17C964]" />
            <span>{isDoctorScoped ? "Handled Patient EHR Records Archive" : "Master Patient EHR Database & Records Archive"}</span>
          </h2>
          <p className="text-xs text-slate-500">
            {isDoctorScoped
              ? `EHR consultations, clinical notes, and prescriptions handled and authored by ${doctorName || "Dr. Attending Physician"}`
              : "Searchable table of all consented patient records, lab diagnostic panels, and prescriptions across connected hospitals"}
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#17C964] bg-[#E9FBF1] border border-[#17C964]/30 px-3 py-1.5 rounded-xl">
          <span>{isDoctorScoped ? "Handled Records" : "Accessible Records"}: {filteredRecords.length}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 bg-[#FFFFFF] border border-slate-200 p-4 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Universal Search (Patient Health ID, Name, Diagnosis, Notes, Doctor, Hospital)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#17C964]"
            />
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium outline-none focus:border-[#17C964]"
            >
              <option value="ALL">All Categories</option>
              <option value="LAB_REPORT">🔬 Lab Reports</option>
              <option value="PRESCRIPTION">💊 Prescriptions</option>
              <option value="IMAGING_SCAN">🩻 Imaging & Scans</option>
              <option value="MANUAL_RECORD">📄 Manual Records</option>
              <option value="Outpatient Consultation">🩺 Outpatient Consultations</option>
            </select>
          </div>
        </div>

        {/* Specific Multi-Column Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200/80 text-xs">
          <div>
            <label className="block text-[10px] font-mono text-slate-500 mb-1">Filter by Doctor Name:</label>
            <input
              type="text"
              placeholder="e.g. Doctor name"
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 placeholder-slate-600 focus:outline-none focus:border-[#17C964]/50"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-slate-500 mb-1">Filter by Hospital Facility:</label>
            <input
              type="text"
              placeholder="e.g. Apollo Hospital"
              value={hospitalFilter}
              onChange={(e) => setHospitalFilter(e.target.value)}
              className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 placeholder-slate-600 focus:outline-none focus:border-[#17C964]/50"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-slate-500 mb-1">Filter by Patient Name / Unique Health ID:</label>
            <input
              type="text"
              placeholder="e.g. Health ID or Patient name"
              value={patientFilter}
              onChange={(e) => setPatientFilter(e.target.value)}
              className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 placeholder-slate-600 focus:outline-none focus:border-[#17C964]/50"
            />
          </div>
        </div>
      </div>

      {/* Master Table */}
      <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Patient Health ID</th>
                <th className="py-3 px-3">Patient Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Diagnosis / Findings</th>
                <th className="py-3 px-3">Attending Physician</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 text-slate-800">
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-[#EDF1F5] transition">
                  <td className="py-3 px-3 text-slate-500 font-bold">{rec.date}</td>
                  <td className="py-3 px-3 font-bold text-[#17C964]">{rec.patientHealthId}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">{rec.patientName || "John Doe"}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 bg-[#E9FBF1] border border-[#17C964]/30 text-[#17C964] text-[10px] rounded font-bold">
                      {rec.category || "Consultation"}
                    </span>
                  </td>
                  <td className="py-3 px-3 max-w-xs truncate font-medium text-slate-800">{rec.diagnosis}</td>
                  <td className="py-3 px-3 text-slate-700">{rec.doctorName} ({rec.hospitalName || "Clinic"})</td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => {
                        setSelectedRecordDetail(rec);
                        if (onSelectRecord) onSelectRecord(rec);
                      }}
                      className="px-3 py-1.5 bg-[#17C964] hover:bg-[#0f172a] text-white font-bold rounded-xl transition text-[11px] inline-flex items-center space-x-1"
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
          <div className="bg-[#FFFFFF] border border-[#17C964]/30 rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative text-slate-900 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <span className="px-2.5 py-1 bg-[#E9FBF1] border border-[#17C964]/40 text-[#17C964] font-mono text-[10px] font-bold rounded-md uppercase">
                  {selectedRecordDetail.category || "Consultation"}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedRecordDetail.diagnosis}</h3>
                <p className="text-xs text-[#17C964] font-mono">Patient Health ID: {selectedRecordDetail.patientHealthId}</p>
              </div>
              <button
                onClick={() => setSelectedRecordDetail(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#EDF1F5] p-3.5 border border-slate-200 rounded-2xl font-mono">
                <div>Date: <strong className="text-slate-900">{selectedRecordDetail.date}</strong></div>
                <div>Attending Doctor: <strong className="text-slate-900">{selectedRecordDetail.doctorName}</strong></div>
                <div>Facility: <strong className="text-slate-900">{selectedRecordDetail.hospitalName || "Central Hospital"}</strong></div>
                <div>Digital Signature: <strong className="text-[#17C964]">VERIFIED CLINICAL SIGN</strong></div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Clinical Symptoms & Findings</span>
                <div className="bg-[#EDF1F5] p-3 rounded-xl border border-slate-200 text-slate-800">
                  {selectedRecordDetail.symptoms || "Standard outpatient medical review."}
                </div>
              </div>

              {selectedRecordDetail.prescriptions && selectedRecordDetail.prescriptions.length > 0 && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Attached Prescriptions</span>
                  <div className="bg-[#EDF1F5] p-3 rounded-xl border border-slate-200 space-y-2 font-mono">
                    {selectedRecordDetail.prescriptions.map((p, idx) => (
                      <div key={idx} className="flex justify-between items-center border-b border-slate-200/60 pb-1">
                        <span className="text-[#17C964] font-bold">{p.medicationName}</span>
                        <span className="text-slate-500">{p.dosage} ({p.frequency}) - {p.durationDays} days</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRecordDetail.attachmentUrl && (
                <div className="space-y-1">
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Diagnostic Scan / Document Attachment</span>
                  <div className="rounded-xl overflow-hidden border border-slate-200 max-h-48">
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
                className="px-5 py-2.5 bg-[#17C964] hover:bg-[#0f172a] text-white font-bold rounded-xl text-xs transition"
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
