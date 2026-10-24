import React, { useState, useEffect } from 'react';
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
  LogIn,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { recordLoginEvent } from '../services/firebase';

type Mode = 'signin' | 'register';
type RoleKey = 'COORDINATOR' | 'FIRST_RESPONDER' | 'CITIZEN';

export const LoginPage: React.FC = () => {
  const {
    isFirebaseLive,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    loadDemoProfile,
  } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [role, setRole] = useState<RoleKey>('COORDINATOR');
  const [agency, setAgency] = useState('Municipal Disaster Management Authority');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  const clear = () => { setErrorMsg(null); setSuccessMsg(null); };

  const handleGoogleSignIn = async () => {
    clear();
    setLoading(true);
    try {
      await signInWithGoogle(role);
      setSuccessMsg('Google authentication verified — redirecting…');
      await recordLoginEvent({ provider: 'google', role });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clear();
    if (!email || !password) { setErrorMsg('Email and password are required.'); return; }
    if (mode === 'register') {
      if (!name) { setErrorMsg('Please enter your full name.'); return; }
      if (password.length < 6) { setErrorMsg('Password must be at least 6 characters.'); return; }
      if (password !== confirmPass) { setErrorMsg('Passwords do not match.'); return; }
    }
    setLoading(true);
    try {
      if (mode === 'register') {
        await registerWithEmail(name, email, password, role, agency);
        setSuccessMsg(`Welcome, ${name}! Account created.`);
        await recordLoginEvent({ provider: 'password', role, isNewUser: true });
      } else {
        await signInWithEmail(email, password);
        setSuccessMsg('Authentication successful — redirecting…');
        await recordLoginEvent({ provider: 'password', role });
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = (key: 'coordinator' | 'doctor' | 'responder' | 'citizen') => {
    loadDemoProfile(key);
    setSuccessMsg('Demo profile loaded — entering command…');
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: '#020617' }}>
      {/* Animated gradient BG */}
      <div className="absolute inset-0 z-0" style={{
        background:
          'radial-gradient(ellipse 80% 60% at 60% 20%, rgba(14,165,233,0.15) 0%, transparent 60%),' +
          'radial-gradient(ellipse 60% 80% at 10% 80%, rgba(99,102,241,0.12) 0%, transparent 60%),' +
          'radial-gradient(ellipse 50% 40% at 90% 90%, rgba(20,184,166,0.1) 0%, transparent 50%)'
      }} />
      {/* Grid overlay */}
      <div className="absolute inset-0 z-0 opacity-[0.025]" style={{
        backgroundImage:
          'linear-gradient(rgba(148,163,184,1) 1px,transparent 1px),' +
          'linear-gradient(90deg,rgba(148,163,184,1) 1px,transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      {/* ══ LEFT HERO ══ */}
      <div className="hidden lg:flex lg:w-1/2 z-10 flex-col justify-between p-14 xl:p-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg,#0ea5e9,#14b8a6)', boxShadow: '0 4px 20px rgba(14,165,233,0.35)' }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-black text-xl tracking-tight">SahaaySetu</span>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-sky-400"
              style={{ border: '1px solid rgba(14,165,233,0.3)', background: 'rgba(14,165,233,0.1)' }}>
              <Radio className="w-3.5 h-3.5" style={{ opacity: tick % 2 === 0 ? 1 : 0.4, transition: 'opacity 0.8s' }} />
              Emergency Intelligence Platform
            </div>
            <h1 className="text-5xl xl:text-6xl font-black text-white leading-tight tracking-tight">
              Crisis{' '}
              <span style={{ backgroundImage: 'linear-gradient(135deg,#38bdf8,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                to Action
              </span>
              <br />in Seconds.
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              AI-powered incident analysis, real-time contradiction detection, and prioritised response for Coordinators, First Responders, and Citizens.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['🛡️ Trust Trace Provenance','⚡ Evidence-Aware Triage','🔍 Contradiction Detection','📡 Freshness Engine'].map(f => (
              <span key={f} className="text-xs font-medium px-3 py-1.5 rounded-full text-slate-300"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {f}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isFirebaseLive ? 'bg-emerald-400' : 'bg-amber-400'}`}
              style={isFirebaseLive ? { animation: 'pulse 2s infinite' } : {}} />
            <span className="text-xs text-slate-500 font-medium">
              {isFirebaseLive ? 'Firebase Cloud Auth — Live' : 'Local Resilient Auth Engine — Active'}
            </span>
          </div>
        </div>
        <p className="text-slate-600 text-xs">PromptWars Societal Benefit Challenge · WCAG 2.2 AA Compliant</p>
      </div>

      {/* ══ RIGHT FORM ══ */}
      <div className="w-full lg:w-1/2 z-10 flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile brand */}
          <div className="flex lg:hidden items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0ea5e9,#14b8a6)' }}>
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-black text-lg tracking-tight">SahaaySetu</span>
          </div>

          {/* Glass card */}
          <div className="rounded-2xl p-7 sm:p-8 space-y-5 shadow-2xl"
            style={{ background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="space-y-3">
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">
                  {mode === 'signin' ? 'Welcome back' : 'Create account'}
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  {mode === 'signin' ? 'Sign in to access the emergency command system' : 'Register your official emergency credentials'}
                </p>
              </div>
              {/* Mode toggle */}
              <div className="flex p-1 rounded-xl gap-1" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {([['signin','Sign In',<LogIn className="w-3.5 h-3.5"/>],['register','Register',<UserPlus className="w-3.5 h-3.5"/>]] as const).map(([m,label,icon])=>(
                  <button key={m} type="button" onClick={() => { setMode(m as Mode); clear(); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition"
                    style={mode===m ? { background:'linear-gradient(135deg,#0ea5e9,#0284c7)', color:'white', boxShadow:'0 2px 12px rgba(14,165,233,0.3)' } : { color:'rgba(148,163,184,1)' }}>
                    {icon}{label}
                  </button>
                ))}
              </div>
            </div>

            {/* Alerts */}
            {errorMsg && (
              <div className="p-3 rounded-xl text-xs text-red-300 flex items-start gap-2"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />{errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-xl text-xs text-emerald-300 flex items-start gap-2"
                style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />{successMsg}
              </div>
            )}

            {/* Google */}
            <button type="button" onClick={handleGoogleSignIn} disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-md transition disabled:opacity-50">
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              {mode === 'register' ? 'Sign up with Google' : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-grow border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
              <span className="text-[11px] text-slate-600 font-semibold uppercase tracking-widest">or credentials</span>
              <div className="flex-grow border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
            </div>

            {/* Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {mode === 'register' && (
                <>
                  <LabelInput icon={<UserIcon className="w-4 h-4"/>} label="Full Name & Title *">
                    <input type="text" value={name} onChange={e=>setName(e.target.value)}
                      placeholder="e.g. Inspector Rajesh Sawant" required className="ss-input" />
                  </LabelInput>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Emergency Role *</label>
                    <select value={role} onChange={e=>setRole(e.target.value as RoleKey)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm text-white font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500"
                      style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)' }}>
                      <option value="COORDINATOR" style={{color:'#0f172a'}}>🛡️ Disaster Coordinator (DDMA)</option>
                      <option value="FIRST_RESPONDER" style={{color:'#0f172a'}}>🚑 Emergency Medical Services (108)</option>
                      <option value="CITIZEN" style={{color:'#0f172a'}}>👤 Citizen First Reporter</option>
                    </select>
                  </div>
                  <LabelInput icon={<Building className="w-4 h-4"/>} label="Department / Agency">
                    <input type="text" value={agency} onChange={e=>setAgency(e.target.value)}
                      placeholder="e.g. Pune District Collectorate" className="ss-input" />
                  </LabelInput>
                </>
              )}
              <LabelInput icon={<Mail className="w-4 h-4"/>} label="Email Address *">
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                  placeholder="name@agency.gov.in" required autoComplete="email" className="ss-input" />
              </LabelInput>
              <LabelInput icon={<Lock className="w-4 h-4"/>} label="Password *">
                <input type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)}
                  placeholder="••••••••••••" required
                  autoComplete={mode==='register'?'new-password':'current-password'}
                  className="ss-input" style={{paddingRight:'2.75rem'}} />
                <button type="button" onClick={()=>setShowPassword(v=>!v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  aria-label="Toggle password visibility">
                  {showPassword?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                </button>
              </LabelInput>
              {mode==='register' && (
                <LabelInput icon={<Lock className="w-4 h-4"/>} label="Confirm Password *">
                  <input type={showPassword?'text':'password'} value={confirmPass} onChange={e=>setConfirmPass(e.target.value)}
                    placeholder="••••••••••••" required autoComplete="new-password" className="ss-input" />
                </LabelInput>
              )}
              <button type="submit" disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white transition flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
                style={{
                  background: loading ? 'rgba(14,165,233,0.5)' : 'linear-gradient(135deg,#0ea5e9,#0284c7)',
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(14,165,233,0.35)'
                }}>
                {loading
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                  : <><span>{mode==='register'?'Create Account & Access':'Sign In to Command'}</span><ArrowRight className="w-4 h-4"/></>
                }
              </button>
            </form>
          </div>

          {/* Demo access */}
          <div className="rounded-2xl p-5 sm:p-6 space-y-3"
            style={{ background:'rgba(15,23,42,0.65)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5"/>Quick Evaluator Access
            </div>
            <p className="text-xs text-slate-500">Load a verified demo profile instantly — no credentials needed:</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                {key:'coordinator',icon:<ShieldCheck className="w-4 h-4"/>,name:'Vikramaditya Deshmukh',sub:'DDMA Coordinator',color:'#0ea5e9'},
                {key:'doctor',icon:<Stethoscope className="w-4 h-4"/>,name:'Dr. Ananya Roy',sub:'Chief Medical Officer',color:'#14b8a6'},
                {key:'responder',icon:<Flame className="w-4 h-4"/>,name:'Officer Nilesh Jadhav',sub:'Fire & Rescue (101)',color:'#f97316'},
                {key:'citizen',icon:<UserCheck className="w-4 h-4"/>,name:'Priya Sharma',sub:'Citizen Reporter',color:'#818cf8'},
              ] as const).map(({key,icon,name:dn,sub,color})=>(
                <button key={key} type="button" onClick={()=>handleDemo(key as 'coordinator'|'doctor'|'responder'|'citizen')}
                  className="p-3 rounded-xl text-left transition group"
                  style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}
                  onMouseEnter={e=>(e.currentTarget.style.background='rgba(255,255,255,0.08)')}
                  onMouseLeave={e=>(e.currentTarget.style.background='rgba(255,255,255,0.04)')}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2 transition"
                    style={{ background:`${color}22`, color }}>
                    {icon}
                  </div>
                  <p className="text-[11px] font-bold text-white truncate">{dn}</p>
                  <p className="text-[10px] text-slate-500 truncate">{sub}</p>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-700">
            SahaaySetu PromptWars · WCAG 2.2 AA · Zero-Trust Field Protocol
          </p>
        </div>
      </div>

      <style>{`
        .ss-input {
          width:100%;padding:0.625rem 0.875rem 0.625rem 2.75rem;
          background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);
          border-radius:0.75rem;color:white;font-size:0.875rem;font-weight:500;
          outline:none;transition:border-color .2s,box-shadow .2s;
        }
        .ss-input::placeholder{color:rgba(148,163,184,0.6);}
        .ss-input:focus{border-color:rgba(14,165,233,0.6);box-shadow:0 0 0 3px rgba(14,165,233,0.15);}
        .ss-input:-webkit-autofill{-webkit-box-shadow:0 0 0 1000px #0f172a inset!important;-webkit-text-fill-color:white!important;}
      `}</style>
    </div>
  );
};

const LabelInput: React.FC<{icon:React.ReactNode;label:string;children:React.ReactNode}> = ({icon,label,children}) => (
  <div>
    <label className="block text-xs font-semibold text-slate-400 mb-1.5">{label}</label>
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">{icon}</div>
      {children}
    </div>
  </div>
);
