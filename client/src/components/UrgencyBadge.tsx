import React from 'react';
import { UrgencyLevel } from '@sahaaysetu/shared';
import { Flame, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface Props {
  urgency: UrgencyLevel;
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const UrgencyBadge: React.FC<Props> = ({ urgency, score, size = 'md' }) => {
  const config = {
    CRITICAL: {
      bg: 'bg-red-100 text-red-900 border-red-300 ring-red-400',
      icon: Flame,
      aria: 'Critical Urgency - Immediate life safety threat'
    },
    HIGH: {
      bg: 'bg-orange-100 text-orange-900 border-orange-300 ring-orange-400',
      icon: AlertCircle,
      aria: 'High Urgency - Severe active hazard'
    },
    MEDIUM: {
      bg: 'bg-amber-100 text-amber-900 border-amber-300 ring-amber-400',
      icon: AlertTriangle,
      aria: 'Medium Urgency - Escalation potential'
    },
    LOW: {
      bg: 'bg-emerald-100 text-emerald-900 border-emerald-300 ring-emerald-400',
      icon: Info,
      aria: 'Low Urgency - Informational or routine'
    }
  }[urgency] || {
    bg: 'bg-slate-100 text-slate-800 border-slate-300 ring-slate-400',
    icon: Info,
    aria: 'Urgency status pending'
  };

  const Icon = config.icon;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : size === 'lg' ? 'px-3.5 py-1.5 text-base' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-full border shadow-sm ${config.bg} ${padding}`}
      role="status"
      aria-label={config.aria}
    >
      <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} aria-hidden="true" />
      <span>{urgency}</span>
      {typeof score === 'number' && (
        <span className="opacity-80 text-xs font-mono ml-0.5" aria-label={`Score: ${score} out of 100`}>
          ({score}/100)
        </span>
      )}
    </span>
  );
};
