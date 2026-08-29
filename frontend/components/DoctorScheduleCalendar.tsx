import React, { useState, useEffect } from "react";
import { DoctorProfile, Appointment, AvailableSlot } from "../types";
import { safeFetchJson, parseResponseSafe } from "../utils/api";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Siren,
  Coffee,
  Check,
  XCircle,
  FileText,
  Plus,
  Trash2
} from "lucide-react";

interface DoctorScheduleCalendarProps {
  doctor: DoctorProfile;
  appointments: Appointment[];
  onRefreshData?: () => void;
}

export const DoctorScheduleCalendar: React.FC<DoctorScheduleCalendarProps> = ({
  doctor,
  appointments,
  onRefreshData,
}) => {
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsMessage, setSlotsMessage] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  // Fetch Available Slots for selected date
  const fetchDateSlots = async (dateStr: string) => {
    setIsLoadingSlots(true);
    setSlotsMessage(null);
    try {
      const data = await safeFetchJson<any>(`/api/appointments/available-slots?doctorId=${doctor.id}&date=${dateStr}`, undefined, { success: false, slots: [] });
      if (data?.success) {
        setAvailableSlots(data.slots || []);
        if (data.slots.length === 0 && data.message) {
          setSlotsMessage(data.message);
        }
      } else {
        setAvailableSlots([]);
        setSlotsMessage(data?.message || "No slots available for selected date.");
      }
    } catch (err) {
      setSlotsMessage("Failed to load availability for this date.");
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Fetch Analytics
  const fetchAnalytics = async () => {
    try {
      const data = await safeFetchJson<any>(`/api/doctors/${doctor.id}/analytics`, undefined, null);
      if (data) setAnalytics(data);
    } catch (err) {
      console.error("Failed to fetch doctor analytics", err);
    }
  };

  const [isTogglingActive, setIsTogglingActive] = useState(false);
  const [activeDoctorStatus, setActiveDoctorStatus] = useState(doctor.activeStatus || doctor.availabilityStatus || "ACTIVE");
  const [activeToggleMessage, setActiveToggleMessage] = useState<string | null>(null);

  // Status Scope & Emergency Absence State
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusScope, setStatusScope] = useState<"TODAY" | "TOMORROW" | "THIS_WEEK" | "SPECIFIC_DATE" | "ALL_UPCOMING">("TODAY");
  const [statusSpecificDate, setStatusSpecificDate] = useState(todayStr);
  const [statusActionType, setStatusActionType] = useState<"CANCEL" | "REBOOK">("CANCEL");
  const [statusReason, setStatusReason] = useState("Sudden Emergency Callout / Personal Unavailability");

  // Custom Preferred Slots State
  const [customSlots, setCustomSlots] = useState<any[]>(doctor.customPreferredSlots || []);
  const [showAddCustomSlotModal, setShowAddCustomSlotModal] = useState(false);
  const [cSlotName, setCSlotName] = useState("Specialist Consultation Session");
  const [cDayName, setCDayName] = useState("Monday");
  const [cStartTime, setCStartTime] = useState("08:00 AM");
  const [cEndTime, setCEndTime] = useState("09:30 AM");
  const [cTokensMax, setCTokensMax] = useState("5");
  const [cCustomFee, setCCustomFee] = useState(String(doctor.fee || 500));
  const [cNotes, setCNotes] = useState("");
  const [isAddingCSlot, setIsAddingCSlot] = useState(false);

  // Toggle Doctor Active / Inactive Status with Scope
  const handleApplyActiveStatusChange = async (targetNextStatus: "ACTIVE" | "INACTIVE") => {
    setIsTogglingActive(true);
    setActiveToggleMessage(null);
    try {
      const res = await fetch(`/api/doctors/${doctor.id}/toggle-active`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activeStatus: targetNextStatus,
          targetScope: statusScope,
          specificDate: statusSpecificDate,
          actionType: statusActionType,
          reason: statusReason,
        }),
      });
      const data = await parseResponseSafe<any>(res, { success: false });
      if (data && data.success) {
        const newSt = data.doctor.activeStatus || data.doctor.availabilityStatus || targetNextStatus;
        setActiveDoctorStatus(newSt);
        setActiveToggleMessage(data.message);
        setShowStatusModal(false);
        fetchDateSlots(selectedDate);
        if (onRefreshData) onRefreshData();
      } else {
        alert(data?.message || "Failed to update doctor active status.");
      }
    } catch (err) {
      alert("Error updating active status.");
    } finally {
      setIsTogglingActive(false);
    }
  };

  // Add Custom Preferred Slot
  const handleAddCustomSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cStartTime || !cEndTime) {
      alert("Start time and end time are required.");
      return;
    }

    setIsAddingCSlot(true);
    try {
      const res = await fetch(`/api/doctors/${doctor.id}/custom-slots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotName: cSlotName,
          dayName: cDayName,
          startTime: cStartTime,
          endTime: cEndTime,
          tokensMax: cTokensMax,
          customFee: cCustomFee,
          notes: cNotes,
        }),
      });
      const data = await parseResponseSafe<any>(res, { success: false });
      if (data && data.success && data.customPreferredSlots) {
        setCustomSlots(data.customPreferredSlots);
        setShowAddCustomSlotModal(false);
        fetchDateSlots(selectedDate);
        alert(`Custom preferred slot '${cSlotName}' added!`);
      } else {
        alert(data?.message || "Failed to add custom slot.");
      }
    } catch (err) {
      alert("Error adding custom slot.");
    } finally {
      setIsAddingCSlot(false);
    }
  };

  // Delete Custom Preferred Slot
  const handleDeleteCustomSlot = async (slotId: string) => {
    try {
      const res = await fetch(`/api/doctors/${doctor.id}/custom-slots/${slotId}`, {
        method: "DELETE",
      });
      const data = await parseResponseSafe<any>(res, { success: false });
      if (data && data.success) {
        setCustomSlots(data.customPreferredSlots || []);
        fetchDateSlots(selectedDate);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDateSlots(selectedDate);
    fetchAnalytics();
  }, [selectedDate, doctor.id]);

  // Appointments on selected date
  const dateAppointments = (appointments || []).filter(
    (a) => (a.doctorId === doctor.id || a.doctorName === doctor.name) && a.appointmentDate === selectedDate
  );

  const activeBookingsCount = dateAppointments.filter((a) => !["CANCELLED", "NO_SHOW"].includes(a.status)).length;
  const maxDailyCapacity = doctor.dailyMaxAppointments || 30;

  // Next 7 days schedule helper
  const getNext7Days = () => {
    const days = [];
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.now() + i * 86400000);
      const dStr = d.toISOString().split("T")[0];
      const dayName = daysOfWeek[d.getDay()];
      const daySched = (doctor.weeklySchedule || {})[dayName];
      const active = daySched ? daySched.active : false;
      days.push({ dateStr: dStr, dayName, active, daySched });
    }
    return days;
  };

  const next7 = getNext7Days();

  return (
    <div className="space-y-6">
      {/* Doctor Active / Inactive Practice Control Banner */}
      <div className={`p-5 rounded-3xl border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition ${
        activeDoctorStatus === "INACTIVE" || activeDoctorStatus === "NOT_ACTIVE"
          ? "bg-gradient-to-r from-red-950/90 via-rose-950/80 to-slate-950 border-red-500/50 text-red-200"
          : "bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-slate-950 border-emerald-500/40 text-emerald-200"
      }`}>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className={`px-2.5 py-0.5 font-mono text-[10px] font-bold rounded-md uppercase border ${
              activeDoctorStatus === "INACTIVE" || activeDoctorStatus === "NOT_ACTIVE"
                ? "bg-red-900 border-red-400 text-white"
                : "bg-emerald-900 border-emerald-400 text-white"
            }`}>
              {activeDoctorStatus === "INACTIVE" || activeDoctorStatus === "NOT_ACTIVE" ? "PRACTICE PAUSED / NOT ACTIVE" : "PRACTICE ACTIVE & BOOKING OPEN"}
            </span>
            <span className="text-xs text-slate-400 font-mono">Doctor Final Say Override</span>
          </div>
          <h3 className="text-base font-bold text-white">
            {activeDoctorStatus === "INACTIVE" || activeDoctorStatus === "NOT_ACTIVE"
              ? "You are currently NOT ACTIVE. All patient appointments are cancelled and bookings are blocked."
              : "Doctor Status: ACTIVE — Patients can book preferred consultation slots."}
          </h3>
          {activeToggleMessage && (
            <p className="text-xs font-mono font-bold text-amber-300">{activeToggleMessage}</p>
          )}
        </div>

        <button
          onClick={() => setShowStatusModal(true)}
          className={`px-5 py-2.5 font-bold rounded-2xl text-xs transition shadow-lg shrink-0 flex items-center space-x-2 border ${
            activeDoctorStatus === "INACTIVE" || activeDoctorStatus === "NOT_ACTIVE"
              ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-emerald-900/40"
              : "bg-red-600 hover:bg-red-500 text-white border-red-400 shadow-red-900/40"
          }`}
        >
          {activeDoctorStatus === "INACTIVE" || activeDoctorStatus === "NOT_ACTIVE" ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>MANAGE STATUS (Resume Practice / Set Active)</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4" />
              <span>MANAGE STATUS (Set Not Active / Emergency Absence)</span>
            </>
          )}
        </button>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#13192B] border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <span>Physician Schedule & Availability Calendar</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live capacity calculation, working shifts, breaks, and date-specific slot inspector
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              fetchDateSlots(selectedDate);
              if (onRefreshData) onRefreshData();
            }}
            className="px-3.5 py-2 bg-[#0D121F] border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-slate-300 font-medium flex items-center space-x-2 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Refresh Availability</span>
          </button>
        </div>
      </div>

      {/* Date Inspector & Slots Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Date Selector & Day Overview */}
        <div className="space-y-6">
          
          {/* Selected Date Picker Card */}
          <div className="bg-[#13192B] border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span>Inspect Date Schedule</span>
              <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                {selectedDate === todayStr ? "TODAY" : selectedDate}
              </span>
            </h3>

            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">Select Calendar Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-[#0D121F] border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            {/* Daily Capacity Progress */}
            <div className="p-4 bg-[#0D121F] border border-slate-800/80 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">Daily Token Capacity</span>
                <span className="font-mono font-bold text-white">
                  {activeBookingsCount} / {maxDailyCapacity} Booked
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    activeBookingsCount >= maxDailyCapacity
                      ? "bg-red-500"
                      : activeBookingsCount > maxDailyCapacity * 0.8
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(100, (activeBookingsCount / maxDailyCapacity) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0 Tokens</span>
                <span>{maxDailyCapacity} Max Limit</span>
              </div>
            </div>

            {/* Quick Date Shortcuts */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setSelectedDate(todayStr)}
                className={`py-2 rounded-xl border text-center font-medium transition ${
                  selectedDate === todayStr
                    ? "bg-emerald-600 text-white border-emerald-500"
                    : "bg-[#0D121F] text-slate-300 border-slate-800 hover:border-slate-700"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setSelectedDate(new Date(Date.now() + 86400000).toISOString().split("T")[0])}
                className={`py-2 rounded-xl border text-center font-medium transition ${
                  selectedDate === new Date(Date.now() + 86400000).toISOString().split("T")[0]
                    ? "bg-emerald-600 text-white border-emerald-500"
                    : "bg-[#0D121F] text-slate-300 border-slate-800 hover:border-slate-700"
                }`}
              >
                Tomorrow
              </button>
            </div>
          </div>

          {/* Next 7 Days Overview Card */}
          <div className="bg-[#13192B] border border-slate-800 rounded-3xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Upcoming 7-Day Schedule</span>
            </h3>

            <div className="space-y-2 text-xs font-mono">
              {next7.map((item) => (
                <div
                  key={item.dateStr}
                  onClick={() => setSelectedDate(item.dateStr)}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                    selectedDate === item.dateStr
                      ? "bg-emerald-950/60 border-emerald-500/50 text-white"
                      : "bg-[#0D121F] border-slate-800 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="font-bold text-slate-200">{item.dayName}</span>
                    <span className="text-[10px] text-slate-500">{item.dateStr}</span>
                  </div>
                  <div>
                    {item.active ? (
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold">
                        ACTIVE
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-900 text-slate-500 border border-slate-800 px-2 py-0.5 rounded-md">
                        OFF
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (2 cols wide): Live Time Slots Grid & Appointments */}
        <div className="lg:col-span-2 space-y-6">

          {/* Time Slots Grid */}
          <div className="bg-[#13192B] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>Time Slots & Real-Time Token Capacity</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Slot Duration: <span className="text-emerald-400 font-mono font-bold">{doctor.slotDurationMin || 15} mins</span> | Buffer: <span className="text-emerald-400 font-mono font-bold">{doctor.slotBufferMin || 5} mins</span> | Tokens/Slot: <span className="text-emerald-400 font-mono font-bold">{doctor.tokensPerSlot || 2}</span>
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-slate-300 bg-[#0D121F] border border-slate-800 px-3 py-1.5 rounded-xl">
                {availableSlots.length} Slots Generated
              </span>
            </div>

            {isLoadingSlots ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 mx-auto" />
                <p className="text-xs">Calculating real-time slot capacities...</p>
              </div>
            ) : slotsMessage ? (
              <div className="p-8 text-center bg-[#0D121F] border border-slate-800 rounded-2xl text-slate-400 text-xs space-y-2">
                <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto" />
                <p className="font-semibold text-slate-200">{slotsMessage}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableSlots.map((slot, idx) => {
                  let badgeBg = "bg-emerald-950 text-emerald-300 border-emerald-500/30";
                  let statusText = `${slot.tokensLeft} Left`;

                  if (slot.status === "FULL") {
                    badgeBg = "bg-red-950 text-red-300 border-red-500/30";
                    statusText = "FULL";
                  } else if (slot.status === "BREAK") {
                    badgeBg = "bg-amber-950 text-amber-300 border-amber-500/30";
                    statusText = "BREAK";
                  } else if (slot.status === "PAST") {
                    badgeBg = "bg-slate-900 text-slate-500 border-slate-800";
                    statusText = "PAST";
                  } else if (slot.status === "DAILY_MAX_REACHED") {
                    badgeBg = "bg-purple-950 text-purple-300 border-purple-500/30";
                    statusText = "MAX REACHED";
                  }

                  return (
                    <div
                      key={idx}
                      className="p-3.5 bg-[#0D121F] border border-slate-800 rounded-2xl space-y-2 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-white">{slot.timeStr}</span>
                        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md border ${badgeBg}`}>
                          {statusText}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400 flex justify-between font-mono">
                        <span>Window: {slot.displayWindow.split("-")[1]?.trim() || slot.timeStr}</span>
                        <span>{slot.bookedCount}/{slot.maxCapacity} Booked</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Booked Appointments for Selected Date */}
          <div className="bg-[#13192B] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Booked Appointments on {selectedDate}</span>
              </span>
              <span className="text-xs font-mono font-bold text-purple-400 bg-purple-950 border border-purple-500/30 px-3 py-1 rounded-xl">
                {dateAppointments.length} Tokens Issued
              </span>
            </h3>

            {dateAppointments.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs bg-[#0D121F] rounded-2xl border border-slate-800/80">
                No appointments booked for this date yet.
              </div>
            ) : (
              <div className="space-y-2.5 font-mono text-xs">
                {dateAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-3.5 bg-[#0D121F] border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-700 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-emerald-400 text-sm">{apt.tokenNumber}</span>
                        <span className="text-white font-semibold">{apt.patientName}</span>
                        <span className="text-[10px] text-slate-400">({apt.patientHealthId})</span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center space-x-3">
                        <span>Time: {apt.slotTime}</span>
                        <span>Type: {apt.appointmentType || "Routine"}</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center space-x-2">
                      <span className={`px-2.5 py-1 rounded-xl border text-[10px] font-bold ${
                        apt.status === "COMPLETED"
                          ? "bg-emerald-950 text-emerald-400 border-emerald-500/30"
                          : apt.status === "CANCELLED"
                          ? "bg-red-950 text-red-400 border-red-500/30"
                          : "bg-blue-950 text-blue-400 border-blue-500/30"
                      }`}>
                        {apt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DOCTOR PREFERRED CUSTOM SLOTS CARD */}
          <div className="bg-[#13192B] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Coffee className="w-4 h-4 text-cyan-400" />
                  <span>Doctor Preferred Custom Slots & Tokens</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Set specific preferred consultation times, token limits, and fees overriding default auto-generated schedules
                </p>
              </div>

              <button
                onClick={() => setShowAddCustomSlotModal(true)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition flex items-center space-x-1.5 shadow-lg shadow-cyan-900/30 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Preferred Custom Slot</span>
              </button>
            </div>

            {customSlots.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs bg-[#0D121F] rounded-2xl border border-slate-800/80">
                No custom preferred slots defined yet. Click "+ Add Preferred Custom Slot" above to set your custom consultation hours and token limits.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                {customSlots.map((cs) => (
                  <div
                    key={cs.id}
                    className="p-4 bg-[#0D121F] border border-slate-800 hover:border-cyan-500/40 rounded-2xl space-y-2 relative group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-2 py-0.5 bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold rounded text-[10px] uppercase">
                          {cs.dayName || "RECURRING"}
                        </span>
                        <h4 className="font-bold text-white text-xs mt-1">{cs.slotName}</h4>
                      </div>
                      <button
                        onClick={() => handleDeleteCustomSlot(cs.id)}
                        title="Delete custom slot"
                        className="text-slate-500 hover:text-red-400 p-1 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-slate-300 text-[11px] pt-1 border-t border-slate-800/80">
                      <span>Time: <strong className="text-cyan-400">{cs.startTime} - {cs.endTime}</strong></span>
                      <span>Max Tokens: <strong className="text-purple-400">{cs.tokensMax}</strong></span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Fee: ₹{cs.customFee || doctor.fee || 500}</span>
                      {cs.notes && <span className="truncate max-w-[150px]">{cs.notes}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Schedule Analytics Card */}
          {analytics && (
            <div className="bg-[#13192B] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>Doctor Schedule & Utilization Analytics</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3.5 bg-[#0D121F] border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-slate-400 text-[10px]">Total Consultations</span>
                  <p className="text-lg font-bold text-white">{analytics.totalAppointments}</p>
                </div>
                <div className="p-3.5 bg-[#0D121F] border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-slate-400 text-[10px]">Completed Cases</span>
                  <p className="text-lg font-bold text-emerald-400">{analytics.completed}</p>
                </div>
                <div className="p-3.5 bg-[#0D121F] border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-slate-400 text-[10px]">Cancelled / Released</span>
                  <p className="text-lg font-bold text-red-400">{analytics.cancelled}</p>
                </div>
                <div className="p-3.5 bg-[#0D121F] border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-slate-400 text-[10px]">Utilization Rate</span>
                  <p className="text-lg font-bold text-purple-400">{analytics.utilizationPercent}%</p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ADD CUSTOM PREFERRED SLOT MODAL */}
      {showAddCustomSlotModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#13192B] border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <Coffee className="w-5 h-5 text-cyan-400" />
                <span>Add Doctor Preferred Custom Slot</span>
              </h3>
              <button onClick={() => setShowAddCustomSlotModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddCustomSlot} className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">Session / Slot Title *</label>
                <input
                  type="text"
                  value={cSlotName}
                  onChange={(e) => setCSlotName(e.target.value)}
                  placeholder="e.g. Morning Specialist VIP Session"
                  className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Day of Week</label>
                  <select
                    value={cDayName}
                    onChange={(e) => setCDayName(e.target.value)}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                    <option value="Daily">Daily Recurring</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Max Token Capacity</label>
                  <input
                    type="number"
                    value={cTokensMax}
                    onChange={(e) => setCTokensMax(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Start Time *</label>
                  <input
                    type="text"
                    value={cStartTime}
                    onChange={(e) => setCStartTime(e.target.value)}
                    placeholder="e.g. 08:00 AM"
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">End Time *</label>
                  <input
                    type="text"
                    value={cEndTime}
                    onChange={(e) => setCEndTime(e.target.value)}
                    placeholder="e.g. 09:30 AM"
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    value={cCustomFee}
                    onChange={(e) => setCCustomFee(e.target.value)}
                    placeholder="e.g. 600"
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Notes / Instructions</label>
                  <input
                    type="text"
                    value={cNotes}
                    onChange={(e) => setCNotes(e.target.value)}
                    placeholder="e.g. Prior appointment required"
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomSlotModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingCSlot}
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl flex items-center space-x-1.5 shadow-lg shadow-cyan-900/30"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAddingCSlot ? "Saving..." : "Save Custom Slot"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* DOCTOR STATUS SCOPE & EMERGENCY ABSENCE MANAGER MODAL */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#13192B] border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center space-x-2">
                <Siren className="w-5 h-5 text-amber-400" />
                <span>Doctor Practice Status & Absence Controller</span>
              </h3>
              <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-white text-base">✕</button>
            </div>

            <div className="space-y-4">
              {/* Scope Selection */}
              <div>
                <label className="text-slate-300 font-bold block mb-1.5">Select Date Scope for Status Change *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusScope("TODAY")}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      statusScope === "TODAY"
                        ? "bg-amber-950 border-amber-500 text-amber-200"
                        : "bg-[#0D121F] border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    🗓️ Today ({todayStr})
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusScope("TOMORROW")}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      statusScope === "TOMORROW"
                        ? "bg-amber-950 border-amber-500 text-amber-200"
                        : "bg-[#0D121F] border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    ☀️ Tomorrow
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusScope("THIS_WEEK")}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      statusScope === "THIS_WEEK"
                        ? "bg-amber-950 border-amber-500 text-amber-200"
                        : "bg-[#0D121F] border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    📆 Next 7 Days
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusScope("SPECIFIC_DATE")}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      statusScope === "SPECIFIC_DATE"
                        ? "bg-amber-950 border-amber-500 text-amber-200"
                        : "bg-[#0D121F] border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    📌 Specific Date
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusScope("ALL_UPCOMING")}
                    className={`p-2.5 rounded-xl border text-center font-bold transition ${
                      statusScope === "ALL_UPCOMING"
                        ? "bg-amber-950 border-amber-500 text-amber-200"
                        : "bg-[#0D121F] border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    🛑 All Upcoming
                  </button>
                </div>
              </div>

              {/* Specific Date Input */}
              {statusScope === "SPECIFIC_DATE" && (
                <div>
                  <label className="text-slate-400 block mb-1">Select Specific Date</label>
                  <input
                    type="date"
                    value={statusSpecificDate}
                    onChange={(e) => setStatusSpecificDate(e.target.value)}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Action Choice when setting Inactive */}
              <div>
                <label className="text-slate-300 font-bold block mb-1.5">Action on Affected Appointments</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusActionType("CANCEL")}
                    className={`p-2.5 rounded-xl border text-center font-bold transition flex flex-col items-center justify-center ${
                      statusActionType === "CANCEL"
                        ? "bg-red-950 border-red-500 text-red-200"
                        : "bg-[#0D121F] border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span className="text-xs">❌ Auto-Cancel</span>
                    <span className="text-[10px] font-normal text-slate-400 mt-0.5">Refund & notify patient</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusActionType("REBOOK")}
                    className={`p-2.5 rounded-xl border text-center font-bold transition flex flex-col items-center justify-center ${
                      statusActionType === "REBOOK"
                        ? "bg-purple-950 border-purple-500 text-purple-200"
                        : "bg-[#0D121F] border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <span className="text-xs">🔄 Request Rebook</span>
                    <span className="text-[10px] font-normal text-slate-400 mt-0.5">Prompt patient to rebook slot</span>
                  </button>
                </div>
              </div>

              {/* Emergency Reason Input */}
              <div>
                <label className="text-slate-300 font-bold block mb-1">Reason / Notes for Absence *</label>
                <input
                  type="text"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="e.g. Urgent Surgery Callout, Personal Unavailability, Family Emergency"
                  className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white font-bold focus:border-amber-500 focus:outline-none"
                  required
                />
              </div>

              {/* Apply Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleApplyActiveStatusChange("ACTIVE")}
                  disabled={isTogglingActive}
                  className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-900/40"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isTogglingActive ? "Updating..." : "SET ACTIVE (Resume)"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleApplyActiveStatusChange("INACTIVE")}
                  disabled={isTogglingActive}
                  className="py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition flex items-center justify-center space-x-1.5 shadow-lg shadow-red-900/40"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{isTogglingActive ? "Updating..." : "SET NOT ACTIVE (Pause)"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
