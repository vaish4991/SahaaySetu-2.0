import React, { useState } from 'react';
import {
  IncidentRecord,
  IncidentFact,
  TrustTrace,
  EvidenceLabel
} from '@sahaaysetu/shared';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { FreshnessBadge } from '../components/FreshnessBadge';
import { ContradictionReviewCard } from '../components/ContradictionReviewCard';
import { TrustTraceDrawer } from '../components/TrustTraceDrawer';
import { EvidenceTimeline } from '../components/EvidenceTimeline';
import { DuplicateAlertBanner } from '../components/DuplicateAlertBanner';
import {
  updateIncidentApi,
  resolveContradictionApi,
  addConfirmationApi,
  correctFactApi,
  addSubReportApi
} from '../services/api';
import { Language, translations } from '../locales/translations';
import {
  ShieldCheck,
  MapPin,
  AlertTriangle,
  HelpCircle,
  CheckCircle,
  Edit2,
  Save,
  ArrowRight,
  Printer,
  Sparkles,
  Clock,
  PlusCircle,
  Search,
  Check,
  ExternalLink
} from 'lucide-react';

interface Props {
  incident: IncidentRecord;
  onUpdateIncident: (updated: IncidentRecord) => void;
  onProceedToActions: () => void;
  onOpenBrief: () => void;
  onSelectDuplicate?: (id: string) => void;
  language: Language;
}

export const AnalysisReview: React.FC<Props> = ({
  incident,
  onUpdateIncident,
  onProceedToActions,
  onOpenBrief,
  onSelectDuplicate,
  language
}) => {
  const t = translations[language];

  // Trust Trace Drawer state
  const [activeTrustTrace, setActiveTrustTrace] = useState<TrustTrace | null>(null);
  const [activeTraceTitle, setActiveTraceTitle] = useState('');
  const [isTraceDrawerOpen, setIsTraceDrawerOpen] = useState(false);

  // Editable Facts state
  const [facts, setFacts] = useState<IncidentFact[]>(incident.userReportedFacts);
  const [editingFactId, setEditingFactId] = useState<string | null>(null);
  const [editingFactText, setEditingFactText] = useState('');

  // Location state
  const [locationText, setLocationText] = useState(incident.location.rawText);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationConfirmed, setLocationConfirmed] = useState(incident.location.userConfirmed);

  // New Sub-Report Modal/Form
  const [showSubReportModal, setShowSubReportModal] = useState(false);
  const [subReportSource, setSubReportSource] = useState('');
  const [subReportType, setSubReportType] = useState<'CITIZEN_TEXT' | 'VOICE_TRANSCRIPT' | 'OFFICIAL_BULLETIN' | 'SCENE_PHOTO'>('CITIZEN_TEXT');
  const [subReportText, setSubReportText] = useState('');
  const [subReportLocation, setSubReportLocation] = useState('');
  const [subReportStatus, setSubReportStatus] = useState<EvidenceLabel>('USER-REPORTED');
  const [subReportSubmitting, setSubReportSubmitting] = useState(false);

  // Confirmation state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmSource, setConfirmSource] = useState('On-Scene Responder');
  const [confirmNote, setConfirmNote] = useState('');
  const [confirming, setConfirming] = useState(false);

  // Synchronize state when incident prop updates or when viewing a different incident
  React.useEffect(() => {
    setFacts(incident.userReportedFacts);
    setLocationText(incident.location.rawText);
    setLocationConfirmed(incident.location.userConfirmed);
  }, [incident.id, incident.userReportedFacts, incident.location]);

  // Open Trust Trace Drawer
  const handleOpenTrustTrace = (trace: TrustTrace | undefined, title: string) => {
    if (!trace) {
      // Fallback synthetic trace if undefined
      setActiveTrustTrace({
        targetId: 'trace-generic',
        supportingClaim: title,
        sourceName: 'Platform intake',
        sourceType: 'USER_TEXT',
        submissionTime: incident.createdAt,
        evidenceLabel: 'USER-REPORTED',
        supportExplanation: 'Extracted directly from user crisis submission.',
        verificationDetails: 'Logged as citizen observation; awaiting field confirmation.'
      });
    } else {
      setActiveTrustTrace(trace);
    }
    setActiveTraceTitle(title);
    setIsTraceDrawerOpen(true);
  };

  // Save reviewed fact correction with provenance
  const handleSaveFactCorrection = async (
    factId: string,
    correctionText: string,
    reviewerName: string
  ) => {
    const updated = await correctFactApi(incident.id, factId, correctionText, reviewerName);
    onUpdateIncident(updated);
    setFacts(updated.userReportedFacts);
    // Update currently open drawer trace
    const updatedFact = updated.userReportedFacts.find(f => f.id === factId);
    if (updatedFact?.trustTrace) {
      setActiveTrustTrace(updatedFact.trustTrace);
    }
  };

  // Resolve contradiction
  const handleResolveContradiction = async (
    contradictionId: string,
    resolution: { resolutionRationale: string; acceptedClaimId?: string; additionalEvidenceSubmitted?: string; resolvedBy?: string }
  ) => {
    const updated = await resolveContradictionApi(incident.id, contradictionId, resolution);
    onUpdateIncident(updated);
  };

  // Record confirmation
  const handleConfirmStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirming(true);
    try {
      const updated = await addConfirmationApi(incident.id, {
        confirmedBy: confirmSource,
        source: confirmSource,
        note: confirmNote || 'On-scene condition verified.'
      });
      onUpdateIncident(updated);
      setShowConfirmModal(false);
      setConfirmNote('');
    } catch (err) {
      console.error('Failed to confirm status:', err);
    } finally {
      setConfirming(false);
    }
  };

  // Submit sub-report
  const handleSubReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subReportText.trim() || !subReportSource.trim()) return;

    setSubReportSubmitting(true);
    try {
      const updated = await addSubReportApi(incident.id, {
        sourceName: subReportSource.trim(),
        sourceType: subReportType,
        text: subReportText.trim(),
        locationDescription: subReportLocation.trim() || undefined,
        verificationStatus: subReportStatus,
        submittedAt: new Date().toISOString(),
        eventObservedAt: new Date().toISOString(),
        isEventTimeUnknown: false
      });
      onUpdateIncident(updated);
      setShowSubReportModal(false);
      setSubReportText('');
      setSubReportSource('');
      setSubReportLocation('');
    } catch (err) {
      console.error('Failed to submit sub-report:', err);
    } finally {
      setSubReportSubmitting(false);
    }
  };

  const handleToggleConfirmFact = async (id: string) => {
    const updatedFacts = facts.map(f =>
      f.id === id ? { ...f, userConfirmed: !f.userConfirmed } : f
    );
    setFacts(updatedFacts);
    try {
      const updated = await updateIncidentApi(incident.id, { userReportedFacts: updatedFacts });
      onUpdateIncident(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveLocation = async () => {
    setIsEditingLocation(false);
    try {
      const updated = await updateIncidentApi(incident.id, {
        location: { ...incident.location, rawText: locationText, userConfirmed: locationConfirmed }
      });
      onUpdateIncident(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleConfirmLocation = async () => {
    const newConfirmed = !locationConfirmed;
    setLocationConfirmed(newConfirmed);
    try {
      const updated = await updateIncidentApi(incident.id, {
        location: { ...incident.location, userConfirmed: newConfirmed }
      });
      onUpdateIncident(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const unresolvedContradictions = (incident.contradictions || []).filter(c => !c.isResolved);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Suspected Duplicates Alert */}
      {incident.possibleDuplicates && incident.possibleDuplicates.length > 0 && (
        <DuplicateAlertBanner
          duplicates={incident.possibleDuplicates}
          onSelectDuplicate={onSelectDuplicate}
        />
      )}

      {/* Freshness Engine Warning Banner */}
      {incident.freshness && (incident.freshness.status === 'STALE' || incident.freshness.status === 'UNKNOWN') && (
        <div
          className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl flex items-start justify-between gap-3 shadow-sm"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-black text-red-950 flex items-center gap-2">
                <span>Information Freshness Warning: {incident.freshness.status}</span>
                <span className="text-xs font-mono font-bold bg-red-200 text-red-900 px-2 py-0.5 rounded">
                  {incident.freshness.ageFormatted}
                </span>
              </p>
              <p className="text-xs text-red-900 mt-1 leading-relaxed">
                {incident.freshness.warning || 'Evidence exceeds the category freshness threshold. Never infer current safety from stale or unconfirmed reports.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            className="shrink-0 text-xs font-bold bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl shadow-sm transition"
          >
            Confirm Scene Status
          </button>
        </div>
      )}

      {/* Main Review Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
              {incident.category}
            </span>
            <span className="text-xs font-mono text-slate-400">#{incident.id}</span>
            {incident.freshness && (
              <FreshnessBadge
                status={incident.freshness.status}
                ageFormatted={incident.freshness.ageFormatted}
                warning={incident.freshness.warning}
              />
            )}
            {incident.isDemoScenario && (
              <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md border border-brand-200">
                Demonstration Simulation
              </span>
            )}
          </div>
          <UrgencyBadge urgency={incident.estimatedUrgency} score={incident.urgencyScore} size="md" />
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {incident.title}
          </h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            {incident.situationSummary}
          </p>
        </div>

        {/* Explainable Urgency Breakdown */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
          <div>
            <span className="font-bold text-slate-900">Explainable Urgency Calculation: </span>
            <span>{incident.urgencyExplanation}</span>
          </div>
        </div>

        {/* Action Header Bar */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSubReportModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-50 hover:bg-brand-100 text-brand-800 border border-brand-200 transition"
            >
              <PlusCircle className="w-4 h-4 text-brand-600" />
              <span>{t.addSubReportBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition"
            >
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Confirm Status</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenBrief}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
            >
              <Printer className="w-4 h-4" />
              <span>{t.responderBriefBtn}</span>
            </button>

            <button
              type="button"
              onClick={onProceedToActions}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white transition shadow-sm"
            >
              <span>{t.actionsTitle}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* FEATURE 1: Contradictions Section */}
      {incident.contradictions && incident.contradictions.length > 0 && (
        <section className="space-y-3" aria-labelledby="contradictions-heading">
          <div className="flex items-center justify-between">
            <h2 id="contradictions-heading" className="text-base font-black text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>{t.contradictionsTitle} ({incident.contradictions.length})</span>
            </h2>
            <span className="text-xs font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-full border border-red-300">
              {unresolvedContradictions.length} Unresolved
            </span>
          </div>

          <p className="text-xs text-slate-600">
            Contemporaneous reports regarding the same incident present opposing claims. Review side-by-side evidence and record a justified resolution without deleting original claims.
          </p>

          <div className="space-y-3">
            {incident.contradictions.map((contra) => (
              <ContradictionReviewCard
                key={contra.id}
                contradiction={contra}
                onResolve={handleResolveContradiction}
              />
            ))}
          </div>
        </section>
      )}

      {/* Reported Location Review Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-600" />
            <span>Reported Scene Location & Geographic Confidence</span>
          </h3>
          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
            Confidence: {incident.location.confidence}
          </span>
        </div>

        {!isEditingLocation ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="space-y-0.5">
              <p className="text-sm font-bold text-slate-800">{locationText}</p>
              <p className="text-xs text-slate-500">
                {locationConfirmed ? 'Verified by on-scene reporter' : 'Pending human confirmation'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition"
                title="Open location in map navigation for first responders"
              >
                <ExternalLink className="w-3.5 h-3.5 text-brand-600" />
                <span>Navigate</span>
              </a>
              <button
                type="button"
                onClick={handleToggleConfirmLocation}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  locationConfirmed
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{locationConfirmed ? 'Confirmed' : 'Confirm Location'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditingLocation(true)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition"
                aria-label="Edit location text"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:border-brand-500 focus:ring-brand-500"
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsEditingLocation(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveLocation}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold bg-brand-600 text-white rounded-lg hover:bg-brand-700"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FEATURE 2: Evidence-to-Action Chain with Trust Trace */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-600" />
              <span>{t.evidenceChainTitle}</span>
            </h2>
            <p className="text-xs text-slate-500">
              {t.evidenceChainDesc} Click "Trust Trace" on any item to view its provenance and evidence links.
            </p>
          </div>
          <span className="text-xs bg-brand-50 text-brand-800 px-2.5 py-1 rounded-full font-semibold border border-brand-200">
            {facts.length} Audited Items
          </span>
        </div>

        <div className="space-y-3">
          {facts.map((fact) => (
            <div
              key={fact.id}
              className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition bg-slate-50/50 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <EvidenceBadge label={fact.evidenceLabel} size="sm" />
                  {fact.sourceReference && (
                    <span className="text-xs text-slate-500 italic">
                      via {fact.sourceReference}
                    </span>
                  )}
                  {fact.trustTrace?.hasUnresolvedContradiction && (
                    <span className="text-[11px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                      Disputed Claim
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenTrustTrace(fact.trustTrace, fact.text)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 transition"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Trust Trace</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleConfirmFact(fact.id)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                      fact.userConfirmed
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-300'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{fact.userConfirmed ? 'Verified' : 'Verify'}</span>
                  </button>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-800 font-medium">
                {fact.text}
              </p>

              {fact.trustTrace?.reviewedCorrection && (
                <div className="text-[11px] text-emerald-800 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200">
                  <span className="font-bold">Human Correction: </span>
                  <span>{fact.trustTrace.reviewedCorrection}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Identified Hazards & Precautions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span>{t.hazardsTitle}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {incident.potentialHazards.map((haz) => (
            <div
              key={haz.id}
              className="p-4 rounded-xl border border-red-200 bg-red-50/40 space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-900 uppercase">
                    [{haz.severity}] HAZARD
                  </span>
                  <div className="flex items-center gap-1.5">
                    <EvidenceBadge label={haz.evidenceLabel} size="sm" />
                    <button
                      type="button"
                      onClick={() => handleOpenTrustTrace(haz.trustTrace, haz.description)}
                      className="p-1 rounded text-brand-700 hover:bg-brand-50"
                      title="Inspect Hazard Trust Trace"
                      aria-label="Inspect Hazard Trust Trace"
                    >
                      <Search className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-900">{haz.description}</p>
                <div className="text-xs text-red-950 font-medium bg-white/80 p-2.5 rounded-lg border border-red-200">
                  <span className="font-bold">Required Precaution: </span>
                  {haz.precautions}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURE 4: Chronological Evidence Timeline */}
      <EvidenceTimeline events={incident.timelineEvents || []} />

      {/* Trust Trace Drawer */}
      <TrustTraceDrawer
        isOpen={isTraceDrawerOpen}
        onClose={() => setIsTraceDrawerOpen(false)}
        trustTrace={activeTrustTrace}
        targetTitle={activeTraceTitle}
        onSaveCorrection={handleSaveFactCorrection}
      />

      {/* Sub-Report Ingestion Modal */}
      {showSubReportModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-brand-600" />
                <span>Submit Additional Incident Evidence</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSubReportModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubReportSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Source / Reporter Name
                </label>
                <input
                  type="text"
                  value={subReportSource}
                  onChange={(e) => setSubReportSource(e.target.value)}
                  placeholder="e.g. Eyewitness @ North Gate, Police CAD Unit #12"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Source Type
                </label>
                <select
                  value={subReportType}
                  onChange={(e) => setSubReportType(e.target.value as any)}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900"
                >
                  <option value="CITIZEN_TEXT">Citizen Eyewitness Text</option>
                  <option value="VOICE_TRANSCRIPT">Voice Recording Transcript</option>
                  <option value="OFFICIAL_BULLETIN">Official Agency Bulletin</option>
                  <option value="SCENE_PHOTO">Eyewitness Scene Photo</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Reported Information / Evidence Text
                </label>
                <textarea
                  rows={3}
                  value={subReportText}
                  onChange={(e) => setSubReportText(e.target.value)}
                  placeholder="Describe newly observed condition..."
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Observed Location (Optional)
                </label>
                <input
                  type="text"
                  value={subReportLocation}
                  onChange={(e) => setSubReportLocation(e.target.value)}
                  placeholder="e.g. Milan Subway north entrance"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubReportModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={subReportSubmitting || !subReportText.trim() || !subReportSource.trim()}
                  className="px-4 py-2 font-bold bg-brand-600 text-white rounded-xl hover:bg-brand-700 shadow-sm disabled:bg-slate-300"
                >
                  {subReportSubmitting ? 'Ingesting...' : 'Ingest Report & Re-Evaluate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Confirmation Modal */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600" />
                <span>Confirm Current On-Scene Status</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Recording an on-scene confirmation resets the evidence age and establishes freshness as CURRENT without altering original historical claims.
            </p>

            <form onSubmit={handleConfirmStatus} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Confirming Person / Authority
                </label>
                <input
                  type="text"
                  value={confirmSource}
                  onChange={(e) => setConfirmSource(e.target.value)}
                  placeholder="e.g. Field Volunteer #4, Highway Patrol Officer"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Verification Note / Observation
                </label>
                <textarea
                  rows={2}
                  value={confirmNote}
                  onChange={(e) => setConfirmNote(e.target.value)}
                  placeholder="e.g. Visually inspected 3 mins ago; water level is static at 2 feet."
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={confirming}
                  className="px-4 py-2 font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-sm"
                >
                  {confirming ? 'Recording...' : 'Commit Confirmation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
