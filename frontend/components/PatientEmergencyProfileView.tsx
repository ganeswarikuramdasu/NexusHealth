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
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 border border-rose-500/30 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-rose-500/20 border border-rose-500/40 rounded-full text-xs font-mono font-bold text-rose-300 mb-2">
            <Siren className="w-3.5 h-3.5 text-rose-400" />
            <span>Emergency Preparedness & Access Audit</span>
          </div>
          <h1 className="text-2xl font-black text-white">Emergency Profile & Access History</h1>
          <p className="text-xs text-rose-200/90 max-w-xl mt-1">
            Configure vital medical information and emergency contacts shown to attending doctors during an emergency override session. Review all emergency accesses.
          </p>
        </div>

        <button
          onClick={fetchEmergencyData}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs transition border border-slate-700 flex items-center space-x-2 shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* EMERGENCY NOTIFICATIONS ALERT BOX */}
      {notifications.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/90 via-rose-950/80 to-[#13192B] border-2 border-amber-500/50 rounded-3xl p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-amber-400 animate-bounce" />
              <span className="font-extrabold text-white text-sm">Emergency Access Notifications</span>
            </div>
            <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold rounded-full">
              {notifications.length} Event(s)
            </span>
          </div>

          <div className="space-y-2">
            {notifications.map((n) => (
              <div key={n.id} className="p-3 bg-[#0D121F] rounded-2xl border border-slate-800 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-rose-300 block">Emergency Session {n.sessionId}</span>
                  <span className="text-slate-300">Doctor: <strong>{n.doctorName}</strong> ({n.hospitalName})</span>
                  <p className="text-amber-200/90 text-[11px] mt-0.5">Reason: "{n.reason}"</p>
                </div>
                <span className="font-mono text-[10px] text-slate-400 shrink-0">{new Date(n.timestamp).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SAVE NOTICE */}
      {message && (
        <div className="p-4 bg-emerald-950 border border-emerald-500/40 rounded-2xl text-xs font-bold text-emerald-200 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT 7 COLS: EDIT EMERGENCY PROFILE & CONTACTS */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSaveProfile} className="bg-[#13192B] border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl text-xs">
            <h3 className="font-bold text-white text-sm flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Heart className="w-4 h-4 text-rose-400" />
              <span>Critical Emergency Medical Directives</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full bg-[#0D121F] border border-slate-800 rounded-xl p-3 text-white font-bold"
                >
                  {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Primary Physician / Hospital</label>
                <input
                  type="text"
                  value={primaryPhysician}
                  onChange={(e) => setPrimaryPhysician(e.target.value)}
                  className="w-full bg-[#0D121F] border border-slate-800 rounded-xl p-3 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Known Drug Allergies (Comma Separated)</label>
              <input
                type="text"
                value={allergiesText}
                onChange={(e) => setAllergiesText(e.target.value)}
                placeholder="e.g. Penicillin, Sulfa, Dust Mites"
                className="w-full bg-[#0D121F] border border-slate-800 rounded-xl p-3 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Chronic / Critical Conditions</label>
              <input
                type="text"
                value={conditionsText}
                onChange={(e) => setConditionsText(e.target.value)}
                placeholder="e.g. Mild Asthma, Type 2 Diabetes"
                className="w-full bg-[#0D121F] border border-slate-800 rounded-xl p-3 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Current Important Medications</label>
              <input
                type="text"
                value={medicationsText}
                onChange={(e) => setMedicationsText(e.target.value)}
                placeholder="e.g. Levosalbutamol Inhaler 100mcg"
                className="w-full bg-[#0D121F] border border-slate-800 rounded-xl p-3 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Emergency Care Notes & Directives</label>
              <textarea
                rows={3}
                value={emergencyNotes}
                onChange={(e) => setEmergencyNotes(e.target.value)}
                placeholder="Specific instructions for emergency care responders..."
                className="w-full bg-[#0D121F] border border-slate-800 rounded-xl p-3 text-white"
              />
            </div>

            {/* EMERGENCY CONTACTS EDITOR */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex justify-between items-center">
                <label className="text-white font-bold text-sm flex items-center space-x-2">
                  <PhoneCall className="w-4 h-4 text-emerald-400" />
                  <span>Emergency Next of Kin Contacts</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddContact}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[11px] flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Contact</span>
                </button>
              </div>

              <div className="space-y-3">
                {contacts.map((c, idx) => (
                  <div key={c.id} className="bg-[#0D121F] p-3 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
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
                        className="w-full bg-[#13192B] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
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
                        className="w-full bg-[#13192B] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
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
                        className="w-full bg-[#13192B] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>
                    <div className="sm:col-span-1 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemoveContact(c.id)}
                        className="p-1.5 text-rose-400 hover:bg-rose-950 rounded-lg transition"
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
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl text-xs transition shadow-lg shadow-rose-900/40 flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving Directives..." : "Save Emergency Profile & Contacts"}</span>
            </button>
          </form>
        </div>

        {/* RIGHT 5 COLS: EMERGENCY ACCESS AUDIT LOGS */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#13192B] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl text-xs">
            <h3 className="font-bold text-white text-sm flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Emergency Access Audit History</span>
            </h3>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {emergencySessions.map((s) => (
                <div key={s.id} className="bg-[#0D121F] p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-mono font-bold text-cyan-300">{s.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      s.status === "ACTIVE" ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40" : "bg-slate-800 text-slate-400"
                    }`}>
                      {s.status}
                    </span>
                  </div>

                  <p className="text-white font-bold">{s.doctorName}</p>
                  <p className="text-slate-400">{s.hospitalName}</p>
                  <p className="text-amber-300 text-[11px]"><strong>Reason:</strong> {s.emergencyReason}</p>
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
