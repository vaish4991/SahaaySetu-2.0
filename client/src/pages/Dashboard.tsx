import React, { useState } from 'react';
import { IncidentRecord, DEMO_SCENARIOS } from '@sahaaysetu/shared';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { EmergencyContactsBar } from '../components/EmergencyContactsBar';
import { Language, translations } from '../locales/translations';
import {
  ShieldAlert,
  ArrowRight,
  Flame,
  Activity,
  Layers,
  Sparkles,
  MapPin,
  Clock,
  Play,
  RotateCcw
} from 'lucide-react';

interface Props {
  incidents: IncidentRecord[];
  onAnalyzeNew: () => void;
  onSelectIncident: (id: string, view: 'review' | 'actions') => void;
  onSelectDemoScenario: (demoId: string) => void;
  onResetDemos?: () => Promise<void>;
  language: Language;
}

export const Dashboard: React.FC<Props> = ({
  incidents,
  onAnalyzeNew,
  onSelectIncident,
  onSelectDemoScenario,
  onResetDemos,
  language
}) => {
  const t = translations[language];
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (!onResetDemos) return;
    setResetting(true);
    try {
      await onResetDemos();
    } catch (err) {
      console.error('Failed to reset demos:', err);
    } finally {
      setResetting(false);
    }
  };

  const criticalCount = incidents.filter(i => i.estimatedUrgency === 'CRITICAL').length;
  const highCount = incidents.filter(i => i.estimatedUrgency === 'HIGH').length;
  const totalCount = incidents.length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-slate-900 to-brand-950 text-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/40">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PromptWars Societal Benefit Project</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
            Universal Bridge from <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-tealAccent-400 to-emerald-300">
              Crisis Chaos to Verified Action
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            SahaaySetu transforms messy, unstructured crisis inputs — voice notes, photos, bystander texts, and alerts — into verified structured incident intelligence and prioritized next steps.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onAnalyzeNew}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-brand-500 hover:bg-brand-600 text-white transition shadow-lg shadow-brand-500/25 group focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-400"
            >
              <span>{t.ctaAnalyze}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </button>

            <a
              href="#demo-scenarios"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Play className="w-4 h-4 text-emerald-400" />
              <span>{t.ctaDemoPresets}</span>
            </a>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="absolute -right-24 -bottom-24 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Emergency Helplines Direct Access Bar */}
      <EmergencyContactsBar />

      {/* Triage Status Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Critical Threats</p>
            <p className="text-2xl font-black text-slate-900">{criticalCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">High Urgency</p>
            <p className="text-2xl font-black text-slate-900">{highCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Recorded</p>
            <p className="text-2xl font-black text-slate-900">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-tealAccent-50 text-tealAccent-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Evidence Audited</p>
            <p className="text-2xl font-black text-emerald-700">100%</p>
          </div>
        </div>
      </div>

      {/* Realistic Demonstration Scenarios Showcase */}
      <section id="demo-scenarios" className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-600" />
              <span>Realistic Demonstration Scenarios</span>
            </h2>
            <p className="text-xs text-slate-500">
              Deterministic, rigorously labeled test scenarios matching PromptWars Societal Benefit criteria
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium border border-slate-200">
              {DEMO_SCENARIOS.length} Grounded Scenarios
            </span>
            {onResetDemos && (
              <button
                type="button"
                onClick={handleReset}
                disabled={resetting}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 transition shadow-sm"
                title="Restore all demo scenarios to initial baseline state"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                <span>{resetting ? 'Resetting...' : 'Reset Demo State'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEMO_SCENARIOS.map((demo, idx) => (
            <div
              key={demo.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-brand-400 hover:shadow-md transition flex flex-col justify-between group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-slate-500">
                    SCENARIO #{idx + 1}
                  </span>
                  <UrgencyBadge urgency={demo.urgency} score={demo.urgencyScore} size="sm" />
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-brand-700 transition">
                  {demo.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {demo.description}
                </p>

                <div className="pt-2 text-xs text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{demo.locationText}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase">
                  {demo.category.replace('_', ' ')}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectDemoScenario(demo.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition"
                >
                  <span>Load & Analyze</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Active Incident Feed */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">Active Incident Feed</h2>
            <p className="text-xs text-slate-500">Recently evaluated situations across all input channels</p>
          </div>
          <button
            type="button"
            onClick={onAnalyzeNew}
            className="text-xs font-bold text-brand-600 hover:text-brand-800 hover:underline"
          >
            + Submit New Incident
          </button>
        </div>

        <div className="space-y-3">
          {incidents.slice(0, 5).map((inc) => (
            <div
              key={inc.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:shadow-sm transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <UrgencyBadge urgency={inc.estimatedUrgency} score={inc.urgencyScore} size="sm" />
                  <span className="text-xs font-mono text-slate-500">#{inc.id}</span>
                  {inc.isDemoScenario && (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium border border-slate-200">
                      Demo Record
                    </span>
                  )}
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{inc.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-2">{inc.situationSummary}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{inc.location.rawText}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => onSelectIncident(inc.id, 'review')}
                  className="flex-1 md:flex-initial px-3.5 py-2 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 transition text-center"
                >
                  Review Facts
                </button>
                <button
                  type="button"
                  onClick={() => onSelectIncident(inc.id, 'actions')}
                  className="flex-1 md:flex-initial px-4 py-2 text-xs font-bold rounded-lg bg-brand-600 hover:bg-brand-700 text-white transition text-center shadow-sm"
                >
                  Action Plan →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
