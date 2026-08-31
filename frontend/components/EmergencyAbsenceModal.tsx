import React, { useState } from "react";
import { DoctorProfile, Appointment } from "../types";
import { Siren, AlertTriangle, Calendar, Clock, CheckCircle2, X } from "lucide-react";
import { parseResponseSafe } from "../utils/api";

interface EmergencyAbsenceModalProps {
  doctor: DoctorProfile;
  appointments: Appointment[];
  onClose: () => void;
  onSuccess: (updatedDoctor: DoctorProfile) => void;
}

export const EmergencyAbsenceModal: React.FC<EmergencyAbsenceModalProps> = ({
  doctor,
  appointments,
  onClose,
  onSuccess,
}) => {
  const todayStr = new Date().toISOString().split("T")[0];
  const [dateOption, setDateOption] = useState<"TODAY" | "TOMORROW" | "CUSTOM">("TODAY");
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:59");
  const [isPartial, setIsPartial] = useState(false);
  const [reasonCategory, setReasonCategory] = useState("Medical Emergency");
  const [customReason, setCustomReason] = useState("");
  const [actionTaken, setActionTaken] = useState<"CANCEL" | "RESCHEDULE" | "KEEP">("CANCEL");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDateOptionChange = (option: "TODAY" | "TOMORROW" | "CUSTOM") => {
    setDateOption(option);
    if (option === "TODAY") {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (option === "TOMORROW") {
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
      setStartDate(tomorrow);
      setEndDate(tomorrow);
    }
  };

  // Find affected appointments
  const affectedAppointments = (appointments || []).filter((apt) => {
    if (!apt) return false;
    const matchDoc = apt.doctorId === doctor.id || (apt.doctorName && doctor.name && apt.doctorName.toLowerCase().includes(doctor.name.toLowerCase()));
    if (!matchDoc) return false;
    if (["CANCELLED", "COMPLETED", "NO_SHOW"].includes(apt.status)) return false;

    const aptDate = apt.appointmentDate;
    if (aptDate >= startDate && aptDate <= endDate) {
      return true;
    }
    return false;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const finalReason = customReason.trim() ? `${reasonCategory}: ${customReason}` : reasonCategory;

    try {
      const res = await fetch(`/api/doctors/${doctor.id}/emergency-unavailability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          startTime: isPartial ? startTime : "00:00",
          endTime: isPartial ? endTime : "23:59",
          reason: finalReason,
          actionTaken
        }),
      });

      const data = await parseResponseSafe<any>(res, { success: false, message: "Failed to activate emergency unavailability." });
      if (data && data.success && data.doctor) {
        onSuccess(data.doctor);
      } else {
        setError(data?.message || "Failed to activate emergency unavailability.");
      }
    } catch (err: any) {
      setError(err.message || "Network error activating emergency unavailability.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#FFFFFF] border border-[#F2603C]/40 w-full max-w-xl rounded-3xl p-6 space-y-6 shadow-2xl relative overflow-hidden">
        
        {/* Top Warning Banner */}
        <div className="bg-[#FDE9E3] border border-[#F2603C]/30 p-4 rounded-2xl flex items-start space-x-3">
          <Siren className="w-6 h-6 text-[#F2603C] shrink-0 mt-0.5 animate-pulse" />
          <div>
            <h2 className="text-base font-bold text-[#C83E1E]">🚨 Immediate Emergency Unavailability</h2>
            <p className="text-xs text-[#C83E1E] mt-0.5">
              Activating emergency mode immediately blocks new appointment bookings for the selected window. Existing bookings will be processed safely.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-[#FDE9E3] border border-[#F2603C]/50 text-[#C83E1E] text-xs rounded-xl flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-[#F2603C] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Quick Date Selector */}
          <div className="space-y-2">
            <label className="text-slate-700 font-medium block">Select Unavailable Period</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDateOptionChange("TODAY")}
                className={`py-2.5 px-3 rounded-xl border text-center font-semibold transition ${
                  dateOption === "TODAY"
                    ? "bg-[#F2603C] text-white border-[#F2603C]"
                    : "bg-[#EDF1F5] text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
              >
                Today ({todayStr})
              </button>
              <button
                type="button"
                onClick={() => handleDateOptionChange("TOMORROW")}
                className={`py-2.5 px-3 rounded-xl border text-center font-semibold transition ${
                  dateOption === "TOMORROW"
                    ? "bg-[#F2603C] text-white border-[#F2603C]"
                    : "bg-[#EDF1F5] text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => handleDateOptionChange("CUSTOM")}
                className={`py-2.5 px-3 rounded-xl border text-center font-semibold transition ${
                  dateOption === "CUSTOM"
                    ? "bg-[#F2603C] text-white border-[#F2603C]"
                    : "bg-[#EDF1F5] text-slate-700 border-slate-200 hover:border-slate-300"
                }`}
              >
                Custom Range
              </button>
            </div>
          </div>

          {dateOption === "CUSTOM" && (
            <div className="grid grid-cols-2 gap-3 bg-[#EDF1F5] p-3 rounded-2xl border border-slate-200">
              <div>
                <label className="text-slate-500 mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  required
                />
              </div>
              <div>
                <label className="text-slate-500 mb-1 block">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  required
                />
              </div>
            </div>
          )}

          {/* Partial Day Toggle */}
          <div className="flex items-center justify-between bg-[#EDF1F5] p-3 rounded-2xl border border-slate-200">
            <div>
              <span className="font-semibold text-slate-900 block">Partial Day Unavailability</span>
              <span className="text-[11px] text-slate-500">Mark only specific hours as unavailable (e.g., 11:00 AM onward)</span>
            </div>
            <input
              type="checkbox"
              checked={isPartial}
              onChange={(e) => setIsPartial(e.target.checked)}
              className="w-4 h-4 rounded text-[#F2603C] focus:ring-[#F2603C] bg-slate-100 border-slate-300"
            />
          </div>

          {isPartial && (
            <div className="grid grid-cols-2 gap-3 bg-[#EDF1F5] p-3 rounded-2xl border border-slate-200">
              <div>
                <label className="text-slate-500 mb-1 block">Unavailable From</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>
              <div>
                <label className="text-slate-500 mb-1 block">Unavailable To</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>
            </div>
          )}

          {/* Reason Category */}
          <div className="space-y-2">
            <label className="text-slate-700 font-medium block">Reason Category</label>
            <select
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 outline-none focus:border-[#F2603C]"
            >
              <option value="Medical Emergency">🚨 Medical Emergency</option>
              <option value="Personal Emergency">🚨 Personal / Family Emergency</option>
              <option value="Hospital ER Duty">🚨 Urgent Hospital ER Duty</option>
              <option value="Unscheduled Surgery">🚨 Unscheduled Emergency Surgery</option>
              <option value="Travel Delay">✈️ Unexpected Travel / Transport Delay</option>
            </select>
          </div>

          <div>
            <label className="text-slate-500 mb-1 block">Optional Details (Internal Audit Note)</label>
            <input
              type="text"
              placeholder="e.g., Sudden acute illness, required for trauma ER call..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-500 focus:outline-none focus:border-[#F2603C]"
            />
          </div>

          {/* Affected Appointments Inspection */}
          <div className="p-4 bg-[#EDF1F5] border border-amber-500/30 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-700 flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Existing Booked Appointments</span>
              </span>
              <span className="bg-amber-50 text-amber-700 border border-amber-500/40 px-2.5 py-1 rounded-lg font-mono font-bold">
                {affectedAppointments.length} Affected
              </span>
            </div>

            {affectedAppointments.length > 0 ? (
              <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1 text-[11px] text-slate-700 font-mono">
                {affectedAppointments.map((apt) => (
                  <div key={apt.id} className="p-2 bg-[#FFFFFF] rounded-xl flex items-center justify-between border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-900">{apt.tokenNumber}</span> - {apt.patientName} ({apt.slotTime})
                    </div>
                    <span className="text-[10px] text-slate-500">{apt.appointmentDate}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-[11px]">No existing booked appointments fall within this time period.</p>
            )}

            {affectedAppointments.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="text-slate-700 font-semibold block">Action for Affected Appointments</label>
                <div className="space-y-1.5">
                  <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="action"
                      value="CANCEL"
                      checked={actionTaken === "CANCEL"}
                      onChange={() => setActionTaken("CANCEL")}
                      className="text-[#F2603C] focus:ring-[#F2603C]"
                    />
                    <span>Cancel affected appointments & notify patients via Nexus Health Feed</span>
                  </label>
                  <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="action"
                      value="RESCHEDULE"
                      checked={actionTaken === "RESCHEDULE"}
                      onChange={() => setActionTaken("RESCHEDULE")}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <span>Flag as 'Reschedule Required' & request patient slot rebooking</span>
                  </label>
                  <label className="flex items-center space-x-2 text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="action"
                      value="KEEP"
                      checked={actionTaken === "KEEP"}
                      onChange={() => setActionTaken("KEEP")}
                      className="text-slate-500 focus:ring-slate-400"
                    />
                    <span>Keep existing appointments (Block new bookings only)</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#F2603C] hover:bg-[#E23A2E] text-white font-bold flex items-center space-x-2 shadow-lg shadow-[#F2603C]/40 transition disabled:opacity-50"
            >
              <Siren className="w-4 h-4" />
              <span>{isSubmitting ? "Activating..." : "Confirm Emergency Block"}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
