import React from "react";
import { PatientProfile } from "../types";
import { X, QrCode, ShieldCheck, Heart, Droplet, User, Phone, FileText } from "lucide-react";

interface GlobalHealthCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PatientProfile;
  patientName: string;
}

export const GlobalHealthCardModal: React.FC<GlobalHealthCardModalProps> = ({
  isOpen,
  onClose,
  profile,
  patientName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-100 via-slate-900 to-slate-950 border border-[#17C964]/60 rounded-3xl p-6 text-slate-900 shadow-2xl shadow-[#0f172a]/50">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-slate-900 bg-slate-100/60 rounded-full transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-[#17C964] rounded-xl flex items-center justify-center text-white shadow-md shadow-[#0f172a]/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">Digital Health ID Card</h3>
            <p className="text-xs text-[#17C964] font-mono">Verified National Health Record ID</p>
          </div>
        </div>

        {/* Physical Identity Card Styled Container */}
        <div className="bg-gradient-to-tr from-slate-950 via-slate-900 to-[#0f172a] border border-[#17C964]/40 rounded-2xl p-5 shadow-inner space-y-4">
          <div className="flex justify-between items-start border-b border-[#17C964]/60 pb-3">
            <div>
              <span className="text-[10px] font-mono tracking-widest text-[#17C964] uppercase">Universal Health ID</span>
              <div className="text-lg font-mono font-bold text-white tracking-wider">{profile.globalHealthId}</div>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-xl border border-[#17C964]/40 flex items-center justify-center text-[#17C964]">
              <QrCode className="w-6 h-6" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 text-[10px] block">Patient Full Name</span>
              <span className="font-semibold text-white">{patientName}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Blood Group</span>
              <span className="font-bold text-[#F2603C] flex items-center space-x-1">
                <Droplet className="w-3.5 h-3.5 text-[#F2603C]" />
                <span>{profile.bloodGroup}</span>
              </span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Date of Birth / Sex</span>
              <span className="font-medium text-white">{profile.dob} ({profile.gender})</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">Emergency Contact</span>
              <span className="font-medium text-white">{profile.emergencyContactPhone}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold text-xs rounded-xl transition"
          >
            Close Health Card
          </button>
        </div>
      </div>
    </div>
  );
};
