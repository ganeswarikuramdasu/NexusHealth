import React from "react";
import { UserRole } from "../types";
import {
  Activity,
  User,
  Stethoscope,
  Building2,
  ShieldCheck,
  FileText,
  Lock,
  Calendar,
  Bot,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Globe,
  Zap,
} from "lucide-react";

interface LandingPageProps {
  onOpenLogin: (initialRole?: UserRole, initialRegister?: boolean) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
}) => {
  return (
    <div className="min-h-screen bg-[#0A0E1A] text-slate-100 font-sans selection:bg-purple-600 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-[#0B0F19]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="w-full px-4 sm:px-8 h-20 flex items-center justify-between">
          {/* Logo & National Slogan */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/30 border border-purple-400/30">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white block">
                  NexusHealth <span className="text-purple-400">AI</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-400 font-bold tracking-widest uppercase block">
                  National Digital Health Mission
                </span>
              </div>
            </div>

            {/* Quote Badge */}
            <div className="hidden lg:flex items-center pl-4 border-l border-slate-800">
              <span className="px-3 py-1 bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-bold italic rounded-xl shadow-xs">
                “One Nation. One Health Identity. Infinite Care.”
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => onOpenLogin("PATIENT", false)}
              className="px-4 py-2 bg-[#13192B] hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-bold transition flex items-center space-x-2"
            >
              <User className="w-4 h-4 text-purple-400" />
              <span>Login</span>
            </button>
            <button
              onClick={() => onOpenLogin("PATIENT", true)}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-purple-600/30 flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Register Health ID</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-8">
        {/* Hero Motto Banner */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-purple-950/60 border border-purple-500/40 rounded-full shadow-md">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
          <span className="text-xs font-mono font-bold text-purple-300 uppercase tracking-widest">
            NATIONAL DIGITAL HEALTH MISSION INTEROPERABILITY
          </span>
        </div>

        {/* Main Title & Slogan Quote */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            “One Nation. One Health Identity. <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">Infinite Care</span>.”
          </h1>
          <p className="text-lg sm:text-xl text-cyan-300 font-bold max-w-2xl mx-auto">
            A Unified Portable Electronic Health Record Stack for Every Citizen
          </p>
          <p className="text-sm sm:text-base text-slate-400 max-w-3xl mx-auto leading-relaxed">
            NexusHealth AI seamlessly connects patients, medical practitioners, hospitals, and governance administrators into a single secure digital health continuum. Lifetime medical history, digital prescriptions, consent management, and AI clinical support—all tied to your verifiable Global Health ID.
          </p>
        </div>

        {/* Hero Call to Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => onOpenLogin("PATIENT", false)}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-purple-600/30 text-sm transition flex items-center space-x-3 group"
          >
            <span>Access Portal / Login</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button
            onClick={() => onOpenLogin("PATIENT", true)}
            className="px-8 py-4 bg-[#13192B] hover:bg-slate-800 text-purple-300 border border-purple-500/40 font-bold rounded-2xl text-sm transition shadow-md flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Create New Health ID</span>
          </button>
        </div>
      </section>

      {/* Core Capabilities Section */}
      <section className="py-16 bg-[#0D121F] border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="px-3 py-1 bg-purple-950 border border-purple-500/40 text-purple-300 text-xs font-mono font-bold rounded-full uppercase">
              Core Stack Capabilities
            </span>
            <h2 className="text-3xl font-black text-white">
              Built for Interoperability, Trust & Speed
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every component is designed to eliminate fragmented medical siloes while enforcing absolute patient data ownership.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-[#13192B] border border-slate-800 rounded-2xl p-6 space-y-3 shadow-md hover:border-purple-500/40 transition">
              <div className="w-12 h-12 bg-sky-950/60 border border-sky-500/40 rounded-2xl flex items-center justify-center text-sky-400">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Universal Health ID</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Unique lifelong health identifier formatted as <code className="text-purple-400 font-bold font-mono">NH-IND-2026-XXXXXXXX</code>. Contains verifiable digital signature, blood group, emergency contacts, and printable health card with QR code.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#13192B] border border-slate-800 rounded-2xl p-6 space-y-3 shadow-md hover:border-purple-500/40 transition">
              <div className="w-12 h-12 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl flex items-center justify-center text-emerald-400">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Interoperable EHR Records</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Seamless sharing of lab reports, consultation notes, vitals, and digital prescriptions across all affiliated clinics and specialty hospitals.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#13192B] border border-slate-800 rounded-2xl p-6 space-y-3 shadow-md hover:border-purple-500/40 transition">
              <div className="w-12 h-12 bg-indigo-950/60 border border-indigo-500/40 rounded-2xl flex items-center justify-center text-indigo-400">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Patient Consent Control</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Patients actively grant access to doctors for 24-hour temporary slots, specific appointments, or permanent care—with 1-click immediate revocation.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#13192B] border border-slate-800 rounded-2xl p-6 space-y-3 shadow-md hover:border-purple-500/40 transition">
              <div className="w-12 h-12 bg-rose-950/60 border border-rose-500/40 rounded-2xl flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Emergency ER Break-Glass</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Emergency override protocol for trauma physicians during critical life-threatening care, enforcing mandatory reason logging & immediate patient audit notification.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-[#13192B] border border-slate-800 rounded-2xl p-6 space-y-3 shadow-md hover:border-purple-500/40 transition">
              <div className="w-12 h-12 bg-purple-950/60 border border-purple-500/40 rounded-2xl flex items-center justify-center text-purple-400">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Gemini AI Clinical Assistant</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Contextual health Q&A for patients over their medical records & differential diagnosis support with drug interaction checks for attending physicians.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-[#13192B] border border-slate-800 rounded-2xl p-6 space-y-3 shadow-md hover:border-purple-500/40 transition">
              <div className="w-12 h-12 bg-cyan-950/60 border border-cyan-500/40 rounded-2xl flex items-center justify-center text-cyan-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Immutable System Audit Trail</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every record access, consent grant, prescription issuance, or hospital approval is recorded on an immutable ledger for absolute legal compliance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Network Metrics Bar */}
      <section className="py-12 bg-[#0A0E1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#13192B] border border-slate-800 rounded-3xl p-8 grid grid-cols-2 lg:grid-cols-4 gap-6 text-center shadow-lg">
            <div>
              <div className="text-3xl sm:text-4xl font-black text-purple-400 font-mono">100%</div>
              <div className="text-xs font-bold text-slate-300 mt-1">Digital Identity Coverage</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">0.02s</div>
              <div className="text-xs font-bold text-slate-300 mt-1">EHR Verification Latency</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-cyan-400 font-mono">256-Bit</div>
              <div className="text-xs font-bold text-slate-300 mt-1">Immutable Audit Trail</div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black text-indigo-400 font-mono">24/7</div>
              <div className="text-xs font-bold text-slate-300 mt-1">Gemini AI Clinical Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#0B0F19] py-8 text-center text-xs text-slate-400 space-y-2">
        <p className="font-bold text-slate-200">
          NexusHealth AI Gateway • “One Nation. One Health Identity. Infinite Care.”
        </p>
        <p className="text-[11px] text-slate-500 max-w-xl mx-auto">
          Compliant with MCI, National Health Authority, HIPAA & Global Electronic Medical Record Privacy Guidelines.
        </p>
      </footer>
    </div>
  );
};
