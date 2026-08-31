import React, { useState } from "react";
import { UserRole, HospitalProfile } from "../types";
import { Activity, User, Stethoscope, Building2, ShieldCheck, Mail, Lock, ShieldAlert, CheckCircle2, ArrowRight, Eye, EyeOff, Inbox, Sparkles, Fingerprint, HeartPulse, FileText } from "lucide-react";
import { checkPasswordStrength } from "../utils/validation";
import { parseResponseSafe } from "../utils/api";

interface LoginPageProps {
  hospitals: HospitalProfile[];
  onLoginSuccess: (user: any, role: UserRole) => void;
  onBackToHome?: () => void;
  initialRole?: UserRole;
  initialRegister?: boolean;
}

const C = {
  neon: "#17C964",
  neonDeep: "#0EA653",
  neonBright: "#3CE584",
  neonTint: "#E9FBF1",
  navy: "#0B1220",
  navyLight: "#111C2F",
  panelText: "#DCE6F2",
  panelMuted: "#8FA2BA",
  line: "#E6EAF0",
};

export const LoginPage: React.FC<LoginPageProps> = ({
  hospitals,
  onLoginSuccess,
  onBackToHome,
  initialRole = "PATIENT",
  initialRegister = false,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    initialRegister && initialRole !== "PATIENT" ? "PATIENT" : initialRole
  );
  const [isRegisterMode, setIsRegisterMode] = useState(
    initialRole === "PATIENT" ? initialRegister : false
  );

  // Login form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Patient Registration States
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regDob, setRegDob] = useState("1998-05-14");
  const [regGender, setRegGender] = useState("Male");
  const [regBloodGroup, setRegBloodGroup] = useState("O+");
  const [regHeight, setRegHeight] = useState("172");
  const [regWeight, setRegWeight] = useState("68");
  const [regContactName, setRegContactName] = useState("Family Emergency");
  const [regContactPhone, setRegContactPhone] = useState("+91 98765 43210");
  
  // OTP States
  const [otpCode, setOtpCode] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [simulatedEmailNotice, setSimulatedEmailNotice] = useState<any | null>(null);
  const [showInboxModal, setShowInboxModal] = useState(false);

  // Show/Hide password toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setIsRegisterMode(false);
    setLoginEmail("");
    setLoginPassword("");
    if (role !== "PATIENT") {
      setStatusMessage({
        type: "success",
        text: `${role === "DOCTOR" ? "Doctor" : role === "HOSPITAL_ADMIN" ? "Hospital" : "Super Admin"} accounts are pre-provisioned and cannot self-register. Please Sign In with your credentials.`
      });
    } else {
      setStatusMessage(null);
    }
  };

  // Direct Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setStatusMessage({ type: "error", text: "Please enter both your registered email address and password." });
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword.trim(),
          role: selectedRole
        }),
      });
      const data = await parseResponseSafe<any>(res, { success: false, message: "Authentication service unavailable." });
      if (!res.ok || !data || data.success === false) {
        setStatusMessage({ type: "error", text: data?.message || "Authentication failed. Invalid email or password." });
        return;
      }
      onLoginSuccess(data.user, selectedRole);
    } catch (err) {
      setStatusMessage({ type: "error", text: "Login service error. Please try again." });
    }
  };

  // Send OTP for Patient Registration
  const handleSendOtp = async () => {
    if (isSendingOtp || isOtpVerified) return;
    if (!regEmail.trim()) {
      setStatusMessage({ type: "error", text: "Please enter your email to receive verification OTP." });
      return;
    }
    setIsSendingOtp(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail.trim() }),
      });
      const data = await parseResponseSafe<any>(res, { success: false, message: "Failed to dispatch OTP." });
      if (!res.ok || !data || data.success === false) {
        setStatusMessage({ type: "error", text: data?.message || "Failed to dispatch OTP." });
        return;
      }
      if (!isOtpSent) setOtpCode("");
      setIsOtpSent(true);
      setSimulatedEmailNotice(data.emailDetails || data.simulatedEmail);
      setStatusMessage({ type: "success", text: `Verification email sent to ${regEmail.trim()}. Use the 6-digit code from your inbox.` });
    } catch (err) {
      setStatusMessage({ type: "error", text: "Error dispatching OTP code via SMTP. Please try again." });
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (isVerifyingOtp) return;
    if (!otpCode.trim()) {
      setStatusMessage({ type: "error", text: "Please enter the 6-digit OTP code." });
      return;
    }
    setIsVerifyingOtp(true);
    setStatusMessage(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: regEmail.trim(), otpCode: otpCode.trim() }),
      });
      const data = await parseResponseSafe<any>(res, { success: false, message: "Invalid OTP verification code." });
      if (!res.ok || !data || data.success === false) {
        setStatusMessage({ type: "error", text: data?.message || "Invalid OTP verification code." });
        return;
      }
      setIsOtpVerified(true);
      setStatusMessage({ type: "success", text: "Email verified successfully! You can now complete registration." });
    } catch (err) {
      setStatusMessage({ type: "error", text: "Error verifying OTP code. Please try again." });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Password strength render component
  const PasswordStrengthMeter: React.FC<{ passwordVal: string }> = ({ passwordVal }) => {
    const strength = checkPasswordStrength(passwordVal);
    if (!passwordVal) return null;

    return (
      <div className="border rounded-xl p-3 text-[11px] space-y-1.5 font-mono" style={{ borderColor: C.line, backgroundColor: "#F8FAFC" }}>
        <div className="flex justify-between items-center font-bold text-slate-700">
          <span>Password Strength:</span>
          <span className={strength.isValid ? "text-[#17C964]" : "text-[#17C964]"}>
            {strength.isValid ? "✔ Strong" : "⚠️ Weak"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-[10px]">
          <div className={strength.minLength ? "text-[#17C964] font-bold" : "text-slate-400"}>
            <span>{strength.minLength ? "✔" : "○"} 8+ characters</span>
          </div>
          <div className={strength.hasUpper ? "text-[#17C964] font-bold" : "text-slate-400"}>
            <span>{strength.hasUpper ? "✔" : "○"} 1 Uppercase (A-Z)</span>
          </div>
          <div className={strength.hasLower ? "text-[#17C964] font-bold" : "text-slate-400"}>
            <span>{strength.hasLower ? "✔" : "○"} 1 Lowercase (a-z)</span>
          </div>
          <div className={strength.hasNumber ? "text-[#17C964] font-bold" : "text-slate-400"}>
            <span>{strength.hasNumber ? "✔" : "○"} 1 Number (0-9)</span>
          </div>
          <div className="col-span-2 text-left">
            <span className={strength.hasSpecial ? "text-[#17C964] font-bold" : "text-slate-400"}>
              {strength.hasSpecial ? "✔" : "○"} 1 Special character (!@#$%^&*)
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Submit Patient Registration
  const handlePatientRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOtpVerified) {
      setStatusMessage({ type: "error", text: "Please verify your email address via OTP first." });
      return;
    }
    
    const pwdStrength = checkPasswordStrength(regPassword);
    if (!pwdStrength.isValid) {
      setStatusMessage({ type: "error", text: "Password must be at least 8 chars long with 1 uppercase, 1 lowercase, 1 number, and 1 special character." });
      return;
    }

    if (regConfirmPassword !== regPassword) {
      setStatusMessage({ type: "error", text: "Passwords do not match. Please re-enter your password." });
      return;
    }

    try {
      const res = await fetch("/api/auth/register-patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          dob: regDob,
          gender: regGender,
          bloodGroup: regBloodGroup,
          heightCm: regHeight,
          weightKg: regWeight,
          emergencyContactName: regContactName,
          emergencyContactPhone: regContactPhone,
          otpVerified: true
        }),
      });
      const data = await parseResponseSafe<any>(res, { success: false, message: "Registration service unavailable." });
      if (!res.ok || !data || data.success === false) {
        setStatusMessage({ type: "error", text: data?.message || "Registration failed." });
        return;
      }
      onLoginSuccess(data.user, "PATIENT");
    } catch (err) {
      setStatusMessage({ type: "error", text: "Registration failed. Please check network." });
    }
  };

  const roleTabs = [
    { role: "PATIENT", label: "Patient", icon: User },
    { role: "DOCTOR", label: "Doctor", icon: Stethoscope },
    { role: "HOSPITAL_ADMIN", label: "Hospital", icon: Building2 },
    { role: "SUPER_ADMIN", label: "Admin", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen font-sans flex flex-col lg:flex-row selection:bg-[#17C964]/30 selection:text-slate-900">
      {/* Back to home */}
      {onBackToHome && (
        <button
          onClick={onBackToHome}
          className="absolute top-5 left-5 z-20 px-3.5 py-2 bg-white/90 hover:bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-bold transition flex items-center space-x-2 shadow-sm backdrop-blur"
        >
          <span>← Back</span>
        </button>
      )}

      {/* LEFT BRAND PANEL */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[42%] relative flex-col justify-between p-10 overflow-hidden text-white"
           style={{ backgroundColor: C.navy }}>
        {/* subtle glow accents */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -top-32 -right-24 w-96 h-96 rounded-full blur-[110px]" style={{ backgroundColor: "rgba(23,201,100,0.22)" }} />
          <div className="absolute bottom-0 -left-24 w-80 h-80 rounded-full blur-[100px]" style={{ backgroundColor: "rgba(23,201,100,0.12)" }} />
        </div>

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ backgroundColor: C.neon }}>
            <Activity className="w-5 h-5" style={{ color: "#06130B" }} />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-white leading-none">NexusHealth</p>
            <p className="text-[10px] font-semibold tracking-[0.22em] uppercase mt-1" style={{ color: C.neonBright }}>
              National Digital Health Stack
            </p>
          </div>
        </div>

        <div className="relative space-y-6">
          <h1 className="text-4xl xl:text-[2.9rem] font-bold leading-[1.12] tracking-tight text-white">
            One health identity for{" "}
            <span style={{ color: C.neonBright }}>every citizen, everywhere.</span>
          </h1>
          <p className="text-[15px] leading-relaxed max-w-md" style={{ color: C.panelMuted }}>
            A secure, portable record that follows you from clinic to hospital to
            emergency room — always consented, always audited.
          </p>

          <div className="space-y-3 pt-1">
            {[
              { icon: Fingerprint, text: "A lifelong, QR-enabled Health ID" },
              { icon: HeartPulse, text: "Critical vitals on first touch" },
              { icon: FileText, text: "Portable records for any provider" },
            ].map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.text} className="flex items-center gap-3 text-sm" style={{ color: C.panelText }}>
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: "rgba(23,201,100,0.14)", color: C.neonBright }}>
                    <Icon className="w-4 h-4" />
                  </span>
                  {b.text}
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-xs" style={{ color: C.panelMuted }}>
          <ShieldCheck className="w-4 h-4" style={{ color: C.neonBright }} />
          256-bit encrypted · Consent-driven · Audited
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8 bg-[#F7F9FB] min-h-screen"
           style={{ backgroundColor: "#F6F8FA" }}>
        <div className="w-full max-w-md">
          {/* Mobile brand mark */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.neon }}>
              <Activity className="w-5 h-5" style={{ color: "#06130B" }} />
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-none">NexusHealth</p>
              <p className="text-[9px] font-semibold tracking-[0.2em] uppercase mt-1" style={{ color: C.neon }}>National Health Stack</p>
            </div>
          </div>

          <div className="bg-white border rounded-2xl p-7 sm:p-8 shadow-sm"
               style={{ borderColor: C.line }}>
            {/* Heading */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                {isRegisterMode ? "Create your account" : "Welcome back"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {isRegisterMode
                  ? "Establish your National Digital Health Identity."
                  : "Sign in to access the NexusHealth portal."}
              </p>
            </div>

            {/* Status Alert */}
            {statusMessage && (
              <div className={`mb-4 p-3 rounded-lg text-xs font-medium border flex items-start gap-2 ${
                statusMessage.type === "success"
                  ? "bg-[#E9FBF1] border-[#17C964]/40 text-[#0EA653]"
                  : "bg-[#FDECE8] border-[#F2603C]/40 text-[#C0392B]"
              }`}>
                {statusMessage.type === "success"
                  ? <CheckCircle2 className="w-4 h-4 text-[#17C964] shrink-0 mt-0.5" />
                  : <ShieldAlert className="w-4 h-4 text-[#E23A2E] shrink-0 mt-0.5" />}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Role tabs (sign-in only) */}
            {!isRegisterMode ? (
              <div className="mb-5">
                <label className="block text-xs font-semibold text-slate-600 mb-2">Sign in as</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {roleTabs.map((item) => {
                    const Icon = item.icon;
                    const isSelected = selectedRole === item.role;
                    return (
                      <button
                        key={item.role}
                        type="button"
                        onClick={() => handleRoleSelect(item.role as UserRole)}
                        className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-lg text-[11px] font-semibold transition border ${
                          isSelected
                            ? "text-white border-transparent shadow-sm"
                            : "text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-800"
                        }`}
                        style={isSelected ? { backgroundColor: C.neon, boxShadow: `0 4px 14px ${C.neon}44` } : undefined}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
                {selectedRole !== "PATIENT" && !isRegisterMode && (
                  <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
                    <Lock className="w-3 h-3" style={{ color: C.neon }} />
                    {selectedRole === "DOCTOR" ? "Doctor" : selectedRole === "HOSPITAL_ADMIN" ? "Hospital" : "Super Admin"} accounts are pre-provisioned — sign in only.
                  </p>
                )}
              </div>
            ) : (
              <div className="mb-5 p-3 rounded-lg text-xs flex items-start gap-2" style={{ backgroundColor: C.neonTint, border: `1px solid ${C.neon}44` }}>
                <User className="w-4 h-4 shrink-0 mt-0.5" style={{ color: C.neon }} />
                <span className="text-slate-700">
                  <span className="font-bold text-slate-900 block">Patient Citizen Registration</span>
                  Self-registration is available for Patient Citizens. Doctors are provisioned by Hospital Admins; Hospitals by Super Admin.
                </span>
              </div>
            )}

            {/* SIGN IN FORM */}
            {!isRegisterMode && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-white border rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition"
                      style={{ borderColor: C.line }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = C.neon)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = C.line)}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-600">Password</label>
                    <span className="text-[11px] font-semibold" style={{ color: C.neonDeep }}>Forgot password?</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full bg-white border rounded-xl pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:ring-2"
                      style={{ borderColor: C.line }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = C.neon)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = C.line)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition hover:brightness-105 flex items-center justify-center gap-2"
                  style={{ backgroundColor: C.neon, boxShadow: `0 6px 18px ${C.neon}55` }}
                >
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {selectedRole === "PATIENT" && (
                  <p className="text-center text-[13px] text-slate-500 pt-1">
                    New to NexusHealth?{" "}
                    <button
                      type="button"
                      onClick={() => { setIsRegisterMode(true); setStatusMessage(null); }}
                      className="font-bold hover:underline"
                      style={{ color: C.neonDeep }}
                    >
                      Create an account
                    </button>
                  </p>
                )}
              </form>
            )}

            {/* REGISTRATION FORM */}
            {isRegisterMode && selectedRole === "PATIENT" && (
              <form onSubmit={handlePatientRegister} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full legal name</label>
                    <input type="text" required value={regName} onChange={(e) => setRegName(e.target.value)}
                      placeholder="Aarav Sharma"
                      className="w-full bg-white border rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none"
                      style={{ borderColor: C.line }} />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-semibold text-slate-600">Email address</label>
                      {isOtpSent && (
                        <button type="button"
                          onClick={() => { setIsOtpSent(false); setIsOtpVerified(false); setOtpCode(""); setSimulatedEmailNotice(null); setStatusMessage({ type: "success", text: "Email unlocked! You can re-enter your email address." }); }}
                          className="text-[11px] font-bold underline" style={{ color: C.neonDeep }}>↻ Re-enter</button>
                      )}
                    </div>
                    <input type="email" required disabled={isOtpSent} value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="aarav@example.com"
                      className="w-full bg-white border rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none disabled:opacity-60"
                      style={{ borderColor: C.line }} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Create password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} required value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Create a secure password"
                      className="w-full bg-white border rounded-xl pl-3 pr-10 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none"
                      style={{ borderColor: C.line }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="mt-2"><PasswordStrengthMeter passwordVal={regPassword} /></div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-600">Re-enter password</label>
                    {regConfirmPassword && (
                      <span className="text-[11px] font-bold" style={{ color: regConfirmPassword === regPassword ? C.neonDeep : "#dc2626" }}>
                        {regConfirmPassword === regPassword ? "✓ Matches" : "✕ Does not match"}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input type={showConfirmPassword ? "text" : "password"} required value={regConfirmPassword} onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="w-full bg-white border rounded-xl pl-3 pr-10 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none"
                      style={{ borderColor: regConfirmPassword && regConfirmPassword !== regPassword ? "#fca5a5" : C.line }} />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* OTP */}
                <div className="border rounded-xl p-4 space-y-3" style={{ borderColor: C.line, backgroundColor: "#FAFBFC" }}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-slate-800">Email verification</p>
                      <p className="text-[11px] text-slate-500">Dispatch a code to verify your email</p>
                    </div>
                    <button type="button" onClick={handleSendOtp} disabled={isSendingOtp}
                      className="px-3 py-1.5 text-[11px] font-bold text-white rounded-lg transition shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ backgroundColor: C.neon }}>
                      {isSendingOtp ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Sending…
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" />{isOtpSent ? "Resend" : "Send code"}</span>
                      )}
                    </button>
                  </div>

                  {isOtpSent && !isSendingOtp && simulatedEmailNotice && (
                    <div className="rounded-lg p-2.5 flex justify-between items-center text-[11px] gap-2" style={{ backgroundColor: C.neonTint, border: `1px solid ${C.neon}44` }}>
                      <span className="font-medium" style={{ color: C.neonDeep }}>✉️ OTP sent to {regEmail}.</span>
                      {simulatedEmailNotice.previewUrl ? (
                        <a href={simulatedEmailNotice.previewUrl} target="_blank" rel="noreferrer"
                          className="px-2.5 py-1 text-white rounded-lg text-[10px] font-bold shrink-0 no-underline" style={{ backgroundColor: C.neon }}>
                          <span className="inline-flex items-center gap-1"><Inbox className="w-3 h-3" />Open inbox</span>
                        </a>
                      ) : (
                        <button type="button" onClick={() => setShowInboxModal(true)}
                          className="px-2.5 py-1 text-white rounded-lg text-[10px] font-bold shrink-0" style={{ backgroundColor: C.neon }}>
                          <span className="inline-flex items-center gap-1"><Inbox className="w-3 h-3" />View sent notice</span>
                        </button>
                      )}
                    </div>
                  )}

                  {isOtpSent && (
                    <div className="flex items-center gap-2 pt-1">
                      <input type="text" placeholder="6-digit code" value={otpCode} onChange={(e) => setOtpCode(e.target.value)}
                        disabled={isOtpVerified}
                        className="flex-1 bg-white border rounded-lg px-3 py-2 text-sm text-slate-900 font-mono outline-none disabled:opacity-60"
                        style={{ borderColor: isOtpVerified ? C.neon : C.line }} />
                      {isOtpVerified ? (
                        <span className="px-4 py-2 text-sm font-bold shrink-0 rounded-lg inline-flex items-center gap-1.5"
                          style={{ backgroundColor: C.neonTint, color: C.neonDeep, border: `1px solid ${C.neon}55` }}>
                          <CheckCircle2 className="w-4 h-4" /> Verified
                        </span>
                      ) : (
                        <button type="button" onClick={handleVerifyOtp} disabled={isVerifyingOtp}
                          className="px-4 py-2 text-sm font-bold text-white rounded-lg transition shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                          style={{ backgroundColor: C.neonDeep }}>
                          {isVerifyingOtp ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              Verifying…
                            </span>
                          ) : "Verify"}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 font-semibold mb-1">DOB</label>
                    <input type="date" value={regDob} onChange={(e) => setRegDob(e.target.value)}
                      className="w-full bg-white border rounded-lg px-2 py-1.5 text-sm text-slate-900" style={{ borderColor: C.line }} />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-semibold mb-1">Blood group</label>
                    <select value={regBloodGroup} onChange={(e) => setRegBloodGroup(e.target.value)}
                      className="w-full bg-white border rounded-lg px-2 py-1.5 text-sm text-slate-900" style={{ borderColor: C.line }}>
                      {["Don't Know / Not Tested", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 font-semibold mb-1">Gender</label>
                    <select value={regGender} onChange={(e) => setRegGender(e.target.value)}
                      className="w-full bg-white border rounded-lg px-2 py-1.5 text-sm text-slate-900" style={{ borderColor: C.line }}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!isOtpVerified}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold transition ${
                    isOtpVerified
                      ? "text-white hover:brightness-105"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                  style={isOtpVerified ? { backgroundColor: C.neon, boxShadow: `0 6px 18px ${C.neon}55` } : undefined}
                >
                  Create Health ID account
                </button>

                <p className="text-center text-[13px] text-slate-500 pt-1">
                  Already have an account?{" "}
                  <button type="button" onClick={() => setIsRegisterMode(false)} className="font-bold hover:underline" style={{ color: C.neonDeep }}>
                    Sign in
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* EMAIL INBOX MODAL */}
      {showInboxModal && simulatedEmailNotice && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4 text-slate-900">
            <button onClick={() => setShowInboxModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-900 p-1 rounded-lg bg-slate-100">✕</button>
            <div className="flex items-center gap-3 pb-2 border-b border-slate-200">
              <Mail className="w-6 h-6" style={{ color: C.neonDeep }} />
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <span>Email dispatched</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: C.neonTint, color: C.neonDeep, border: `1px solid ${C.neon}44` }}>LIVE</span>
                </h3>
                <p className="text-xs text-slate-500">Recipient: {simulatedEmailNotice.to}</p>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3">
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span><strong>To:</strong> {simulatedEmailNotice.to}</span>
                <span>Just now</span>
              </div>
              <div className="text-slate-900 font-bold border-b border-slate-200 pb-2">
                Subject: {simulatedEmailNotice.subject || "Your NexusHealth OTP Code"}
              </div>
              <p className="text-slate-700 leading-relaxed">
                Dear Citizen,<br /><br />A 6-digit One-Time Password has been sent to <strong>{simulatedEmailNotice.to}</strong>.
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setShowInboxModal(false)}
                className="px-4 py-2 text-white font-bold rounded-xl text-xs transition hover:brightness-105"
                style={{ backgroundColor: C.neon }}>I'll check my inbox</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
