import React, { useState } from "react";
import { DoctorProfile, DaySchedule, DoctorLeave, ScheduleTimeSlot } from "../types";
import { EmergencyAbsenceModal } from "./EmergencyAbsenceModal";
import { parseResponseSafe } from "../utils/api";
import {
  User,
  Award,
  Calendar,
  Clock,
  ShieldCheck,
  Bell,
  Lock,
  Save,
  AlertTriangle,
  CheckCircle2,
  Siren,
  Plus,
  Trash2,
  RefreshCw,
  Info,
  Copy,
  ChevronRight
} from "lucide-react";

interface DoctorProfileSettingsProps {
  doctor: DoctorProfile;
  appointments?: any[];
  onUpdateDoctor: (updated: DoctorProfile) => void;
}

export const DoctorProfileSettings: React.FC<DoctorProfileSettingsProps> = ({
  doctor,
  appointments = [],
  onUpdateDoctor,
}) => {
  const [activeTab, setActiveTab] = useState<
    "PERSONAL" | "PROFESSIONAL" | "SCHEDULE" | "APPOINTMENT_RULES" | "LEAVE_EMERGENCY" | "NOTIFICATIONS" | "SECURITY"
  >("PERSONAL");

  // Local state initialized with doctor profile
  const [profileData, setProfileData] = useState<DoctorProfile>({ ...doctor });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  // Leave Form State
  const [leaveCategory, setLeaveCategory] = useState<"CASUAL" | "SICK" | "CONFERENCE" | "EMERGENCY" | "OTHER">("CASUAL");
  const [leaveStartDate, setLeaveStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [leaveEndDate, setLeaveEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [leaveIsFullDay, setLeaveIsFullDay] = useState(true);
  const [leaveReason, setLeaveReason] = useState("");
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  const updateField = (field: keyof DoctorProfile, val: any) => {
    setProfileData((prev) => ({ ...prev, [field]: val }));
    setHasUnsavedChanges(true);
  };

  const updateWeeklySchedule = (dayName: string, daySched: DaySchedule) => {
    setProfileData((prev) => ({
      ...prev,
      weeklySchedule: {
        ...(prev.weeklySchedule || {}),
        [dayName]: daySched,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      // 1. Save general profile
      const resProf = await fetch(`/api/doctors/${doctor.id}/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });
      const dataProf = await parseResponseSafe<any>(resProf, { success: false, message: "Failed to save profile." });

      // 2. Save schedule settings if weekly schedule updated
      if (profileData.weeklySchedule) {
        await fetch(`/api/doctors/${doctor.id}/schedule`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            weeklySchedule: profileData.weeklySchedule,
            slotDurationMin: profileData.slotDurationMin,
            slotBufferMin: profileData.slotBufferMin,
            tokensPerSlot: profileData.tokensPerSlot,
            dailyMaxAppointments: profileData.dailyMaxAppointments,
            bookingHorizonDays: profileData.bookingHorizonDays,
            bookingCutoffMins: profileData.bookingCutoffMins,
          }),
        });
      }

      if (dataProf && dataProf.success && dataProf.doctor) {
        onUpdateDoctor(dataProf.doctor);
        setHasUnsavedChanges(false);
        setSaveStatus({ type: "success", message: "Doctor profile and schedule updated successfully." });
      } else {
        setSaveStatus({ type: "error", message: dataProf?.message || "Failed to save profile." });
      }
    } catch (err: any) {
      setSaveStatus({ type: "error", message: err.message || "Network error saving profile." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) return;

    setIsSubmittingLeave(true);
    try {
      const res = await fetch(`/api/doctors/${doctor.id}/leaves`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: leaveStartDate,
          endDate: leaveEndDate,
          isFullDay: leaveIsFullDay,
          reason: `${leaveCategory}: ${leaveReason}`,
          category: leaveCategory,
        }),
      });
      const data = await parseResponseSafe<any>(res, { success: false, message: "Failed to apply leave." });
      if (data && data.success && data.doctor) {
        setProfileData(data.doctor);
        onUpdateDoctor(data.doctor);
        setLeaveReason("");
        setSaveStatus({ type: "success", message: "Leave application submitted successfully." });
      } else {
        setSaveStatus({ type: "error", message: data?.message || "Failed to apply leave." });
      }
    } catch (err: any) {
      setSaveStatus({ type: "error", message: err.message || "Error submitting leave." });
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  const handleDeleteLeave = async (leaveId: string) => {
    try {
      const res = await fetch(`/api/doctors/${doctor.id}/leaves/${leaveId}`, {
        method: "DELETE",
      });
      const data = await parseResponseSafe<any>(res, { success: false });
      if (data && data.success && data.doctor) {
        setProfileData(data.doctor);
        onUpdateDoctor(data.doctor);
        setSaveStatus({ type: "success", message: "Leave record cancelled." });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearEmergency = async () => {
    try {
      const res = await fetch(`/api/doctors/${doctor.id}/clear-emergency`, {
        method: "POST",
      });
      const data = await parseResponseSafe<any>(res, { success: false });
      if (data && data.success && data.doctor) {
        setProfileData(data.doctor);
        onUpdateDoctor(data.doctor);
        setSaveStatus({ type: "success", message: "Emergency unavailability cleared. Regular schedule restored." });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="space-y-6">
      
      {/* Save Status / Banner */}
      {saveStatus && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between font-medium ${
            saveStatus.type === "success"
              ? "bg-[#E9FBF1] border-[#17C964]/40 text-[#17C964]"
              : "bg-[#FDE9E3] border-[#F2603C]/40 text-[#C83E1E]"
          }`}
        >
          <div className="flex items-center space-x-2">
            {saveStatus.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-[#17C964] shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-[#F2603C] shrink-0" />
            )}
            <span>{saveStatus.message}</span>
          </div>
          <button onClick={() => setSaveStatus(null)} className="underline hover:opacity-80">
            Dismiss
          </button>
        </div>
      )}

      {hasUnsavedChanges && (
        <div className="bg-amber-50 border border-amber-500/40 p-4 rounded-2xl flex items-center justify-between text-xs text-amber-800 shadow-xl">
          <div className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-amber-600 shrink-0" />
            <span>You have unsaved changes in your profile or schedule settings.</span>
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      )}

      {/* Emergency Active Status Header if Emergency Absence is Active */}
      {profileData.availabilityStatus === "EMERGENCY_UNAVAILABLE" && (
        <div className="bg-[#F2603C] border border-[#C83E1E] p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3 text-xs">
            <Siren className="w-6 h-6 text-white/80 shrink-0 animate-bounce mt-0.5" />
            <div>
              <h3 className="font-bold text-white text-sm">🚨 Emergency Absence Currently Active</h3>
              <p className="text-white/85 mt-0.5">
                Reason: {profileData.emergencyAbsence?.reason || "Emergency"} | Period: {profileData.emergencyAbsence?.startDate} to {profileData.emergencyAbsence?.endDate}
              </p>
            </div>
          </div>
          <button
            onClick={handleClearEmergency}
            className="px-4 py-2 bg-white text-[#C83E1E] hover:bg-[#FDE9E3] font-bold rounded-xl text-xs transition"
          >
            Clear Emergency & Restore Schedule
          </button>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("PERSONAL")}
          className={`px-4 py-2.5 rounded-2xl border transition whitespace-nowrap flex items-center space-x-2 ${
            activeTab === "PERSONAL"
              ? "bg-[#17C964] text-white border-[#17C964] shadow-lg shadow-[#17C964]/40"
              : "bg-[#FFFFFF] text-slate-500 border-slate-200 hover:text-slate-900"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Personal Profile</span>
        </button>

        <button
          onClick={() => setActiveTab("PROFESSIONAL")}
          className={`px-4 py-2.5 rounded-2xl border transition whitespace-nowrap flex items-center space-x-2 ${
            activeTab === "PROFESSIONAL"
              ? "bg-[#17C964] text-white border-[#17C964] shadow-lg shadow-[#17C964]/40"
              : "bg-[#FFFFFF] text-slate-500 border-slate-200 hover:text-slate-900"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Professional Info</span>
        </button>

        <button
          onClick={() => setActiveTab("SCHEDULE")}
          className={`px-4 py-2.5 rounded-2xl border transition whitespace-nowrap flex items-center space-x-2 ${
            activeTab === "SCHEDULE"
              ? "bg-[#17C964] text-white border-[#17C964] shadow-lg shadow-[#17C964]/40"
              : "bg-[#FFFFFF] text-slate-500 border-slate-200 hover:text-slate-900"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Weekly Schedule</span>
        </button>

        <button
          onClick={() => setActiveTab("APPOINTMENT_RULES")}
          className={`px-4 py-2.5 rounded-2xl border transition whitespace-nowrap flex items-center space-x-2 ${
            activeTab === "APPOINTMENT_RULES"
              ? "bg-[#17C964] text-white border-[#17C964] shadow-lg shadow-[#17C964]/40"
              : "bg-[#FFFFFF] text-slate-500 border-slate-200 hover:text-slate-900"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Slot & Capacity Rules</span>
        </button>

        <button
          onClick={() => setActiveTab("LEAVE_EMERGENCY")}
          className={`px-4 py-2.5 rounded-2xl border transition whitespace-nowrap flex items-center space-x-2 ${
            activeTab === "LEAVE_EMERGENCY"
              ? "bg-[#F2603C] text-white border-[#F2603C] shadow-lg shadow-[#F2603C]/40"
              : "bg-[#FFFFFF] text-slate-500 border-slate-200 hover:text-slate-900"
          }`}
        >
          <Siren className="w-4 h-4 text-[#F2603C]" />
          <span>Leave & Emergency</span>
        </button>

        <button
          onClick={() => setActiveTab("NOTIFICATIONS")}
          className={`px-4 py-2.5 rounded-2xl border transition whitespace-nowrap flex items-center space-x-2 ${
            activeTab === "NOTIFICATIONS"
              ? "bg-[#17C964] text-white border-[#17C964] shadow-lg shadow-[#17C964]/40"
              : "bg-[#FFFFFF] text-slate-500 border-slate-200 hover:text-slate-900"
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications</span>
        </button>

        <button
          onClick={() => setActiveTab("SECURITY")}
          className={`px-4 py-2.5 rounded-2xl border transition whitespace-nowrap flex items-center space-x-2 ${
            activeTab === "SECURITY"
              ? "bg-[#17C964] text-white border-[#17C964] shadow-lg shadow-[#17C964]/40"
              : "bg-[#FFFFFF] text-slate-500 border-slate-200 hover:text-slate-900"
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security & Access</span>
        </button>
      </div>

      {/* TAB CONTENT: PERSONAL PROFILE */}
      {activeTab === "PERSONAL" && (
        <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Personal Information</h3>
              <p className="text-xs text-slate-500 mt-0.5">Manage your demographic details and personal statement</p>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="px-4 py-2 bg-[#17C964] hover:bg-[#0EA653] text-white font-bold rounded-xl text-xs flex items-center space-x-2 transition"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save Profile"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-500 mb-1 block">Full Name</label>
              <input
                type="text"
                value={profileData.name || ""}
                onChange={(e) => updateField("name", e.target.value)}
                className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#17C964]"
              />
            </div>

            <div>
              <label className="text-slate-500 mb-1 block">Contact Phone Number</label>
              <input
                type="text"
                value={profileData.phone || ""}
                onChange={(e) => updateField("phone", e.target.value)}
                className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#17C964]"
              />
            </div>

            <div>
              <label className="text-slate-500 mb-1 block">Email Address</label>
              <input
                type="email"
                value={profileData.email || ""}
                onChange={(e) => updateField("email", e.target.value)}
                className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#17C964]"
              />
            </div>

            <div>
              <label className="text-slate-500 mb-1 block">Gender</label>
              <select
                value={profileData.gender || "Male"}
                onChange={(e) => updateField("gender", e.target.value)}
                className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#17C964]"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-slate-500 mb-1 block">Date of Birth</label>
              <input
                type="date"
                value={profileData.dob || ""}
                onChange={(e) => updateField("dob", e.target.value)}
                className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#17C964]"
              />
            </div>

            <div>
              <label className="text-slate-500 mb-1 block">Profile Avatar Image URL</label>
              <input
                type="text"
                value={profileData.profilePhoto || ""}
                onChange={(e) => updateField("profilePhoto", e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#17C964]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-slate-500 mb-1 block">Residential Address</label>
              <input
                type="text"
                value={profileData.address || ""}
                onChange={(e) => updateField("address", e.target.value)}
                className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#17C964]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-slate-500 mb-1 block">Physician Statement / Biography</label>
              <textarea
                rows={3}
                value={profileData.bio || ""}
                onChange={(e) => updateField("bio", e.target.value)}
                placeholder="Brief clinical background and patient care philosophy..."
                className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-[#17C964]"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: PROFESSIONAL INFO */}
      {activeTab === "PROFESSIONAL" && (
        <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Professional Credentials & Hospital Alignment</h3>
              <p className="text-xs text-slate-500 mt-0.5">Specialization, credentials, consultation fee, and hospital department</p>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="px-4 py-2 bg-[#17C964] hover:bg-[#0EA653] text-white font-bold rounded-xl text-xs flex items-center space-x-2 transition"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save Professional Info"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-500 mb-1 block">Specialization</label>
              <input
                type="text"
                value={profileData.specialization || ""}
                onChange={(e) => updateField("specialization", e.target.value)}
                className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#17C964]"
              />
            </div>

            <div>
              <label className="text-slate-500 mb-1 block">Highest Qualification</label>
              <input
                type="text"
                value={profileData.qualification || ""}
                onChange={(e) => updateField("qualification", e.target.value)}
                className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#17C964]"
              />
            </div>

            <div>
              <label className="text-slate-500 mb-1 block flex items-center justify-between">
                <span>Medical Council Registration Number</span>
                <span className="text-[10px] text-amber-600 font-mono">✅ Verified</span>
              </label>
              <input
                type="text"
                value={profileData.licenseNumber || ""}
                onChange={(e) => updateField("licenseNumber", e.target.value)}
                className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono focus:outline-none focus:border-[#17C964]"
              />
            </div>

            <div>
              <label className="text-slate-500 mb-1 block">Years of Clinical Experience</label>
              <input
                type="number"
                value={profileData.experienceYears || 0}
                onChange={(e) => updateField("experienceYears", parseInt(e.target.value, 10) || 0)}
                className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#17C964]"
              />
            </div>

            <div>
              <label className="text-slate-500 mb-1 block">Designation</label>
              <input
                type="text"
                value={profileData.designation || ""}
                onChange={(e) => updateField("designation", e.target.value)}
                className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#17C964]"
              />
            </div>

            <div>
              <label className="text-slate-500 mb-1 block">Consultation Type</label>
              <select
                value={profileData.consultationType || "BOTH"}
                onChange={(e) => updateField("consultationType", e.target.value)}
                className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-[#17C964]"
              >
                <option value="IN_PERSON">In-Person Consultations Only</option>
                <option value="TELECONSULT">Teleconsultation / Virtual Only</option>
                <option value="BOTH">Both In-Person & Teleconsultation</option>
              </select>
            </div>

            <div>
              <label className="text-slate-500 mb-1 block">Consultation Fee (₹ INR)</label>
              <input
                type="number"
                value={profileData.fee || 500}
                onChange={(e) => updateField("fee", parseInt(e.target.value, 10) || 0)}
                className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono focus:outline-none focus:border-[#17C964]"
              />
            </div>

            <div>
              <label className="text-slate-500 mb-1 block font-semibold flex items-center space-x-1">
                <span>Associated Hospital</span>
                <span className="text-[10px] text-slate-500">(Admin Managed)</span>
              </label>
              <input
                type="text"
                value={profileData.hospitalName || "Apex Care Hospital"}
                disabled
                className="w-full bg-[#EDF1F5] border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: WEEKLY SCHEDULE */}
      {activeTab === "SCHEDULE" && (
        <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Weekly Working Schedule (Monday - Sunday)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Define active consultation days, shift working hours, and break windows
              </p>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="px-4 py-2 bg-[#17C964] hover:bg-[#0EA653] text-white font-bold rounded-xl text-xs flex items-center space-x-2 transition"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save Weekly Schedule"}</span>
            </button>
          </div>

          {/* Days Schedule Table */}
          <div className="space-y-4">
            {daysOfWeek.map((dayName) => {
              const daySched: DaySchedule = (profileData.weeklySchedule || {})[dayName] || {
                active: dayName !== "Sunday",
                slotDurationMin: profileData.slotDurationMin || 15,
                slotBufferMin: profileData.slotBufferMin || 5,
                tokensPerSlot: profileData.tokensPerSlot || 2,
                dailyMaxLimit: profileData.dailyMaxAppointments || 30,
                timeSlots: [
                  { id: "ts_m1", slotName: "Morning Shift", startTime: "09:00 AM", endTime: "01:00 PM" },
                  { id: "ts_a1", slotName: "Afternoon Shift", startTime: "02:00 PM", endTime: "05:00 PM" }
                ],
                breaks: [{ id: "b_1", breakName: "Lunch Break", startTime: "01:00 PM", endTime: "02:00 PM" }],
              };

              return (
                <div
                  key={dayName}
                  className={`p-4 rounded-2xl border transition ${
                    daySched.active
                      ? "bg-[#EDF1F5] border-slate-200"
                      : "bg-[#EDF1F5] border-slate-200/50 opacity-60"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    {/* Day Toggle */}
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={daySched.active}
                        onChange={(e) =>
                          updateWeeklySchedule(dayName, { ...daySched, active: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-[#17C964] focus:ring-[#17C964] bg-slate-100 border-slate-300"
                      />
                      <div>
                        <span className="font-bold text-sm text-slate-900">{dayName}</span>
                        <span className="text-[11px] text-slate-500 block font-mono">
                          {daySched.active ? `${daySched.timeSlots.length} Shift Window(s)` : "OFF / Unavailable"}
                        </span>
                      </div>
                    </div>

                    {/* Time Slots display */}
                    {daySched.active && (
                      <div className="flex-1 max-w-xl space-y-2 text-xs">
                        <div className="space-y-1.5 font-mono">
                          {daySched.timeSlots.map((ts, idx) => (
                            <div key={idx} className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={ts.startTime}
                                onChange={(e) => {
                                  const newTs = [...daySched.timeSlots];
                                  newTs[idx].startTime = e.target.value;
                                  updateWeeklySchedule(dayName, { ...daySched, timeSlots: newTs });
                                }}
                                className="w-24 bg-[#FFFFFF] border border-slate-300 rounded-lg px-2 py-1 text-slate-900 text-center"
                              />
                              <span className="text-slate-500">to</span>
                              <input
                                type="text"
                                value={ts.endTime}
                                onChange={(e) => {
                                  const newTs = [...daySched.timeSlots];
                                  newTs[idx].endTime = e.target.value;
                                  updateWeeklySchedule(dayName, { ...daySched, timeSlots: newTs });
                                }}
                                className="w-24 bg-[#FFFFFF] border border-slate-300 rounded-lg px-2 py-1 text-slate-900 text-center"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newTs = daySched.timeSlots.filter((_, i) => i !== idx);
                                  updateWeeklySchedule(dayName, { ...daySched, timeSlots: newTs });
                                }}
                                className="text-slate-500 hover:text-[#F2603C] p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const newTs = [
                              ...daySched.timeSlots,
                              { id: `ts_${Date.now()}`, slotName: "Shift Window", startTime: "05:00 PM", endTime: "08:00 PM" }
                            ];
                            updateWeeklySchedule(dayName, { ...daySched, timeSlots: newTs });
                          }}
                          className="text-[11px] text-[#17C964] hover:underline font-semibold flex items-center space-x-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Shift Period</span>
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: APPOINTMENT RULES */}
      {activeTab === "APPOINTMENT_RULES" && (
        <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Slot Duration, Buffer, & Token Capacity Rules</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure appointment granularity, token limits, and booking horizon
              </p>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="px-4 py-2 bg-[#17C964] hover:bg-[#0EA653] text-white font-bold rounded-xl text-xs flex items-center space-x-2 transition"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save Slot Rules"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            
            <div className="p-4 bg-[#EDF1F5] border border-slate-200 rounded-2xl space-y-2">
              <label className="text-slate-900 font-semibold block">Consultation Slot Duration</label>
              <p className="text-[11px] text-slate-500">Duration allocated for each patient consultation</p>
              <select
                value={profileData.slotDurationMin || 15}
                onChange={(e) => updateField("slotDurationMin", parseInt(e.target.value, 10))}
                className="w-full bg-[#FFFFFF] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
              >
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes (Standard)</option>
                <option value={20}>20 Minutes</option>
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>

            <div className="p-4 bg-[#EDF1F5] border border-slate-200 rounded-2xl space-y-2">
              <label className="text-slate-900 font-semibold block">Buffer Interval Between Slots</label>
              <p className="text-[11px] text-slate-500">Sanitization & documentation time between cases</p>
              <select
                value={profileData.slotBufferMin || 5}
                onChange={(e) => updateField("slotBufferMin", parseInt(e.target.value, 10))}
                className="w-full bg-[#FFFFFF] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
              >
                <option value={0}>0 Minutes (Back-to-back)</option>
                <option value={5}>5 Minutes (Recommended)</option>
                <option value={10}>10 Minutes</option>
                <option value={15}>15 Minutes</option>
              </select>
            </div>

            <div className="p-4 bg-[#EDF1F5] border border-slate-200 rounded-2xl space-y-2">
              <label className="text-slate-900 font-semibold block">Max Tokens per Time Slot</label>
              <p className="text-[11px] text-slate-500">Number of patients allowed in same slot window</p>
              <input
                type="number"
                min={1}
                max={10}
                value={profileData.tokensPerSlot || 2}
                onChange={(e) => updateField("tokensPerSlot", parseInt(e.target.value, 10) || 1)}
                className="w-full bg-[#FFFFFF] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
              />
            </div>

            <div className="p-4 bg-[#EDF1F5] border border-slate-200 rounded-2xl space-y-2">
              <label className="text-slate-900 font-semibold block">Daily Maximum Appointments Cap</label>
              <p className="text-[11px] text-slate-500">Total appointments ceiling across all shifts in a day</p>
              <input
                type="number"
                min={5}
                max={100}
                value={profileData.dailyMaxAppointments || 30}
                onChange={(e) => updateField("dailyMaxAppointments", parseInt(e.target.value, 10) || 30)}
                className="w-full bg-[#FFFFFF] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
              />
            </div>

            <div className="p-4 bg-[#EDF1F5] border border-slate-200 rounded-2xl space-y-2">
              <label className="text-slate-900 font-semibold block">Booking Horizon (Days in Advance)</label>
              <p className="text-[11px] text-slate-500">How far in advance patients can book slots</p>
              <input
                type="number"
                min={1}
                max={90}
                value={profileData.bookingHorizonDays || 30}
                onChange={(e) => updateField("bookingHorizonDays", parseInt(e.target.value, 10) || 30)}
                className="w-full bg-[#FFFFFF] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
              />
            </div>

            <div className="p-4 bg-[#EDF1F5] border border-slate-200 rounded-2xl space-y-2">
              <label className="text-slate-900 font-semibold block">Booking Cutoff Window (Minutes)</label>
              <p className="text-[11px] text-slate-500">Minimum notice before slot start for new bookings</p>
              <input
                type="number"
                min={0}
                max={240}
                value={profileData.bookingCutoffMins || 30}
                onChange={(e) => updateField("bookingCutoffMins", parseInt(e.target.value, 10) || 30)}
                className="w-full bg-[#FFFFFF] border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
              />
            </div>

          </div>
        </div>
      )}

      {/* TAB CONTENT: LEAVE & EMERGENCY */}
      {activeTab === "LEAVE_EMERGENCY" && (
        <div className="space-y-6">
          
          {/* Emergency Trigger Section */}
          <div className="bg-gradient-to-r from-[#FDE9E3] via-[#FFFFFF] to-[#FFFFFF] border border-[#F2603C]/50 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-start space-x-3 text-xs">
              <Siren className="w-8 h-8 text-[#F2603C] shrink-0 mt-1 animate-pulse" />
              <div>
                <h3 className="text-base font-bold text-[#C83E1E]">🚨 Immediate Emergency Unavailability Trigger</h3>
                <p className="text-slate-700 mt-1 max-w-xl">
                  In case of sudden hospital ER calls, personal emergencies, or acute illness, trigger an immediate emergency block. This instantly locks new bookings and safely handles existing scheduled patients.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowEmergencyModal(true)}
              className="px-5 py-3 bg-[#F2603C] hover:bg-[#E23A2E] text-white font-bold rounded-2xl text-xs flex items-center space-x-2 shadow-lg shadow-[#F2603C]/40 transition shrink-0"
            >
              <Siren className="w-4 h-4" />
              <span>Trigger Emergency Absence</span>
            </button>
          </div>

          {/* Leave Application Form */}
          <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-[#17C964]" />
              <span>Apply for Scheduled Planned Leave</span>
            </h3>

            <form onSubmit={handleApplyLeave} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-500 mb-1 block">Leave Category</label>
                <select
                  value={leaveCategory}
                  onChange={(e: any) => setLeaveCategory(e.target.value)}
                  className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900"
                >
                  <option value="CASUAL">Casual Leave</option>
                  <option value="SICK">Medical / Sick Leave</option>
                  <option value="CONFERENCE">Medical Conference / Academic</option>
                  <option value="EMERGENCY">Emergency Leave</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="flex items-center space-x-4 bg-[#EDF1F5] border border-slate-200 rounded-xl px-4 py-2 mt-5">
                <input
                  type="checkbox"
                  id="fullDay"
                  checked={leaveIsFullDay}
                  onChange={(e) => setLeaveIsFullDay(e.target.checked)}
                  className="w-4 h-4 rounded text-[#17C964]"
                />
                <label htmlFor="fullDay" className="text-slate-700 font-semibold cursor-pointer">
                  Full Day Leave
                </label>
              </div>

              <div>
                <label className="text-slate-500 mb-1 block">Start Date</label>
                <input
                  type="date"
                  value={leaveStartDate}
                  onChange={(e) => setLeaveStartDate(e.target.value)}
                  className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="text-slate-500 mb-1 block">End Date</label>
                <input
                  type="date"
                  value={leaveEndDate}
                  onChange={(e) => setLeaveEndDate(e.target.value)}
                  className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-slate-500 mb-1 block">Reason for Leave</label>
                <input
                  type="text"
                  placeholder="e.g., Attending National Cardiology Summit 2026..."
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900"
                  required
                />
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingLeave}
                  className="px-5 py-2.5 bg-[#17C964] hover:bg-[#0EA653] text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
                >
                  {isSubmittingLeave ? "Submitting..." : "Submit Leave Application"}
                </button>
              </div>
            </form>
          </div>

          {/* Existing Leaves List */}
          <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">Submitted Leave History</h3>

            {!profileData.leaves || profileData.leaves.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No leave records submitted.</p>
            ) : (
              <div className="space-y-2 text-xs font-mono">
                {profileData.leaves.map((l) => (
                  <div
                    key={l.id}
                    className="p-3.5 bg-[#EDF1F5] border border-slate-200 rounded-2xl flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{l.category || "LEAVE"}</span>
                        <span className="text-slate-500">({l.startDate} to {l.endDate})</span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">{l.reason}</p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-[10px] bg-[#E9FBF1] text-[#17C964] border border-[#17C964]/30 px-2 py-0.5 rounded-md">
                        {l.status}
                      </span>
                      <button
                        onClick={() => handleDeleteLeave(l.id)}
                        className="text-slate-500 hover:text-[#F2603C] p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB CONTENT: NOTIFICATIONS */}
      {activeTab === "NOTIFICATIONS" && (
        <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-base font-bold text-slate-900">Communication & Notification Preferences</h3>
            <p className="text-slate-500 mt-0.5">Configure real-time alerts for bookings, cancellations, and emergency notifications</p>
          </div>

          <div className="space-y-3 max-w-xl">
            <div className="p-4 bg-[#EDF1F5] border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Email Notifications</span>
                <span className="text-slate-500 text-[11px]">Receive daily schedule digests & appointment updates via email</span>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#17C964]" />
            </div>

            <div className="p-4 bg-[#EDF1F5] border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">SMS Alerts</span>
                <span className="text-slate-500 text-[11px]">Instant SMS for last-minute booking changes or emergency calls</span>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#17C964]" />
            </div>

            <div className="p-4 bg-[#EDF1F5] border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">WhatsApp Updates</span>
                <span className="text-slate-500 text-[11px]">Automated patient check-in notifications on WhatsApp</span>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-[#17C964]" />
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: SECURITY */}
      {activeTab === "SECURITY" && (
        <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
          <div className="border-b border-slate-200 pb-4">
            <h3 className="text-base font-bold text-slate-900">Security & Access Management</h3>
            <p className="text-slate-500 mt-0.5">Manage two-factor authentication, session timeouts, and clinical access logs</p>
          </div>

          <div className="space-y-4 max-w-xl">
            <div className="p-4 bg-[#EDF1F5] border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Two-Factor Authentication (2FA)</span>
                <span className="text-slate-500 text-[11px]">Require OTP verification upon signing in into NexusHealth</span>
              </div>
              <span className="px-2.5 py-1 bg-[#E9FBF1] text-[#17C964] border border-[#17C964]/30 rounded-lg text-[10px] font-bold">
                ACTIVE
              </span>
            </div>

            <div className="p-4 bg-[#EDF1F5] border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 block">Automatic Session Timeout</span>
                <span className="text-slate-500 text-[11px]">Lock clinical workstation after inactivity</span>
              </div>
              <select className="bg-[#FFFFFF] border border-slate-300 text-slate-900 rounded-xl px-3 py-1.5 font-mono">
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="60">60 Minutes</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Modal rendering */}
      {showEmergencyModal && (
        <EmergencyAbsenceModal
          doctor={doctor}
          appointments={appointments}
          onClose={() => setShowEmergencyModal(false)}
          onSuccess={(updatedDoc) => {
            setProfileData(updatedDoc);
            onUpdateDoctor(updatedDoc);
            setShowEmergencyModal(false);
            setSaveStatus({ type: "success", message: "Emergency unavailability activated immediately." });
          }}
        />
      )}

    </div>
  );
};
