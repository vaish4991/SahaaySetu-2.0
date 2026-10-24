import React, { useState } from 'react';
import {
  Shield,
  Radio,
  Activity,
  Globe,
  FileText,
  Settings as SettingsIcon,
  PlusCircle,
  AlertCircle,
  ShieldCheck,
  CheckSquare,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { Language, translations } from '../locales/translations';
import { useAuth } from '../context/AuthContext';

interface Props {
  currentTab: 'dashboard' | 'submit' | 'review' | 'actions' | 'explorer' | 'settings' | 'auth';
  onSelectTab: (tab: 'dashboard' | 'submit' | 'review' | 'actions' | 'explorer' | 'settings' | 'auth') => void;
  geminiConfigured: boolean;
  hasActiveIncident?: boolean;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export const Navbar: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  geminiConfigured,
  hasActiveIncident = true,
  language,
  onLanguageChange
}) => {
  const t = translations[language];
  const { user, isAuthenticated, signOut } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onSelectTab('dashboard')}
            tabIndex={0}
            role="button"
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSelectTab('dashboard');
            }}
            aria-label="SahaaySetu Home"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-tealAccent-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition">
              <Shield className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white">
                  SahaaySetu
                </span>
                <span className="text-xs bg-slate-800 text-brand-300 px-2 py-0.5 rounded-full font-mono border border-slate-700">
                  PromptWars
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                The AI Crisis-to-Action Bridge
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
            <button
              type="button"
              onClick={() => onSelectTab('dashboard')}
              aria-current={currentTab === 'dashboard' ? 'page' : undefined}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400 ${
                currentTab === 'dashboard'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Activity className="w-4 h-4" aria-hidden="true" />
              <span>{t.navDashboard}</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('submit')}
              aria-current={currentTab === 'submit' ? 'page' : undefined}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400 ${
                currentTab === 'submit'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-brand-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-brand-400" aria-hidden="true" />
              <span>{t.navSubmit}</span>
            </button>

            {hasActiveIncident && (
              <>
                <button
                  type="button"
                  onClick={() => onSelectTab('review')}
                  aria-current={currentTab === 'review' ? 'page' : undefined}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-teal-400 ${
                    currentTab === 'review'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-teal-400" aria-hidden="true" />
                  <span>{t.navReview}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectTab('actions')}
                  aria-current={currentTab === 'actions' ? 'page' : undefined}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                    currentTab === 'actions'
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <CheckSquare className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  <span>{t.navActions}</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => onSelectTab('explorer')}
              aria-current={currentTab === 'explorer' ? 'page' : undefined}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400 ${
                currentTab === 'explorer'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" aria-hidden="true" />
              <span>{t.navExplorer}</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('settings')}
              aria-current={currentTab === 'settings' ? 'page' : undefined}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400 ${
                currentTab === 'settings'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <SettingsIcon className="w-4 h-4" aria-hidden="true" />
              <span>{t.navSettings}</span>
            </button>
          </nav>

          {/* Status Badges, Language Selector & User Profile */}
          <div className="flex items-center gap-3">
            {/* Live Gemini vs Demo Mode Indicator */}
            <div
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                geminiConfigured
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                  : 'bg-amber-950/70 text-amber-300 border-amber-800'
              }`}
              title={
                geminiConfigured
                  ? 'Live Gemini API configured and active on server'
                  : 'Operating in Deterministic Demo Mode. Provide GEMINI_API_KEY in server/.env for live calls.'
              }
            >
              <Radio className={`w-3 h-3 ${geminiConfigured ? 'animate-pulse text-emerald-400' : 'text-amber-400'}`} />
              <span>{geminiConfigured ? 'Live Gemini AI' : 'Demo Simulator'}</span>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-1" aria-hidden="true" />
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`px-2 py-1 text-xs font-bold rounded-md transition ${
                  language === 'en'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                aria-pressed={language === 'en'}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('hi')}
                className={`px-2 py-1 text-xs font-bold rounded-md transition ${
                  language === 'hi'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
                aria-pressed={language === 'hi'}
              >
                हिन्दी
              </button>
            </div>

            {/* User Profile / Sign In Section */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-2 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 rounded-xl transition group"
                  aria-expanded={profileDropdownOpen}
                  aria-label="User profile options"
                >
                  <img
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=0284c7&color=fff`}
                    alt={user.displayName || 'Profile'}
                    className="w-7 h-7 rounded-lg object-cover border border-slate-600"
                  />
                  <div className="hidden xl:block text-left text-xs max-w-[120px]">
                    <p className="font-bold text-white truncate leading-tight">
                      {user.displayName}
                    </p>
                    <p className="text-[10px] text-brand-300 truncate font-mono">
                      {user.role}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition mr-1" />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 text-white space-y-3 animate-fadeIn">
                    <div className="border-b border-slate-800 pb-2.5">
                      <p className="text-xs font-bold text-white truncate">{user.displayName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                      <span className="inline-block mt-1.5 text-[10px] font-bold bg-brand-900/60 text-brand-300 border border-brand-700/60 px-2 py-0.5 rounded-full">
                        {user.roleTitle}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onSelectTab('auth');
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition flex items-center gap-2"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-brand-400" />
                        <span>Switch Persona / Re-authenticate</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          signOut();
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition flex items-center gap-2"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onSelectTab('auth')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-600 to-tealAccent-600 hover:from-brand-500 hover:to-tealAccent-500 text-white shadow-sm flex items-center gap-1.5 transition"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Submenu Navigation */}
      <nav aria-label="Mobile Navigation" className="md:hidden bg-slate-950 px-2 py-2 border-t border-slate-800 flex items-center justify-around text-xs overflow-x-auto">
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          aria-current={currentTab === 'dashboard' ? 'page' : undefined}
          className={`px-2 py-1 rounded font-medium shrink-0 focus:outline-none focus:ring-1 focus:ring-brand-400 ${currentTab === 'dashboard' ? 'text-brand-400 font-bold' : 'text-slate-400'}`}
        >
          {t.navDashboard}
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('submit')}
          aria-current={currentTab === 'submit' ? 'page' : undefined}
          className={`px-2 py-1 rounded font-medium shrink-0 focus:outline-none focus:ring-1 focus:ring-brand-400 ${currentTab === 'submit' ? 'text-brand-400 font-bold' : 'text-slate-400'}`}
        >
          {t.navSubmit}
        </button>
        {hasActiveIncident && (
          <>
            <button
              type="button"
              onClick={() => onSelectTab('review')}
              aria-current={currentTab === 'review' ? 'page' : undefined}
              className={`px-2 py-1 rounded font-medium shrink-0 focus:outline-none focus:ring-1 focus:ring-teal-400 ${currentTab === 'review' ? 'text-teal-400 font-bold' : 'text-slate-400'}`}
            >
              {t.navReview}
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('actions')}
              aria-current={currentTab === 'actions' ? 'page' : undefined}
              className={`px-2 py-1 rounded font-medium shrink-0 focus:outline-none focus:ring-1 focus:ring-amber-400 ${currentTab === 'actions' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
            >
              {t.navActions}
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => onSelectTab('explorer')}
          aria-current={currentTab === 'explorer' ? 'page' : undefined}
          className={`px-2 py-1 rounded font-medium shrink-0 focus:outline-none focus:ring-1 focus:ring-brand-400 ${currentTab === 'explorer' ? 'text-brand-400 font-bold' : 'text-slate-400'}`}
        >
          {t.navExplorer}
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('settings')}
          aria-current={currentTab === 'settings' ? 'page' : undefined}
          className={`px-2 py-1 rounded font-medium shrink-0 focus:outline-none focus:ring-1 focus:ring-brand-400 ${currentTab === 'settings' ? 'text-brand-400 font-bold' : 'text-slate-400'}`}
        >
          {t.navSettings}
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('auth')}
          aria-current={currentTab === 'auth' ? 'page' : undefined}
          className={`px-2 py-1 rounded font-medium shrink-0 focus:outline-none focus:ring-1 focus:ring-teal-400 ${currentTab === 'auth' ? 'text-teal-400 font-bold' : 'text-slate-400'}`}
        >
          Account
        </button>
      </nav>
    </header>
  );
};
