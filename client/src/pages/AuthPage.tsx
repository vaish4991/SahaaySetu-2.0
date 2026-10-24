import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  User as UserIcon,
  Building,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Radio,
  ArrowRight,
  Sparkles,
  Stethoscope,
  Flame,
  ShieldCheck,
  UserCheck,
  Key,
  Sliders,
  ChevronDown,
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Language, translations } from '../locales/translations';

interface Props {
  language: Language;
  onAuthSuccess: () => void;
}

export const AuthPage: React.FC<Props> = ({ language, onAuthSuccess }) => {
  const {
    user,
    isAuthenticated,
    isFirebaseLive,
    firebaseConfig,
    updateFirebaseConfig,
    resetFirebaseConfig,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    loadDemoProfile,
    signOut
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [role, setRole] = useState<'COORDINATOR' | 'FIRST_RESPONDER' | 'CITIZEN'>('COORDINATOR');
  const [agency, setAgency] = useState('Municipal Disaster Management Authority');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Custom Firebase Credentials Input State
  const [showFirebaseConfig, setShowFirebaseConfig] = useState(false);
  const [fbApiKey, setFbApiKey] = useState(firebaseConfig?.apiKey || '');
  const [fbAuthDomain, setFbAuthDomain] = useState(firebaseConfig?.authDomain || '');
  const [fbProjectId, setFbProjectId] = useState(firebaseConfig?.projectId || '');
  const [fbStorageBucket, setFbStorageBucket] = useState(firebaseConfig?.storageBucket || '');
  const [fbSenderId, setFbSenderId] = useState(firebaseConfig?.messagingSenderId || '');
  const [fbAppId, setFbAppId] = useState(firebaseConfig?.appId || '');
  const [fbStatusMsg, setFbStatusMsg] = useState<string | null>(null);

  const t = translations[language];

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await signInWithGoogle(role);
      setSuccessMsg('Successfully signed in with Google.');
      setTimeout(() => onAuthSuccess(), 400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in could not be completed.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg('Please provide both email address and password.');
      return;
    }

    if (mode === 'register') {
      if (!name) {
        setErrorMsg('Please enter your full name or official callsign.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password should be at least 6 characters.');
        return;
      }
      if (password !== confirmPass) {
        setErrorMsg('Passwords do not match. Please recheck.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        await registerWithEmail(name, email, password, role, agency);
        setSuccessMsg(`Welcome, ${name}! Your account has been registered and verified.`);
      } else {
        await signInWithEmail(email, password);
        setSuccessMsg('Authentication verified. Welcome back.');
      }
      setTimeout(() => onAuthSuccess(), 500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication error. Please check your credentials.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = (key: 'coordinator' | 'doctor' | 'responder' | 'citizen') => {
    loadDemoProfile(key);
    setSuccessMsg('Loaded active verified profile.');
    setTimeout(() => onAuthSuccess(), 350);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8 animate-fadeIn">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-tealAccent-500 shadow-xl shadow-brand-500/20 text-white mb-2">
          <Shield className="w-9 h-9" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          SahaaySetu Emergency Access Portal
        </h1>
        <p className="text-slate-600 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          Secure identity verification for Civic Coordinators, 108/112 Emergency Responders, and Verified Citizen Reporters.
        </p>

        {/* Firebase Connectivity Status Indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border bg-slate-100 text-slate-700 border-slate-200 mt-2">
          <Radio className={`w-3.5 h-3.5 ${isFirebaseLive ? 'text-emerald-500 animate-pulse' : 'text-brand-500'}`} />
          <span>
            {isFirebaseLive
              ? 'Firebase Cloud Authentication Live'
              : 'Resilient Local Auth Engine (Ready for Firebase Credentials)'}
          </span>
        </div>
      </div>

      {/* Currently Logged In Banner (if active) */}
      {isAuthenticated && user && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <img
              src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'User')}&background=0284c7&color=fff`}
              alt={user.displayName || 'User Avatar'}
              className="w-12 h-12 rounded-xl border border-emerald-300 object-cover shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-sm sm:text-base">
                  {user.displayName}
                </span>
                <span className="text-xs bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                  Active Session
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                {user.roleTitle} • {user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onAuthSuccess}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
            >
              <span>Continue to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => signOut()}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Authentication Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left Form Area (7 cols) */}
        <div className="md:col-span-7 p-6 sm:p-8 space-y-6">
          {/* Sign In vs Register Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition ${
                mode === 'signin'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In (Existing User)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition ${
                mode === 'register'
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account (New User)
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Google 1-Click Sign-In */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-brand-500 rounded-2xl text-slate-800 font-bold text-sm shadow-sm hover:shadow transition disabled:opacity-60 group"
            >
              {/* Google Multicolored SVG Icon */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{mode === 'register' ? 'Sign up with Google' : 'Sign in with Google'}</span>
            </button>
            <p className="text-[11px] text-center text-slate-500">
              One-click secure Google single sign-on with verified disaster agency affiliation
            </p>
          </div>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Or with credentials
            </span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name & Title *
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Inspector Rajesh Sawant"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Emergency Operating Role *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-900"
                  >
                    <option value="COORDINATOR">🛡️ District Disaster Management Coordinator (DDMA / NDRF)</option>
                    <option value="FIRST_RESPONDER">🚑 Emergency Medical Services / Paramedic (108 ACLS)</option>
                    <option value="FIRST_RESPONDER">🚒 Fire & HazMat Response Commander (101)</option>
                    <option value="CITIZEN">👤 Citizen First Reporter / Volunteer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department / Agency / District
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={agency}
                      onChange={(e) => setAgency(e.target.value)}
                      placeholder="e.g. Pune District Collectorate / 108 EMS"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-900"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@agency.gov.in"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-900"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm shadow-md shadow-brand-600/20 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'register' ? 'Create Account & Access Command' : 'Sign In to Emergency Command'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Info & Quick Demo Profiles Area (5 cols) */}
        <div className="md:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8 text-white flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-tealAccent-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Evaluator & Quick Demo Access</span>
            </div>
            <h2 className="text-lg font-black tracking-tight text-white">
              Instant 1-Click Persona Access
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              For testing and demonstration, select an accredited profile below to immediately authenticate without entering credentials:
            </p>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleDemoSelect('coordinator')}
                className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-brand-500 text-left transition flex items-center gap-3 group"
              >
                <div className="w-9 h-9 rounded-lg bg-brand-600/30 text-brand-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">Vikramaditya Deshmukh</p>
                  <p className="text-[11px] text-slate-400 truncate">District Disaster Management (DDMA)</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('doctor')}
                className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-teal-500 text-left transition flex items-center gap-3 group"
              >
                <div className="w-9 h-9 rounded-lg bg-teal-600/30 text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">Dr. Ananya Roy, MD</p>
                  <p className="text-[11px] text-slate-400 truncate">Chief Medical Officer / 108 EMS</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('responder')}
                className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-orange-500 text-left transition flex items-center gap-3 group"
              >
                <div className="w-9 h-9 rounded-lg bg-orange-600/30 text-orange-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <Flame className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">Station Officer Nilesh Jadhav</p>
                  <p className="text-[11px] text-slate-400 truncate">Fire & Rescue Command (101)</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoSelect('citizen')}
                className="w-full p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500 text-left transition flex items-center gap-3 group"
              >
                <div className="w-9 h-9 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">Priya Sharma</p>
                  <p className="text-[11px] text-slate-400 truncate">Citizen First Eyewitness</p>
                </div>
              </button>
            </div>
          </div>

          {/* Governance Footer */}
          <div className="border-t border-slate-800 pt-4 text-[11px] text-slate-500 space-y-1">
            <p className="font-semibold text-slate-400">Security & Privacy Protocol:</p>
            <p>
              Session activity is audited under SahaaySetu Zero-Trust Field Protocol. Medical consent controls apply to all incident modifications.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Firebase Credentials Entry (User Requested) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900">
                  Firebase Cloud Credentials Integration
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isFirebaseLive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {isFirebaseLive ? 'Active Live Firebase' : 'Resilient Fallback Mode'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                You can paste your Firebase web project credentials below to connect live Google OAuth & Auth services.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowFirebaseConfig(!showFirebaseConfig)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{showFirebaseConfig ? 'Hide Firebase Keys' : 'Enter Firebase Credentials'}</span>
            {showFirebaseConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {fbStatusMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{fbStatusMsg}</span>
          </div>
        )}

        {showFirebaseConfig && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const ok = updateFirebaseConfig({
                apiKey: fbApiKey.trim(),
                authDomain: fbAuthDomain.trim(),
                projectId: fbProjectId.trim(),
                storageBucket: fbStorageBucket.trim(),
                messagingSenderId: fbSenderId.trim(),
                appId: fbAppId.trim()
              });
              if (ok) {
                setFbStatusMsg('Firebase credentials saved successfully and live authentication activated!');
              } else {
                setFbStatusMsg('Saved locally. Ensure API Key, Auth Domain, and Project ID are valid to activate cloud sync.');
              }
              setTimeout(() => setFbStatusMsg(null), 4000);
            }}
            className="space-y-4 pt-3 border-t border-slate-100 animate-fadeIn"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  apiKey *
                </label>
                <input
                  type="text"
                  value={fbApiKey}
                  onChange={(e) => setFbApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  authDomain *
                </label>
                <input
                  type="text"
                  value={fbAuthDomain}
                  onChange={(e) => setFbAuthDomain(e.target.value)}
                  placeholder="your-app.firebaseapp.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  projectId *
                </label>
                <input
                  type="text"
                  value={fbProjectId}
                  onChange={(e) => setFbProjectId(e.target.value)}
                  placeholder="your-project-id"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  storageBucket
                </label>
                <input
                  type="text"
                  value={fbStorageBucket}
                  onChange={(e) => setFbStorageBucket(e.target.value)}
                  placeholder="your-app.appspot.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  messagingSenderId
                </label>
                <input
                  type="text"
                  value={fbSenderId}
                  onChange={(e) => setFbSenderId(e.target.value)}
                  placeholder="109283746..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  appId
                </label>
                <input
                  type="text"
                  value={fbAppId}
                  onChange={(e) => setFbAppId(e.target.value)}
                  placeholder="1:109283...:web:abc"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  resetFirebaseConfig();
                  setFbApiKey('');
                  setFbAuthDomain('');
                  setFbProjectId('');
                  setFbStorageBucket('');
                  setFbSenderId('');
                  setFbAppId('');
                  setFbStatusMsg('Reset credentials to project defaults.');
                  setTimeout(() => setFbStatusMsg(null), 3000);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Defaults</span>
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Save & Connect Firebase</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
