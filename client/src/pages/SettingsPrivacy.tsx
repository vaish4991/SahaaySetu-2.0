import React, { useState } from 'react';
import { clearAllUserDataApi, clearLocalDraft } from '../services/api';
import { Language, translations } from '../locales/translations';
import {
  ShieldCheck,
  Globe,
  Trash2,
  Lock,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Server
} from 'lucide-react';

interface Props {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  geminiConfigured: boolean;
  onDataCleared: () => void;
}

export const SettingsPrivacy: React.FC<Props> = ({
  language,
  onLanguageChange,
  geminiConfigured,
  onDataCleared
}) => {
  const t = translations[language];
  const [clearing, setClearing] = useState(false);
  const [clearMessage, setClearMessage] = useState<string | null>(null);

  const handleClearData = async () => {
    if (!window.confirm('Are you sure you want to clear all user-created incidents from this session? (Demo scenarios will remain intact).')) {
      return;
    }

    setClearing(true);
    setClearMessage(null);
    try {
      const msg = await clearAllUserDataApi();
      clearLocalDraft();
      setClearMessage(msg || 'All session incident records successfully deleted.');
      onDataCleared();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to clear session data.';
      setClearMessage(msg);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Settings & Privacy Architecture
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review system configuration, localization, consent safeguards, and manage session storage
        </p>
      </div>

      {/* Language Preference Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Globe className="w-5 h-5 text-brand-600" />
          <span>Localization & Language</span>
        </h2>
        <p className="text-xs text-slate-600">
          Select interface language for citizen reporting and incident review.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={() => onLanguageChange('en')}
            className={`p-4 rounded-xl border text-left transition flex items-center justify-between ${
              language === 'en'
                ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <p className="text-sm font-bold text-slate-900">English (India / Global)</p>
              <p className="text-xs text-slate-500 mt-0.5">Standard civic emergency terminology</p>
            </div>
            {language === 'en' && <CheckCircle2 className="w-5 h-5 text-brand-600" />}
          </button>

          <button
            type="button"
            onClick={() => onLanguageChange('hi')}
            className={`p-4 rounded-xl border text-left transition flex items-center justify-between ${
              language === 'hi'
                ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <p className="text-sm font-bold text-slate-900">हिन्दी (Hindi)</p>
              <p className="text-xs text-slate-500 mt-0.5">व्यापक नागरिक आपदा समन्वय हेतु</p>
            </div>
            {language === 'hi' && <CheckCircle2 className="w-5 h-5 text-brand-600" />}
          </button>
        </div>
      </div>

      {/* AI Engine Status Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-brand-600" />
          <span>Gemini Intelligence Layer Status</span>
        </h2>

        <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Operational Mode:</span>
            <span className={`font-mono font-bold px-2 py-0.5 rounded ${
              geminiConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {geminiConfigured ? 'LIVE GOOGLE GEMINI 2.5 FLASH' : 'DETERMINISTIC SIMULATOR'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">API Key Storage:</span>
            <span className="font-mono text-slate-800">Server-Side Environment Only (Never exposed to client)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Schema Enforcement:</span>
            <span className="font-mono text-slate-800">Runtime Zod Validation with Structured JSON</span>
          </div>
        </div>
      </div>

      {/* Privacy Architecture Checklist */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Lock className="w-5 h-5 text-brand-600" />
          <span>Privacy & Security Safeguards</span>
        </h2>

        <div className="space-y-3 text-xs text-slate-700">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Ephemeral In-Memory Media Processing</p>
              <p className="text-slate-600 mt-0.5">
                Uploaded photos and voice notes are handled entirely in transient memory without permanent disk storage.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Strict Medical Consent Barrier</p>
              <p className="text-slate-600 mt-0.5">
                Medical information is never processed or passed to AI unless explicit affirmative consent is checked.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Prompt Injection & Script Neutralization</p>
              <p className="text-slate-600 mt-0.5">
                All inputs pass through pattern-based neutralization filters, preventing prompt overrides or XSS payloads.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Session Data Reset Action */}
      <div className="bg-white rounded-2xl p-6 border border-red-200 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-red-950 flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-red-600" />
          <span>Data Erasure & Reset</span>
        </h2>
        <p className="text-xs text-slate-600">
          Delete all user-submitted incident records and draft data from this session to ensure complete privacy. Pre-configured demonstration fixtures will remain accessible.
        </p>

        {clearMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{clearMessage}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleClearData}
          disabled={clearing}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition shadow-sm"
        >
          <Trash2 className="w-4 h-4" />
          <span>{clearing ? 'Clearing Data...' : t.clearDataBtn}</span>
        </button>
      </div>
    </div>
  );
};
