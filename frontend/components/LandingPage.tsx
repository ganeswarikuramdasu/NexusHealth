import React, { useEffect, useState } from "react";
import { UserRole } from "../types";
import {
  Activity,
  FileText,
  Lock,
  ShieldCheck,
  ShieldAlert,
  HeartPulse,
  Network,
  CheckCircle2,
  Menu,
  X,
  Siren,
  Stethoscope,
  Users,
  ArrowRight,
  Zap,
} from "lucide-react";

interface LandingPageProps {
  onOpenLogin: (initialRole?: UserRole, initialRegister?: boolean) => void;
}

const C = {
  neon: "#17C964",
  neonBright: "#3CE584",
  neonDeep: "#0EA653",
  navy: "#0B1220",
  navyLight: "#111C2F",
  card: "#141F36",
  border: "rgba(255,255,255,0.09)",
  borderGreen: "rgba(23,201,100,0.45)",
  panelText: "#DCE6F2",
  panelMuted: "#8FA2BA",
  dim: "#5D6B80",
};

const NAV_LINKS = [
  { label: "Platform", href: "#platform" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Security", href: "#security" },
  { label: "Emergency", href: "#emergency" },
];

const FEATURES = [
  { icon: FileText, title: "One lifelong Health ID", desc: "A QR-enabled identity every provider recognizes, from day one." },
  { icon: Network, title: "Portable records", desc: "Labs, consults, and vitals travel with the patient, wherever care happens." },
  { icon: Lock, title: "Consent you control", desc: "Time-bound access, revocable in a single action, always on your terms." },
  { icon: ShieldAlert, title: "Emergency break-glass", desc: "Instant access for trauma teams, with mandatory, audited reason logging." },
  { icon: HeartPulse, title: "AI clinical support", desc: "Record-aware guidance for faster triage and safer prescribing." },
  { icon: ShieldCheck, title: "Immutable audit trail", desc: "Every action on a tamper-proof ledger, ready for full compliance." },
];

const STEPS = [
  { step: "01", title: "Issue a Health ID", desc: "Verify identity and issue a lifelong, QR-enabled patient identifier." },
  { step: "02", title: "Attach the record", desc: "Consults, labs, and vitals attach to the ID and follow the patient." },
  { step: "03", title: "Care, anywhere", desc: "Any physician or ER pulls the full, consented record at the point of care." },
];

const METRICS = [
  { value: "0.02s", label: "Emergency record access" },
  { value: "100%", label: "Digital identity coverage" },
  { value: "256-bit", label: "Encryption at rest, in transit" },
  { value: "24/7", label: "AI-supported triage" },
];

const AUDIENCES = [
  { icon: Users, title: "For patients", desc: "Own and share your records, on your terms." },
  { icon: Stethoscope, title: "For physicians", desc: "Consented access at the bedside, in seconds." },
  { icon: Siren, title: "For emergency teams", desc: "Critical data the moment the patient arrives." },
];

const FOOTER_COLUMNS: { title: string; links: string[] }[] = [
  { title: "Platform", links: ["Health ID", "Patient records", "Consent manager", "Emergency access"] },
  { title: "Company", links: ["About", "Careers", "Partners", "Contact"] },
  { title: "Legal", links: ["Privacy", "Terms", "Compliance", "Security"] },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenLogin }) => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen font-sans antialiased selection:bg-[#17C964]/30 selection:text-white" style={{ backgroundColor: C.navy, color: C.panelText }}>
      {/* Navbar */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all ${scrolled ? "shadow-lg shadow-black/30" : ""}`}
        style={{ backgroundColor: scrolled ? "rgba(11,18,32,0.92)" : "rgba(11,18,32,0.4)", borderBottom: `1px solid ${scrolled ? C.border : "transparent"}`, backdropFilter: scrolled ? "blur(12px)" : "none" }}
      >
        <nav className="w-full max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg" style={{ backgroundColor: C.neon, boxShadow: `0 4px 14px ${C.neon}66` }}>
              <Activity className="w-4.5 h-4.5" style={{ color: "#06130B" }} />
            </div>
            <div className="leading-none">
              <span className="text-[17px] font-bold tracking-tight text-white block">NexusHealth</span>
              <span className="text-[9px] font-bold tracking-[0.18em] uppercase block mt-0.5" style={{ color: C.neonBright }}>
                National Health Stack
              </span>
            </div>
          </a>

          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="text-[13px] font-semibold text-[#9FB0C6] hover:text-[#3CE584] transition-colors">
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => onOpenLogin("PATIENT", false)} className="px-4 py-2 text-[13px] font-bold text-[#3CE584] hover:text-white transition-colors">
              Sign in
            </button>
            <button
              onClick={() => onOpenLogin("PATIENT", true)}
              className="px-4 py-2 text-[13px] font-bold text-white rounded-md transition hover:brightness-110 flex items-center gap-1.5"
              style={{ backgroundColor: C.neon, boxShadow: `0 6px 18px ${C.neon}55` }}
            >
              Get a Health ID
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button onClick={() => setMenuOpen((v) => !v)} className="md:hidden p-2 text-[#9FB0C6] rounded-md" style={{ border: `1px solid ${C.border}` }} aria-label="Toggle menu">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>

        {menuOpen && (
          <div className="md:hidden px-5 py-4 space-y-3" style={{ backgroundColor: C.navyLight, borderTop: `1px solid ${C.border}` }}>
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-semibold text-[#9FB0C6]">
                {l.label}
              </a>
            ))}
            <div className="flex gap-3 pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
              <button onClick={() => onOpenLogin("PATIENT", false)} className="flex-1 py-2.5 text-sm font-bold text-[#3CE584] rounded-md" style={{ border: `1px solid ${C.border}` }}>
                Sign in
              </button>
              <button onClick={() => onOpenLogin("PATIENT", true)} className="flex-1 py-2.5 text-sm font-bold text-white rounded-md" style={{ backgroundColor: C.neon }}>
                Get Health ID
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="top" className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
        {/* glow accents */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -top-40 -right-24 w-[34rem] h-[34rem] rounded-full blur-[130px]" style={{ backgroundColor: "rgba(23,201,100,0.18)" }} />
          <div className="absolute bottom-0 -left-32 w-[28rem] h-[28rem] rounded-full blur-[120px]" style={{ backgroundColor: "rgba(23,201,100,0.10)" }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 text-[12px] font-bold rounded-full text-white" style={{ backgroundColor: "rgba(23,201,100,0.12)", border: `1px solid ${C.borderGreen}`, color: C.neonBright }}>
            <Zap className="w-3.5 h-3.5" />
            Next-generation health identity
          </span>

          <h1 className="mt-7 text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05] text-white mx-auto max-w-4xl">
            One health identity for{" "}
            <span style={{ color: C.neonBright }}>every citizen, everywhere.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-[#9FB0C6] max-w-2xl mx-auto leading-relaxed">
            NexusHealth connects patients, doctors, and hospitals around one portable,
            consent-driven record &mdash; so the right information is always at the point of care.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onOpenLogin("PATIENT", true)}
              className="px-7 py-3.5 text-sm font-bold text-white rounded-md transition hover:brightness-110 flex items-center gap-2"
              style={{ backgroundColor: C.neon, boxShadow: `0 8px 26px ${C.neon}66` }}
            >
              Create a Health ID
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onOpenLogin("PATIENT", false)}
              className="px-7 py-3.5 text-sm font-bold text-white rounded-md transition hover:bg-white/5"
              style={{ border: "1px solid rgba(255,255,255,0.25)" }}
            >
              Provider sign in
            </button>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-[#8FA2BA]">
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" style={{ color: C.neonBright }} /> 0.02-second retrieval</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" style={{ color: C.neonBright }} /> 256-bit encrypted</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" style={{ color: C.neonBright }} /> Nationwide</span>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, backgroundColor: C.navyLight }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#5D6B80]">Interoperable with</span>
          {["National Health Authority", "Apollo Network", "Fortis Care", "AIIMS Registry", "PM-JAY"].map((n) => (
            <span key={n} className="text-sm font-bold text-[#8FA2BA]">{n}</span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="platform" className="py-20 sm:py-24 relative">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 relative z-10">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Everything a hospital needs, in one record
            </h2>
            <p className="mt-3 text-base text-[#9FB0C6] leading-relaxed">
              Replace scattered charts and paper with a single, consent-driven record that is always current.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="p-6 rounded-2xl transition-all duration-200 group"
                  style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.neon; e.currentTarget.style.boxShadow = `0 10px 30px rgba(23,201,100,0.14)`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(23,201,100,0.13)", border: `1px solid ${C.borderGreen}33` }}>
                    <Icon className="w-5 h-5" style={{ color: C.neonBright }} />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-white">{f.title}</h3>
                  <p className="mt-2 text-[13px] text-[#8FA2BA] leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 sm:py-24 relative" style={{ backgroundColor: C.navyLight, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white text-center">
            From issue to care in three steps
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-14">
            {STEPS.map((s, idx) => (
              <div key={s.step} className="text-center relative">
                {idx < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-px" style={{ background: "linear-gradient(90deg, rgba(23,201,100,0.5), rgba(23,201,100,0.05))" }} />
                )}
                <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center text-lg font-extrabold text-[#06130B] shadow-lg" style={{ backgroundColor: C.neon, boxShadow: `0 8px 22px ${C.neon}55` }}>
                  {s.step}
                </div>
                <h3 className="mt-5 text-lg font-bold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-[#8FA2BA] leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-20 sm:py-24 relative">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center relative z-10">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Patient privacy, engineered in
            </h2>
            <p className="mt-4 text-base text-[#9FB0C6] leading-relaxed max-w-xl">
              Every access is consented, every action is audited, and every byte is encrypted.
              Patients remain the sole owners of their record.
            </p>
            <div className="mt-6 space-y-4">
              {[
                { icon: Lock, text: "Consent-driven access across every provider." },
                { icon: ShieldCheck, text: "One-tap revocation at any time, anywhere." },
                { icon: Network, text: "Audit trail meeting national and global standards." },
              ].map((it) => {
                const Icon = it.icon;
                return (
                  <div key={it.text} className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(23,201,100,0.13)", border: `1px solid ${C.borderGreen}33` }}>
                      <Icon className="w-4 h-4" style={{ color: C.neonBright }} />
                    </span>
                    <span className="text-sm text-[#DCE6F2]">{it.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {AUDIENCES.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.title} className="flex items-center gap-4 p-5 rounded-2xl transition-all duration-200" style={{ backgroundColor: C.card, border: `1px solid ${C.border}` }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.neon; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(23,201,100,0.13)", border: `1px solid ${C.borderGreen}33` }}>
                    <Icon className="w-5 h-5" style={{ color: C.neonBright }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{r.title}</p>
                    <p className="text-[13px] text-[#8FA2BA] mt-0.5">{r.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, backgroundColor: C.navyLight }}>
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 py-14 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-40 rounded-full blur-[120px]" style={{ backgroundColor: "rgba(23,201,100,0.10)" }} />
          </div>
          {METRICS.map((m) => (
            <div key={m.label} className="relative">
              <div className="text-3xl sm:text-4xl font-extrabold" style={{ color: C.neonBright }}>{m.value}</div>
              <div className="text-[13px] font-medium mt-1 text-[#8FA2BA]">{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Emergency CTA */}
      <section id="emergency" className="py-20 sm:py-24 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[36rem] h-72 rounded-full blur-[130px]" style={{ backgroundColor: "rgba(23,201,100,0.16)" }} />
        </div>
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8">
          <div className="rounded-3xl p-8 sm:p-14 text-center relative overflow-hidden" style={{ backgroundColor: C.navyLight, border: `1px solid ${C.border}` }}>
            <div className="pointer-events-none absolute -top-20 -right-16 w-64 h-64 rounded-full blur-[90px]" style={{ backgroundColor: "rgba(23,201,100,0.18)" }} aria-hidden />
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Critical data, at the emergency door
            </h2>
            <p className="mt-4 text-base text-[#9FB0C6] max-w-2xl mx-auto leading-relaxed">
              Break-glass access gives trauma teams instant, audited visibility of allergies,
              medications, and directives &mdash; without waiting for paperwork.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button onClick={() => onOpenLogin("PATIENT", true)} className="px-7 py-3.5 text-sm font-bold text-white rounded-md transition hover:brightness-110 flex items-center gap-2" style={{ backgroundColor: C.neon, boxShadow: `0 8px 26px ${C.neon}66` }}>
                Get started today
                <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => onOpenLogin("PATIENT", false)} className="px-7 py-3.5 text-sm font-bold text-white rounded-md transition hover:bg-white/5" style={{ border: "1px solid rgba(255,255,255,0.25)" }}>
                Provider sign in
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: "#060B14", borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.neon }}>
                  <Activity className="w-4 h-4" style={{ color: "#06130B" }} />
                </div>
                <span className="text-base font-bold text-white">NexusHealth</span>
              </div>
              <p className="text-[13px] leading-relaxed max-w-xs text-[#8FA2BA]">
                One nation, one health identity, continuous care.
              </p>
            </div>

            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <h4 className="text-[11px] font-bold uppercase tracking-wider mb-3 text-[#5D6B80]">{col.title}</h4>
                {col.links.map((l) => (
                  <a key={l} href="#platform" className="block py-1.5 text-[13px] text-[#8FA2BA] hover:text-[#3CE584] transition-colors">{l}</a>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderTop: `1px solid ${C.border}` }}>
            <p className="text-xs text-[#5D6B80]">© {new Date().getFullYear()} NexusHealth Global Digital Health Identity Platform</p>
            <p className="text-[11px] text-[#5D6B80]">Aligned with National Health Authority · HIPAA · MCI</p>
          </div>
        </div>
      </footer>
    </div>
  );
};