import React, { useState, useEffect } from 'react';
import { ResponderBrief } from '@sahaaysetu/shared';
import { generateBriefApi } from '../services/api';
import { X, Copy, Check, Download, Printer, Shield, AlertTriangle } from 'lucide-react';

interface Props {
  incidentId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ResponderBriefModal: React.FC<Props> = ({ incidentId, isOpen, onClose }) => {
  const [brief, setBrief] = useState<ResponderBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scrubMedical, setScrubMedical] = useState(true);
  const [scrubLocation, setScrubLocation] = useState(false);

  useEffect(() => {
    if (!isOpen || !incidentId) return;

    const loadBrief = async () => {
      setLoading(true);
      try {
        const data = await generateBriefApi(incidentId, { scrubMedical, scrubLocation });
        setBrief(data);
      } catch (err) {
        console.error('Failed to load responder brief:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBrief();
  }, [isOpen, incidentId, scrubMedical, scrubLocation]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const generateMarkdownText = (b: ResponderBrief) => {
    return `# SAHAAYSETU RESPONDER BRIEF
=============================================================
INCIDENT ID: ${b.incidentId}
GENERATED AT: ${new Date(b.generatedAt).toLocaleString()}
TITLE: ${b.title}
CATEGORY: ${b.category}
URGENCY: ${b.urgency} (Score: ${b.urgencyScore}/100)
LOCATION: ${b.locationSummary}

-------------------------------------------------------------
1. SITUATION OVERVIEW:
${b.situationOverview}

-------------------------------------------------------------
2. EXTRACTED FACTS & EVIDENCE STATUS:
${b.keyFacts.map((f, i) => `[${i + 1}] [${f.evidence}] ${f.fact}`).join('\n')}

-------------------------------------------------------------
3. CRITICAL HAZARDS & PRECAUTIONS:
${b.criticalHazards.map((h, i) => `[${i + 1}] ${h}`).join('\n')}

-------------------------------------------------------------
4. TOP ACTION PRIORITIES:
${b.topActionPriorities.map(a => `Step ${a.step}: ${a.title}\n   Safety Precautions: ${a.precautions}`).join('\n\n')}

-------------------------------------------------------------
5. OPEN UNCERTAINTIES / INFORMATION GAPS:
${b.openUncertainties.map((u, i) => `[${i + 1}] ${u}`).join('\n')}

-------------------------------------------------------------
CONFIDENTIALITY & GOVERNANCE:
${b.confidentialityNote}
Contact Emergency Dispatch: 112 / 108 / 101
=============================================================`;
  };

  const handleCopy = async () => {
    if (!brief) return;
    const text = generateMarkdownText(brief);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    if (!brief) return;
    const text = generateMarkdownText(brief);
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SahaaySetu_Brief_${brief.incidentId}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="brief-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-brand-400" aria-hidden="true" />
            <div>
              <h2 id="brief-modal-title" className="text-lg font-bold">
                Official Responder Incident Brief
              </h2>
              <p className="text-xs text-slate-400">
                Printable, evidence-aware operational handoff for emergency personnel
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Privacy Redaction Toggles */}
        <div className="bg-slate-50 border-b border-slate-200 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={scrubMedical}
                onChange={(e) => setScrubMedical(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
              />
              <span>Redact Sensitive Medical Context</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
              <input
                type="checkbox"
                checked={scrubLocation}
                onChange={(e) => setScrubLocation(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
              />
              <span>Withhold Exact Coordinates</span>
            </label>
          </div>
          <span className="text-slate-500 italic">
            Privacy-first export compliance
          </span>
        </div>

        {/* Brief Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 font-sans">
          {loading ? (
            <div className="py-12 text-center text-slate-500">
              <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm font-medium">Generating formatted Responder Brief...</p>
            </div>
          ) : brief ? (
            <div className="space-y-6 border border-slate-200 p-6 rounded-xl bg-slate-50/50">
              {/* Top Meta */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
                <div>
                  <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                    {brief.category} • INCIDENT #{brief.incidentId}
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">{brief.title}</h3>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300">
                    URGENCY: {brief.urgency} ({brief.urgencyScore}/100)
                  </span>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    {new Date(brief.generatedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Location */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Reported Scene Location
                </h4>
                <p className="text-sm font-medium text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200">
                  {brief.locationSummary}
                </p>
              </div>

              {/* Situation Summary */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Situation Overview
                </h4>
                <p className="text-sm text-slate-800 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                  {brief.situationOverview}
                </p>
              </div>

              {/* Key Facts */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Key Facts & Evidence Provenance
                </h4>
                <ul className="space-y-2">
                  {brief.keyFacts.map((f, i) => (
                    <li key={i} className="text-xs bg-white p-2 rounded-lg border border-slate-200 flex items-start gap-2">
                      <span className="font-semibold text-brand-700 font-mono">[{f.evidence}]</span>
                      <span className="text-slate-700">{f.fact}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Hazards */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-red-800 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Critical Hazards & Safety Precautions
                </h4>
                <div className="space-y-2">
                  {brief.criticalHazards.map((h, i) => (
                    <div key={i} className="text-xs bg-red-50/70 p-2.5 rounded-lg border border-red-200 text-red-950 font-medium">
                      {h}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Actions */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Prioritized Next Steps
                </h4>
                <div className="space-y-2">
                  {brief.topActionPriorities.map(a => (
                    <div key={a.step} className="text-xs bg-white p-3 rounded-lg border border-slate-200">
                      <div className="font-bold text-slate-900">Step {a.step}: {a.title}</div>
                      <div className="text-slate-600 mt-1">Precautions: {a.precautions}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confidentiality Notice */}
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 font-medium">
                {brief.confidentialityNote}
              </div>
            </div>
          ) : (
            <p className="text-center text-sm text-red-600">Failed to render brief.</p>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            Format: Markdown / Printable Plain Text
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!brief}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition shadow-sm"
              aria-label="Copy brief to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Brief'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!brief}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition shadow-sm"
              aria-label="Download brief as Markdown file"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Download (.md)</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={!brief}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white transition shadow-sm"
              aria-label="Print report"
            >
              <Printer className="w-4 h-4" />
              <span>Print Brief</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
