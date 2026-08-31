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
        return { label: "PATIENT", color: "bg-[#17C964]/10 text-[#17C964] border-[#17C964]/30", icon: User };
      case "DOCTOR":
        return { label: "PHYSICIAN", color: "bg-[#17C964]/10 text-[#17C964] border-[#17C964]/30", icon: Stethoscope };
      case "HOSPITAL_ADMIN":
        return { label: "HOSPITAL ADMIN", color: "bg-[#17C964]/10 text-[#17C964] border-[#17C964]/30", icon: Building2 };
      case "SUPER_ADMIN":
        return { label: "SUPER ADMIN", color: "bg-[#17C964]/10 text-[#17C964] border-[#17C964]/30", icon: ShieldCheck };
    }
  };

  const badge = getRoleBadge(currentUser.role);
  const BadgeIcon = badge.icon;
  const initial = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U";

  return (
    <header className="bg-[#FFFFFF]/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 text-slate-900">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center space-x-3 shrink-0">
          <div
            onClick={onGoToHome}
            className="flex items-center space-x-3 cursor-pointer group"
            title="NexusHealth AI Gateway"
          >
            <div className="w-10 h-10 bg-[#17C964] rounded-2xl flex items-center justify-center shadow-lg shadow-[#17C964]/20 group-hover:scale-105 transition-transform border border-[#17C964]/30">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-base font-black tracking-tight text-slate-900 group-hover:text-[#17C964] transition-colors">
                  NexusHealth
                </span>
                <span className="px-1.5 py-0.2 bg-[#17C964]/10 text-[#17C964] text-[9px] font-mono font-bold rounded-md border border-[#17C964]/30">
                  AI
                </span>
              </div>
              <span className="block text-[9px] font-mono text-[#17C964] font-bold tracking-widest uppercase">
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
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#E9FBF1] hover:bg-slate-100 border border-[#17C964]/30 rounded-xl text-xs font-bold text-[#17C964] transition shadow-xs cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5 text-[#17C964]" />
              <span className="hidden sm:inline">Health ID Card</span>
            </button>
          )}

          {/* User Capsule Pill */}

          {/* User Capsule Pill (Exact like screenshot "G gani") */}
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
            <div className="flex items-center space-x-2 bg-[#FFFFFF] border border-slate-200 rounded-xl p-1 pr-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#17C964] to-[#0f172a] flex items-center justify-center font-bold text-white text-xs shadow-sm">
                {initial}
              </div>
              <div className="hidden lg:block text-left">
                <span className="block text-xs font-bold text-slate-900 leading-tight truncate max-w-[100px]">
                  {currentUser.name}
                </span>
                <span className="block text-[9px] font-mono text-[#17C964] leading-none">
                  {currentUser.role.replace("_", " ")}
                </span>
              </div>
            </div>

            {onGoToHome && (
              <button
                onClick={onGoToHome}
                title="Return to Main Landing Page"
                className="p-2 text-slate-500 hover:text-[#17C964] hover:bg-slate-100 rounded-xl transition border border-slate-200"
              >
                <Sparkles className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onLogout}
              title="Logout"
              className="p-2 text-slate-500 hover:text-[#E23A2E] hover:bg-slate-100 rounded-xl transition border border-slate-200"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
