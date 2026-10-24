import React, { useState } from 'react';
import { TimelineEvent } from '@sahaaysetu/shared';
import { EvidenceBadge } from './EvidenceBadge';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  FileText,
  Camera,
  Activity,
  ChevronRight,
  Info
} from 'lucide-react';

interface Props {
  events: TimelineEvent[];
  onSelectEvent?: (event: TimelineEvent) => void;
}

export const EvidenceTimeline: React.FC<Props> = ({ events, onSelectEvent }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!events || events.length === 0) {
    return (
      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
        No chronological timeline events recorded yet.
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'REPORT_SUBMITTED':
        return <FileText className="w-4 h-4 text-brand-600" />;
      case 'MEDIA_CAPTURED':
        return <Camera className="w-4 h-4 text-purple-600" />;
      case 'CONTRADICTION_DETECTED':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'STATUS_CONFIRMED':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'USER_VERIFICATION':
        return <CheckCircle className="w-4 h-4 text-teal-600" />;
      default:
        return <Activity className="w-4 h-4 text-slate-600" />;
    }
  };

  const handleSelect = (evt: TimelineEvent) => {
    setSelectedId(evt.id === selectedId ? null : evt.id);
    if (onSelectEvent) onSelectEvent(evt);
  };

  return (
    <div
      className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4"
      role="region"
      aria-label="Evidence Timeline"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-brand-600" />
          <h2 className="text-base font-bold text-slate-900">
            Chronological Evidence Timeline
          </h2>
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-3">
          <span className="flex items-center gap-1 font-mono">
            <span className="w-2 h-2 rounded-full bg-brand-500"></span> Event Time
          </span>
          <span className="flex items-center gap-1 font-mono">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span> Submission Time
          </span>
        </div>
      </div>

      <div className="relative pl-6 sm:pl-8 space-y-4 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {events.map((evt, idx) => {
          const isSelected = selectedId === evt.id;

          return (
            <div
              key={evt.id}
              onClick={() => handleSelect(evt)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect(evt);
                }
              }}
              tabIndex={0}
              role="button"
              aria-expanded={isSelected}
              className={`relative group cursor-pointer p-3.5 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-brand-50/60 border-brand-400 shadow-sm'
                  : 'bg-slate-50/50 hover:bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Timeline Node Bullet */}
              <div
                className={`absolute -left-[27px] sm:-left-[31px] top-3.5 w-6 h-6 rounded-full border-2 bg-white flex items-center justify-center transition-all ${
                  isSelected ? 'border-brand-600 scale-110 shadow-sm' : 'border-slate-300 group-hover:border-brand-400'
                }`}
                aria-hidden="true"
              >
                {getEventIcon(evt.eventType)}
              </div>

              {/* Event Content Header */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-sm text-slate-900">
                    {evt.title}
                  </span>
                  {evt.evidenceLabel && (
                    <EvidenceBadge label={evt.evidenceLabel} size="sm" />
                  )}
                  {evt.statusBadge && !evt.evidenceLabel && (
                    <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                      {evt.statusBadge}
                    </span>
                  )}
                </div>

                <div className="text-right text-xs">
                  <span className="font-mono font-bold text-brand-700">
                    {evt.displayTime}
                  </span>
                </div>
              </div>

              {/* Event Description */}
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {evt.description}
              </p>

              {/* Timestamp Breakdown (Distinguishing Event vs Submission vs Unknown) */}
              <div className="mt-2 pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
                <div>
                  Event Time:{' '}
                  {evt.isEventTimeUnknown ? (
                    <span className="text-amber-700 font-semibold bg-amber-100/80 px-1.5 py-0.5 rounded">
                      Unknown (Not provided by eyewitness)
                    </span>
                  ) : evt.eventTime ? (
                    <strong className="text-slate-800">
                      {new Date(evt.eventTime).toLocaleString()}
                    </strong>
                  ) : (
                    <span className="text-slate-400">Same as submission</span>
                  )}
                </div>

                {evt.submissionTime && (
                  <div>
                    Submitted:{' '}
                    <strong className="text-slate-700">
                      {new Date(evt.submissionTime).toLocaleTimeString()}
                    </strong>
                  </div>
                )}
              </div>

              {/* Expanded details if selected */}
              {isSelected && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-brand-200 text-xs text-slate-700 space-y-1.5 animate-fadeIn">
                  <div className="font-bold text-brand-900 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-brand-600" />
                    <span>Evidence Record Details:</span>
                  </div>
                  <div>Source Origin: <strong className="text-slate-900">{evt.sourceName || 'Platform intake'}</strong></div>
                  <div>Event Type: <strong className="text-slate-900 font-mono">{evt.eventType}</strong></div>
                  <p className="text-slate-600 text-[11px] mt-1">
                    Press Enter or click again to collapse this entry.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
