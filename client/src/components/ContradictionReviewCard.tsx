import React, { useState } from 'react';
import { ContradictionItem, EvidenceLabel } from '@sahaaysetu/shared';
import { EvidenceBadge } from './EvidenceBadge';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Check,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Plus
} from 'lucide-react';

interface Props {
  contradiction: ContradictionItem;
  onResolve: (contradictionId: string, resolution: {
    resolutionRationale: string;
    acceptedClaimId?: string;
    additionalEvidenceSubmitted?: string;
    resolvedBy?: string;
  }) => Promise<void>;
}

export const ContradictionReviewCard: React.FC<Props> = ({ contradiction, onResolve }) => {
  const [isResolving, setIsResolving] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<string>('SYNTHESIS');
  const [rationale, setRationale] = useState('');
  const [additionalEvidence, setAdditionalEvidence] = useState('');
  const [reviewerName, setReviewerName] = useState('Incident Commander Reviewer');
  const [saving, setSaving] = useState(false);

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rationale.trim()) return;

    setSaving(true);
    try {
      await onResolve(contradiction.id, {
        resolutionRationale: rationale.trim(),
        acceptedClaimId: selectedClaim === 'SYNTHESIS' ? undefined : selectedClaim,
        additionalEvidenceSubmitted: additionalEvidence.trim() || undefined,
        resolvedBy: reviewerName.trim()
      });
      setIsResolving(false);
    } catch (err) {
      console.error('Failed to resolve contradiction:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={`rounded-2xl border transition-all ${
        contradiction.isResolved
          ? 'bg-emerald-50/30 border-emerald-300'
          : 'bg-red-50/40 border-red-300 shadow-sm'
      } p-5 space-y-4`}
      role="region"
      aria-label={`Contradiction: ${contradiction.topic}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          {contradiction.isResolved ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
              Contradiction Alert: {contradiction.topic}
            </span>
            <h3 className="text-sm font-extrabold text-slate-900">
              {contradiction.explanation}
            </h3>
          </div>
        </div>

        <div>
          {contradiction.isResolved ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-300">
              <Check className="w-3.5 h-3.5" />
              <span>Resolved</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-bold bg-red-100 text-red-800 px-2.5 py-1 rounded-full border border-red-300 animate-pulse">
              <span>UNRESOLVED CONFLICT</span>
            </span>
          )}
        </div>
      </div>

      {/* Side-by-Side Conflicting Claims */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Claim A */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-2 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-slate-400">CLAIM A</span>
              <EvidenceBadge label={contradiction.claimA.verificationStatus} size="sm" />
            </div>

            <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              "{contradiction.claimA.claimText}"
            </p>

            <div className="space-y-1 text-xs text-slate-500 pt-1">
              <div>Source: <strong className="text-slate-800">{contradiction.claimA.sourceName}</strong></div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Observed: {contradiction.claimA.eventObservedAt ? new Date(contradiction.claimA.eventObservedAt).toLocaleTimeString() : 'Unknown'}</span>
                <span className="opacity-60 ml-1">(Submitted: {new Date(contradiction.claimA.submittedAt).toLocaleTimeString()})</span>
              </div>
              {contradiction.claimA.location && (
                <div className="flex items-center gap-1 text-slate-600 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{contradiction.claimA.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Claim B */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-2 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-slate-400">CLAIM B</span>
              <EvidenceBadge label={contradiction.claimB.verificationStatus} size="sm" />
            </div>

            <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              "{contradiction.claimB.claimText}"
            </p>

            <div className="space-y-1 text-xs text-slate-500 pt-1">
              <div>Source: <strong className="text-slate-800">{contradiction.claimB.sourceName}</strong></div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Observed: {contradiction.claimB.eventObservedAt ? new Date(contradiction.claimB.eventObservedAt).toLocaleTimeString() : 'Unknown'}</span>
                <span className="opacity-60 ml-1">(Submitted: {new Date(contradiction.claimB.submittedAt).toLocaleTimeString()})</span>
              </div>
              {contradiction.claimB.location && (
                <div className="flex items-center gap-1 text-slate-600 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{contradiction.claimB.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resolution Section */}
      {contradiction.isResolved && contradiction.resolution ? (
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 text-xs space-y-1.5">
          <div className="flex items-center justify-between font-bold text-emerald-900">
            <span className="flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Official Resolution Recorded by {contradiction.resolution.resolvedBy}</span>
            </span>
            <span className="font-mono text-[11px] opacity-80">
              {new Date(contradiction.resolution.resolvedAt).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-emerald-950 font-medium">
            <strong>Rationale:</strong> "{contradiction.resolution.resolutionRationale}"
          </p>
          {contradiction.resolution.additionalEvidenceSubmitted && (
            <p className="text-emerald-800">
              <strong>Corroborating Evidence:</strong> {contradiction.resolution.additionalEvidenceSubmitted}
            </p>
          )}
        </div>
      ) : (
        <div className="pt-2">
          {!isResolving ? (
            <button
              type="button"
              onClick={() => setIsResolving(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white transition shadow-sm"
            >
              <span>Record Reviewed Resolution</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          ) : (
            <form onSubmit={handleResolveSubmit} className="bg-white p-4 rounded-xl border border-slate-300 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-800">
                  Record Contradiction Resolution (Original Claims Preserved)
                </span>
                <button
                  type="button"
                  onClick={() => setIsResolving(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded focus:outline-none focus:ring-1 focus:ring-brand-400"
                  aria-label="Collapse resolution form"
                >
                  <ChevronUp className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Which claim is accepted or synthesized?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name={`claim-${contradiction.id}`}
                      checked={selectedClaim === contradiction.claimA.id}
                      onChange={() => setSelectedClaim(contradiction.claimA.id)}
                    />
                    <span>Accept Claim A</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name={`claim-${contradiction.id}`}
                      checked={selectedClaim === contradiction.claimB.id}
                      onChange={() => setSelectedClaim(contradiction.claimB.id)}
                    />
                    <span>Accept Claim B</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name={`claim-${contradiction.id}`}
                      checked={selectedClaim === 'SYNTHESIS'}
                      onChange={() => setSelectedClaim('SYNTHESIS')}
                    />
                    <span>Synthesized Resolution</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Justification / Rationale (Mandatory)
                </label>
                <textarea
                  rows={2}
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  placeholder="Explain why one claim is prioritized or how the contradiction was physically inspected (e.g. Police patrol confirmed 4ft water at north gate)..."
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Additional Corroborating Evidence (Optional)
                </label>
                <input
                  type="text"
                  value={additionalEvidence}
                  onChange={(e) => setAdditionalEvidence(e.target.value)}
                  placeholder="e.g. On-scene police wireless confirmation dispatch #812"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reviewer Name / Agency
                </label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2 text-slate-900"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsResolving(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !rationale.trim()}
                  className="px-4 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm disabled:bg-slate-300"
                >
                  {saving ? 'Recording...' : 'Commit Resolution'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
