import React, { useState, useEffect } from "react";
import { PatientProfile } from "../types";
import { safeFetchJson, parseResponseSafe } from "../utils/api";
import {
  Siren,
  ShieldCheck,
  ShieldAlert,
  PhoneCall,
  User,
  Heart,
  Plus,
  Trash2,
  Save,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  RefreshCw,
  Bell,
  Activity,
  FileText,
} from "lucide-react";

interface PatientEmergencyProfileViewProps {
  patient: PatientProfile;
}

export const PatientEmergencyProfileView: React.FC<PatientEmergencyProfileViewProps> = ({ patient }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  // Emergency Profile Form
  const [bloodGroup, setBloodGroup] = useState<string>(patient.bloodGroup || "");
  const [allergiesText, setAllergiesText] = useState<string>(patient.allergies?.join(", ") || "");
  const [conditionsText, setConditionsText] = useState<string>(patient.chronicConditions?.join(", ") || "");
  const [medicationsText, setMedicationsText] = useState<string>("");
  const [emergencyNotes, setEmergencyNotes] = useState<string>("");
  const [primaryPhysician, setPrimaryPhysician] = useState<string>("");

  // Emergency Contacts
  const [contacts, setContacts] = useState<
    Array<{ id: string; name: string; relationship: string; phone: string; priority: number }>
  >(
    patient.emergencyContactName
      ? [
          {
            id: "econt_1",
            name: patient.emergencyContactName,
            relationship: patient.emergencyContactRelation || "Primary Contact",
            phone: patient.emergencyContactPhone || "",
            priority: 1,
          },
        ]
      : []
  );

  // History & Notifications
  const [emergencySessions, setEmergencySessions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Fetch Patient Emergency Data
  useEffect(() => {
    fetchEmergencyData();
  }, [patient.userId, patient.globalHealthId]);

  const fetchEmergencyData = async () => {
    setLoading(true);
    try {
      const pid = patient.userId || patient.globalHealthId;
      const [data, histData] = await Promise.all([
        safeFetchJson<any>(`/api/emergency/patient/${pid}/profile`, undefined, { success: false }),
        safeFetchJson<any>(`/api/emergency/patient/${pid}/history`, undefined, { success: false, emergencySessions: [] })
      ]);

      if (data?.success) {
        if (data.emergencyProfile) {
          const ep = data.emergencyProfile;
          setBloodGroup(ep.bloodGroup || patient.bloodGroup || "");
          setAllergiesText(Array.isArray(ep.allergies) ? ep.allergies.join(", ") : "");
          setConditionsText(Array.isArray(ep.criticalConditions) ? ep.criticalConditions.join(", ") : "");
          setMedicationsText(Array.isArray(ep.currentMedications) ? ep.currentMedications.join(", ") : "");
          setEmergencyNotes(ep.emergencyNotes || "");
          setPrimaryPhysician(ep.primaryPhysician || "");
        }
        if (Array.isArray(data.emergencyContacts) && data.emergencyContacts.length > 0) {
          setContacts(data.emergencyContacts);
        }
        if (Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        }
      }

      if (histData?.success && Array.isArray(histData.emergencySessions)) {
        setEmergencySessions(histData.emergencySessions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const pid = patient.userId || patient.globalHealthId;
      const res = await fetch(`/api/emergency/patient/${pid}/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bloodGroup,
          allergies: allergiesText.split(",").map((s) => s.trim()).filter(Boolean),
          criticalConditions: conditionsText.split(",").map((s) => s.trim()).filter(Boolean),
          currentMedications: medicationsText.split(",").map((s) => s.trim()).filter(Boolean),
          emergencyNotes,
          primaryPhysician,
          contacts,
        }),
      });

      const data = await parseResponseSafe<any>(res, { success: false });
      if (data && data.success) {
        setMessage("Emergency profile & contacts saved successfully!");
      } else {
        setMessage("Failed to save emergency profile.");
      }
    } catch (err) {
      setMessage("Error saving emergency profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddContact = () => {
    setContacts([
      ...contacts,
      {
        id: `econt_${Date.now()}`,
        name: "",
        relationship: "Family Member",
        phone: "",
        priority: contacts.length + 1,
      },
    ]);
  };

  const handleRemoveContact = (id: string) => {
    setContacts(contacts.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#E23A2E] via-[#0f172a] to-[#0f172a] border border-[#F2603C]/30 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#F2603C]/20 border border-[#F2603C]/40 rounded-full text-xs font-mono font-bold text-[#F8B0A0] mb-2">
            <Siren className="w-3.5 h-3.5 text-[#F8A08C]" />
            <span>Emergency Preparedness & Access Audit</span>
          </div>
          <h1 className="text-2xl font-black text-white">Emergency Profile & Access History</h1>
          <p className="text-xs text-[#FBD3C9] max-w-xl mt-1">
            Configure vital medical information and emergency contacts shown to attending doctors during an emergency override session. Review all emergency accesses.
          </p>
        </div>

        <button
          onClick={fetchEmergencyData}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition border border-slate-300 flex items-center space-x-2 shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* EMERGENCY NOTIFICATIONS ALERT BOX */}
      {notifications.length > 0 && (
        <div className="bg-gradient-to-r from-[#FDECE8] via-[#FBE0DA] to-[#FFFFFF] border-2 border-[#F2603C]/50 rounded-3xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#F2603C]/30 pb-2">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-[#F2603C] animate-bounce" />
              <span className="font-extrabold text-[#E23A2E] text-sm">Emergency Access Notifications</span>
            </div>
            <span className="px-2.5 py-0.5 bg-[#F2603C]/15 border border-[#F2603C]/40 text-[#E23A2E] font-mono text-[10px] font-bold rounded-full">
              {notifications.length} Event(s)
            </span>
          </div>

          <div className="space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className="p-3 bg-[#EDF1F5] rounded-2xl border border-slate-200 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-[#E23A2E] block">Emergency Session {n.sessionId}</span>
                  <span className="text-slate-700">Doctor: <strong>{n.doctorName}</strong> ({n.hospitalName})</span>
                  <p className="text-slate-700 text-[11px] mt-0.5">Reason: "{n.reason}"</p>
                </div>
                <span className="font-mono text-[10px] text-slate-500 shrink-0">{new Date(n.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SAVE NOTICE */}
      {message && (
        <div className="p-4 bg-[#E9FBF1] border border-[#17C964]/40 rounded-2xl text-xs font-bold text-[#17C964] flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-[#17C964]" />
          <span>{message}</span>
        </div>
      )}

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT 7 COLS: EDIT EMERGENCY PROFILE & CONTACTS */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSaveProfile} className="bg-[#FFFFFF] border border-slate-200 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2 border-b border-slate-200 pb-3">
              <Heart className="w-4 h-4 text-[#F2603C]" />
              <span>Critical Emergency Medical Directives</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl p-3 text-slate-900 font-bold"
                >
                  {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Primary Physician / Hospital</label>
                <input
                  type="text"
                  value={primaryPhysician}
                  onChange={(e) => setPrimaryPhysician(e.target.value)}
                  className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl p-3 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Known Drug Allergies (Comma Separated)</label>
              <input
                type="text"
                value={allergiesText}
                onChange={(e) => setAllergiesText(e.target.value)}
                placeholder="e.g. Penicillin, Sulfa, Dust Mites"
                className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl p-3 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Chronic / Critical Conditions</label>
              <input
                type="text"
                value={conditionsText}
                onChange={(e) => setConditionsText(e.target.value)}
                placeholder="e.g. Mild Asthma, Type 2 Diabetes"
                className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl p-3 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Current Important Medications</label>
              <input
                type="text"
                value={medicationsText}
                onChange={(e) => setMedicationsText(e.target.value)}
                placeholder="e.g. Levosalbutamol Inhaler 100mcg"
                className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl p-3 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Emergency Care Notes & Directives</label>
              <textarea
                rows={3}
                value={emergencyNotes}
                onChange={(e) => setEmergencyNotes(e.target.value)}
                placeholder="Specific instructions for emergency care responders..."
                className="w-full bg-[#EDF1F5] border border-slate-200 rounded-xl p-3 text-slate-900"
              />
            </div>

            {/* EMERGENCY CONTACTS EDITOR */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <label className="text-slate-900 font-bold text-sm flex items-center space-x-2">
                  <PhoneCall className="w-4 h-4 text-[#17C964]" />
                  <span>Emergency Next of Kin Contacts</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddContact}
                  className="px-3 py-1.5 bg-[#17C964] hover:bg-[#0f172a] text-white font-bold rounded-xl text-[11px] flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Contact</span>
                </button>
              </div>

              <div className="space-y-3">
                {contacts.map((c, idx) => (
                  <div key={c.id} className="bg-[#EDF1F5] p-3 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        placeholder="Contact Name"
                        value={c.name}
                        onChange={(e) => {
                          const updated = [...contacts];
                          updated[idx].name = e.target.value;
                          setContacts(updated);
                        }}
                        className="w-full bg-[#FFFFFF] border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        placeholder="Relationship"
                        value={c.relationship}
                        onChange={(e) => {
                          const updated = [...contacts];
                          updated[idx].relationship = e.target.value;
                          setContacts(updated);
                        }}
                        className="w-full bg-[#FFFFFF] border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        placeholder="Phone Number"
                        value={c.phone}
                        onChange={(e) => {
                          const updated = [...contacts];
                          updated[idx].phone = e.target.value;
                          setContacts(updated);
                        }}
                        className="w-full bg-[#FFFFFF] border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono"
                      />
                    </div>
                    <div className="sm:col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveContact(c.id)}
                        className="p-1.5 text-[#E23A2E] hover:bg-[#FDECE8] rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 bg-[#F2603C] hover:bg-[#E23A2E] text-white font-bold rounded-2xl text-xs transition shadow-lg shadow-[#E23A2E]/40 flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving Directives..." : "Save Emergency Profile & Contacts"}</span>
            </button>
          </form>
        </div>

        {/* RIGHT 5 COLS: EMERGENCY ACCESS AUDIT LOGS */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#FFFFFF] border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xl text-xs">
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2 border-b border-slate-200 pb-3">
              <Clock className="w-4 h-4 text-[#17C964]" />
              <span>Emergency Access Audit History</span>
            </h3>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {emergencySessions.map((s) => (
                <div key={s.id} className="bg-[#EDF1F5] p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-bold text-[#17C964]">{s.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      s.status === "ACTIVE" ? "bg-[#E9FBF1] text-[#17C964] border border-[#17C964]/40" : "bg-slate-100 text-slate-500"
                    }`}>
                      {s.status}
                    </span>
                  </div>

                  <p className="text-slate-900 font-bold">{s.doctorName}</p>
                  <p className="text-slate-500">{s.hospitalName}</p>
                  <p className="text-slate-700 text-[11px]"><strong>Reason:</strong> {s.emergencyReason}</p>
                  <div className="pt-1 text-[10px] text-slate-500 flex justify-between font-mono">
                    <span>Method: {s.identificationMethod}</span>
                    <span>{new Date(s.startedAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}

              {emergencySessions.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No emergency access sessions logged for your account.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
