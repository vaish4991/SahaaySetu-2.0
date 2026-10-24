import React from 'react';
import { EMERGENCY_NUMBERS } from '@sahaaysetu/shared';
import { PhoneCall, ShieldAlert } from 'lucide-react';

export const EmergencyContactsBar: React.FC = () => {
  return (
    <div className="bg-slate-900 text-white rounded-xl p-4 shadow-md border border-slate-800">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              DIRECT EMERGENCY HELPLINES (JURISDICTION DIRECTORY)
            </h3>
            <p className="text-xs text-slate-400">
              SahaaySetu does NOT dispatch physical units. In critical life-danger situations, dial directly:
            </p>
          </div>
        </div>
        <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800">
          Toll-Free 24/7 Response
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {EMERGENCY_NUMBERS.slice(0, 5).map((contact) => (
          <a
            key={contact.service}
            href={`tel:${contact.number}`}
            className="flex items-center justify-between p-2.5 bg-slate-800/80 hover:bg-slate-700/90 rounded-lg border border-slate-700 transition group focus-visible:ring-2 focus-visible:ring-brand-400"
            aria-label={`Call ${contact.service} at ${contact.number}`}
          >
            <div>
              <p className="text-xs text-slate-400 font-medium">{contact.service}</p>
              <p className="text-base font-extrabold text-white group-hover:text-brand-300 font-mono">
                {contact.number}
              </p>
            </div>
            <PhoneCall className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" aria-hidden="true" />
          </a>
        ))}
      </div>
    </div>
  );
};
