import React, { useState } from "react";
import { UserRole, HospitalProfile } from "../types";
import { Activity, User, Stethoscope, Building2, ShieldCheck, Mail, Lock, ShieldAlert, CheckCircle2, ArrowRight, Eye, EyeOff, Inbox, Sparkles } from "lucide-react";
import { checkPasswordStrength } from "../utils/validation";
import { parseResponseSafe } from "../utils/api";

interface LoginPageProps {
  hospitals: HospitalProfile[];
  onLoginSuccess: (user: any, role: UserRole) => void;
  onBackToHome?: () => void;
  initialRole?: UserRole;
  initialRegister?: boolean;
}

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
  const [simulatedEmailNotice, setSimulatedEmailNotice] = useState<any | null>(null);
  const [showInboxModal, setShowInboxModal] = useState(false);

  // Show/Hide password toggles
  const [showPassword, setShowPassword] = useState(false);

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

  // Quick 1-Click Fill & Login
  const handleQuickDemoLogin = async (emailVal: string, passVal: string, roleVal: UserRole) => {
    setSelectedRole(roleVal);
    setIsRegisterMode(false);
    setLoginEmail(emailVal);
    setLoginPassword(passVal);
    setStatusMessage({ type: "success", text: `Authenticating demo account for ${roleVal}...` });

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailVal,
          password: passVal,
          role: roleVal
        }),
      });
      const data = await parseResponseSafe<any>(res, { success: false, message: "Authentication service unavailable." });
      if (!res.ok || !data || data.success === false) {
        setStatusMessage({ type: "error", text: data?.message || "Authentication failed." });
        return;
      }
      onLoginSuccess(data.user, roleVal);
    } catch (err) {
      setStatusMessage({ type: "error", text: "Login service error. Please try again." });
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
    if (!regEmail.trim()) {
      setStatusMessage({ type: "error", text: "Please enter your email to receive verification OTP." });
      return;
    }
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
      setIsOtpSent(true);
      setSimulatedEmailNotice(data.emailDetails || data.simulatedEmail);
      setStatusMessage({ type: "success", text: `Verification email sent to ${regEmail.trim()}. Please check your inbox.` });
    } catch (err) {
      setStatusMessage({ type: "error", text: "Error dispatching OTP code via SMTP." });
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      setStatusMessage({ type: "error", text: "Please enter the 6-digit OTP code." });
      return;
    }
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
      setStatusMessage({ type: "error", text: "Error verifying OTP code." });
    }
  };

  // Password strength render component
  const PasswordStrengthMeter: React.FC<{ passwordVal: string }> = ({ passwordVal }) => {
    const strength = checkPasswordStrength(passwordVal);
    if (!passwordVal) return null;

    return (
      <div className="bg-[#0D121F] border border-slate-800 rounded-xl p-3 text-[11px] space-y-1.5 font-mono text-slate-300">
        <div className="flex justify-between items-center font-bold">
          <span>Password Strength Check:</span>
          <span className={strength.isValid ? "text-emerald-400" : "text-amber-400"}>
            {strength.isValid ? "✅ STRONG" : "⚠️ WEAK"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-[10px]">
          <div className={strength.minLength ? "text-emerald-400 font-bold" : "text-slate-500"}>
            <span>{strength.minLength ? "✓" : "✗"} 8+ characters</span>
          </div>
          <div className={strength.hasUpper ? "text-emerald-400 font-bold" : "text-slate-500"}>
            <span>{strength.hasUpper ? "✓" : "✗"} 1 Uppercase (A-Z)</span>
          </div>
          <div className={strength.hasLower ? "text-emerald-400 font-bold" : "text-slate-500"}>
            <span>{strength.hasLower ? "✓" : "✗"} 1 Lowercase (a-z)</span>
          </div>
          <div className={strength.hasNumber ? "text-emerald-400 font-bold" : "text-slate-500"}>
            <span>{strength.hasNumber ? "✓" : "✗"} 1 Number (0-9)</span>
          </div>
          <div className="col-span-2 text-left">
            <span className={strength.hasSpecial ? "text-emerald-400 font-bold" : "text-slate-500"}>
              {strength.hasSpecial ? "✓" : "✗"} 1 Special character (!@#$%^&*)
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

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-slate-100 flex flex-col items-center justify-center p-4 font-sans selection:bg-purple-600 selection:text-white relative">
      {onBackToHome && (
        <button
          onClick={onBackToHome}
          className="absolute top-6 left-6 px-4 py-2 bg-[#13192B] hover:bg-slate-800 text-purple-300 border border-slate-800 rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-md"
        >
          <span>← Back to Main Page</span>
        </button>
      )}

      <div className="w-full max-w-xl space-y-6 my-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 rounded-2xl shadow-xl shadow-purple-600/30 mb-1 border border-purple-400/30">
            <Activity className="w-9 h-9 text-white" />
          </div>

          <div className="space-y-1">
            <span className="inline-block px-3 py-1 bg-purple-950/80 border border-purple-500/40 text-purple-300 text-[11px] font-mono font-bold tracking-widest uppercase rounded-full">
              NATIONAL DIGITAL HEALTH MISSION
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              NexusHealth Gateway
            </h1>
          </div>

          {/* Quotation Banner */}
          <div className="bg-[#13192B] border border-slate-800 rounded-2xl p-4 shadow-md max-w-lg mx-auto space-y-1 relative overflow-hidden">
            <p className="text-sm sm:text-base font-bold text-purple-300 italic tracking-wide">
              “One Nation. One Health Identity. Infinite Care.”
            </p>
            <p className="text-xs text-slate-400">
              Unified, Interoperable & Portable Electronic Health Records for Every Citizen
            </p>
          </div>
        </div>

        {/* Quick Demo Login Bar */}
        {!isRegisterMode && (
          <div className="bg-[#13192B] border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-purple-300 font-bold">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Quick 1-Click Demo Login Accounts:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              <button
                onClick={() => handleQuickDemoLogin("ananya.sharma@nexus.org", "PatientPass123!", "PATIENT")}
                className="px-2 py-2 bg-[#0D121F] hover:bg-slate-800 border border-sky-500/30 text-sky-300 rounded-xl font-bold text-[11px] flex flex-col items-center justify-center transition shadow-xs text-center"
              >
                <span className="text-[9px] text-sky-400 font-mono">PATIENT 1</span>
                <span className="truncate w-full font-bold">Ananya S.</span>
              </button>

              <button
                onClick={() => handleQuickDemoLogin("rohan.verma@nexus.org", "PatientPass123!", "PATIENT")}
                className="px-2 py-2 bg-[#0D121F] hover:bg-slate-800 border border-sky-500/30 text-sky-300 rounded-xl font-bold text-[11px] flex flex-col items-center justify-center transition shadow-xs text-center"
              >
                <span className="text-[9px] text-sky-400 font-mono">PATIENT 2</span>
                <span className="truncate w-full font-bold">Rohan V.</span>
              </button>

              <button
                onClick={() => handleQuickDemoLogin("dr.rajesh@apollo.org", "DoctorPass123!", "DOCTOR")}
                className="px-2 py-2 bg-[#0D121F] hover:bg-slate-800 border border-emerald-500/30 text-emerald-300 rounded-xl font-bold text-[11px] flex flex-col items-center justify-center transition shadow-xs text-center"
              >
                <span className="text-[9px] text-emerald-400 font-mono">DOCTOR</span>
                <span className="truncate w-full font-bold">Dr. Rajesh</span>
              </button>

              <button
                onClick={() => handleQuickDemoLogin("admin@apollo.org", "HospitalPass123!", "HOSPITAL_ADMIN")}
                className="px-2 py-2 bg-[#0D121F] hover:bg-slate-800 border border-indigo-500/30 text-indigo-300 rounded-xl font-bold text-[11px] flex flex-col items-center justify-center transition shadow-xs text-center"
              >
                <span className="text-[9px] text-indigo-400 font-mono">HOSPITAL</span>
                <span className="truncate w-full font-bold">Apollo Admin</span>
              </button>

              <button
                onClick={() => handleQuickDemoLogin("ganeswarikuramdasu@gmail.com", "Admin@Nexus2026!", "SUPER_ADMIN")}
                className="px-2 py-2 bg-[#0D121F] hover:bg-slate-800 border border-purple-500/30 text-purple-300 rounded-xl font-bold text-[11px] flex flex-col items-center justify-center transition shadow-xs text-center col-span-2 sm:col-span-1"
              >
                <span className="text-[9px] text-purple-400 font-mono">SUPER ADMIN</span>
                <span className="truncate w-full font-bold">Super Admin</span>
              </button>
            </div>
          </div>
        )}

        {/* Role Selection Tabs (4 tabs on Sign In page; Removed on Registration page) */}
        {!isRegisterMode ? (
          <div className="bg-[#13192B] border border-slate-800 rounded-2xl p-1.5 grid grid-cols-4 gap-1 text-xs shadow-md">
            {[
              { role: "PATIENT", label: "Patient", icon: User },
              { role: "DOCTOR", label: "Doctor", icon: Stethoscope },
              { role: "HOSPITAL_ADMIN", label: "Hospital", icon: Building2 },
              { role: "SUPER_ADMIN", label: "Super Admin", icon: ShieldCheck },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = selectedRole === item.role;
              return (
                <button
                  key={item.role}
                  onClick={() => handleRoleSelect(item.role as UserRole)}
                  className={`flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1.5 py-2.5 px-2 rounded-xl font-bold transition relative ${
                    isSelected
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex flex-col sm:flex-row items-center space-x-1">
                    <span>{item.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#13192B] border border-purple-500/30 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between text-xs gap-2 shadow-md">
            <div className="flex items-center space-x-2 text-purple-300 font-bold">
              <User className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Citizen Patient Registration (Digital Health Identity)</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Doctor, Hospital & Admin accounts are pre-provisioned
            </span>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-[#13192B] border border-slate-800 rounded-3xl p-6 sm:p-8 text-slate-100 shadow-2xl space-y-6">
          
          {/* Status Alert Banner */}
          {statusMessage && (
            <div
              className={`p-4 rounded-2xl text-xs font-medium border flex items-start space-x-2 ${
                statusMessage.type === "success"
                  ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                  : "bg-rose-950/60 border-rose-500/40 text-rose-300"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Mode Switch Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-200">
                {isRegisterMode ? "New Patient Registration (Digital Health ID)" : `Sign In as ${selectedRole.replace("_", " ")}`}
              </span>
            </div>

            {selectedRole === "PATIENT" ? (
              <button
                type="button"
                onClick={() => {
                  const nextMode = !isRegisterMode;
                  setIsRegisterMode(nextMode);
                  if (nextMode) {
                    setSelectedRole("PATIENT");
                  }
                  setStatusMessage(null);
                }}
                className="px-3 py-1.5 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 rounded-xl font-bold transition flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>{isRegisterMode ? "Already registered? Sign In" : "Register New Patient"}</span>
              </button>
            ) : (
              <span className="px-3 py-1 bg-slate-900 border border-slate-700/80 text-slate-400 text-[11px] font-mono font-bold rounded-lg flex items-center space-x-1">
                <Lock className="w-3 h-3 text-amber-400" />
                <span>Sign In Only (Self-Registration Disabled)</span>
              </span>
            )}
          </div>

          {/* SIGN IN FORM */}
          {!isRegisterMode && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder={
                      selectedRole === "SUPER_ADMIN"
                        ? "ganeswarikuramdasu@gmail.com"
                        : selectedRole === "DOCTOR"
                        ? "dr.rajesh@apollo.org"
                        : selectedRole === "HOSPITAL_ADMIN"
                        ? "admin@apollo.org"
                        : "ananya.sharma@nexus.org"
                    }
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-slate-500 focus:border-purple-500/50 outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Account Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-slate-500 focus:border-purple-500/50 outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 transition"
                    title={showPassword ? "Hide Password" : "Show Password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl transition shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2 text-sm"
              >
                <span>Authorize & Access Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* PATIENT REGISTRATION FORM */}
          {isRegisterMode && selectedRole === "PATIENT" && (
            <form onSubmit={handlePatientRegister} className="space-y-4 text-xs">
              <div className="bg-[#0D121F] border border-purple-500/30 rounded-2xl p-3.5 text-xs text-purple-200 flex items-start space-x-2.5">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Citizen Digital Health ID Registration</span>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Self-registration is available exclusively for Patient Citizens to establish their National Digital Health Identity. Doctors are provisioned by Hospital Administrators, and Hospitals are provisioned by Super Admin.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Aarav Sharma"
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block font-bold text-slate-300">Email Address</label>
                    {isOtpSent && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsOtpSent(false);
                          setIsOtpVerified(false);
                          setOtpCode("");
                          setSimulatedEmailNotice(null);
                          setStatusMessage({ type: "success", text: "Email unlocked! You can now re-enter or edit your email address." });
                        }}
                        className="text-[10px] text-purple-400 hover:text-purple-300 underline font-bold"
                      >
                        ✏️ Re-enter
                      </button>
                    )}
                  </div>
                  <input
                    type="email"
                    required
                    disabled={isOtpSent}
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="aarav@example.com"
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500/50 disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Create Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create secure password"
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl pl-3 pr-10 py-2 text-white outline-none focus:border-purple-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="mt-2">
                  <PasswordStrengthMeter passwordVal={regPassword} />
                </div>
              </div>

              {/* OTP Dispatch & Verify Section */}
              <div className="bg-[#0D121F] border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-200 block">Mandatory Email Verification</span>
                    <span className="text-[10px] text-slate-400">Dispatch verification code to email</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="px-3 py-1.5 bg-purple-950/80 hover:bg-purple-900/80 text-purple-300 border border-purple-500/40 rounded-xl font-bold transition flex items-center space-x-1"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{isOtpSent ? "Resend OTP Code" : "Send Verification OTP"}</span>
                  </button>
                </div>

                {isOtpSent && simulatedEmailNotice && (
                  <div className="bg-sky-950/60 border border-sky-500/40 rounded-xl p-2.5 flex justify-between items-center text-[11px]">
                    <span className="text-sky-300 font-medium">📧 OTP Email sent to {regEmail}.</span>
                    <button
                      type="button"
                      onClick={() => setShowInboxModal(true)}
                      className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold flex items-center space-x-1 transition shrink-0"
                    >
                      <Inbox className="w-3.5 h-3.5" />
                      <span>Open Email Inbox</span>
                    </button>
                  </div>
                )}

                {isOtpSent && (
                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="text"
                      placeholder="Enter 6-Digit OTP"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full bg-[#13192B] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shrink-0 transition"
                    >
                      Verify Code
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 font-bold mb-1">DOB</label>
                  <input
                    type="date"
                    value={regDob}
                    onChange={(e) => setRegDob(e.target.value)}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-2 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 font-bold mb-1">Blood Group</label>
                  <select
                    value={regBloodGroup}
                    onChange={(e) => setRegBloodGroup(e.target.value)}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-2 py-1.5 text-white"
                  >
                    {["Don't Know / Not Tested", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 font-bold mb-1">Gender</label>
                  <select
                    value={regGender}
                    onChange={(e) => setRegGender(e.target.value)}
                    className="w-full bg-[#0D121F] border border-slate-800 rounded-xl px-2 py-1.5 text-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={!isOtpVerified}
                className={`w-full py-3 font-bold rounded-xl transition ${
                  isOtpVerified
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                }`}
              >
                Create Global Health ID Account
              </button>
            </form>
          )}

        </div>
      </div>

      {/* EMAIL INBOX / DISPATCH STATUS MODAL FOR OTP */}
      {showInboxModal && simulatedEmailNotice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#13192B] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative space-y-4 text-slate-100">
            <button
              onClick={() => setShowInboxModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-[#0D121F]"
            >
              ✕
            </button>
            <div className="flex items-center space-x-3 text-purple-400 pb-2 border-b border-slate-800">
              <Mail className="w-6 h-6" />
              <div>
                <h3 className="font-bold text-white text-base flex items-center space-x-2">
                  <span>Real Email Dispatched</span>
                  <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[10px] rounded-full font-bold">LIVE</span>
                </h3>
                <p className="text-xs text-slate-400">Recipient: {simulatedEmailNotice.to}</p>
              </div>
            </div>

            <div className="bg-[#0D121F] border border-slate-800 rounded-xl p-4 text-xs space-y-3 font-sans">
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span><strong>To:</strong> {simulatedEmailNotice.to}</span>
                <span>Just Now</span>
              </div>
              <div className="text-white font-bold border-b border-slate-800 pb-2">
                Subject: {simulatedEmailNotice.subject || "NexusHealth Digital Identity Verification - Your OTP Code"}
              </div>
              <p className="text-slate-300 leading-relaxed">
                Dear Citizen,
                <br /><br />
                A 6-digit One-Time Password (OTP) has been dispatched to <strong>{simulatedEmailNotice.to}</strong>.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowInboxModal(false)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition"
              >
                I'll Check My Email Inbox
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
