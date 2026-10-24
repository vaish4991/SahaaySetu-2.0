import React, { useState, useEffect } from 'react';
import { IncidentInputPayload } from '@sahaaysetu/shared';
import { AudioInput } from '../components/AudioInput';
import { ImageDropzone } from '../components/ImageDropzone';
import { analyzeIncidentApi, saveLocalDraft, loadLocalDraft, clearLocalDraft } from '../services/api';
import { Language, translations } from '../locales/translations';
import {
  Send,
  Sparkles,
  Shield,
  FileText,
  AlertTriangle,
  Lock,
  Unlock,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Mic,
  Car,
  CloudLightning,
  Radio,
  Camera,
  HeartPulse,
  Zap,
  MapPin,
  ArrowRight
} from 'lucide-react';

interface Props {
  onAnalysisSuccess: (incidentId: string) => void;
  language: Language;
  initialPayload?: Partial<IncidentInputPayload>;
}

interface RealWorldPreset {
  id: string;
  name: string;
  tag: string;
  icon: React.ElementType;
  color: string;
  summary: string;
  data: Partial<IncidentInputPayload>;
}

const REAL_WORLD_PRESETS: RealWorldPreset[] = [
  {
    id: 'preset-voice',
    name: 'Panicked Voice Note',
    tag: 'Audio Channel',
    icon: Mic,
    color: 'from-purple-600 to-indigo-600',
    summary: 'Spoken dispatch transcript with background sirens, low visibility fog, and trapped victims.',
    data: {
      text: 'Accident reported on the expressway just past Khandala tunnel! A chemical tanker and two cars crashed in dense fog. Fuel is leaking across the road.',
      speechTranscript: 'Help please! There is a massive pileup right outside the tunnel near Khandala! A chemical tanker is on its side, diesel or fuel is leaking across both lanes! Thick black smoke, super foggy, cars are still speeding into the smoke! Two people are trapped in a white hatchback, please send fire brigade and ambulances immediately! Hurry!',
      pastedReport: '',
      pastedReportSource: '',
      consentGivenForLocation: true,
      consentGivenForMedical: true,
      medicalContext: 'One trapped passenger is clutching their chest, struggling for breath with history of asthma and hypertension.',
      languagePreference: 'en'
    }
  },
  {
    id: 'preset-traffic',
    name: 'Highway Traffic & Fuel Spill',
    tag: 'Traffic Hazard',
    icon: Car,
    color: 'from-amber-600 to-orange-600',
    summary: 'Multi-vehicle collision, fuel leak, blocked arterial lanes, upstream detour requirement.',
    data: {
      text: 'Major multi-vehicle collision on Western Express Flyover northbound past the airport junction. Two SUVs and a heavy transport tanker collided in center lane. Diesel fuel is pouring through expansion joints onto lower service road. Road completely blocked, 3 km traffic queue formed.',
      speechTranscript: 'Traffic police wireless report: Flyover northbound is totally blocked due to hazardous liquid spill. Divert all vehicles via SV Road.',
      pastedReport: 'POLICE CAD DISPATCH #402: Western Express Flyover closed. Hazardous material containment team mobilized. Fire tenders en route.',
      pastedReportSource: 'Traffic Police Wireless Control Room',
      consentGivenForLocation: true,
      consentGivenForMedical: false,
      medicalContext: '',
      languagePreference: 'en'
    }
  },
  {
    id: 'preset-weather',
    name: 'Severe Weather & Live Wire',
    tag: 'Cyclone / Flood',
    icon: CloudLightning,
    color: 'from-blue-600 to-cyan-600',
    summary: 'Cloudburst storm, 3.5ft floodwaters, submerged 11kV live transformer wire electrocution threat.',
    data: {
      text: 'Severe cloudburst and waterlogging in Karve Nagar! Street submerged under 3.5 feet of swirling water. A high-voltage 11kV power line snapped and dropped straight into the standing floodwater near the main bakery. Sparks and steam shooting up from the water! An auto-rickshaw with an elderly passenger is stranded 15 feet away.',
      speechTranscript: 'Do not let anyone step into the water! The whole street is energized! We need the electricity board to trip feeder line #4 immediately!',
      pastedReport: 'DISCOM EMERGENCY NOTICE: High-tension line down in Ward 12. Feeder substation trip in progress.',
      pastedReportSource: 'State Power Distribution Co. Emergency Ops',
      consentGivenForLocation: true,
      consentGivenForMedical: false,
      medicalContext: '',
      languagePreference: 'en'
    }
  },
  {
    id: 'preset-news',
    name: 'Breaking News & Viral Forward',
    tag: 'Viral Alert vs Official Bulletin',
    icon: Radio,
    color: 'from-rose-600 to-red-600',
    summary: 'Viral WhatsApp forward alleging dam breach creating mass panic; verified against official communique.',
    data: {
      text: 'Residents along riverside societies are panicking and creating a vehicle gridlock trying to flee. A viral voice note on society groups claims the upstream dam wall cracked.',
      speechTranscript: '',
      pastedReport: 'URGENT FORWARD: Red alert declared! Upstream dam gates have broken! 75,000 cusecs surging towards city, sectors 1-8 will submerge in 20 minutes! Evacuate immediately!',
      pastedReportSource: 'Viral WhatsApp Forward (Unverified Community Group)',
      consentGivenForLocation: false,
      consentGivenForMedical: false,
      medicalContext: '',
      languagePreference: 'en'
    }
  },
  {
    id: 'preset-photo',
    name: 'Eyewitness Scene Damage Photo',
    tag: 'Visual Damage Evidence',
    icon: Camera,
    color: 'from-emerald-600 to-teal-600',
    summary: 'Structural support pillar cracking, concrete spalling, visual damage assessment with EXIF time.',
    data: {
      text: 'Severe diagonal shear cracks have appeared across the ground-floor load-bearing pillar of Sunrise Commercial Arcade following morning tremors. Concrete chunks are breaking off onto the footpath. Building is groaning when trucks pass on the main road outside.',
      speechTranscript: 'Ground floor grocery and chemist shops are evacuating. We took a clear photo of the fractured pillar.',
      imageName: 'sunrise_pillar_shear_fracture.jpg',
      imageMimeType: 'image/jpeg',
      imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
      mediaCapturedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      consentGivenForLocation: true,
      consentGivenForMedical: false,
      medicalContext: '',
      languagePreference: 'en'
    }
  },
  {
    id: 'preset-medical',
    name: 'Messy Medical History Stack',
    tag: 'Unstructured EHR / Clinical Notes',
    icon: HeartPulse,
    color: 'from-pink-600 to-rose-700',
    summary: 'Unresponsive senior citizen collapse with messy hospital discharge notes, pacemaker, and diabetic insulin history.',
    data: {
      text: 'An elderly gentleman collapsed suddenly while walking in the park courtyard. Shallow, rasping breathing. Not responding to voice or shoulder shake. His pocket had a crumpled stack of clinic records and hospital discharge notes.',
      speechTranscript: 'Bystander calling 108: A senior citizen is unresponsive on the lawn. Please send an ambulance with advanced cardiac life support!',
      pastedReport: '',
      pastedReportSource: '',
      consentGivenForLocation: true,
      consentGivenForMedical: true,
      medicalContext: 'Messy Discharge Summary: Ramesh K., 72M. Hx: Severe 3-vessel CAD s/p CABG (2018), Medtronic Dual-Chamber Pacemaker implanted in left pectoral pocket (2020), Type 2 Diabetes Mellitus (HbA1c 8.9%), on Insulin Glargine 22u qHS + Metformin 1000mg BID. Chronic Kidney Disease Stage 3. Severe Penicillin anaphylaxis. Current Rx: Clopidogrel 75mg, Atorvastatin 40mg. DO NOT administer fluids by mouth if altered sensorium.',
      languagePreference: 'en'
    }
  },
  {
    id: 'preset-image-only',
    name: 'Pure Photo Only (Zero Text)',
    tag: 'Multimodal Vision Recognition',
    icon: Camera,
    color: 'from-cyan-600 to-blue-700',
    summary: 'Submit exclusively a photo without any typed text. Model inspects visual damage, classifies infrastructure failure, establishes evidence chain, and recommends 30m safety cordons.',
    data: {
      text: '',
      speechTranscript: '',
      pastedReport: '',
      pastedReportSource: '',
      imageName: 'sunrise_pillar_shear_fracture.jpg',
      imageMimeType: 'image/jpeg',
      imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
      mediaCapturedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      consentGivenForLocation: true,
      consentGivenForMedical: false,
      medicalContext: '',
      languagePreference: 'en'
    }
  }
];

export const SubmitIncident: React.FC<Props> = ({
  onAnalysisSuccess,
  language,
  initialPayload
}) => {
  const t = translations[language];

  const [text, setText] = useState(initialPayload?.text || '');
  const [speechTranscript, setSpeechTranscript] = useState(initialPayload?.speechTranscript || '');
  const [pastedReport, setPastedReport] = useState(initialPayload?.pastedReport || '');
  const [pastedReportSource, setPastedReportSource] = useState(initialPayload?.pastedReportSource || '');
  const [imageBase64, setImageBase64] = useState<string | undefined>(initialPayload?.imageBase64);
  const [imageMimeType, setImageMimeType] = useState<string | undefined>(initialPayload?.imageMimeType);
  const [imageName, setImageName] = useState<string | undefined>(initialPayload?.imageName);
  const [medicalContext, setMedicalContext] = useState(initialPayload?.medicalContext || '');
  const [consentMedical, setConsentMedical] = useState(initialPayload?.consentGivenForMedical || false);
  const [consentLocation, setConsentLocation] = useState(initialPayload?.consentGivenForLocation ?? true);

  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [draftNotice, setDraftNotice] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Synchronize when initialPayload prop changes (e.g. from Dashboard or presets)
  useEffect(() => {
    if (initialPayload && Object.keys(initialPayload).length > 0) {
      setText(initialPayload.text || '');
      setSpeechTranscript(initialPayload.speechTranscript || '');
      setPastedReport(initialPayload.pastedReport || '');
      setPastedReportSource(initialPayload.pastedReportSource || '');
      setImageBase64(initialPayload.imageBase64);
      setImageMimeType(initialPayload.imageMimeType);
      setImageName(initialPayload.imageName);
      setMedicalContext(initialPayload.medicalContext || '');
      setConsentMedical(Boolean(initialPayload.consentGivenForMedical || (initialPayload.medicalContext && initialPayload.medicalContext.trim().length > 0)));
      setConsentLocation(initialPayload.consentGivenForLocation ?? true);
      setDraftNotice(false);
    }
  }, [initialPayload]);

  // Auto-restore draft on mount if not given initial payload
  useEffect(() => {
    if (!initialPayload || Object.keys(initialPayload).length === 0) {
      const saved = loadLocalDraft();
      if (saved && (saved.text || saved.speechTranscript || saved.pastedReport)) {
        setText(saved.text || '');
        setSpeechTranscript(saved.speechTranscript || '');
        setPastedReport(saved.pastedReport || '');
        setPastedReportSource(saved.pastedReportSource || '');
        setDraftNotice(true);
      }
    }
  }, [initialPayload]);

  // Save non-sensitive draft on change
  useEffect(() => {
    saveLocalDraft({
      text,
      speechTranscript,
      pastedReport,
      pastedReportSource,
      consentGivenForLocation: consentLocation,
      consentGivenForMedical: consentMedical,
      medicalContext: consentMedical ? medicalContext : ''
    });
  }, [text, speechTranscript, pastedReport, pastedReportSource, consentLocation, consentMedical, medicalContext]);

  // Execute crisis analysis with the current state or explicit payload
  const executeAnalysis = async (customPayload?: IncidentInputPayload) => {
    setValidationError(null);

    const targetPayload: IncidentInputPayload = customPayload || {
      text,
      speechTranscript,
      pastedReport,
      pastedReportSource,
      imageBase64,
      imageMimeType,
      imageName,
      medicalContext: consentMedical ? medicalContext : '',
      consentGivenForMedical: consentMedical,
      consentGivenForLocation: consentLocation,
      languagePreference: language,
      clientTimestamp: new Date().toISOString()
    };

    const hasAnyInput =
      Boolean(targetPayload.text && targetPayload.text.trim().length > 0) ||
      Boolean(targetPayload.speechTranscript && targetPayload.speechTranscript.trim().length > 0) ||
      Boolean(targetPayload.pastedReport && targetPayload.pastedReport.trim().length > 0) ||
      Boolean(targetPayload.imageBase64) ||
      Boolean(targetPayload.medicalContext && targetPayload.medicalContext.trim().length > 0 && targetPayload.consentGivenForMedical);

    if (!hasAnyInput) {
      setValidationError(
        'Please provide at least one input source: typed situation, voice transcript, pasted report, scene photo, or consented medical history.'
      );
      return;
    }

    setLoading(true);

    try {
      const result = await analyzeIncidentApi(targetPayload);
      clearLocalDraft();
      onAnalysisSuccess(result.incident.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to analyze incident. Please check your network connection.';
      setValidationError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeAnalysis();
  };

  // Instant one-click ingestion & analysis for messy real-world presets
  const handleInstantPreset = async (preset: RealWorldPreset) => {
    setActivePresetId(preset.id);
    setText(preset.data.text || '');
    setSpeechTranscript(preset.data.speechTranscript || '');
    setPastedReport(preset.data.pastedReport || '');
    setPastedReportSource(preset.data.pastedReportSource || '');
    setImageBase64(preset.data.imageBase64);
    setImageMimeType(preset.data.imageMimeType);
    setImageName(preset.data.imageName);
    setMedicalContext(preset.data.medicalContext || '');
    setConsentMedical(Boolean(preset.data.consentGivenForMedical || preset.data.medicalContext));
    setConsentLocation(preset.data.consentGivenForLocation ?? true);

    const payload: IncidentInputPayload = {
      text: preset.data.text || '',
      speechTranscript: preset.data.speechTranscript || '',
      pastedReport: preset.data.pastedReport || '',
      pastedReportSource: preset.data.pastedReportSource || '',
      imageBase64: preset.data.imageBase64,
      imageMimeType: preset.data.imageMimeType,
      imageName: preset.data.imageName,
      medicalContext: preset.data.medicalContext || '',
      consentGivenForMedical: Boolean(preset.data.consentGivenForMedical || preset.data.medicalContext),
      consentGivenForLocation: preset.data.consentGivenForLocation ?? true,
      languagePreference: language,
      clientTimestamp: new Date().toISOString()
    };

    await executeAnalysis(payload);
  };

  // Populate preset data into form for inspection/editing
  const handleLoadPresetToForm = (preset: RealWorldPreset) => {
    setActivePresetId(preset.id);
    setText(preset.data.text || '');
    setSpeechTranscript(preset.data.speechTranscript || '');
    setPastedReport(preset.data.pastedReport || '');
    setPastedReportSource(preset.data.pastedReportSource || '');
    setImageBase64(preset.data.imageBase64);
    setImageMimeType(preset.data.imageMimeType);
    setImageName(preset.data.imageName);
    setMedicalContext(preset.data.medicalContext || '');
    setConsentMedical(Boolean(preset.data.consentGivenForMedical || preset.data.medicalContext));
    setConsentLocation(preset.data.consentGivenForLocation ?? true);
    setValidationError(null);
  };

  const handleClear = () => {
    setText('');
    setSpeechTranscript('');
    setPastedReport('');
    setPastedReportSource('');
    setImageBase64(undefined);
    setImageMimeType(undefined);
    setImageName(undefined);
    setMedicalContext('');
    setConsentMedical(false);
    setValidationError(null);
    setDraftNotice(false);
    setActivePresetId(null);
    clearLocalDraft();
  };

  // Detected modalities badge calculator
  const activeModalities = [
    Boolean(text.trim()) && 'Text Narrative',
    Boolean(speechTranscript.trim()) && 'Audio/Voice Transcript',
    Boolean(pastedReport.trim()) && 'Alert/News Excerpt',
    Boolean(imageBase64) && 'Visual Photo',
    Boolean(medicalContext.trim()) && 'Medical History Stack'
  ].filter(Boolean) as string[];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Real-World Unstructured Multi-Modal Ingestion Selector */}
      <div className="bg-gradient-to-r from-slate-900 via-navy-900 to-brand-950 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/40 mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Unstructured Real-World Input Ingestor</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Convert Any Messy Crisis Input into Life-Saving Actions
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
              Test with messy real-world inputs: panicked voice transcripts, expressway gridlock, cyclone storm surges, breaking news tickers, photos, or raw clinical medical stacks.
            </p>
          </div>
        </div>

        {/* 6 Modality Ingestion Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {REAL_WORLD_PRESETS.map((preset) => {
            const IconComponent = preset.icon;
            const isSelected = activePresetId === preset.id;

            return (
              <div
                key={preset.id}
                className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between group ${
                  isSelected
                    ? 'bg-slate-800/95 border-brand-400 shadow-lg ring-1 ring-brand-400'
                    : 'bg-slate-800/50 hover:bg-slate-800/80 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                      {preset.tag}
                    </span>
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${preset.color} flex items-center justify-center text-white shadow-sm`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                  </div>

                  <h2 className="text-sm font-bold text-white group-hover:text-brand-300 transition">
                    {preset.name}
                  </h2>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {preset.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-700/60 mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleInstantPreset(preset)}
                    disabled={loading}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white transition shadow-sm disabled:opacity-50"
                    title="Instantly convert this messy input into structured actions"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Instant Actions</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLoadPresetToForm(preset)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 transition"
                    title="Load into form fields below to inspect and customize"
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Ingestion Studio Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Studio Sub-Header */}
        <div className="p-6 sm:p-7 bg-slate-900 text-white border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight">
                Crisis Input Ingestion Studio
              </h2>
              <p className="text-xs text-slate-400">
                Multi-channel ingestion with evidence attribution, medical privacy safeguards, and instant triage
              </p>
            </div>
          </div>

          {/* Active Modalities Pill */}
          {activeModalities.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-400 font-medium">Detected:</span>
              {activeModalities.map((m, idx) => (
                <span
                  key={idx}
                  className="text-[11px] font-bold bg-brand-900/80 text-brand-300 border border-brand-700 px-2 py-0.5 rounded-full"
                >
                  {m}
                </span>
              ))}
            </div>
          )}
        </div>

        {draftNotice && (
          <div className="mx-6 mt-4 bg-brand-50 border border-brand-200 rounded-xl p-3 flex items-center justify-between text-xs text-brand-900">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Recovered unfinished input draft from your browser storage.</span>
            </span>
            <button
              type="button"
              onClick={() => setDraftNotice(false)}
              className="text-xs font-bold text-brand-700 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Studio Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Validation Notice */}
          {validationError && (
            <div
              className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-900 text-sm"
              role="alert"
            >
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Submission Notice</p>
                <p className="text-xs text-red-800 mt-0.5">{validationError}</p>
              </div>
            </div>
          )}

          {/* 1. Free-form text description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="situation-text" className="block text-sm font-bold text-slate-800">
                1. Situation Description (Free-Form Text)
              </label>
              <span className="text-xs text-slate-400 font-mono">
                {text.length} chars
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Describe the emergency in natural, unstructured language: vehicle collisions, road blockages, rising floods, collapsed structures, or trapped citizens.
            </p>
            <textarea
              id="situation-text"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Collision between a tanker and two cars near expressway milestone 42. Diesel fuel is leaking onto the roadway. Thick fog is blinding drivers..."
              className="w-full text-sm rounded-xl border border-slate-300 bg-white p-3.5 focus:border-brand-500 focus:ring-brand-500 text-slate-800 placeholder-slate-400 shadow-sm transition"
            />
          </div>

          {/* 2. Voice Input with Speech Recognition */}
          <div className="pt-2 border-t border-slate-100">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              2. Voice Audio Channel
            </span>
            <AudioInput
              value={speechTranscript}
              onTranscriptChange={(t) => setSpeechTranscript(t)}
            />
          </div>

          {/* 3. Image Upload */}
          <div className="pt-2 border-t border-slate-100">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              3. Visual Photographic Evidence
            </span>
            <ImageDropzone
              onImageSelected={(base64, mimeType, name) => {
                setImageBase64(base64);
                setImageMimeType(mimeType);
                setImageName(name);
              }}
            />
          </div>

          {/* 4. Pasted External Report / Weather Alert */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              4. External Communication or Alert Excerpt
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label htmlFor="pasted-report" className="text-xs font-semibold text-slate-700">
                  Pasted Alert / Message Excerpt
                </label>
                <textarea
                  id="pasted-report"
                  rows={2}
                  value={pastedReport}
                  onChange={(e) => setPastedReport(e.target.value)}
                  placeholder="Paste WhatsApp forward, police bulletin, or weather alert..."
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2.5 focus:border-brand-500 focus:ring-brand-500 text-slate-800 placeholder-slate-400 shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="pasted-source" className="text-xs font-semibold text-slate-700">
                  Claimed Source Attribution
                </label>
                <input
                  id="pasted-source"
                  type="text"
                  value={pastedReportSource}
                  onChange={(e) => setPastedReportSource(e.target.value)}
                  placeholder="e.g. IMD Advisory, Traffic Police, Resident WhatsApp"
                  className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2.5 focus:border-brand-500 focus:ring-brand-500 text-slate-800 placeholder-slate-400 shadow-sm"
                />
                <p className="text-[11px] text-slate-500">
                  Helps Evidence Chain identify source credibility.
                </p>
              </div>
            </div>
          </div>

          {/* 5. Consented Medical Context (Smooth & Non-Clickable Issue Fixed) */}
          <div
            className={`pt-2 border-t border-slate-100 space-y-3 p-4 rounded-2xl border transition-all ${
              consentMedical
                ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {consentMedical ? (
                  <Unlock className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 text-brand-600 shrink-0" />
                )}
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {t.medicalConsentTitle}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Paste raw doctor notes, discharge sheets, pacemaker history, or chronic allergies.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConsentMedical(!consentMedical)}
                className={`text-xs px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  consentMedical
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100'
                }`}
                aria-pressed={consentMedical}
              >
                {consentMedical ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Consent Active</span>
                  </>
                ) : (
                  <span>Click to Unlock Consent</span>
                )}
              </button>
            </div>

            <textarea
              id="medical-context-input"
              aria-label="Consented medical history and health context"
              rows={3}
              value={medicalContext}
              onFocus={() => {
                if (!consentMedical) setConsentMedical(true);
              }}
              onChange={(e) => {
                setMedicalContext(e.target.value);
                if (e.target.value.trim().length > 0 && !consentMedical) {
                  setConsentMedical(true);
                }
              }}
              placeholder="Paste or type medical history (e.g. Ramesh K, 72M, Pacemaker implanted 2020, Type 2 diabetes on insulin, allergic to penicillin, unresponsive)..."
              className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2.5 focus:border-brand-500 focus:ring-brand-500 text-slate-800 placeholder-slate-400 shadow-sm transition"
            />

            <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={consentMedical}
                onChange={(e) => setConsentMedical(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4 shrink-0"
              />
              <span>{t.medicalConsentDesc}</span>
            </label>
          </div>

          {/* Location Consent & Device GPS Capture */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={consentLocation}
                onChange={(e) => setConsentLocation(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
              />
              <span>{t.locationConsentTitle}</span>
            </label>
            <div className="flex items-center gap-2">
              {consentLocation && (
                <button
                  type="button"
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          const lat = pos.coords.latitude.toFixed(5);
                          const lng = pos.coords.longitude.toFixed(5);
                          const coordTag = `[GPS Coordinates: ${lat}, ${lng}]`;
                          setText((prev) => (prev ? `${prev}\n${coordTag}` : coordTag));
                        },
                        () => {
                          setValidationError('Unable to retrieve device GPS. Please verify browser geolocation permissions.');
                        }
                      );
                    }
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 transition"
                  title="Detect and append exact GPS coordinates"
                >
                  <MapPin className="w-3.5 h-3.5 text-brand-600" />
                  <span>Use Device GPS</span>
                </button>
              )}
              <span className="text-slate-500 italic">Disclosed to on-scene brief only</span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" />
              <span>Clear Form</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className={`inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-white shadow-lg transition ${
                loading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/25 active:scale-95'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{t.analyzingText}</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Convert Messy Input into Life-Saving Actions</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
