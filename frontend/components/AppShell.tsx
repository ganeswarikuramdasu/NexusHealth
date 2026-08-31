import React from "react";
import { UserRole } from "../types";
import {
  LogOut,
  Activity,
  User,
  Building2,
  Stethoscope,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  badge?: string;
}

interface AppShellProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    globalHealthId?: string;
  };
  roleLabel?: string;
  navItems: NavItem[];
  active: string;
  onSelect: (id: string) => void;
  onLogout: () => void;
  onGoToHome?: () => void;
  subtitle?: string;
  children: React.ReactNode;
}

const ROLE_ICONS: Record<UserRole, React.ComponentType<{ className?: string }>> = {
  PATIENT: User,
  DOCTOR: Stethoscope,
  HOSPITAL_ADMIN: Building2,
  SUPER_ADMIN: ShieldCheck,
};

export const AppShell: React.FC<AppShellProps> = ({
  user,
  roleLabel,
  navItems,
  active,
  onSelect,
  onLogout,
  onGoToHome,
  subtitle,
  children,
}) => {
  const RoleIcon = ROLE_ICONS[user.role] || User;
  const initial = user.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="min-h-screen flex bg-[#f4f6f9] text-slate-900 font-sans">
      {/* ============ SIDEBAR (far left) ============ */}
      <aside className="w-80 shrink-0 bg-[#0f172a] text-white flex flex-col fixed inset-y-0 left-0 z-50 shadow-2xl">
        {/* Brand */}
        <button
          onClick={onGoToHome}
          className="flex items-center gap-3 px-5 h-16 shrink-0 border-b border-white/10 cursor-pointer hover:bg-white/5 transition-colors text-left"
          title="NexusHealth Home"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#17C964] to-[#3CE584] flex items-center justify-center shadow-lg shadow-green-900/40 shrink-0">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="leading-none">
            <span className="text-[15px] font-extrabold tracking-tight text-white block">NexusHealth</span>
            <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-[#5EF2A0]/90 block mt-0.5">
              {subtitle || "Clinical Dashboard"}
            </span>
          </div>
        </button>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto nh-side-scroll px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === active;
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "bg-gradient-to-r from-[#17C964] to-[#3CE584] text-white shadow-lg shadow-green-900/30"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <span className="flex-1 text-left leading-snug">{item.label}</span>
                {item.badge && (
                  <span className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded ${
                    isActive ? "bg-white/25 text-white" : "bg-[#17C964]/15 text-[#5EF2A0] border border-[#17C964]/40"
                  }`}>
                    {item.badge}
                  </span>
                )}
                {typeof item.count === "number" && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono shrink-0 ${
                    isActive ? "bg-[#0B7A3E]/40 text-white font-bold" : "bg-white/10 text-slate-300"
                  }`}>
                    {item.count}
                  </span>
                )}
                {isActive && !item.badge && typeof item.count !== "number" && (
                  <ChevronDown className="w-3.5 h-3.5 ml-auto opacity-70 rotate-90 shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User + Logout pinned at bottom */}
        <div className="px-3 pb-4 pt-3 border-t border-white/10 space-y-2">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0f172a] to-[#1e293b] flex items-center justify-center font-bold text-[#5EF2A0] text-sm border border-white/10 shrink-0">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="block text-[13px] font-bold text-white leading-tight truncate">
                  {user.name}
                </span>
                <RoleIcon className="w-3.5 h-3.5 text-[#5EF2A0]/80 shrink-0" />
              </div>
              <span className="block text-[10px] font-mono text-slate-400 leading-none mt-0.5">
                {roleLabel || user.role.replace("_", " ")}
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-[#5EF2A0] hover:bg-[#17C964]/20 hover:text-white bg-white/5 border border-white/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ============ CONTENT AREA ============ */}
      <div className="flex-1 ml-80 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="hidden max-lg:flex items-center justify-between px-4 h-14 bg-[#0f172a] text-white sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#17C964] to-[#3CE584] flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-extrabold">NexusHealth</span>
          </div>
          <span className="text-[11px] font-mono text-[#5EF2A0]">{roleLabel || user.role.replace("_", " ")}</span>
        </header>

        <main className="flex-1 p-5 sm:p-7 lg:p-8 space-y-6 min-w-0">{children}</main>
      </div>
    </div>
  );
};
