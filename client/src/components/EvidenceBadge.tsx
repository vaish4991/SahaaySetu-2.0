import React from 'react';
import { EvidenceLabel } from '@sahaaysetu/shared';
import { UserCheck, ShieldCheck, Cpu, AlertTriangle } from 'lucide-react';

interface Props {
  label: EvidenceLabel;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const EvidenceBadge: React.FC<Props> = ({ label, size = 'sm', showIcon = true }) => {
  const config = {
    'USER-REPORTED': {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: UserCheck,
      description: 'Reported directly by citizen or eyewitness on the scene.'
    },
    'SOURCE-VERIFIED': {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: ShieldCheck,
      description: 'Corroborated by official government or weather bureau bulletin.'
    },
    'AI-INFERRED': {
      bg: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: Cpu,
      description: 'Deduce by Gemini AI model based on multi-source situational analysis.'
    },
    'UNVERIFIED': {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: AlertTriangle,
      description: 'Forwarded third-party report; requires verification before deployment.'
    }
  }[label] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: AlertTriangle,
    description: 'Unknown evidence status'
  };

  const IconComponent = config.icon;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-md border ${config.bg} ${padding}`}
      title={config.description}
      role="status"
      aria-label={`Evidence status: ${label}`}
    >
      {showIcon && <IconComponent className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
};
