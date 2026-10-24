import React, { useState, useEffect } from 'react';
import { IncidentRecord, ActionItem, TrustTrace } from '@sahaaysetu/shared';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { FreshnessBadge } from '../components/FreshnessBadge';
import { TrustTraceDrawer } from '../components/TrustTraceDrawer';
import { EmergencyContactsBar } from '../components/EmergencyContactsBar';
import { updateIncidentApi } from '../services/api';
import { Language, translations } from '../locales/translations';
import {
  ListChecks,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Info,
  Shield,
  Printer,
  ChevronLeft,
  Clock,
  HelpCircle,
  AlertOctagon
} from 'lucide-react';

interface Props {
  incident: IncidentRecord;
  onUpdateIncident: (updated: IncidentRecord) => void;
  onBackToReview: () => void;
  onOpenBrief: () => void;
  language: Language;
}

export const ActionCenter: React.FC<Props> = ({
  incident,
  onUpdateIncident,
  onBackToReview,
  onOpenBrief,
  language
}) => {
  const t = translations[language];
  const [actions, setActions] = useState<ActionItem[]>(incident.recommendedActions);
  const [activeTrustTrace, setActiveTrustTrace] = useState<TrustTrace | null>(null);
  const [activeTraceTitle, setActiveTraceTitle] = useState<string>('');

  // Synchronize actions when incident updates
  useEffect(() => {
    setActions(incident.recommendedActions);
  }, [incident.id, incident.recommendedActions]);

  const toggleActionComplete = async (actionId: string) => {
    const updatedActions = actions.map(a =>
      a.id === actionId ? { ...a, isCompleted: !a.isCompleted } : a
    );
    setActions(updatedActions);

    try {
      const updated = await updateIncidentApi(incident.id, {
        recommendedActions: updatedActions
      });
      onUpdateIncident(updated);
    } catch (err) {
      console.error('Failed to toggle action status:', err);
    }
  };

  const openActionTrace = (act: ActionItem) => {
    const trace: TrustTrace = act.trustTrace || {
      targetId: act.id,
      supportingClaim: act.supportingEvidenceClaim || act.rationale,
      sourceName: incident.userReportedFacts[0]?.trustTrace?.sourceName || incident.subReports[0]?.sourceName || 'Intake Synthesis Matrix',
      sourceType: incident.userReportedFacts[0]?.trustTrace?.sourceType || incident.subReports[0]?.sourceType || 'USER_TEXT',
      eventTime: incident.subReports[0]?.eventObservedAt || incident.userReportedFacts[0]?.trustTrace?.eventTime,
      submissionTime: incident.createdAt,
      evidenceLabel: act.evidenceLabel,
      supportExplanation: act.rationale,
      verificationDetails: act.evidenceLabel === 'SOURCE-VERIFIED'
        ? 'Verified against official emergency communique.'
        : 'Action derived from verified triage matrix; requires on-scene confirmation.',
      hasUnresolvedContradiction: Boolean(act.conflictWarning || act.hasUnresolvedConflict)
    };

    setActiveTrustTrace(trace);
    setActiveTraceTitle(`Step ${act.stepNumber}: ${act.title}`);
  };

  const completedCount = actions.filter(a => a.isCompleted).length;
  const progressPercent = actions.length > 0 ? Math.round((completedCount / actions.length) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Action Center Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBackToReview}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Evidence Review</span>
          </button>

          <div className="flex items-center gap-2">
            {incident.freshness && (
              <FreshnessBadge evaluation={incident.freshness} size="sm" />
            )}
            <button
              type="button"
              onClick={onOpenBrief}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>{t.responderBriefBtn}</span>
            </button>
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Prioritized Crisis Action Center
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Executable next steps prioritized by life safety, hazard mitigation, and responder coordination.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Action Coordination Progress</span>
            <span className="font-mono text-brand-700">{completedCount} of {actions.length} Completed ({progressPercent}%)</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-brand-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Emergency Helplines Direct Contact Bar */}
      <EmergencyContactsBar />

      {/* Strict Conservative Medical & Legal Disclaimer Banner */}
      <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-300 flex items-start gap-3 text-amber-950 text-xs">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Conservative Safety & Emergency Dispatch Notice</p>
          <p className="mt-0.5 leading-relaxed text-amber-900">
            SahaaySetu does NOT automatically dispatch police, ambulances, or fire teams, and NEVER claims physical help is en route. It does not diagnose medical illnesses or prescribe medications. Actions below provide conservative scene safety guidance and escalation protocols.
          </p>
        </div>
      </div>

      {/* Recommended Action Items */}
      <div className="space-y-4">
        {actions.map((act) => {
          const priorityColor = {
            IMMEDIATE: 'bg-red-50 text-red-900 border-red-200',
            HIGH: 'bg-orange-50 text-orange-900 border-orange-200',
            ROUTINE: 'bg-slate-50 text-slate-800 border-slate-200'
          }[act.priority];

          const actionFreshness = act.freshnessStatus || incident.freshness?.status;

          return (
            <div
              key={act.id}
              className={`bg-white rounded-2xl p-6 border transition-all ${
                act.isCompleted
                  ? 'border-emerald-200 bg-emerald-50/20 opacity-80'
                  : act.conflictWarning
                  ? 'border-amber-300 shadow-sm'
                  : 'border-slate-200 hover:border-brand-400 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleActionComplete(act.id)}
                    className="mt-1 p-1 rounded-full text-slate-400 hover:text-brand-600 transition focus-visible:ring-2 focus-visible:ring-brand-500"
                    aria-label={act.isCompleted ? `Mark step ${act.stepNumber} incomplete` : `Mark step ${act.stepNumber} complete`}
                  >
                    {act.isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    ) : (
                      <Circle className="w-6 h-6 hover:text-brand-500" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">
                        STEP {act.stepNumber}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${priorityColor}`}>
                        {act.priority} PRIORITY
                      </span>
                      <EvidenceBadge label={act.evidenceLabel} size="sm" />
                      {actionFreshness && (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                          actionFreshness === 'CURRENT'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : actionFreshness === 'AGING'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : actionFreshness === 'STALE'
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}>
                          {actionFreshness}
                        </span>
                      )}
                      {act.requiresConfirmation && (
                        <span className="text-[11px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium border border-purple-200">
                          Confirmation Required
                        </span>
                      )}
                    </div>

                    <h3 className={`text-lg font-bold ${act.isCompleted ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                      {act.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openActionTrace(act)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition"
                    title="Audit Trust Trace and supporting evidence"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Trust Trace</span>
                  </button>

                  {act.emergencyServiceContact && (
                    <span className="text-xs font-mono font-bold text-red-700 bg-red-100 px-2.5 py-1.5 rounded-lg border border-red-200 hidden sm:inline-block">
                      Dial {act.emergencyServiceContact}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Description & Rationale */}
              <div className="pl-10 mt-3 space-y-3">
                <p className="text-sm text-slate-700 leading-relaxed font-normal">
                  {act.description}
                </p>

                {/* Contradiction Warning */}
                {act.conflictWarning && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-amber-950 text-xs flex items-start gap-2">
                    <AlertOctagon className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Contradiction Caution: </span>
                      <span>{act.conflictWarning}</span>
                    </div>
                  </div>
                )}

                {/* Stale Evidence Warning */}
                {act.staleWarning && (
                  <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-950 text-xs flex items-start gap-2">
                    <Clock className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Freshness Advisory: </span>
                      <span>{act.staleWarning}</span>
                    </div>
                  </div>
                )}

                {/* Supporting Claim */}
                {act.supportingEvidenceClaim && (
                  <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-700 font-mono">
                    <span className="font-sans font-bold text-slate-500">Supporting Evidence Claim: </span>
                    "{act.supportingEvidenceClaim}"
                  </div>
                )}

                {/* Why it matters (Rationale) */}
                <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-800">
                  <span className="font-bold text-slate-900">Why it matters: </span>
                  <span>{act.rationale}</span>
                </div>

                {/* Important Unknowns */}
                {act.importantUnknowns && act.importantUnknowns.length > 0 && (
                  <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-800 flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">Important Unknowns: </span>
                      <span>{act.importantUnknowns.join('; ')}</span>
                    </div>
                  </div>
                )}

                {/* Safety Precautions */}
                {act.safetyPrecautions && (
                  <div className="text-xs bg-red-50/70 p-3 rounded-xl border border-red-200 text-red-950 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Safety Precautions: </span>
                      <span>{act.safetyPrecautions}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust Trace Drawer */}
      <TrustTraceDrawer
        isOpen={Boolean(activeTrustTrace)}
        onClose={() => setActiveTrustTrace(null)}
        trustTrace={activeTrustTrace}
        targetTitle={activeTraceTitle}
      />
    </div>
  );
};
