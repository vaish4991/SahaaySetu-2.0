import React from 'react';
import { DuplicateSuggestion } from '@sahaaysetu/shared';
import { Copy, AlertCircle, ArrowRight } from 'lucide-react';

interface Props {
  duplicates: DuplicateSuggestion[];
  onSelectDuplicate?: (id: string) => void;
}

export const DuplicateAlertBanner: React.FC<Props> = ({ duplicates, onSelectDuplicate }) => {
  if (!duplicates || duplicates.length === 0) return null;

  return (
    <div
      className="p-4 bg-amber-50 border border-amber-300 rounded-xl mb-6 shadow-sm"
      role="region"
      aria-label="Suspected duplicate reports alert"
    >
      <div className="flex items-start gap-3">
        <Copy className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" aria-hidden="true" />
        <div className="flex-1">
          <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
            <span>Potential Duplicate Reports Detected ({duplicates.length})</span>
            <span className="text-xs font-normal bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
              Civic Deduplication Engine
            </span>
          </h4>
          <p className="text-xs text-amber-800 mt-1">
            Other citizens or sensors have reported similar incidents nearby. The system maintains independent records without unconfirmed auto-merging:
          </p>

          <div className="mt-3 space-y-2">
            {duplicates.map((dup) => (
              <div
                key={dup.matchedIncidentId}
                className="bg-white/80 p-2.5 rounded-lg border border-amber-200 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-800">{dup.title}</span>
                  <div className="text-slate-600 mt-0.5">
                    Match Confidence: <span className="font-mono font-bold text-amber-700">{Math.round(dup.similarityScore * 100)}%</span> — {dup.reason}
                  </div>
                </div>
                {onSelectDuplicate && (
                  <button
                    type="button"
                    onClick={() => onSelectDuplicate(dup.matchedIncidentId)}
                    className="inline-flex items-center gap-1 text-brand-700 font-semibold hover:text-brand-900 hover:underline px-2 py-1"
                  >
                    <span>View Record</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
