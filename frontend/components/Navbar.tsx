import React from "react";
import { UserRole } from "../types";
import {
  Activity,
  ShieldAlert,
  CreditCard,
  LogOut,
  User,
  Building2,
  Stethoscope,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface NavbarProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    globalHealthId?: string;
  };
  onLogout: () => void;
  onGoToHome?: () => void;
  onOpenCard: () => void;
  healthId: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onLogout,
  onGoToHome,
  onOpenCard,
  healthId,
}) => {

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "PATIENT":
        return { label: "PATIENT", color: "bg-sky-500/10 text-sky-400 border-sky-500/30", icon: User };
      case "DOCTOR":
        return { label: "PHYSICIAN", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", icon: Stethoscope };
      case "HOSPITAL_ADMIN":
        return { label: "HOSPITAL ADMIN", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30", icon: Building2 };
      case "SUPER_ADMIN":
        return { label: "SUPER ADMIN", color: "bg-purple-500/10 text-purple-400 border-purple-500/30", icon: ShieldCheck };
    }
  };

  const badge = getRoleBadge(currentUser.role);
  const BadgeIcon = badge.icon;
  const initial = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U";

  return (
    <header className="bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 text-slate-100">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center space-x-3 shrink-0">
          <div
            onClick={onGoToHome}
            className="flex items-center space-x-3 cursor-pointer group"
            title="NexusHealth AI Gateway"
          >
            <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/20 group-hover:scale-105 transition-transform border border-purple-400/30">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-base font-black tracking-tight text-white group-hover:text-purple-400 transition-colors">
                  NexusHealth
                </span>
                <span className="px-1.5 py-0.2 bg-purple-500/20 text-purple-300 text-[9px] font-mono font-bold rounded-md border border-purple-500/30">
                  AI
                </span>
              </div>
              <span className="block text-[9px] font-mono text-cyan-400 font-bold tracking-widest uppercase">
                PRECISION HEALTHCARE
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Action Buttons & User Profile */}
        <div className="flex items-center space-x-3 shrink-0">
          
          {/* Action Buttons (Card) */}
          {currentUser.role === "PATIENT" && (
            <button
              onClick={onOpenCard}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/30 rounded-xl text-xs font-bold text-cyan-300 transition shadow-xs cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Health ID Card</span>
            </button>
          )}

          {/* User Capsule Pill */}

          {/* User Capsule Pill (Exact like screenshot "G gani") */}
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
            <div className="flex items-center space-x-2 bg-[#13192B] border border-slate-800 rounded-xl p-1 pr-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
                {initial}
              </div>
              <div className="hidden lg:block text-left">
                <span className="block text-xs font-bold text-white leading-tight truncate max-w-[100px]">
                  {currentUser.name}
                </span>
                <span className="block text-[9px] font-mono text-purple-400 leading-none">
                  {currentUser.role.replace("_", " ")}
                </span>
              </div>
            </div>

            {onGoToHome && (
              <button
                onClick={onGoToHome}
                title="Return to Main Landing Page"
                className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-xl transition border border-slate-800"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onLogout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition border border-slate-800"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
