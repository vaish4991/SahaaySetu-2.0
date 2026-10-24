import React, { useState, useMemo } from 'react';
import { IncidentRecord, IncidentCategory, UrgencyLevel } from '@sahaaysetu/shared';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { FreshnessBadge } from '../components/FreshnessBadge';
import { Language, translations } from '../locales/translations';
import {
  Search,
  Filter,
  FileText,
  MapPin,
  Clock,
  Printer,
  ArrowRight,
  ShieldAlert,
  AlertOctagon
} from 'lucide-react';

interface Props {
  incidents: IncidentRecord[];
  onSelectIncident: (id: string, view: 'review' | 'actions') => void;
  onOpenBrief: (id: string) => void;
  language: Language;
}

export const IncidentExplorer: React.FC<Props> = ({
  incidents,
  onSelectIncident,
  onOpenBrief,
  language
}) => {
  const t = translations[language];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('ALL');

  const filtered = useMemo(() => {
    return incidents.filter(inc => {
      if (selectedCategory !== 'ALL' && inc.category !== selectedCategory) return false;
      if (selectedUrgency !== 'ALL' && inc.estimatedUrgency !== selectedUrgency) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = inc.title.toLowerCase().includes(q);
        const matchSummary = inc.situationSummary.toLowerCase().includes(q);
        const matchLoc = inc.location.rawText.toLowerCase().includes(q);
        return matchTitle || matchSummary || matchLoc;
      }
      return true;
    });
  }, [incidents, selectedCategory, selectedUrgency, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Incident Records Explorer
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Searchable repository of citizen reports, demonstration fixtures, and verified crisis briefings
          </p>
        </div>
        <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200" aria-live="polite">
          Showing {filtered.length} of {incidents.length} Records
        </span>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3" role="search" aria-label="Incident search and filters">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" aria-hidden="true" />
          <input
            type="text"
            id="incident-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by keywords, location, or title..."
            aria-label="Search incident records by keywords, location, or title"
            className="w-full text-xs rounded-xl border border-slate-300 pl-10 pr-3.5 py-2.5 focus:border-brand-500 focus:ring-brand-500 text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <select
            id="incident-category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter incidents by category"
            className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:border-brand-500 focus:ring-brand-500 text-slate-800 bg-white"
          >
            <option value="ALL">All Categories</option>
            <option value="NATURAL_DISASTER">Natural Disaster</option>
            <option value="TRAFFIC_ACCIDENT">Traffic Accident</option>
            <option value="INFRASTRUCTURE_FAILURE">Infrastructure Failure</option>
            <option value="PUBLIC_SAFETY">Public Safety</option>
            <option value="MEDICAL_EMERGENCY">Medical Emergency</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Urgency Filter */}
        <div className="relative">
          <select
            id="incident-urgency-filter"
            value={selectedUrgency}
            onChange={(e) => setSelectedUrgency(e.target.value)}
            aria-label="Filter incidents by urgency level"
            className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:border-brand-500 focus:ring-brand-500 text-slate-800 bg-white"
          >
            <option value="ALL">All Urgency Levels</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Urgency</option>
            <option value="MEDIUM">Medium Urgency</option>
            <option value="LOW">Low Urgency</option>
          </select>
        </div>
      </div>

      {/* Incidents List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No matching incident records</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search keywords or resetting your category and urgency filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((inc) => {
            const unresolvedConflicts = (inc.contradictions || []).filter(c => !c.isResolved).length;

            return (
              <div
                key={inc.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-brand-400 hover:shadow-md transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500 uppercase">
                      {inc.category.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      {inc.freshness && (
                        <FreshnessBadge evaluation={inc.freshness} size="sm" />
                      )}
                      <UrgencyBadge urgency={inc.estimatedUrgency} score={inc.urgencyScore} size="sm" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-2">
                      {inc.title}
                    </h3>
                    {unresolvedConflicts > 0 && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <AlertOctagon className="w-3.5 h-3.5 text-amber-700" />
                        <span>{unresolvedConflicts} Unresolved Conflict{unresolvedConflicts > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {inc.situationSummary}
                  </p>

                  <div className="pt-1 text-xs text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{inc.location.rawText}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {inc.isDemoScenario ? (
                      <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                        Demo Scenario
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                        Live Submission
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(inc.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenBrief(inc.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                    title="Export Responder Brief"
                    aria-label="Export Responder Brief"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectIncident(inc.id, 'review')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
                  >
                    <span>Audit Facts</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectIncident(inc.id, 'actions')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white transition shadow-sm"
                  >
                    <span>Action Plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);
};
