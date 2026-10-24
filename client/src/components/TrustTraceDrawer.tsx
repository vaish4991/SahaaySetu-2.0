import React, { useState, useEffect } from 'react';
import { TrustTrace } from '@sahaaysetu/shared';
import { EvidenceBadge } from './EvidenceBadge';
import {
  X,
  Shield,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle,
  Edit3,
  History,
  Info
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  trustTrace: TrustTrace | null;
  targetTitle: string;
  onSaveCorrection?: (factId: string, correctionText: string, reviewerName: string) => Promise<void>;
}

export const TrustTraceDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  trustTrace,
  targetTitle,
  onSaveCorrection
}) => {
  const [isEditingCorrection, setIsEditingCorrection] = useState(false);
  const [correctionText, setCorrectionText] = useState('');
  const [reviewerName, setReviewerName] = useState('Authorized Field Reviewer');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (trustTrace?.reviewedCorrection) {
      setCorrectionText(trustTrace.reviewedCorrection);
    } else {
      setCorrectionText('');
    }
    setIsEditingCorrection(false);
  }, [trustTrace]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !trustTrace) return null;

  const handleApplyCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveCorrection || !correctionText.trim()) return;

    setSaving(true);
    try {
      await onSaveCorrection(trustTrace.targetId, correctionText.trim(), reviewerName);
      setIsEditingCorrection(false);
    } catch (err) {
      console.error('Failed to save correction:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-end overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trace-title"
    >
      <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-slate-200 flex flex-col overflow-y-auto">
        {/* Drawer Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-brand-400" />
            <div>
              <h2 id="trace-title" className="text-base font-bold">
                Trust Trace & Provenance Audit
              </h2>
              <p className="text-xs text-slate-400">
                Transparent origin, verification evidence, and correction trail
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close Trust Trace drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Item Headline */}
        <div className="p-4 bg-brand-50/60 border-b border-brand-100 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-800">
              Target Item Being Traced
            </span>
            <p className="text-xs font-semibold text-slate-900 mt-0.5">{targetTitle}</p>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="p-6 space-y-6 flex-1 text-slate-800">
          {/* 1. Evidence Label & Verification Status */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Assigned Evidence Label
            </span>
            <div className="flex items-center gap-3">
              <EvidenceBadge label={trustTrace.evidenceLabel} size="md" />
              <span className="text-xs text-slate-600">
                {trustTrace.evidenceLabel === 'SOURCE-VERIFIED'
                  ? 'Corroborated by verified communique'
                  : trustTrace.evidenceLabel === 'USER-REPORTED'
                  ? 'Submitted directly by citizen eyewitness'
                  : trustTrace.evidenceLabel === 'AI-INFERRED'
                  ? 'Deduced by AI model based on situation context'
                  : 'Uncorroborated third-party forward'}
              </span>
            </div>
          </div>

          {/* 2. Original Supporting Claim & Source */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Original Supporting Claim
            </span>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs font-mono text-slate-800 leading-relaxed shadow-sm">
              "{trustTrace.supportingClaim}"
            </div>
            <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 px-1 pt-0.5">
              <span>Source: <strong className="text-slate-800">{trustTrace.sourceName || 'Citizen eyewitness'}</strong></span>
              <span>Type: <strong className="text-slate-800">{trustTrace.sourceType || 'USER_TEXT'}</strong></span>
            </div>
          </div>

          {/* 3. Timestamps: Event Time vs Submission Time */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="font-semibold text-slate-500 block">Actual Event Time</span>
              <span className="font-mono text-slate-900 font-bold">
                {trustTrace.eventTime
                  ? new Date(trustTrace.eventTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Unknown (Not specified)'}
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-500 block">Report Submission Time</span>
              <span className="font-mono text-slate-900 font-bold">
                {trustTrace.submissionTime
                  ? new Date(trustTrace.submissionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Recorded on intake'}
              </span>
            </div>
          </div>

          {/* 4. Support Explanation */}
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Why Evidence Supports this Item
            </span>
            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
              {trustTrace.supportExplanation}
            </p>
          </div>

          {/* 5. Verification Details */}
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Implemented Verification Method
            </span>
            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
              {trustTrace.verificationDetails}
            </p>
          </div>

          {/* 6. Unresolved Contradictions Alert */}
          {trustTrace.hasUnresolvedContradiction && (
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-300 text-xs text-amber-950 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Active Contradiction Flagged</p>
                <p className="text-amber-800 mt-0.5">
                  Another contemporaneous report disputes this claim. Inspect the Contradiction Review section before finalizing operational decisions.
                </p>
              </div>
            </div>
          )}

          {/* 7. Reviewed Correction Trail */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>Human-Reviewed Correction Trail</span>
              </span>
              {onSaveCorrection && !isEditingCorrection && (
                <button
                  type="button"
                  onClick={() => setIsEditingCorrection(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{trustTrace.reviewedCorrection ? 'Edit Correction' : 'Add Correction'}</span>
                </button>
              )}
            </div>

            {trustTrace.reviewedCorrection && !isEditingCorrection ? (
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1">
                <div className="flex items-center justify-between text-emerald-800 font-bold">
                  <span>Current Corrected Fact:</span>
                  <span className="text-[10px] font-mono opacity-80">
                    {trustTrace.reviewedAt ? new Date(trustTrace.reviewedAt).toLocaleTimeString() : ''}
                  </span>
                </div>
                <p className="text-emerald-950 font-medium">"{trustTrace.reviewedCorrection}"</p>
                <p className="text-[11px] text-emerald-700 italic">
                  Original eyewitness statement preserved in Trust Trace above.
                </p>
              </div>
            ) : !isEditingCorrection ? (
              <p className="text-xs text-slate-500 italic">
                No manual correction applied. The original claim is currently displayed.
              </p>
            ) : null}

            {isEditingCorrection && onSaveCorrection && (
              <form onSubmit={handleApplyCorrection} className="p-3.5 bg-slate-50 rounded-xl border border-slate-300 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Corrected Claim Statement
                  </label>
                  <textarea
                    rows={2}
                    value={correctionText}
                    onChange={(e) => setCorrectionText(e.target.value)}
                    placeholder="Enter verified or corrected text..."
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 text-slate-900 bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Reviewer Name / Call-Sign
                  </label>
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 p-2 text-slate-900 bg-white"
                    required
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingCorrection(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-1.5 text-xs font-bold bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-sm"
                  >
                    {saving ? 'Saving...' : 'Save Correction'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
