import React from 'react';
import { FreshnessStatus, FreshnessEvaluation } from '@sahaaysetu/shared';
import { CheckCircle2, Clock, AlertTriangle, HelpCircle } from 'lucide-react';

interface Props {
  status?: FreshnessStatus;
  evaluation?: FreshnessEvaluation;
  ageFormatted?: string;
  warning?: string;
  size?: 'sm' | 'md';
}

export const FreshnessBadge: React.FC<Props> = ({
  status,
  evaluation,
  ageFormatted,
  warning,
  size = 'sm'
}) => {
  const resolvedStatus: FreshnessStatus = evaluation?.status || status || 'UNKNOWN';
  const resolvedAge = evaluation?.ageFormatted || ageFormatted;
  const resolvedWarning = evaluation?.warning || warning;

  const config = {
    CURRENT: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      icon: CheckCircle2,
      ariaLabel: 'Current fresh evidence'
    },
    AGING: {
      bg: 'bg-amber-50 text-amber-900 border-amber-300',
      icon: Clock,
      ariaLabel: 'Aging evidence nearing freshness threshold'
    },
    STALE: {
      bg: 'bg-red-50 text-red-900 border-red-300',
      icon: AlertTriangle,
      ariaLabel: 'Stale outdated evidence. Caution required.'
    },
    UNKNOWN: {
      bg: 'bg-slate-100 text-slate-700 border-slate-300',
      icon: HelpCircle,
      ariaLabel: 'Observation time unknown or missing'
    }
  }[resolvedStatus] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-300',
    icon: HelpCircle,
    ariaLabel: 'Unknown freshness'
  };

  const Icon = config.icon;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-md border ${config.bg} ${padding}`}
      role="status"
      aria-label={`${config.ariaLabel}: ${resolvedStatus}`}
      title={resolvedWarning || `${resolvedStatus} (${resolvedAge || ''})`}
    >
      <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} aria-hidden="true" />
      <span>{resolvedStatus}</span>
      {resolvedAge && (
        <span className="opacity-80 font-normal text-[11px] ml-0.5">
          • {resolvedAge}
        </span>
      )}
    </span>
  );
};
