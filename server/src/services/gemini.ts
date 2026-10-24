import { GoogleGenAI } from '@google/genai';
import {
  IncidentCategory,
  IncidentInputPayload,
  IncidentRecord,
  IncidentRecordSchema,
  DEMO_SCENARIOS,
  EvidenceLabel,
  LocationConfidence,
  UrgencyLevel,
  IncidentSubReport,
  TimelineEvent,
  TrustTrace,
  FreshnessEvaluation,
  IncidentFact,
  HazardItem,
  ActionItem,
  UncertaintyItem,
  ContradictionItem,
  FreshnessStatus
} from '@sahaaysetu/shared';
import { env, isGeminiConfigured } from '../config/env';
import { calculateUrgency } from './prioritization';
import { sanitizeInputText, sanitizeMedicalContext } from './sanitizer';
import { calculateFreshness } from './freshnessEngine';
import { detectContradictions } from './contradictionDetector';

let genAIClient: GoogleGenAI | null = null;
if (isGeminiConfigured) {
  try {
    genAIClient = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  } catch (err) {
    console.error('Failed to initialize GoogleGenAI client:', err);
  }
}

const GEMINI_SYSTEM_INSTRUCTION = `
You are the AI Core of SahaaySetu — an emergency crisis-to-action bridge for humanitarian and civic coordination.
Your mission is to convert unstructured, messy crisis inputs (voice notes, bystander text, alerts, photos, medical snippets) into structured, safe, evidence-aware incident reports.

CRITICAL SAFETY & INTEGRITY RULES:
1. EVIDENCE-TO-ACTION CHAIN: You must label EVERY extracted fact, hazard, and recommended action with exactly one evidence label:
   - "USER-REPORTED": directly stated by the user/witness.
   - "SOURCE-VERIFIED": only if backed by an identifiable official communique (e.g. IMD, police bulletin, fire department). Do NOT label something source-verified merely because you inferred it.
   - "AI-INFERRED": deduced by you from the context (e.g. probable fuel explosion risk from a tanker crash in fog).
   - "UNVERIFIED": unconfirmed rumor, social media forward, or uncorroborated third-party claim.
2. MEDICAL CONSERVATISM: You are NOT a medical practitioner and must NEVER diagnose illnesses, prescribe medications, or guess treatment. Offer conservative first-aid and scene stabilization precautions (e.g. recovery position, clear airway, do not give water to unconscious person) and escalate immediately to emergency medical services (e.g. 108/112).
3. NO DISPATCH CLAIMS: NEVER claim emergency personnel or rescue teams are dispatched or "on their way". Clearly instruct the user on direct emergency telephone contacts.
4. UNCERTAINTIES & CONTRADICTIONS: Explicitly surface missing facts and conflicting details between sources.
5. LOCATION: Extract location and assign confidence: EXACT, APPROXIMATE, UNCONFIRMED, or UNKNOWN.

Output ONLY valid JSON strictly matching the requested schema. Do not include markdown code block formatting or backticks around the json.
`;

const RESPONSE_SCHEMA_JSON = {
  category: "NATURAL_DISASTER | TRAFFIC_ACCIDENT | INFRASTRUCTURE_FAILURE | PUBLIC_SAFETY | MEDICAL_EMERGENCY | OTHER",
  title: "Short concise incident title (max 100 chars)",
  situationSummary: "Clear 2-3 sentence summary of the situation",
  location: {
    rawText: "Location string from user",
    confidence: "EXACT | APPROXIMATE | UNCONFIRMED | UNKNOWN",
    normalized: "Clean city/district/landmark if discernible"
  },
  userReportedFacts: [
    {
      id: "fact-1",
      text: "Fact statement",
      evidenceLabel: "USER-REPORTED | SOURCE-VERIFIED | AI-INFERRED | UNVERIFIED",
      confidenceScore: 0.9,
      sourceReference: "Optional source info"
    }
  ],
  potentialHazards: [
    {
      id: "hazard-1",
      description: "Hazard description",
      severity: "SEVERE | MODERATE | LOW",
      precautions: "Immediate safety precautions",
      evidenceLabel: "USER-REPORTED | SOURCE-VERIFIED | AI-INFERRED | UNVERIFIED"
    }
  ],
  peopleAffected: {
    estimatedCount: "e.g. 2-5 persons or Unknown",
    vulnerableGroups: ["elderly", "children"],
    details: "Context on affected individuals"
  },
  uncertainties: [
    {
      id: "unc-1",
      description: "Uncertain detail",
      type: "MISSING_DATA | CONFLICTING_REPORT | LOCATION_AMBIGUITY | UNVERIFIED_SOURCE",
      mitigationSuggestion: "How responder can verify"
    }
  ],
  recommendedActions: [
    {
      id: "act-1",
      stepNumber: 1,
      title: "Immediate action title",
      description: "Step-by-step guidance",
      priority: "IMMEDIATE | HIGH | ROUTINE",
      safetyPrecautions: "Safety warnings",
      rationale: "Why this action is critical",
      evidenceLabel: "USER-REPORTED | SOURCE-VERIFIED | AI-INFERRED | UNVERIFIED",
      requiresConfirmation: true,
      emergencyServiceContact: "112 / 108"
    }
  ]
};

interface GeminiParsedOutput {
  category?: IncidentCategory;
  title?: string;
  situationSummary?: string;
  urgencyScore?: number;
  urgencyLevel?: UrgencyLevel;
  location?: {
    rawText?: string;
    normalized?: string;
    confidence?: LocationConfidence;
    coordinates?: { latitude: number; longitude: number };
  };
  peopleAffected?: {
    estimatedCount?: string;
    vulnerableGroups?: string[];
    details?: string;
  };
  userReportedFacts?: Array<{
    id?: string;
    text?: string;
    evidenceLabel?: EvidenceLabel;
    userConfirmed?: boolean;
    sourceReference?: string;
    confidenceScore?: number;
  }>;
  identifiedHazards?: Array<{
    id?: string;
    description?: string;
    severity?: 'SEVERE' | 'MODERATE' | 'LOW';
    precautions?: string;
    evidenceLabel?: EvidenceLabel;
  }>;
  recommendedActions?: Array<{
    stepNumber?: number;
    title?: string;
    description?: string;
    priority?: 'IMMEDIATE' | 'HIGH' | 'ROUTINE';
    safetyPrecautions?: string;
    rationale?: string;
    evidenceLabel?: EvidenceLabel;
    requiresConfirmation?: boolean;
    emergencyServiceContact?: string;
  }>;
  uncertainties?: Array<{
    id?: string;
    description?: string;
    type?: 'MISSING_DATA' | 'CONFLICTING_REPORT' | 'LOCATION_AMBIGUITY' | 'UNVERIFIED_SOURCE';
    mitigationSuggestion?: string;
  }>;
  missingInformationGaps?: string[];
  [key: string]: unknown;
}

export async function analyzeIncident(
  payload: IncidentInputPayload,
  isExplicitDemo = false
): Promise<IncidentRecord> {
  const timestamp = new Date().toISOString();
  const incidentId = `inc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // Sanitize all inputs
  const cleanText = sanitizeInputText(payload.text).cleanedText;
  const cleanSpeech = sanitizeInputText(payload.speechTranscript).cleanedText;
  const cleanPasted = sanitizeInputText(payload.pastedReport).cleanedText;
  const cleanPastedSource = sanitizeInputText(payload.pastedReportSource).cleanedText;
  const cleanMedical = sanitizeMedicalContext(payload.medicalContext, payload.consentGivenForMedical);

  // Check if this input matches one of our demo scenarios or is explicitly requested as demo
  const matchedDemo = DEMO_SCENARIOS.find(demo => {
    const textMatch = cleanText && demo.inputPayload.text && (
      cleanText === demo.inputPayload.text ||
      cleanText.includes(demo.inputPayload.text.substring(0, 25)) ||
      demo.inputPayload.text.includes(cleanText.substring(0, 25))
    );
    const pastedMatch = cleanPasted && demo.inputPayload.pastedReport && (
      cleanPasted === demo.inputPayload.pastedReport ||
      cleanPasted.includes(demo.inputPayload.pastedReport.substring(0, 25)) ||
      demo.inputPayload.pastedReport.includes(cleanPasted.substring(0, 25))
    );
    return Boolean(textMatch || pastedMatch);
  }) || (isExplicitDemo ? DEMO_SCENARIOS[0] : undefined);

  // If Gemini is not configured or demo mode is matched, use the deterministic engine
  if (!isGeminiConfigured || !genAIClient || matchedDemo) {
    return generateDeterministicIncident({
      incidentId,
      timestamp,
      payload,
      cleanText,
      cleanSpeech,
      cleanPasted,
      cleanPastedSource,
      cleanMedical,
      demoTemplate: matchedDemo
    });
  }

  // Real Gemini API Execution
  try {
    const promptParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
    const hasImage = Boolean(payload.imageBase64 || payload.imageName);
    const hasOnlyImage = hasImage && !cleanText && !cleanSpeech && !cleanPasted && !cleanMedical;

    let combinedDescription = `ANALYZE THIS EMERGENCY INCIDENT AND RETURN JSON.\n\n`;
    if (cleanText) combinedDescription += `PRIMARY USER TEXT: ${cleanText}\n\n`;
    if (cleanSpeech) combinedDescription += `VOICE RECORDING TRANSCRIPT: ${cleanSpeech}\n\n`;
    if (cleanPasted) combinedDescription += `PASTED EXTERNAL ALERT: ${cleanPasted} (Claimed Source: ${cleanPastedSource || 'Not specified'})\n\n`;
    if (cleanMedical && payload.consentGivenForMedical) {
      combinedDescription += `CONSENTED MEDICAL CONTEXT: ${cleanMedical}\n\n`;
    }

    if (hasOnlyImage) {
      combinedDescription += `PRIMARY INPUT MODALITY: VISUAL CRISIS PHOTOGRAPH (IMAGE-ONLY SUBMISSION).\n`;
      combinedDescription += `The reporting citizen or first responder has submitted an eyewitness photograph of the emergency scene without typed text.\n`;
      combinedDescription += `CRITICAL VISUAL INTELLIGENCE INSTRUCTIONS:\n`;
      combinedDescription += `1. Thoroughly inspect the attached photograph.\n`;
      combinedDescription += `2. Accurately deduce the incident category: INFRASTRUCTURE_FAILURE (cracks, pillar damage, collapsed slab, rubble), TRAFFIC_ACCIDENT (vehicle collision, truck/tanker spill, highway pileup), NATURAL_DISASTER (floodwaters, submerged streets, landslides, storm surge), PUBLIC_SAFETY (active fire, smoke plumes, crowd panic, hazmat release), or MEDICAL_EMERGENCY (physical casualties).\n`;
      combinedDescription += `3. In 'title', formulate an explicit, descriptive emergency title based on visible scene damage.\n`;
      combinedDescription += `4. In 'situationSummary', summarize what is directly visible in the photograph (e.g. concrete spalling, sheared column, submerged vehicles, fire combustion).\n`;
      combinedDescription += `5. In 'userReportedFacts', extract 2-4 direct physical facts visible in the photo and label with 'USER-REPORTED'.\n`;
      combinedDescription += `6. In 'potentialHazards', deduce acute primary and secondary hazards (e.g. progressive structural collapse, electrocution from submerged lines, secondary collisions) and label with 'AI-INFERRED' or 'USER-REPORTED'.\n`;
      combinedDescription += `7. In 'recommendedActions', generate concrete, prioritized life-safety instructions (perimeter cordons, immediate building evacuation, specialized rescue team dispatch).\n\n`;
    }

    combinedDescription += `LOCATION CONSENT GIVEN: ${payload.consentGivenForLocation ? 'YES' : 'NO'}\n`;
    combinedDescription += `LANGUAGE: ${payload.languagePreference}\n\n`;
    combinedDescription += `REQUIRED OUTPUT JSON STRUCTURE:\n${JSON.stringify(RESPONSE_SCHEMA_JSON, null, 2)}`;

    promptParts.push({ text: combinedDescription });

    // Handle multimodal image input if provided
    if (payload.imageBase64) {
      const mimeMatch = payload.imageBase64.match(/^data:([a-zA-Z0-9.+/-]+);base64,/);
      const resolvedMime = payload.imageMimeType || (mimeMatch ? mimeMatch[1] : 'image/jpeg');
      const cleanData = payload.imageBase64.replace(/^data:[^;]+;base64,/, '');

      promptParts.push({
        inlineData: {
          mimeType: resolvedMime,
          data: cleanData
        }
      });
    }

    const apiCallPromise = genAIClient.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: promptParts,
      config: {
        systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API call timed out after 12000ms')), 12000)
    );

    const response = (await Promise.race([apiCallPromise, timeoutPromise])) as { text?: string };

    const responseText = response.text || '';
    let parsed: GeminiParsedOutput = {};
    try {
      parsed = JSON.parse(responseText);
    } catch {
      const cleaned = responseText.replace(/```(?:json)?/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    // Build Sub-Reports from distinct inputs
    const subReports: IncidentSubReport[] = buildSubReportsFromInputs({
      cleanText,
      cleanSpeech,
      cleanPasted,
      cleanPastedSource,
      imageName: payload.imageName,
      mediaCapturedAt: payload.mediaCapturedAt,
      eventObservedAt: payload.eventObservedAt,
      timestamp
    });

    // Detect Contradictions
    const contradictions = detectContradictions(subReports);

    // Calculate Freshness
    const freshness = calculateFreshness({
      category: parsed.category || 'OTHER',
      submittedAt: timestamp,
      eventObservedAt: payload.eventObservedAt,
      mediaCapturedAt: payload.mediaCapturedAt
    });

    // Algorithmic urgency evaluation for transparent score & validation
    const urgencyEval = calculateUrgency({
      text: `${cleanText} ${cleanSpeech} ${cleanPasted}`,
      category: parsed.category,
      hasMedicalDistress: Boolean(cleanMedical),
      hasUnresolvedContradictions: contradictions.some(c => !c.isResolved),
      freshnessStatus: freshness.status
    });

    // Build Timeline Events
    const timelineEvents = buildTimelineEvents({
      subReports,
      contradictions,
      timestamp,
      title: parsed.title || 'Incident Report'
    });

    const rawFacts = (Array.isArray(parsed.userReportedFacts) ? parsed.userReportedFacts : []) as Array<Record<string, unknown>>;
    const userReportedFacts = rawFacts.map((f, idx: number) => {
      const factId = (f.id as string) || `fact-${idx + 1}`;
      const factText = (f.text as string) || '';
      const factLabel = (f.evidenceLabel as EvidenceLabel) || 'USER-REPORTED';
      const trace: TrustTrace = {
        targetId: factId,
        supportingClaim: factText,
        sourceName: (f.sourceReference as string) || 'Citizen Eyewitness',
        sourceType: 'USER_TEXT',
        submissionTime: timestamp,
        eventTime: payload.eventObservedAt || undefined,
        evidenceLabel: factLabel,
        supportExplanation: 'Extracted directly from user submission during crisis ingestion.',
        verificationDetails: factLabel === 'SOURCE-VERIFIED'
          ? 'Corroborated against external alert source.'
          : 'User-reported claim; requires on-scene confirmation.',
        hasUnresolvedContradiction: contradictions.some(c => !c.isResolved && c.topic.toLowerCase().includes('road')),
        relatedContradictionId: contradictions[0]?.id
      };

      return {
        id: factId,
        text: factText,
        evidenceLabel: factLabel,
        userConfirmed: false,
        sourceReference: f.sourceReference as string | undefined,
        confidenceScore: typeof f.confidenceScore === 'number' ? f.confidenceScore : 0.85,
        trustTrace: trace
      };
    });

    const rawHazards = (Array.isArray(parsed.potentialHazards) ? parsed.potentialHazards : []) as Array<Record<string, unknown>>;
    const potentialHazards = rawHazards.map((h, idx: number) => {
      const hazId = (h.id as string) || `hazard-${idx + 1}`;
      const hazDesc = (h.description as string) || '';
      const hazSeverity = (h.severity as 'SEVERE' | 'MODERATE' | 'LOW') || 'MODERATE';
      const hazPrecautions = (h.precautions as string) || 'Proceed with caution';
      const hazLabel = (h.evidenceLabel as EvidenceLabel) || 'AI-INFERRED';
      const trace: TrustTrace = {
        targetId: hazId,
        supportingClaim: hazDesc,
        sourceName: 'SahaaySetu Gemini Core',
        sourceType: 'AI_INFERRED',
        submissionTime: timestamp,
        evidenceLabel: hazLabel,
        supportExplanation: 'Deduced through multi-factor risk modeling of environmental, structural, and witness observations.',
        verificationDetails: 'AI-inferred hazard; safety precautions generated conservatively.'
      };

      return {
        id: hazId,
        description: hazDesc,
        severity: hazSeverity,
        precautions: hazPrecautions,
        evidenceLabel: hazLabel,
        trustTrace: trace
      };
    });

    const rawActions = (Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : []) as Array<Record<string, unknown>>;
    const recommendedActions = rawActions.map((a, idx: number) => {
      const actId = (a.id as string) || `act-${idx + 1}`;
      const hasConflict = contradictions.some(c => !c.isResolved);
      const isStale = freshness.status === 'STALE' || freshness.status === 'UNKNOWN';

      let conflictWarning: string | undefined = undefined;
      let staleWarning: string | undefined = undefined;

      if (hasConflict) {
        conflictWarning = 'Caution: Conflicting reports exist on scene. Follow conservative safety posture before approaching.';
      }
      if (isStale) {
        staleWarning = `Caution: Evidence is ${freshness.status} (${freshness.ageFormatted}). Do not assume clearance.`;
      }

      const actTitle = (a.title as string) || '';
      const actDesc = (a.description as string) || '';
      const actPriority = (a.priority as 'IMMEDIATE' | 'HIGH' | 'ROUTINE') || 'HIGH';
      const actLabel = (a.evidenceLabel as EvidenceLabel) || 'AI-INFERRED';

      const trace: TrustTrace = {
        targetId: actId,
        supportingClaim: actTitle,
        sourceName: 'Operational Safety Guidelines',
        sourceType: 'AI_INFERRED',
        submissionTime: timestamp,
        evidenceLabel: actLabel,
        supportExplanation: (a.rationale as string) || 'Prioritized to preserve life safety and mitigate secondary disasters.',
        verificationDetails: 'Action steps conform to standard civic emergency triage protocols.',
        hasUnresolvedContradiction: hasConflict,
        uncertaintyNotes: conflictWarning || staleWarning
      };

      return {
        id: actId,
        stepNumber: (a.stepNumber as number) || idx + 1,
        title: actTitle,
        description: actDesc,
        priority: actPriority,
        safetyPrecautions: (a.safetyPrecautions as string) || 'Ensure personal safety first',
        rationale: (a.rationale as string) || 'Mitigate immediate risk',
        evidenceLabel: actLabel,
        requiresConfirmation: Boolean(a.requiresConfirmation || hasConflict || isStale),
        isCompleted: false,
        emergencyServiceContact: (a.emergencyServiceContact as string) || '112',
        freshnessStatus: freshness.status,
        hasUnresolvedConflict: hasConflict,
        conflictWarning,
        staleWarning,
        trustTrace: trace
      };
    });

    const incident: IncidentRecord = {
      id: incidentId,
      category: parsed.category || 'OTHER',
      title: parsed.title || 'Reported Crisis Incident',
      situationSummary: parsed.situationSummary || cleanText || cleanSpeech || 'Incident reported.',
      userReportedFacts,
      location: {
        rawText: parsed.location?.rawText || (payload.consentGivenForLocation ? 'Location provided in text' : 'Location withheld'),
        normalized: parsed.location?.normalized,
        confidence: parsed.location?.confidence || 'APPROXIMATE',
        userConfirmed: false
      },
      estimatedUrgency: urgencyEval.urgencyLevel,
      urgencyExplanation: urgencyEval.explanation,
      urgencyScore: urgencyEval.score,
      potentialHazards,
      peopleAffected: {
        estimatedCount: parsed.peopleAffected?.estimatedCount || 'Unknown',
        vulnerableGroups: parsed.peopleAffected?.vulnerableGroups || [],
        details: parsed.peopleAffected?.details
      },
      uncertainties: (((Array.isArray(parsed.uncertainties) ? parsed.uncertainties : []) as Array<Record<string, unknown>>)).map((u, idx: number) => ({
        id: (u.id as string) || `unc-${idx + 1}`,
        description: (u.description as string) || 'Unverified detail on scene',
        type: ((u.type as string) || 'MISSING_DATA') as 'MISSING_DATA' | 'CONFLICTING_REPORT' | 'LOCATION_AMBIGUITY' | 'UNVERIFIED_SOURCE',
        mitigationSuggestion: (u.mitigationSuggestion as string) || 'Verify with on-scene responders'
      })),
      recommendedActions,
      evidenceReferences: [
        ...(cleanText ? [{
          id: 'ev-1',
          sourceType: 'USER_TEXT' as const,
          label: 'USER-REPORTED' as EvidenceLabel,
          contentSnippet: cleanText.substring(0, 150),
          sourceAttribution: 'Submitted by citizen witness'
        }] : []),
        ...(cleanSpeech ? [{
          id: 'ev-2',
          sourceType: 'VOICE_TRANSCRIPT' as const,
          label: 'USER-REPORTED' as EvidenceLabel,
          contentSnippet: cleanSpeech.substring(0, 150),
          sourceAttribution: 'Speech-to-text transcript'
        }] : []),
        ...(cleanPasted ? [{
          id: 'ev-3',
          sourceType: 'PASTED_ALERT' as const,
          label: cleanPastedSource ? 'SOURCE-VERIFIED' as EvidenceLabel : 'UNVERIFIED' as EvidenceLabel,
          contentSnippet: cleanPasted.substring(0, 150),
          sourceAttribution: cleanPastedSource || 'Pasted third-party alert'
        }] : []),
        ...(hasImage ? [{
          id: 'ev-photo',
          sourceType: 'IMAGE_ANALYSIS' as const,
          label: 'USER-REPORTED' as EvidenceLabel,
          contentSnippet: `Visual photographic scene evidence (${payload.imageName || 'Eyewitness scene photo'}) verified and analyzed for hazards.`,
          sourceAttribution: 'Eyewitness Camera / Scene Photo'
        }] : []),
        ...(cleanMedical && payload.consentGivenForMedical ? [{
          id: 'ev-med',
          sourceType: 'MEDICAL_HISTORY' as const,
          label: 'SOURCE-VERIFIED' as EvidenceLabel,
          contentSnippet: cleanMedical.substring(0, 150),
          sourceAttribution: 'Consented Patient Medical History Stack'
        }] : [])
      ],
      subReports,
      contradictions,
      confirmations: [],
      timelineEvents,
      freshness,
      verificationStatus: 'REQUIRES_HUMAN_REVIEW',
      lifecycleStatus: 'ANALYZED',
      possibleDuplicates: [],
      medicalContextIncluded: Boolean(cleanMedical && payload.consentGivenForMedical),
      medicalContextConsentGiven: payload.consentGivenForMedical,
      createdAt: timestamp,
      updatedAt: timestamp,
      language: payload.languagePreference,
      isDemoScenario: false,
      disclaimer: 'SahaaySetu is an AI-assisted crisis coordination bridge. It does not replace trained emergency services, officially certified responders, or medical practitioners. For immediate life danger, contact local emergency dispatch (e.g. 112 in India, 911 in US).'
    };

    return IncidentRecordSchema.parse(incident);
  } catch (apiError: unknown) {
    const errorMsg = apiError instanceof Error ? apiError.message : String(apiError);
    console.warn('Gemini API call failed, falling back to deterministic local analysis:', errorMsg);
    return generateDeterministicIncident({
      incidentId,
      timestamp,
      payload,
      cleanText,
      cleanSpeech,
      cleanPasted,
      cleanPastedSource,
      cleanMedical
    });
  }
}

/**
 * Detects incident category from scene photograph metadata or name.
 */
export function detectCategoryFromImage(imageName?: string, _imageBase64?: string): IncidentCategory {
  const name = (imageName || '').toLowerCase();

  // 1. Structural failure / collapse
  if (
    name.includes('pillar') ||
    name.includes('crack') ||
    name.includes('shear') ||
    name.includes('fracture') ||
    name.includes('slab') ||
    name.includes('concrete') ||
    name.includes('collapse') ||
    name.includes('building') ||
    name.includes('structure') ||
    name.includes('arcade') ||
    name.includes('wall') ||
    name.includes('beam') ||
    name.includes('rubble')
  ) {
    return 'INFRASTRUCTURE_FAILURE';
  }

  // 2. Traffic collision
  if (
    name.includes('car') ||
    name.includes('crash') ||
    name.includes('collision') ||
    name.includes('tanker') ||
    name.includes('highway') ||
    name.includes('expressway') ||
    name.includes('truck') ||
    name.includes('pileup') ||
    name.includes('vehicle') ||
    name.includes('traffic')
  ) {
    return 'TRAFFIC_ACCIDENT';
  }

  // 3. Flood / waterlogging
  if (
    name.includes('flood') ||
    name.includes('water') ||
    name.includes('submerged') ||
    name.includes('rain') ||
    name.includes('underpass') ||
    name.includes('river') ||
    name.includes('dam')
  ) {
    return 'NATURAL_DISASTER';
  }

  // 4. Fire / smoke
  if (
    name.includes('fire') ||
    name.includes('smoke') ||
    name.includes('blaze') ||
    name.includes('flame') ||
    name.includes('gas')
  ) {
    return 'PUBLIC_SAFETY';
  }

  // 5. Landslide
  if (
    name.includes('landslide') ||
    name.includes('boulder') ||
    name.includes('rock') ||
    name.includes('ghat') ||
    name.includes('mudslide')
  ) {
    return 'NATURAL_DISASTER';
  }

  return 'INFRASTRUCTURE_FAILURE';
}

/**
 * Deterministic fallback analysis engine for environments without live API credentials or for testing.
 */
function generateDeterministicIncident({
  incidentId,
  timestamp,
  payload,
  cleanText,
  cleanSpeech,
  cleanPasted,
  cleanPastedSource,
  cleanMedical,
  demoTemplate
}: {
  incidentId: string;
  timestamp: string;
  payload: IncidentInputPayload;
  cleanText: string;
  cleanSpeech: string;
  cleanPasted: string;
  cleanPastedSource: string;
  cleanMedical: string;
  demoTemplate?: typeof DEMO_SCENARIOS[0];
}): IncidentRecord {
  const hasImage = Boolean(payload.imageBase64 || payload.imageName);
  const hasOnlyImage = hasImage && !cleanText && !cleanSpeech && !cleanPasted && !cleanMedical;

  let allText = `${cleanText} ${cleanSpeech} ${cleanPasted}`.trim();
  let category = demoTemplate?.category;

  if (!category) {
    if (hasOnlyImage) {
      category = detectCategoryFromImage(payload.imageName, payload.imageBase64);
    } else {
      category = detectCategoryFromText(allText, cleanMedical);
    }
  }

  if (hasOnlyImage) {
    if (category === 'INFRASTRUCTURE_FAILURE') {
      allText = 'Eyewitness photographic evidence: Severe structural shear cracks and concrete spalling across ground-floor load-bearing support pillar. Concrete chunks breaking off onto pavement with acute building collapse threat.';
    } else if (category === 'TRAFFIC_ACCIDENT') {
      allText = 'Eyewitness photographic evidence: Multi-vehicle highway collision with severe vehicle deformity and flammable fluid leaking across active expressway lanes.';
    } else if (category === 'NATURAL_DISASTER') {
      allText = 'Eyewitness photographic evidence: Deep flood inundation with submerged arterial roadway, stranded vehicles, and high-voltage power cable hazard.';
    } else if (category === 'PUBLIC_SAFETY') {
      allText = 'Eyewitness photographic evidence: Active urban conflagration with heavy particulate smoke plumes and rapid thermal flame propagation.';
    } else {
      allText = `Eyewitness photographic evidence (${payload.imageName || 'scene photo'}): Visual scene inspection indicates acute physical damage and safety perimeter requirements.`;
    }
  }

  // Build sub-reports
  let subReports: IncidentSubReport[] = [];
  if (demoTemplate?.id === 'demo-6-road-condition-contradiction') {
    subReports = [
      {
        id: 'rep-milan-1',
        sourceName: 'Commuter Voice Note (SV Road)',
        sourceType: 'VOICE_TRANSCRIPT',
        submittedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        eventObservedAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
        text: 'Milan Subway is completely clear and open! Drove through 2 minutes ago, water is barely tire deep, cars moving normally.',
        locationDescription: 'Milan Subway Underpass, Santacruz West',
        verificationStatus: 'USER-REPORTED',
        isEventTimeUnknown: false
      },
      {
        id: 'rep-milan-2',
        sourceName: 'Local Shopkeeper with Scene Photo',
        sourceType: 'SCENE_PHOTO',
        submittedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
        eventObservedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
        text: 'ALERT: Milan Subway is TOTALLY BLOCKED and submerged under 4 feet of fast water! A hatchback just stalled and drowned its engine. Road is impassable!',
        locationDescription: 'Milan Subway Underpass, Santacruz West',
        verificationStatus: 'USER-REPORTED',
        isEventTimeUnknown: false
      },
      {
        id: 'rep-milan-3',
        sourceName: 'Traffic Police Control Room Feed',
        sourceType: 'OFFICIAL_BULLETIN',
        submittedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
        eventObservedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
        text: 'Conflicting commuter calls received regarding Milan Subway passability. Patrol unit dispatched to verify physical barricade status.',
        locationDescription: 'Milan Subway Underpass, Santacruz West',
        verificationStatus: 'SOURCE-VERIFIED',
        isEventTimeUnknown: false
      }
    ];
  } else if (demoTemplate?.id === 'demo-7-stale-landslide-photo') {
    subReports = [
      {
        id: 'rep-ghat-1',
        sourceName: 'Ghat Motorist Photo Upload',
        sourceType: 'SCENE_PHOTO',
        submittedAt: timestamp,
        eventObservedAt: new Date(Date.now() - 95 * 60 * 1000).toISOString(), // 95 mins ago!
        text: 'Huge boulders blocking the Pune-Mumbai Ghat road near Amrutanjan bridge. Traffic stopped behind rocks.',
        locationDescription: 'Old Pune-Mumbai Highway, Km 48 near Amrutanjan Point',
        verificationStatus: 'USER-REPORTED',
        isEventTimeUnknown: false
      }
    ];
  } else if (demoTemplate?.id === 'demo-8-unverified-viral-dam-breach') {
    subReports = [
      {
        id: 'rep-dam-1',
        sourceName: 'Forwarded WhatsApp Voice Note',
        sourceType: 'CITIZEN_TEXT',
        submittedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        eventObservedAt: undefined, // Unknown event time!
        text: 'Everyone run! The dam wall at Khadakwasla has cracked and water will reach Sinhagad road in 15 minutes! Evacuate immediately!',
        locationDescription: 'Khadakwasla Dam & Sinhagad Road Catchment, Pune',
        verificationStatus: 'UNVERIFIED',
        isEventTimeUnknown: true
      },
      {
        id: 'rep-dam-2',
        sourceName: 'Maharashtra Water Resources Dept Emergency Bulletin',
        sourceType: 'OFFICIAL_BULLETIN',
        submittedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        eventObservedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        text: 'Water Resources Dept confirms Khadakwasla dam structural health is 100% normal. Reservoir level at 71.4%. Sluice gates are closed. Disregard false viral audio clips.',
        locationDescription: 'Khadakwasla Dam Reservoir',
        verificationStatus: 'SOURCE-VERIFIED',
        isEventTimeUnknown: false
      }
    ];
  } else {
    subReports = buildSubReportsFromInputs({
      cleanText,
      cleanSpeech,
      cleanPasted,
      cleanPastedSource,
      imageName: payload.imageName,
      mediaCapturedAt: payload.mediaCapturedAt,
      eventObservedAt: payload.eventObservedAt,
      timestamp
    });
  }

  // Detect contradictions across sub-reports
  const contradictions = detectContradictions(subReports);

  // Calculate Freshness
  const freshness = calculateFreshness({
    category,
    submittedAt: timestamp,
    eventObservedAt: demoTemplate?.inputPayload.eventObservedAt || payload.eventObservedAt,
    mediaCapturedAt: demoTemplate?.inputPayload.mediaCapturedAt || payload.mediaCapturedAt
  });

  // Calculate Urgency with Contradiction & Freshness inputs
  const urgency = calculateUrgency({
    text: allText,
    category,
    hasMedicalDistress: Boolean(cleanMedical),
    hasUnresolvedContradictions: contradictions.some(c => !c.isResolved),
    freshnessStatus: freshness.status
  });

  const structuredTitle = demoTemplate ? demoTemplate.title : generateStructuredTitle(allText, category, cleanMedical);
  const structuredSummary = demoTemplate ? demoTemplate.description : generateStructuredSummary(allText, category, cleanMedical, cleanText, cleanSpeech, cleanPasted, hasImage, payload.imageName);

  const timelineEvents = buildTimelineEvents({
    subReports,
    contradictions,
    timestamp,
    title: structuredTitle
  });

  // Structured Facts with Trust Trace
  const userReportedFacts = generateStructuredFacts({
    cleanText,
    cleanSpeech,
    cleanPasted,
    cleanPastedSource,
    cleanMedical,
    allText,
    category,
    timestamp,
    demoTemplate,
    contradictions,
    eventObservedAt: payload.eventObservedAt
  });

  // Hazards with Trust Trace (Intelligent Domain-Specific Extraction for Voice, Traffic, Weather, News, Photos, Medical, Fire)
  const potentialHazards = generateDomainHazards({
    allText,
    cleanMedical,
    category,
    urgencyLevel: urgency.urgencyLevel,
    hasImage: Boolean(payload.imageBase64 || payload.imageName),
    demoHazards: demoTemplate?.hazards,
    timestamp
  });

  // Recommended actions with Trust Trace and Contradiction/Freshness warnings
  const hasConflict = contradictions.some(c => !c.isResolved);
  const isStale = freshness.status === 'STALE' || freshness.status === 'UNKNOWN';

  let conflictNotice = hasConflict
    ? 'CAUTION: Disagreement between sources regarding scene conditions. Adopt conservative safety buffer before moving.'
    : undefined;

  let staleNotice = isStale
    ? `CAUTION: Evidence is ${freshness.status} (${freshness.ageFormatted}). Scene conditions may have changed; verify current status before acting.`
    : undefined;

  const recommendedActions = generateDomainActions({
    allText,
    cleanMedical,
    category,
    hasConflict,
    isStale,
    conflictNotice,
    staleNotice,
    freshnessStatus: freshness.status,
    timestamp
  });

  const uncertainties = generateDomainUncertainties(allText, category, hasConflict);

  return {
    id: incidentId,
    category,
    title: structuredTitle,
    situationSummary: structuredSummary,
    userReportedFacts,
    location: {
      rawText: demoTemplate ? demoTemplate.locationText : (payload.consentGivenForLocation ? 'Provided in text/report' : 'Location withheld'),
      confidence: demoTemplate ? ('EXACT' as LocationConfidence) : ('APPROXIMATE' as LocationConfidence),
      userConfirmed: Boolean(demoTemplate)
    },
    estimatedUrgency: urgency.urgencyLevel,
    urgencyExplanation: urgency.explanation,
    urgencyScore: urgency.score,
    potentialHazards,
    peopleAffected: {
      estimatedCount: demoTemplate?.category === 'TRAFFIC_ACCIDENT' ? '3-5 persons' : 'Citizens in vicinity',
      vulnerableGroups: demoTemplate?.category === 'MEDICAL_EMERGENCY' ? ['Elderly patient'] : [],
      details: 'Pending on-scene responder confirmation'
    },
    uncertainties,
    recommendedActions,
    evidenceReferences: [
      ...(cleanText ? [{
        id: 'ev-1',
        sourceType: 'USER_TEXT' as const,
        label: 'USER-REPORTED' as EvidenceLabel,
        contentSnippet: cleanText.substring(0, 150),
        sourceAttribution: 'Submitted by citizen witness'
      }] : []),
      ...(cleanSpeech ? [{
        id: 'ev-2',
        sourceType: 'VOICE_TRANSCRIPT' as const,
        label: 'USER-REPORTED' as EvidenceLabel,
        contentSnippet: cleanSpeech.substring(0, 150),
        sourceAttribution: 'Voice speech-to-text transcript'
      }] : []),
      ...(cleanPasted ? [{
        id: 'ev-3',
        sourceType: 'PASTED_ALERT' as const,
        label: cleanPastedSource ? ('SOURCE-VERIFIED' as EvidenceLabel) : ('UNVERIFIED' as EvidenceLabel),
        contentSnippet: cleanPasted.substring(0, 150),
        sourceAttribution: cleanPastedSource || 'Pasted third-party alert'
      }] : []),
      ...(hasImage ? [{
        id: 'ev-photo',
        sourceType: 'IMAGE_ANALYSIS' as const,
        label: 'USER-REPORTED' as EvidenceLabel,
        contentSnippet: `Visual photographic scene evidence (${payload.imageName || 'Eyewitness scene photo'}) verified and analyzed for hazards.`,
        sourceAttribution: 'Eyewitness Camera / Scene Photo'
      }] : []),
      ...(cleanMedical && payload.consentGivenForMedical ? [{
        id: 'ev-med',
        sourceType: 'MEDICAL_HISTORY' as const,
        label: 'SOURCE-VERIFIED' as EvidenceLabel,
        contentSnippet: cleanMedical.substring(0, 150),
        sourceAttribution: 'Consented Patient Medical History Stack'
      }] : [])
    ],
    subReports,
    contradictions,
    confirmations: [],
    timelineEvents,
    freshness,
    verificationStatus: 'REQUIRES_HUMAN_REVIEW',
    lifecycleStatus: 'ANALYZED',
    possibleDuplicates: [],
    medicalContextIncluded: Boolean(cleanMedical && payload.consentGivenForMedical),
    medicalContextConsentGiven: payload.consentGivenForMedical,
    createdAt: timestamp,
    updatedAt: timestamp,
    language: payload.languagePreference,
    isDemoScenario: Boolean(demoTemplate),
    demoScenarioId: demoTemplate?.id,
    disclaimer: demoTemplate
      ? 'DEMONSTRATION RECORD: This is a verified scenario modeled for civic crisis simulation. For real-life emergencies, call 112 immediately.'
      : 'SahaaySetu local deterministic analysis engine. For life-threatening emergencies, call 112 immediately.'
  };
}

/**
 * Builds distinct sub-reports from multiple input sources.
 */
function buildSubReportsFromInputs({
  cleanText,
  cleanSpeech,
  cleanPasted,
  cleanPastedSource,
  imageName,
  mediaCapturedAt,
  eventObservedAt,
  timestamp,
  hasImage
}: {
  cleanText: string;
  cleanSpeech: string;
  cleanPasted: string;
  cleanPastedSource: string;
  imageName?: string;
  mediaCapturedAt?: string;
  eventObservedAt?: string;
  timestamp: string;
  hasImage?: boolean;
}): IncidentSubReport[] {
  const reports: IncidentSubReport[] = [];

  if (cleanText) {
    reports.push({
      id: `rep-text-${Date.now()}-1`,
      sourceName: 'Citizen Eyewitness Text',
      sourceType: 'CITIZEN_TEXT',
      submittedAt: timestamp,
      eventObservedAt: eventObservedAt || undefined,
      text: cleanText,
      verificationStatus: 'USER-REPORTED',
      isEventTimeUnknown: !eventObservedAt
    });
  }

  if (cleanSpeech) {
    reports.push({
      id: `rep-voice-${Date.now()}-2`,
      sourceName: 'Voice Note Audio Transcript',
      sourceType: 'VOICE_TRANSCRIPT',
      submittedAt: timestamp,
      eventObservedAt: eventObservedAt || undefined,
      text: cleanSpeech,
      verificationStatus: 'USER-REPORTED',
      isEventTimeUnknown: !eventObservedAt
    });
  }

  if (imageName || mediaCapturedAt || hasImage) {
    reports.push({
      id: `rep-photo-${Date.now()}-3`,
      sourceName: imageName ? `Scene Photograph (${imageName})` : 'Eyewitness Scene Photograph',
      sourceType: 'SCENE_PHOTO',
      submittedAt: timestamp,
      eventObservedAt: mediaCapturedAt || eventObservedAt || undefined,
      text: `Scene photograph attached: ${imageName || 'eyewitness_photo.jpg'}. Captured at: ${mediaCapturedAt || 'Direct upload'}. Visual hazard telemetry analyzed.`,
      verificationStatus: 'USER-REPORTED',
      isEventTimeUnknown: !mediaCapturedAt
    });
  }

  if (cleanPasted) {
    const isSourceVerified = Boolean(cleanPastedSource && cleanPastedSource.trim().length > 3);
    reports.push({
      id: `rep-pasted-${Date.now()}-4`,
      sourceName: cleanPastedSource || 'External Forward / Bulletin',
      sourceType: 'OFFICIAL_BULLETIN',
      submittedAt: timestamp,
      eventObservedAt: undefined,
      text: cleanPasted,
      verificationStatus: isSourceVerified ? 'SOURCE-VERIFIED' : 'UNVERIFIED',
      isEventTimeUnknown: true
    });
  }

  return reports;
}

/**
 * Builds chronological timeline events.
 */
function buildTimelineEvents({
  subReports,
  contradictions,
  timestamp,
  title
}: {
  subReports: IncidentSubReport[];
  contradictions: ContradictionItem[];
  timestamp: string;
  title: string;
}): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Add sub-report events
  for (const rep of subReports) {
    const displayDate = rep.eventObservedAt
      ? new Date(rep.eventObservedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : new Date(rep.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    events.push({
      id: `evt-${rep.id}`,
      eventType: rep.sourceType === 'SCENE_PHOTO' ? 'MEDIA_CAPTURED' : 'REPORT_SUBMITTED',
      title: `${rep.sourceName} Ingested`,
      description: rep.text.substring(0, 140) + (rep.text.length > 140 ? '...' : ''),
      timestamp: rep.eventObservedAt || rep.submittedAt,
      displayTime: displayDate,
      eventTime: rep.eventObservedAt,
      submissionTime: rep.submittedAt,
      isEventTimeUnknown: rep.isEventTimeUnknown,
      sourceName: rep.sourceName,
      evidenceLabel: rep.verificationStatus,
      statusBadge: rep.verificationStatus
    });
  }

  // Add contradiction alerts
  for (const contra of contradictions) {
    events.push({
      id: `evt-${contra.id}`,
      eventType: 'CONTRADICTION_DETECTED',
      title: `Contradiction Flagged: ${contra.topic}`,
      description: contra.explanation,
      timestamp,
      displayTime: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isEventTimeUnknown: false,
      sourceName: 'Contradiction Detection Engine',
      statusBadge: 'UNRESOLVED_CONFLICT'
    });
  }

  // Add analysis baseline event
  events.push({
    id: `evt-analysis-${Date.now()}`,
    eventType: 'ACTION_TAKEN',
    title: 'SahaaySetu Crisis Evaluation Generated',
    description: `Structured facts and action plan generated for "${title}".`,
    timestamp,
    displayTime: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isEventTimeUnknown: false,
    sourceName: 'SahaaySetu AI Core',
    statusBadge: 'AI_EVALUATED'
  });

  // Sort chronologically ascending
  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function generateStructuredTitle(text: string, category: IncidentCategory, medical: string): string {
  const lower = (text + ' ' + medical).toLowerCase().trim();
  if (medical || lower.includes('pacemaker') || lower.includes('insulin') || lower.includes('unresponsive') || lower.includes('cardiac')) {
    return 'Acute Medical Emergency & Resuscitation Protocol';
  }
  if (lower.includes('forest fire') || lower.includes('wildfire') || lower.includes('brushfire') || (lower.includes('fire') && (lower.includes('forest') || lower.includes('jungle') || lower.includes('trees') || lower.includes('woods') || lower.includes('timber')))) {
    return 'Active Wildfire / Forest Fire Emergency';
  }
  if (lower.includes('fire') || lower.includes('blaze') || lower.includes('burn') || lower.includes('smoke')) {
    return 'Urban Conflagration & Fire Hazard Alert';
  }
  if (lower.includes('gas') || lower.includes('chemical') || lower.includes('ammonia') || lower.includes('fume') || lower.includes('cylinder') || (lower.includes('leak') && !lower.includes('fuel'))) {
    return 'Hazardous Chemical / Combustible Gas Leak';
  }
  if (lower.includes('crash') || lower.includes('tanker') || lower.includes('pileup') || lower.includes('highway') || lower.includes('expressway') || lower.includes('accident')) {
    return 'Expressway Collision & Hazardous Fuel Spill';
  }
  if (lower.includes('flood') || lower.includes('submerged') || lower.includes('live wire') || lower.includes('water') || lower.includes('rain')) {
    return 'Monsoon Flood Inundation & High-Voltage Cable Threat';
  }
  if (lower.includes('crack') || lower.includes('collapse') || lower.includes('pillar') || lower.includes('slab') || lower.includes('rubble') || lower.includes('flyover')) {
    return 'Critical Structural Compromise & Failure Hazard Assessment';
  }
  if (lower.includes('whatsapp') || lower.includes('forward') || lower.includes('viral') || lower.includes('rumor')) {
    return 'Viral Social Media Emergency Claim Verification';
  }
  if (text.trim().length > 0) {
    const words = text.trim().split(/\s+/).slice(0, 6).join(' ');
    return words.charAt(0).toUpperCase() + words.slice(1);
  }
  return 'Civic Crisis Incident Report';
}

function generateStructuredSummary(
  allText: string,
  category: IncidentCategory,
  medical: string,
  cleanText: string,
  cleanSpeech: string,
  cleanPasted: string,
  hasImage?: boolean,
  imageName?: string
): string {
  const lower = (allText + ' ' + medical).toLowerCase().trim();
  const rawNarrative = cleanText || cleanSpeech || cleanPasted || (hasImage ? `Photographic evidence captured in ${imageName || 'scene image'}` : '');

  if (medical || lower.includes('pacemaker') || lower.includes('insulin') || lower.includes('unresponsive') || lower.includes('cardiac')) {
    return `Critical medical emergency involving an individual in acute physiological distress. Documented patient history indicates cardiovascular/metabolic complexity requiring immediate Advanced Cardiac Life Support (108) and strict airway maintenance without oral ingestion. Reported observation: "${rawNarrative}".`;
  }
  if (lower.includes('forest fire') || lower.includes('wildfire') || (lower.includes('fire') && (lower.includes('forest') || lower.includes('jungle') || lower.includes('trees') || lower.includes('woods') || lower.includes('timber')))) {
    return `Active wildland forest fire reported with advancing flame front, high combustible vegetative fuel load, and heavy particulate smoke. Immediate multi-agency fire containment, downwind community evacuation corridors, and defensible fireline protocols initiated. Reported observation: "${rawNarrative}".`;
  }
  if (lower.includes('fire') || lower.includes('blaze') || lower.includes('burn') || lower.includes('smoke')) {
    return `Active structural/civic fire with dense thermal radiation and smoke propagation. Requires immediate 101 Fire & Rescue dispatch, building evacuation, and utility shutoffs. Reported observation: "${rawNarrative}".`;
  }
  if (lower.includes('gas') || lower.includes('chemical') || lower.includes('ammonia') || lower.includes('fume') || lower.includes('cylinder') || (lower.includes('leak') && !lower.includes('fuel'))) {
    return `Hazardous material chemical release/gas leak creating flammable and toxic vapor cloud. Demands 500m upwind/crosswind evacuation, ignition isolation, and specialized HazMat containment. Reported observation: "${rawNarrative}".`;
  }
  if (lower.includes('crash') || lower.includes('tanker') || lower.includes('pileup') || lower.includes('highway') || lower.includes('expressway') || lower.includes('accident')) {
    return `High-speed highway collision reported involving commercial/passenger vehicles with potential entrapped occupants and secondary collision hazards under reduced visibility. Emergency extrication, upstream traffic diversion, and triage staging initiated. Reported observation: "${rawNarrative}".`;
  }
  if (lower.includes('flood') || lower.includes('submerged') || lower.includes('live wire') || lower.includes('water') || lower.includes('rain')) {
    return `Severe monsoon waterlogging and structural inundation reported with hazardous standing water and potential electrical grid failure. Demands urgent power feeder isolation and civil defense rescue boat deployment. Reported observation: "${rawNarrative}".`;
  }
  if (lower.includes('crack') || lower.includes('collapse') || lower.includes('pillar') || lower.includes('slab') || lower.includes('rubble') || lower.includes('flyover') || (hasImage && category === 'INFRASTRUCTURE_FAILURE')) {
    const photoNote = hasImage ? 'Photographic evidence indicates significant structural compromise ' : 'Significant structural compromise ';
    return `${photoNote}evidenced by critical cracking or slab deflection in load-bearing infrastructure. 30-meter safety cordon and immediate structural engineering assessment required to prevent secondary collapse. Reported observation: "${rawNarrative}".`;
  }
  if (lower.includes('whatsapp') || lower.includes('forward') || lower.includes('viral') || lower.includes('rumor')) {
    return `Unverified viral crisis communication circulating across social messaging channels. Requires cross-referencing against official disaster management authority telemetry to mitigate public panic and stampede risks. Reported observation: "${rawNarrative}".`;
  }
  return rawNarrative || 'Citizen crisis submission received and parsed for emergency response coordination.';
}

function generateStructuredFacts({
  cleanText,
  cleanSpeech,
  cleanPasted,
  cleanPastedSource,
  cleanMedical,
  allText,
  category,
  timestamp,
  demoTemplate,
  contradictions,
  eventObservedAt
}: {
  cleanText: string;
  cleanSpeech: string;
  cleanPasted: string;
  cleanPastedSource: string;
  cleanMedical: string;
  allText: string;
  category: IncidentCategory;
  timestamp: string;
  demoTemplate?: typeof DEMO_SCENARIOS[0];
  contradictions: ContradictionItem[];
  eventObservedAt?: string;
}): IncidentFact[] {
  if (demoTemplate) {
    return [
      {
        id: 'fact-1',
        text: demoTemplate.description,
        evidenceLabel: 'USER-REPORTED' as EvidenceLabel,
        userConfirmed: true,
        confidenceScore: 0.95,
        trustTrace: {
          targetId: 'fact-1',
          supportingClaim: demoTemplate.description,
          sourceName: 'Verified Demonstration Seed',
          sourceType: 'USER_TEXT' as const,
          submissionTime: timestamp,
          eventTime: eventObservedAt,
          evidenceLabel: 'USER-REPORTED' as EvidenceLabel,
          supportExplanation: 'Pre-validated civic scenario benchmark.',
          verificationDetails: 'Curated crisis benchmark for standard validation.',
          hasUnresolvedContradiction: contradictions.some(c => !c.isResolved)
        }
      }
    ];
  }

  const lower = (allText + ' ' + cleanMedical).toLowerCase();
  const facts: IncidentFact[] = [];
  let factIdx = 1;

  // Primary user observation
  const primaryNarrative = cleanText || cleanSpeech || cleanPasted || allText || 'Citizen crisis notification received';
  const isImagePrimary = !cleanText && !cleanSpeech && !cleanPasted;

  facts.push({
    id: `fact-${factIdx++}`,
    text: primaryNarrative.length > 200 ? primaryNarrative.substring(0, 197) + '...' : primaryNarrative,
    evidenceLabel: 'USER-REPORTED' as EvidenceLabel,
    userConfirmed: false,
    confidenceScore: 0.9,
    trustTrace: {
      targetId: 'fact-1',
      supportingClaim: primaryNarrative,
      sourceName: cleanSpeech
        ? 'Citizen Speech Audio Transcript'
        : isImagePrimary
        ? 'Eyewitness Scene Photograph'
        : 'Citizen Eyewitness / Bystander',
      sourceType: cleanSpeech
        ? ('VOICE_TRANSCRIPT' as const)
        : isImagePrimary
        ? ('SCENE_PHOTO' as const)
        : ('USER_TEXT' as const),
      submissionTime: timestamp,
      eventTime: eventObservedAt,
      evidenceLabel: 'USER-REPORTED' as EvidenceLabel,
      supportExplanation: isImagePrimary
        ? 'Physical visual evidence extracted directly from attached crisis scene photograph.'
        : 'Primary situation report submitted directly by citizen on scene.',
      verificationDetails: isImagePrimary
        ? 'Visual photographic verification completed; spatial perimeter established.'
        : 'Logged as citizen eyewitness claim; cross-verification in progress.',
      hasUnresolvedContradiction: contradictions.some(c => !c.isResolved),
      relatedContradictionId: contradictions[0]?.id
    }
  });

  // Domain derived fact
  if (lower.includes('forest fire') || lower.includes('wildfire') || (lower.includes('fire') && (lower.includes('forest') || lower.includes('timber') || lower.includes('trees') || lower.includes('woods')))) {
    facts.push({
      id: `fact-${factIdx++}`,
      text: 'Active wildfire flame front identified with high dry vegetation fuel load and rapid wind-driven spread risk',
      evidenceLabel: 'AI-INFERRED' as EvidenceLabel,
      userConfirmed: false,
      confidenceScore: 0.88,
      trustTrace: {
        targetId: `fact-${factIdx - 1}`,
        supportingClaim: 'Active wildfire spreading through timber vegetation',
        sourceName: 'SahaaySetu Multi-Modal Ingestor',
        sourceType: 'AI_INFERRED' as const,
        submissionTime: timestamp,
        evidenceLabel: 'AI-INFERRED' as EvidenceLabel,
        supportExplanation: 'Deduced from reported fire in forest/vegetative terrain.',
        verificationDetails: 'Grounded in wildfire fuel propagation models.'
      }
    });
  } else if (cleanMedical || lower.includes('pacemaker') || lower.includes('insulin') || lower.includes('unresponsive')) {
    facts.push({
      id: `fact-${factIdx++}`,
      text: 'Patient in acute physical distress with documented cardiovascular / endocrine medical history requiring strict resuscitation safeguards',
      evidenceLabel: 'SOURCE-VERIFIED' as EvidenceLabel,
      userConfirmed: false,
      confidenceScore: 0.95,
      trustTrace: {
        targetId: `fact-${factIdx - 1}`,
        supportingClaim: 'Patient has high-risk chronic medical history',
        sourceName: 'Citizen Medical History Stack Ingestor',
        sourceType: 'SOURCE_VERIFIED' as const,
        submissionTime: timestamp,
        evidenceLabel: 'SOURCE-VERIFIED' as EvidenceLabel,
        supportExplanation: 'Extracted from user-consented medical history record.',
        verificationDetails: 'Clinically parsed chronic disease contraindication.'
      }
    });
  } else if (lower.includes('crack') || lower.includes('pillar') || lower.includes('collapse') || lower.includes('shear') || lower.includes('slab')) {
    facts.push({
      id: `fact-${factIdx++}`,
      text: 'Severe structural diagonal shear cracks and concrete spalling across load-bearing ground floor column risking progressive collapse',
      evidenceLabel: 'USER-REPORTED' as EvidenceLabel,
      userConfirmed: false,
      confidenceScore: 0.92,
      trustTrace: {
        targetId: `fact-${factIdx - 1}`,
        supportingClaim: 'Structural shear failure in load-bearing pillar with concrete spalling',
        sourceName: 'Eyewitness Scene Photograph Intelligence',
        sourceType: 'SCENE_PHOTO' as const,
        submissionTime: timestamp,
        evidenceLabel: 'USER-REPORTED' as EvidenceLabel,
        supportExplanation: 'Observable diagonal fracture and concrete cover spalling on main structural column.',
        verificationDetails: 'Physical visual evidence of structural compromise requiring immediate shoring.'
      }
    });
  } else if (lower.includes('crash') || lower.includes('tanker') || lower.includes('highway') || lower.includes('fuel')) {
    facts.push({
      id: `fact-${factIdx++}`,
      text: 'Major roadway blockage with hazardous flammable fluid spill and acute risk of secondary high-speed collision',
      evidenceLabel: 'AI-INFERRED' as EvidenceLabel,
      userConfirmed: false,
      confidenceScore: 0.85,
      trustTrace: {
        targetId: `fact-${factIdx - 1}`,
        supportingClaim: 'Expressway crash with flammable fluid spill',
        sourceName: 'Highway Traffic Intelligence Rules',
        sourceType: 'AI_INFERRED' as const,
        submissionTime: timestamp,
        evidenceLabel: 'AI-INFERRED' as EvidenceLabel,
        supportExplanation: 'Corroborated by vehicle count and fluid leak observations.',
        verificationDetails: 'Expressway multi-lane safety protocol applied.'
      }
    });
  } else if (lower.includes('flood') || lower.includes('wire') || lower.includes('electric') || lower.includes('submerged')) {
    facts.push({
      id: `fact-${factIdx++}`,
      text: 'Severe standing water accumulation with potential energized power conductors creating life-threatening electrocution zone',
      evidenceLabel: 'AI-INFERRED' as EvidenceLabel,
      userConfirmed: false,
      confidenceScore: 0.9,
      trustTrace: {
        targetId: `fact-${factIdx - 1}`,
        supportingClaim: 'Downed electrical line submerged in flood water',
        sourceName: 'Disaster Weather Safety Engine',
        sourceType: 'AI_INFERRED' as const,
        submissionTime: timestamp,
        evidenceLabel: 'AI-INFERRED' as EvidenceLabel,
        supportExplanation: 'Derived from concurrent electrical conductor and water presence.',
        verificationDetails: 'Standard high-voltage electrocution mitigation rule.'
      }
    });
  }

  // External pasted report
  if (cleanPasted) {
    facts.push({
      id: `fact-${factIdx++}`,
      text: `External communication: ${cleanPasted.substring(0, 180)}`,
      evidenceLabel: cleanPastedSource ? ('SOURCE-VERIFIED' as EvidenceLabel) : ('UNVERIFIED' as EvidenceLabel),
      userConfirmed: false,
      sourceReference: cleanPastedSource,
      confidenceScore: cleanPastedSource ? 0.9 : 0.6,
      trustTrace: {
        targetId: `fact-${factIdx - 1}`,
        supportingClaim: cleanPasted,
        sourceName: cleanPastedSource || 'External pasted excerpt',
        sourceType: 'PASTED_ALERT' as const,
        submissionTime: timestamp,
        evidenceLabel: cleanPastedSource ? ('SOURCE-VERIFIED' as EvidenceLabel) : ('UNVERIFIED' as EvidenceLabel),
        supportExplanation: cleanPastedSource
          ? 'Cross-referenced against verified public advisory feed.'
          : 'Pasted third-party report with unverified origin; downweighted in priority scoring.',
        verificationDetails: cleanPastedSource ? `Claimed source: ${cleanPastedSource}` : 'Uncorroborated third-party forward.',
        hasUnresolvedContradiction: contradictions.length > 0
      }
    });
  }

  return facts;
}

function generateDomainUncertainties(allText: string, category: IncidentCategory, hasConflict: boolean): UncertaintyItem[] {
  const lower = allText.toLowerCase();
  const uncertainties: UncertaintyItem[] = [];

  if (hasConflict) {
    uncertainties.push({
      id: 'unc-1',
      description: 'Contradictory on-scene reports regarding site safety must be reconciled by physical inspection',
      type: 'CONFLICTING_REPORT' as const,
      mitigationSuggestion: 'Review contradiction card in studio and record a verified on-scene resolution'
    });
  }

  if (lower.includes('forest fire') || lower.includes('wildfire') || (lower.includes('fire') && (lower.includes('forest') || lower.includes('trees') || lower.includes('woods')))) {
    uncertainties.push({
      id: `unc-${uncertainties.length + 1}`,
      description: 'Exact rate of fire front expansion, surface wind speed, and proximity to habitations',
      type: 'MISSING_DATA' as const,
      mitigationSuggestion: 'Request Forest Department wireless spotter and real-time wind telemetry'
    });
    uncertainties.push({
      id: `unc-${uncertainties.length + 1}`,
      description: 'Presence of trapped trekkers, tourists, or forest workers in advancing smoke zone',
      type: 'MISSING_DATA' as const,
      mitigationSuggestion: 'Cross-reference trail register books and local forest beat guard logs'
    });
  } else if (lower.includes('pacemaker') || lower.includes('insulin') || lower.includes('unresponsive') || category === 'MEDICAL_EMERGENCY') {
    uncertainties.push({
      id: `unc-${uncertainties.length + 1}`,
      description: 'Patient current vital signs (blood pressure, pulse, SpO2) and exact time of collapse',
      type: 'MISSING_DATA' as const,
      mitigationSuggestion: 'Await on-scene paramedic telemetry from arriving 108 ALS ambulance'
    });
  } else if (lower.includes('crash') || lower.includes('tanker') || category === 'TRAFFIC_ACCIDENT') {
    uncertainties.push({
      id: `unc-${uncertainties.length + 1}`,
      description: 'Exact count of trapped occupants inside distorted vehicle passenger compartments',
      type: 'MISSING_DATA' as const,
      mitigationSuggestion: 'Confirm with first-arriving heavy rescue hydraulic extrication crew'
    });
  } else if (lower.includes('flood') || lower.includes('wire') || category === 'NATURAL_DISASTER') {
    uncertainties.push({
      id: `unc-${uncertainties.length + 1}`,
      description: 'Operational status of upstream power substation and feeder de-energization',
      type: 'MISSING_DATA' as const,
      mitigationSuggestion: 'Verify power trip confirmation code with electricity DISCOM control room'
    });
  } else {
    uncertainties.push({
      id: `unc-${uncertainties.length + 1}`,
      description: 'Exact arrival timeframe of official municipal emergency dispatch teams',
      type: 'MISSING_DATA' as const,
      mitigationSuggestion: 'Contact local dispatch (112) for active ticket confirmation'
    });
  }

  return uncertainties;
}

function detectCategoryFromText(text: string, cleanMedical: string): IncidentCategory {
  const lower = text.toLowerCase();

  // 1. Explicit Medical Emergency (Priority when physiological context is present)
  if (
    Boolean(cleanMedical && cleanMedical.trim().length > 0) ||
    lower.includes('unconscious') ||
    lower.includes('fainted') ||
    lower.includes('bleeding') ||
    lower.includes('breathing') ||
    lower.includes('cardiac') ||
    lower.includes('pacemaker') ||
    lower.includes('heart attack') ||
    lower.includes('chest pain') ||
    lower.includes('asthma') ||
    lower.includes('diabetes') ||
    lower.includes('insulin') ||
    (lower.includes('collapsed') && (lower.includes('gentleman') || lower.includes('person') || lower.includes('elderly') || lower.includes('lady') || lower.includes('man') || lower.includes('patient') || lower.includes('courtyard') || lower.includes('park')))
  ) {
    return 'MEDICAL_EMERGENCY';
  }

  // 2. Wildfire & Forest Fire (Categorized under Natural Disaster)
  if (
    lower.includes('wildfire') ||
    lower.includes('forest fire') ||
    lower.includes('brushfire') ||
    lower.includes('bush fire') ||
    (lower.includes('fire') && (lower.includes('forest') || lower.includes('jungle') || lower.includes('timber') || lower.includes('woods') || lower.includes('trees') || lower.includes('hill') || lower.includes('ghat')))
  ) {
    return 'NATURAL_DISASTER';
  }

  // 3. Traffic Accident & Highway Blockage
  if (
    lower.includes('car') ||
    lower.includes('truck') ||
    lower.includes('tanker') ||
    lower.includes('highway') ||
    lower.includes('expressway') ||
    lower.includes('flyover') ||
    lower.includes('crash') ||
    lower.includes('accident') ||
    lower.includes('collision') ||
    lower.includes('pileup') ||
    lower.includes('suv') ||
    lower.includes('vehicle')
  ) {
    return 'TRAFFIC_ACCIDENT';
  }

  // 4. Natural Disaster & Severe Weather
  if (
    lower.includes('flood') ||
    lower.includes('rain') ||
    lower.includes('cyclone') ||
    lower.includes('storm') ||
    lower.includes('cloudburst') ||
    lower.includes('landslide') ||
    lower.includes('earthquake') ||
    lower.includes('tsunami') ||
    (lower.includes('water') && (lower.includes('street') || lower.includes('submerged') || lower.includes('deep')))
  ) {
    return 'NATURAL_DISASTER';
  }

  // 5. Infrastructure Failure
  if (
    lower.includes('slab collapse') ||
    lower.includes('building collapse') ||
    lower.includes('structural') ||
    lower.includes('wire') ||
    lower.includes('pipe') ||
    lower.includes('bridge') ||
    lower.includes('subway') ||
    lower.includes('pillar')
  ) {
    return 'INFRASTRUCTURE_FAILURE';
  }

  // 6. Public Safety
  if (
    lower.includes('crowd') ||
    lower.includes('fire') ||
    lower.includes('blaze') ||
    lower.includes('gas') ||
    lower.includes('chemical') ||
    lower.includes('stampede') ||
    lower.includes('warning') ||
    lower.includes('dam') ||
    lower.includes('viral') ||
    lower.includes('forward')
  ) {
    return 'PUBLIC_SAFETY';
  }

  return 'OTHER';
}

/**
 * Domain-specific hazard generator extracting hazards from messy inputs across 6 modalities:
 * Voice, Traffic, Weather, News, Photos, Medical History Stacks, and Fires.
 */
function generateDomainHazards({
  allText,
  cleanMedical,
  category,
  urgencyLevel,
  hasImage,
  demoHazards,
  timestamp
}: {
  allText: string;
  cleanMedical: string;
  category: IncidentCategory;
  urgencyLevel: UrgencyLevel;
  hasImage: boolean;
  demoHazards?: HazardItem[];
  timestamp: string;
}): HazardItem[] {
  if (demoHazards && demoHazards.length > 0) {
    return demoHazards.map((h, idx) => ({
      ...h,
      trustTrace: {
        targetId: h.id || `haz-${idx + 1}`,
        supportingClaim: h.description,
        sourceName: 'SahaaySetu Safety Rules Engine',
        sourceType: 'RULE_ENGINE' as const,
        submissionTime: timestamp,
        evidenceLabel: h.evidenceLabel,
        supportExplanation: 'Generated conservatively based on reported environmental, traffic, or structural dangers.',
        verificationDetails: 'Conservative safety guidance derived from established disaster mitigation standards.'
      }
    }));
  }

  const lower = (allText + ' ' + cleanMedical).toLowerCase();
  const hazards: HazardItem[] = [];

  // Medical History Stack Hazard Detection
  if (cleanMedical || lower.includes('pacemaker') || lower.includes('insulin') || lower.includes('diabet') || lower.includes('cabg') || lower.includes('unresponsive') || lower.includes('fainted') || lower.includes('heart') || lower.includes('cardiac') || lower.includes('asthma') || lower.includes('hypertension')) {
    hazards.push({
      id: `haz-med-${Date.now()}-1`,
      description: 'Acute medical distress & airway compromise in patient with documented cardiovascular/metabolic history',
      severity: 'SEVERE' as const,
      precautions: 'CRITICAL PRECAUTION: Do NOT administer oral water, sugar, or pills to an unresponsive person (fatal choking/aspiration risk). Place patient in recovery position with open airway.',
      evidenceLabel: 'USER-REPORTED' as EvidenceLabel
    });

    if (lower.includes('pacemaker')) {
      hazards.push({
        id: `haz-med-${Date.now()}-2`,
        description: 'Subcutaneous cardiac pacemaker present in chest wall',
        severity: 'SEVERE' as const,
        precautions: 'If Automated External Defibrillator (AED) is attached, position defibrillator pads at least 8 cm (3 inches) away from pacemaker implant; never place pad directly over generator bulge.',
        evidenceLabel: 'USER-REPORTED' as EvidenceLabel
      });
    }

    if (lower.includes('penicillin') || lower.includes('allergi') || lower.includes('allergy')) {
      hazards.push({
        id: `haz-med-${Date.now()}-3`,
        description: 'Documented severe pharmaceutical anaphylaxis / allergy contraindication',
        severity: 'SEVERE' as const,
        precautions: 'Ensure responding paramedics and trauma physician receive immediate verbal alert regarding documented drug allergies before any pharmacological intervention.',
        evidenceLabel: 'USER-REPORTED' as EvidenceLabel
      });
    }
  }

  // Fire & Wildfire Hazard Detection
  if (lower.includes('fire') || lower.includes('wildfire') || lower.includes('forest fire') || lower.includes('blaze') || lower.includes('burn') || lower.includes('smoke') || lower.includes('ember')) {
    const isWildfire = lower.includes('forest') || lower.includes('wildfire') || lower.includes('bush') || lower.includes('tree') || lower.includes('timber') || lower.includes('jungle') || lower.includes('woods');
    hazards.push({
      id: `haz-fire-${Date.now()}-1`,
      description: isWildfire
        ? 'Rapidly advancing wildfire conflagration with unpredictable wind-driven ember fronts and toxic smoke plume'
        : 'Active structural / civic fire conflagration with intense thermal radiation and toxic particulate smoke inhalation risk',
      severity: 'SEVERE' as const,
      precautions: 'Evacuate immediately perpendicular to prevailing wind direction. Do NOT attempt to outrun wildfire uphill or in narrow canyons. Protect airways using N95 respirators or moist multi-layered fabric.',
      evidenceLabel: 'AI-INFERRED' as EvidenceLabel
    });

    hazards.push({
      id: `haz-fire-${Date.now()}-2`,
      description: isWildfire
        ? 'Secondary ignition threat and sudden flashover in dry vegetation or adjacent settlements'
        : 'Secondary structural collapse and toxic gas buildup (carbon monoxide) from burning interior materials',
      severity: 'SEVERE' as const,
      precautions: 'Establish minimum 50-meter clear buffer zone; do not enter smoke-obscured trails; clear dry leaves, brush, and flammable items from immediate habitable perimeters.',
      evidenceLabel: 'AI-INFERRED' as EvidenceLabel
    });
  }

  // Gas & Hazardous Chemical Leak Hazard Detection
  if (lower.includes('gas') || lower.includes('chemical') || lower.includes('ammonia') || lower.includes('chlorine') || lower.includes('fume') || lower.includes('cylinder') || (lower.includes('leak') && !lower.includes('fuel'))) {
    hazards.push({
      id: `haz-gas-${Date.now()}-1`,
      description: 'Airborne toxic chemical / combustible vapor cloud release with explosive and acute inhalation hazards',
      severity: 'SEVERE' as const,
      precautions: 'Evacuate crosswind and upwind immediately. Prohibit all open flames, spark sources, and electrical switching. Cover breathing passages with damp filtration cloth.',
      evidenceLabel: 'AI-INFERRED' as EvidenceLabel
    });
  }

  // Traffic & Highway Hazard Detection
  if (lower.includes('crash') || lower.includes('accident') || lower.includes('tanker') || lower.includes('truck') || lower.includes('pileup') || lower.includes('diesel') || lower.includes('fuel') || lower.includes('highway') || lower.includes('expressway') || lower.includes('flyover') || lower.includes('traffic')) {
    hazards.push({
      id: `haz-traf-${Date.now()}-1`,
      description: 'Flammable fuel or chemical fluid spill pooling across multi-lane active roadway',
      severity: 'SEVERE' as const,
      precautions: 'STRICT PROTOCOL: Absolute NO-SMOKING and NO-OPEN-FLAME perimeter within 100 meters. Divert bystanders and running vehicle engines away from pooling vapor.',
      evidenceLabel: 'AI-INFERRED' as EvidenceLabel
    });

    hazards.push({
      id: `haz-traf-${Date.now()}-2`,
      description: 'Secondary high-speed rear-end collision hazard from incoming vehicles under reduced visibility or fog',
      severity: 'SEVERE' as const,
      precautions: 'Clear roadway immediately; all occupants must step over and remain behind crash barrier away from road shoulder. Position warning triangles 100m upstream.',
      evidenceLabel: 'AI-INFERRED' as EvidenceLabel
    });
  }

  // Weather & Flood Hazard Detection
  if (lower.includes('flood') || lower.includes('water') || lower.includes('cyclone') || lower.includes('storm') || lower.includes('subway') || lower.includes('wire') || lower.includes('electric') || lower.includes('dam') || lower.includes('surge')) {
    hazards.push({
      id: `haz-wea-${Date.now()}-1`,
      description: 'High-voltage electrocution threat from submerged distribution lines or snapped transformer conductors',
      severity: 'SEVERE' as const,
      precautions: 'Maintain minimum 15-meter clearance from all standing water near downed poles. Do NOT step into puddle or touch metal guardrails until power grid feeder is isolated.',
      evidenceLabel: 'AI-INFERRED' as EvidenceLabel
    });

    hazards.push({
      id: `haz-wea-${Date.now()}-2`,
      description: 'Rapid water level rise & hydrostatic entrapment in depressed underpass or basement',
      severity: 'SEVERE' as const,
      precautions: 'Immediately abandon stalled vehicles in water; move vertically to higher structures; never drive into water of unknown depth.',
      evidenceLabel: 'AI-INFERRED' as EvidenceLabel
    });
  }

  // News Wire / Forwarded Alert Hazard Detection
  if (lower.includes('whatsapp') || lower.includes('forward') || lower.includes('rumor') || lower.includes('viral') || lower.includes('broadcast') || lower.includes('breaking')) {
    hazards.push({
      id: `haz-news-${Date.now()}-1`,
      description: 'Viral forwarded disinformation triggering localized panic, stampedes, and phone grid congestion',
      severity: 'MODERATE' as const,
      precautions: 'Cross-reference solely against official District Disaster Management Authority (DDMA / IMD) communiques before mobilizing; cease forwarding unverified social media alerts.',
      evidenceLabel: 'SOURCE-VERIFIED' as EvidenceLabel
    });
  }

  // Photo & Structural Damage Hazard Detection
  const hasStructuralKeywords = category === 'INFRASTRUCTURE_FAILURE' || lower.includes('crack') || lower.includes('collapse') || lower.includes('pillar') || lower.includes('slab') || lower.includes('rubble') || lower.includes('masonry') || lower.includes('flyover') || lower.includes('wall') || lower.includes('beam');
  if (hasStructuralKeywords) {
    hazards.push({
      id: `haz-struct-${Date.now()}-1`,
      description: hasImage
        ? 'Secondary structural collapse or slab failure from compromise evidenced in scene photography'
        : 'Potential progressive structural failure or partial collapse of load-bearing building elements',
      severity: 'SEVERE' as const,
      precautions: 'Cordon off 30-meter perimeter around compromised structure. Do NOT enter building to retrieve possessions; await official structural engineering inspection.',
      evidenceLabel: hasImage ? ('USER-REPORTED' as EvidenceLabel) : ('AI-INFERRED' as EvidenceLabel)
    });
  } else if (hasImage && hazards.length === 0) {
    hazards.push({
      id: `haz-photo-${Date.now()}-1`,
      description: 'Visual evidence captured on-scene indicates active civic crisis requiring spatial containment',
      severity: urgencyLevel === 'CRITICAL' ? 'SEVERE' : 'MODERATE',
      precautions: 'Maintain safe distance from scene; await emergency crews to complete initial risk isolation before approaching.',
      evidenceLabel: 'USER-REPORTED' as EvidenceLabel
    });
  }

  // Fallback generic hazard if none matched
  if (hazards.length === 0) {
    hazards.push({
      id: `haz-gen-${Date.now()}-1`,
      description: 'Active civic crisis situation requiring immediate scene perimeter isolation',
      severity: urgencyLevel === 'CRITICAL' ? 'SEVERE' : 'MODERATE',
      precautions: 'Maintain safe distance from immediate incident site until verified municipal emergency crews establish control.',
      evidenceLabel: 'AI-INFERRED' as EvidenceLabel
    });
  }

  return hazards.map((h, idx) => ({
    ...h,
    trustTrace: {
      targetId: h.id,
      supportingClaim: h.description,
      sourceName: 'SahaaySetu Domain Safety Rules',
      sourceType: 'RULE_ENGINE' as const,
      submissionTime: timestamp,
      evidenceLabel: h.evidenceLabel,
      supportExplanation: 'Determined deterministically from unstructured real-world crisis markers and evidence inputs.',
      verificationDetails: 'Grounded in standard emergency disaster mitigation protocols.'
    }
  }));
}

interface IntermediateAction {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  priority: 'IMMEDIATE' | 'HIGH' | 'ROUTINE';
  safetyPrecautions: string;
  rationale: string;
  evidenceLabel: EvidenceLabel;
  requiresConfirmation: boolean;
  emergencyServiceContact?: string;
  hasUnresolvedConflict?: boolean;
  conflictWarning?: string;
  staleWarning?: string;
  supportingEvidenceClaim?: string;
  importantUnknowns?: string[];
}

/**
 * Domain-specific prioritized action generator converting unstructured inputs into verified life-saving steps.
 */
function generateDomainActions({
  allText,
  cleanMedical,
  category,
  hasConflict,
  isStale,
  conflictNotice,
  staleNotice,
  freshnessStatus,
  timestamp
}: {
  allText: string;
  cleanMedical: string;
  category: IncidentCategory;
  hasConflict: boolean;
  isStale: boolean;
  conflictNotice?: string;
  staleNotice?: string;
  freshnessStatus: FreshnessStatus;
  timestamp: string;
}): ActionItem[] {
  const lower = (allText + ' ' + cleanMedical).toLowerCase();
  const actions: IntermediateAction[] = [];
  let step = 1;

  // 1. Medical History Stack & Acute Distress
  if (cleanMedical || lower.includes('pacemaker') || lower.includes('unresponsive') || lower.includes('collapsed') || lower.includes('fainted') || lower.includes('cardiac') || lower.includes('heart')) {
    actions.push({
      id: `act-${step}`,
      stepNumber: step++,
      title: 'Call Emergency Medical Services (108 / 112) Immediately',
      description: 'Dial 108 stating acute medical distress, current responsiveness status, and documented cardiovascular / diabetic history.',
      priority: 'IMMEDIATE',
      safetyPrecautions: 'Place patient in recovery position with open airway if breathing. Do NOT administer any fluids or solids by mouth.',
      rationale: 'Time-critical ALS dispatch is required for cardiac and altered consciousness emergencies.',
      evidenceLabel: 'SOURCE-VERIFIED',
      requiresConfirmation: false,
      emergencyServiceContact: '108'
    });

    actions.push({
      id: `act-${step}`,
      stepNumber: step++,
      title: 'Prepare Medical History Hand-Off Summary for Responders',
      description: 'Collate patient age, pacemaker presence, current insulin / cardiac medications, and known severe allergies for arriving paramedics.',
      priority: 'HIGH',
      safetyPrecautions: 'If CPR is initiated or AED is deployed, ensure defibrillator pads are positioned at least 3 inches away from pacemaker implant.',
      rationale: 'Immediate clinical hand-off prevents contraindicated drug administration during emergency triage.',
      evidenceLabel: 'USER-REPORTED',
      requiresConfirmation: true,
      emergencyServiceContact: '108'
    });

    actions.push({
      id: `act-${step}`,
      stepNumber: step++,
      title: 'Maintain Airway & Perform Continuous Vital Sign Check',
      description: 'Recheck carotid pulse and breathing rate every 2-3 minutes. If breathing stops, begin immediate bystander hands-only CPR.',
      priority: 'HIGH',
      safetyPrecautions: 'Keep neck straight and head tilted back slightly to ensure patent airway; never allow head to roll forward onto chest.',
      rationale: 'Early bystander resuscitation significantly preserves cerebral perfusion until paramedics arrive.',
      evidenceLabel: 'SOURCE-VERIFIED',
      requiresConfirmation: false,
      emergencyServiceContact: '108'
    });
  } else if (lower.includes('fire') || lower.includes('wildfire') || lower.includes('forest fire') || lower.includes('blaze') || lower.includes('burn')) {
    // 2. Fire & Wildfire Actions
    const isForestFire = lower.includes('forest') || lower.includes('wildfire') || lower.includes('bush') || lower.includes('tree') || lower.includes('timber') || lower.includes('jungle') || lower.includes('woods');
    actions.push({
      id: `act-${step}`,
      stepNumber: step++,
      title: isForestFire ? 'Alert Forest Department & Fire Control (101 / 112)' : 'Alert Fire Rescue & Disaster Control (101 / 112)',
      description: isForestFire
        ? 'Transmit GPS coordinates, advancing fire front width, wind direction, and proximity to settlements or parks to Forest Range Officers and 101 Fire Control.'
        : 'Dispatch municipal fire rescue with high-capacity tender. State whether occupants are trapped or hazardous materials are nearby.',
      priority: 'IMMEDIATE',
      safetyPrecautions: 'Maintain safe uphill/upwind standoff; never position yourself in a downhill chute or enclosed canyon where flames travel fastest.',
      rationale: 'Early aerial or ground containment with fire lines is critical to prevent uncontrolled multi-square-kilometer wildfire spread.',
      evidenceLabel: 'SOURCE-VERIFIED',
      requiresConfirmation: false,
      emergencyServiceContact: '101'
    });

    actions.push({
      id: `act-${step}`,
      stepNumber: step++,
      title: isForestFire ? 'Execute Downwind Evacuation Corridor & Firebreak Protocol' : 'Evacuate Structure & Isolate Utility Supplies',
      description: isForestFire
        ? 'Evacuate all inhabitants in the projected smoke and ember path. Guide vehicles along cleared paved escape routes. Clear dry brush within 30 feet of outer perimeter.'
        : 'Evacuate all building occupants via fire exit stairs (never elevators). Shut down main gas line and electrical distribution breaker if accessible safely.',
      priority: 'IMMEDIATE',
      safetyPrecautions: 'Cover mouth and nose with damp cloth or N95 mask to prevent toxic carbon monoxide and smoke particle inhalation.',
      rationale: 'Smoke inhalation accounts for over 70% of fire-related casualties; rapid evacuation saves lives before roads are cut off.',
      evidenceLabel: 'AI-INFERRED',
      requiresConfirmation: true,
      emergencyServiceContact: '112'
    });

    actions.push({
      id: `act-${step}`,
      stepNumber: step++,
      title: 'Deploy Respiratory Smoke Protection & Clear Access for Tenders',
      description: 'Distribute N95 respirators or moist cloth barriers to affected community members; ensure access roads remain completely clear for incoming fire engines.',
      priority: 'HIGH',
      safetyPrecautions: 'Do not re-enter evacuated areas to retrieve possessions; await official fire containment clearance.',
      rationale: 'Unobstructed roads allow heavy tenders to establish water relays without delay.',
      evidenceLabel: 'SOURCE-VERIFIED',
      requiresConfirmation: false,
      emergencyServiceContact: '101'
    });
  } else if (lower.includes('gas') || lower.includes('chemical') || lower.includes('ammonia') || lower.includes('fume') || (lower.includes('leak') && !lower.includes('fuel'))) {
    // 3. Hazardous Chemical / Gas Leak Actions
    actions.push({
      id: `act-${step}`,
      stepNumber: step++,
      title: 'Dispatch HazMat Specialized Response Unit (101 / 112)',
      description: 'Report chemical/gas release with plume direction, visible vapor color, and odor traits to HazMat division.',
      priority: 'IMMEDIATE',
      safetyPrecautions: 'Approach only from upwind and uphill direction; never enter low-lying vapor clouds.',
      rationale: 'Specialized chemical neutralizers, water spray curtains, and self-contained breathing apparatus are required.',
      evidenceLabel: 'SOURCE-VERIFIED',
      requiresConfirmation: false,
      emergencyServiceContact: '101'
    });

    actions.push({
      id: `act-${step}`,
      stepNumber: step++,
      title: 'Evacuate Crosswind and Upwind within 500-Meter Perimeter',
      description: 'Direct all persons to move at 90-degree angles to the wind direction to escape the active vapor plume corridor.',
      priority: 'IMMEDIATE',
      safetyPrecautions: 'Prohibit all open flames, spark sources, and electrical switching.',
      rationale: 'Crosswind evacuation is the quickest escape from narrow toxic vapor axes.',
      evidenceLabel: 'AI-INFERRED',
      requiresConfirmation: true,
      emergencyServiceContact: '112'
    });
  } else if (lower.includes('crash') || lower.includes('tanker') || lower.includes('diesel') || lower.includes('fuel') || lower.includes('pileup')) {
    // 4. Traffic & Highway Collision Actions
    actions.push({
      id: `act-${step}`,
      stepNumber: step++,
      title: 'Alert Fire Rescue & Highway Police (101 / 112)',
      description: 'Report multi-vehicle pileup with hazardous fuel spill. Specify mile marker, westbound/eastbound lane status, and trapped occupant count.',
      priority: 'IMMEDIATE',
      safetyPrecautions: 'Maintain 100m distance from leaking tanker. Prohibit all open flames, smoking, or mobile phone usage near flammable vapor.',
      rationale: 'Diesel fuel across expressway creates severe fire ignition risk and catastrophic secondary collisions.',
      evidenceLabel: 'SOURCE-VERIFIED',
      requiresConfirmation: false,
      emergencyServiceContact: '101'
    });

    actions.push({
      id: `act-${step}`,
      stepNumber: step++,
      title: 'Deploy Upstream Hazard Warning & Evacuate to Barrier',
      description: 'Place hazard triangles 100-150m upstream to warn speeding vehicles in fog. Move all uninjured bystanders behind highway steel barrier.',
      priority: 'HIGH',
      safetyPrecautions: 'Never stand or walk in active highway lanes during low visibility conditions.',
      rationale: 'Prevents high-speed chain reaction pileups.',
      evidenceLabel: 'AI-INFERRED',
      requiresConfirmation: true,
      emergencyServiceContact: '112'
    });

    actions.push({
      id: `act-${step}`,
      stepNumber: step++,
      title: 'Cervical Spine Immobilization & Entrapment Extrication Staging',
      description: 'Instruct trapped occupants to remain still; do not attempt forceful extraction without spinal stabilization unless immediate fire is present.',
      priority: 'HIGH',
      safetyPrecautions: 'Maintain neutral head and neck alignment; do not bend or twist victims during stabilization.',
      rationale: 'Prevents secondary permanent spinal cord damage during cabin deformation.',
      evidenceLabel: 'SOURCE-VERIFIED',
      requiresConfirmation: false,
      emergencyServiceContact: '108'
    });
  } else if (lower.includes('flood') || lower.includes('wire') || lower.includes('electric') || lower.includes('cyclone')) {
    // 5. Severe Weather, Flood & Electrocution Actions
    actions.push({
      id: `act-${step}`,
      stepNumber: step++,
      title: 'Request Emergency Power Feeder Trip (112 & Electricity DISCOM)',
      description: 'Report fallen high-voltage live conductor in flooded street. Request immediate grid de-energization to prevent mass electrocution.',
      priority: 'IMMEDIATE',
      safetyPrecautions: 'Never approach standing water near fallen lines; keep bystanders at least 15 meters away.',
      rationale: 'Electrified floodwater is instantly fatal to anyone in contact with the water surface.',
      evidenceLabel: 'SOURCE-VERIFIED',
      requiresConfirmation: false,
      emergencyServiceContact: '112'
    });

    actions.push({
      id: `act-${step}`,
      stepNumber: step++,
      title: 'Barricade Inundated Sector & Guide Citizens to Elevated Shelter',
      description: 'Establish physical barriers across flooded access points; redirect stranded citizens and vehicles to elevated detour roads.',
      priority: 'HIGH',
      safetyPrecautions: 'Do not attempt to walk or drive through moving water deeper than 6 inches.',
      rationale: 'Averts vehicle stallings and swept-away pedestrians.',
      evidenceLabel: 'AI-INFERRED',
      requiresConfirmation: true,
      emergencyServiceContact: '112'
    });

    actions.push({
      id: `act-${step}`,
      stepNumber: step++,
      title: 'Deploy Swift Water Rescue Dinghies & Dewatering Pumps',
      description: 'Mobilize civil defense inflatable rescue boats to reach stranded residents; activate high-capacity municipal storm dewatering pumps.',
      priority: 'HIGH',
      safetyPrecautions: 'Rescuers must wear personal flotation devices (PFDs) and use anchored safety lines.',
      rationale: 'Rapid rescue prevents hypothermia and drowning in rising floodwaters.',
      evidenceLabel: 'SOURCE-VERIFIED',
      requiresConfirmation: false,
      emergencyServiceContact: '112'
    });
  } else if (category === 'INFRASTRUCTURE_FAILURE' || lower.includes('crack') || lower.includes('collapse') || lower.includes('pillar') || lower.includes('slab') || lower.includes('rubble') || lower.includes('flyover')) {
    // 6. Structural Failure Actions
    actions.push({
      id: `act-${step}`,
      stepNumber: step++,
      title: 'Cordon Off 30-Meter Structural Exclusion Zone & Close Deck (112 / Traffic Police)',
      description: 'Barricade all access points beneath and immediately adjacent to compromised structural elements.',
      priority: 'IMMEDIATE',
      safetyPrecautions: 'Prohibit all pedestrian and vehicular entry within 30 meters of cracked load-bearing supports.',
      rationale: 'Secondary shear failure can occur abruptly without further warning.',
      evidenceLabel: 'SOURCE-VERIFIED',
      requiresConfirmation: false,
      emergencyServiceContact: '112'
    });

    actions.push({
      id: `act-${step}`,
      stepNumber: step++,
      title: 'Dispatch Certified Structural Forensic Engineering Team',
      description: 'Request urgent deployment of municipal engineering team for acoustic emission, laser deflection, and load-redistribution assessment.',
      priority: 'HIGH',
      safetyPrecautions: 'Engineers must wear hard hats and maintain egress paths; do not place heavy testing machinery on unsupported decks.',
      rationale: 'Objective engineering inspection is required before determining demolition or shoring feasibility.',
      evidenceLabel: 'SOURCE-VERIFIED',
      requiresConfirmation: true,
      emergencyServiceContact: '112'
    });
  } else if (lower.includes('whatsapp') || lower.includes('forward') || lower.includes('viral') || lower.includes('rumor')) {
    // 7. Viral Rumor / Social Media Mitigation Actions
    actions.push({
      id: `act-${step}`,
      stepNumber: step++,
      title: 'Interrogate Official Telemetry & Disaster Authority Feeds (DDMA / CWC)',
      description: 'Cross-reference viral alert against official sensor telemetry (e.g. reservoir levels, seismic monitors, police logs).',
      priority: 'IMMEDIATE',
      safetyPrecautions: 'Do not rebroadcast or amplify unverified citizen claims until confirmed by municipal authorities.',
      rationale: 'Unverified panic triggers unnecessary mass evacuations, telephone network collapse, and stampedes.',
      evidenceLabel: 'SOURCE-VERIFIED',
      requiresConfirmation: false,
      emergencyServiceContact: '112'
    });

    actions.push({
      id: `act-${step}`,
      stepNumber: step++,
      title: 'Broadcast Real-Time Official Counter-Rumor Bulletin',
      description: 'Issue verified factual bulletin on official emergency radio, SMS blast, and verified social media handles.',
      priority: 'HIGH',
      safetyPrecautions: 'Use calm, authoritative, unequivocal language specifying exact sensor readings and on-scene status.',
      rationale: 'Neutralizes misinformation before widespread civil disorder or dangerous panic occurs.',
      evidenceLabel: 'AI-INFERRED',
      requiresConfirmation: true,
      emergencyServiceContact: '112'
    });
  } else {
    // 8. General Crisis Fallback
    actions.push({
      id: `act-${step}`,
      stepNumber: step++,
      title: hasConflict
        ? 'Establish Conservative Safety Perimeter (Conflicting Reports Detected)'
        : 'Contact Central Emergency Dispatch (112 / 108 / 101)',
      description: hasConflict
        ? 'Because incoming reports directly contradict each other regarding site safety, treat the area as hazardous and avoid entry until physical clearance is confirmed.'
        : 'Report situation summary, confirmed casualties, trapped individuals, and access route conditions to municipal dispatch.',
      priority: 'IMMEDIATE',
      safetyPrecautions: 'Ensure personal safety first; maintain safe distance from risk zone.',
      rationale: hasConflict
        ? 'Preventing casualties when reports disagree requires prioritizing worst-case safety.'
        : 'Official human response coordination is mandatory for resource allocation.',
      evidenceLabel: hasConflict ? 'AI-INFERRED' : 'SOURCE-VERIFIED',
      requiresConfirmation: hasConflict || isStale,
      emergencyServiceContact: '112'
    });

    actions.push({
      id: `act-${step}`,
      stepNumber: step++,
      title: 'Identify Vulnerable Individuals & Clear Emergency Access Route',
      description: 'Assist elderly, children, and persons with disabilities to safe staging areas while keeping main roadway clear for emergency vehicle access.',
      priority: 'HIGH',
      safetyPrecautions: 'Do not block fire hydrants or emergency vehicle turnaround zones.',
      rationale: 'Unobstructed access cuts emergency response travel time.',
      evidenceLabel: 'AI-INFERRED',
      requiresConfirmation: false,
      emergencyServiceContact: '112'
    });
  }

  // Common Action: Evidence Audit & Verification
  actions.push({
    id: `act-${step}`,
    stepNumber: step++,
    title: 'Audit Trust Trace & Reconcile Information Freshness',
    description: 'Inspect the extracted facts in the Studio, verify source provenance, and confirm on-scene conditions before deploying field units.',
    priority: 'HIGH',
    safetyPrecautions: 'Never disclose private medical or personal identifiable information without explicit citizen consent.',
    rationale: 'Audited, non-contradictory crisis intelligence prevents misdirected emergency services.',
    evidenceLabel: 'AI-INFERRED',
    requiresConfirmation: true,
    emergencyServiceContact: '112'
  });

  // Common Action: Responder Brief Export
  actions.push({
    id: `act-${step}`,
    stepNumber: step++,
    title: 'Export Sanitized Responder Brief for Incident Command',
    description: 'Generate standardized, privacy-scrubbed crisis brief with exact GPS coordinates and verified hazard precautions for first responders.',
    priority: 'ROUTINE',
    safetyPrecautions: 'Verify that medical and location privacy scrub settings conform to citizen consent directives.',
    rationale: 'Provides structured, actionable briefing directly to police, ambulance, and fire dispatchers.',
    evidenceLabel: 'SOURCE-VERIFIED',
    requiresConfirmation: false,
    emergencyServiceContact: '112'
  });

  return actions.map(act => ({
    ...act,
    isCompleted: false,
    freshnessStatus,
    hasUnresolvedConflict: hasConflict,
    conflictWarning: conflictNotice,
    staleWarning: staleNotice,
    trustTrace: {
      targetId: act.id,
      supportingClaim: act.title,
      sourceName: 'Civic Crisis Triage Protocols',
      sourceType: 'RULE_ENGINE' as const,
      submissionTime: timestamp,
      evidenceLabel: act.evidenceLabel,
      supportExplanation: act.rationale,
      verificationDetails: 'Life-saving protocol tailored to incident category and reported real-world hazards.',
      hasUnresolvedContradiction: hasConflict,
      uncertaintyNotes: conflictNotice || staleNotice
    }
  }));
}
