import { z } from 'zod';

export const IncidentCategoryEnum = z.enum([
  'NATURAL_DISASTER',
  'TRAFFIC_ACCIDENT',
  'INFRASTRUCTURE_FAILURE',
  'PUBLIC_SAFETY',
  'MEDICAL_EMERGENCY',
  'OTHER'
]);
export type IncidentCategory = z.infer<typeof IncidentCategoryEnum>;

export const UrgencyLevelEnum = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);
export type UrgencyLevel = z.infer<typeof UrgencyLevelEnum>;

export const EvidenceLabelEnum = z.enum([
  'USER-REPORTED',
  'SOURCE-VERIFIED',
  'AI-INFERRED',
  'UNVERIFIED'
]);
export type EvidenceLabel = z.infer<typeof EvidenceLabelEnum>;

export const IncidentLifecycleStatusEnum = z.enum([
  'SUBMITTED',
  'ANALYZED',
  'REVIEWED',
  'ACTION_IN_PROGRESS',
  'RESOLVED',
  'ARCHIVED'
]);
export type IncidentLifecycleStatus = z.infer<typeof IncidentLifecycleStatusEnum>;

export const LocationConfidenceEnum = z.enum(['EXACT', 'APPROXIMATE', 'UNCONFIRMED', 'UNKNOWN']);
export type LocationConfidence = z.infer<typeof LocationConfidenceEnum>;

export const ActionPriorityEnum = z.enum(['IMMEDIATE', 'HIGH', 'ROUTINE']);
export type ActionPriority = z.infer<typeof ActionPriorityEnum>;

export const FreshnessStatusEnum = z.enum(['CURRENT', 'AGING', 'STALE', 'UNKNOWN']);
export type FreshnessStatus = z.infer<typeof FreshnessStatusEnum>;

// Freshness Evaluation Schema
export const FreshnessEvaluationSchema = z.object({
  status: FreshnessStatusEnum,
  ageMinutes: z.number().nullable(),
  ageFormatted: z.string(),
  lastConfirmedAt: z.string().optional(),
  warning: z.string().optional(),
  thresholdMinutes: z.number()
});
export type FreshnessEvaluation = z.infer<typeof FreshnessEvaluationSchema>;

// Confirmation Record Schema
export const ConfirmationRecordSchema = z.object({
  id: z.string(),
  confirmedAt: z.string(),
  confirmedBy: z.string(),
  source: z.string(),
  note: z.string().optional()
});
export type ConfirmationRecord = z.infer<typeof ConfirmationRecordSchema>;

// Sub-Report Schema (Multiple reports associated with one incident)
export const IncidentSubReportSchema = z.object({
  id: z.string(),
  sourceName: z.string(),
  sourceType: z.enum(['CITIZEN_TEXT', 'VOICE_TRANSCRIPT', 'OFFICIAL_BULLETIN', 'SCENE_PHOTO', 'EMERGENCY_DISPATCH']),
  submittedAt: z.string(),
  eventObservedAt: z.string().optional(),
  text: z.string(),
  locationDescription: z.string().optional(),
  verificationStatus: EvidenceLabelEnum,
  mediaUrl: z.string().optional(),
  isEventTimeUnknown: z.boolean().default(false)
});
export type IncidentSubReport = z.infer<typeof IncidentSubReportSchema>;

// Contradiction Resolution Schema
export const ContradictionResolutionSchema = z.object({
  resolvedAt: z.string(),
  resolvedBy: z.string(),
  resolutionRationale: z.string(),
  acceptedClaimId: z.string().optional(),
  additionalEvidenceSubmitted: z.string().optional()
});
export type ContradictionResolution = z.infer<typeof ContradictionResolutionSchema>;

// Contradiction Item Schema
export const ContradictionItemSchema = z.object({
  id: z.string(),
  topic: z.string(),
  explanation: z.string(),
  claimA: z.object({
    id: z.string(),
    claimText: z.string(),
    sourceName: z.string(),
    submittedAt: z.string(),
    eventObservedAt: z.string().optional(),
    location: z.string().optional(),
    verificationStatus: EvidenceLabelEnum
  }),
  claimB: z.object({
    id: z.string(),
    claimText: z.string(),
    sourceName: z.string(),
    submittedAt: z.string(),
    eventObservedAt: z.string().optional(),
    location: z.string().optional(),
    verificationStatus: EvidenceLabelEnum
  }),
  isResolved: z.boolean().default(false),
  resolution: ContradictionResolutionSchema.optional(),
  severity: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('HIGH')
});
export type ContradictionItem = z.infer<typeof ContradictionItemSchema>;

// Trust Trace Schema
export const TrustTraceSchema = z.object({
  targetId: z.string(),
  supportingClaim: z.string(),
  sourceName: z.string().optional(),
  sourceType: z.string().optional(),
  submissionTime: z.string().optional(),
  eventTime: z.string().optional(),
  evidenceLabel: EvidenceLabelEnum,
  supportExplanation: z.string(),
  verificationDetails: z.string(),
  hasUnresolvedContradiction: z.boolean().optional(),
  relatedContradictionId: z.string().optional(),
  uncertaintyNotes: z.string().optional(),
  reviewedCorrection: z.string().optional(),
  reviewedAt: z.string().optional()
});
export type TrustTrace = z.infer<typeof TrustTraceSchema>;

// Timeline Event Schema
export const TimelineEventSchema = z.object({
  id: z.string(),
  eventType: z.enum(['REPORT_SUBMITTED', 'MEDIA_CAPTURED', 'CONTRADICTION_DETECTED', 'USER_VERIFICATION', 'STATUS_CONFIRMED', 'ACTION_TAKEN']),
  title: z.string(),
  description: z.string(),
  timestamp: z.string(),
  displayTime: z.string(),
  eventTime: z.string().optional(),
  submissionTime: z.string().optional(),
  isEventTimeUnknown: z.boolean().default(false),
  sourceName: z.string().optional(),
  evidenceLabel: EvidenceLabelEnum.optional(),
  statusBadge: z.string().optional()
});
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;

// Core Schema Elements
export const IncidentFactSchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  evidenceLabel: EvidenceLabelEnum,
  userConfirmed: z.boolean().default(false),
  sourceReference: z.string().optional(),
  confidenceScore: z.number().min(0).max(1).default(0.8),
  trustTrace: TrustTraceSchema.optional()
});
export type IncidentFact = z.infer<typeof IncidentFactSchema>;

export const HazardItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1),
  severity: z.enum(['SEVERE', 'MODERATE', 'LOW']),
  precautions: z.string(),
  evidenceLabel: EvidenceLabelEnum,
  trustTrace: TrustTraceSchema.optional()
});
export type HazardItem = z.infer<typeof HazardItemSchema>;

export const ActionItemSchema = z.object({
  id: z.string(),
  stepNumber: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  priority: ActionPriorityEnum,
  safetyPrecautions: z.string(),
  rationale: z.string(),
  evidenceLabel: EvidenceLabelEnum,
  requiresConfirmation: z.boolean().default(false),
  isCompleted: z.boolean().default(false),
  emergencyServiceContact: z.string().optional(),
  freshnessStatus: FreshnessStatusEnum.optional(),
  hasUnresolvedConflict: z.boolean().default(false),
  conflictWarning: z.string().optional(),
  staleWarning: z.string().optional(),
  supportingEvidenceClaim: z.string().optional(),
  importantUnknowns: z.array(z.string()).optional(),
  trustTrace: TrustTraceSchema.optional()
});
export type ActionItem = z.infer<typeof ActionItemSchema>;

export const UncertaintyItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1),
  type: z.enum(['MISSING_DATA', 'CONFLICTING_REPORT', 'LOCATION_AMBIGUITY', 'UNVERIFIED_SOURCE']),
  mitigationSuggestion: z.string()
});
export type UncertaintyItem = z.infer<typeof UncertaintyItemSchema>;

export const DuplicateSuggestionSchema = z.object({
  matchedIncidentId: z.string(),
  title: z.string(),
  similarityScore: z.number().min(0).max(1),
  reason: z.string()
});
export type DuplicateSuggestion = z.infer<typeof DuplicateSuggestionSchema>;

// Incident Input Payload
export const IncidentInputPayloadSchema = z.object({
  text: z.string().max(10000).optional().default(''),
  speechTranscript: z.string().max(5000).optional().default(''),
  pastedReport: z.string().max(10000).optional().default(''),
  pastedReportSource: z.string().max(500).optional().default(''),
  imageBase64: z.string().optional(),
  imageMimeType: z.string().optional(),
  imageName: z.string().optional(),
  mediaCapturedAt: z.string().optional(),
  eventObservedAt: z.string().optional(),
  medicalContext: z.string().max(2000).optional().default(''),
  consentGivenForMedical: z.boolean().default(false),
  consentGivenForLocation: z.boolean().default(false),
  clientTimestamp: z.string().default(() => new Date().toISOString()),
  languagePreference: z.enum(['en', 'hi']).default('en')
}).refine(data => {
  const hasText = !!data.text && data.text.trim().length > 0;
  const hasSpeech = !!data.speechTranscript && data.speechTranscript.trim().length > 0;
  const hasPasted = !!data.pastedReport && data.pastedReport.trim().length > 0;
  const hasImage = !!data.imageBase64 && data.imageBase64.trim().length > 0;
  const hasMedical = !!data.medicalContext && data.medicalContext.trim().length > 0;
  return hasText || hasSpeech || hasPasted || hasImage || hasMedical;
}, {
  message: 'At least one input source (text, speech transcript, pasted report, image, or medical context) must be provided.'
});
export type IncidentInputPayload = z.infer<typeof IncidentInputPayloadSchema>;

// Complete Structured Incident Record
export const IncidentRecordSchema = z.object({
  id: z.string(),
  category: IncidentCategoryEnum,
  title: z.string().min(1).max(200),
  situationSummary: z.string().min(1),
  userReportedFacts: z.array(IncidentFactSchema),
  location: z.object({
    rawText: z.string(),
    normalized: z.string().optional(),
    confidence: LocationConfidenceEnum,
    coordinates: z.object({
      latitude: z.number().optional(),
      longitude: z.number().optional()
    }).optional(),
    userConfirmed: z.boolean().default(false)
  }),
  estimatedUrgency: UrgencyLevelEnum,
  urgencyExplanation: z.string(),
  urgencyScore: z.number().min(0).max(100),
  potentialHazards: z.array(HazardItemSchema),
  peopleAffected: z.object({
    estimatedCount: z.string().optional(),
    vulnerableGroups: z.array(z.string()).default([]),
    details: z.string().optional()
  }),
  uncertainties: z.array(UncertaintyItemSchema),
  recommendedActions: z.array(ActionItemSchema),
  evidenceReferences: z.array(z.object({
    id: z.string(),
    sourceType: z.enum(['USER_TEXT', 'VOICE_TRANSCRIPT', 'IMAGE_ANALYSIS', 'PASTED_ALERT', 'MEDICAL_HISTORY']),
    label: EvidenceLabelEnum,
    contentSnippet: z.string(),
    sourceAttribution: z.string()
  })),
  subReports: z.array(IncidentSubReportSchema).default([]),
  contradictions: z.array(ContradictionItemSchema).default([]),
  confirmations: z.array(ConfirmationRecordSchema).default([]),
  timelineEvents: z.array(TimelineEventSchema).default([]),
  freshness: FreshnessEvaluationSchema.default({
    status: 'CURRENT',
    ageMinutes: 0,
    ageFormatted: 'Just submitted',
    thresholdMinutes: 30
  }),
  verificationStatus: z.enum(['REQUIRES_HUMAN_REVIEW', 'USER_VERIFIED', 'OFFICIALLY_UNVERIFIED']),
  lifecycleStatus: IncidentLifecycleStatusEnum,
  possibleDuplicates: z.array(DuplicateSuggestionSchema).default([]),
  medicalContextIncluded: z.boolean().default(false),
  medicalContextConsentGiven: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
  language: z.enum(['en', 'hi']).default('en'),
  isDemoScenario: z.boolean().default(false),
  demoScenarioId: z.string().optional(),
  disclaimer: z.string().default(
    'SahaaySetu is an AI-assisted crisis coordination bridge. It does not replace trained emergency services, officially certified responders, or medical practitioners. For immediate life danger, contact local emergency dispatch (e.g. 112 in India, 911 in US).'
  )
});
export type IncidentRecord = z.infer<typeof IncidentRecordSchema>;

// Responder Brief Export Schema
export const ResponderBriefSchema = z.object({
  incidentId: z.string(),
  generatedAt: z.string(),
  title: z.string(),
  category: IncidentCategoryEnum,
  urgency: UrgencyLevelEnum,
  urgencyScore: z.number(),
  locationSummary: z.string(),
  situationOverview: z.string(),
  keyFacts: z.array(z.object({
    fact: z.string(),
    evidence: EvidenceLabelEnum
  })),
  criticalHazards: z.array(z.string()),
  topActionPriorities: z.array(z.object({
    step: z.number(),
    title: z.string(),
    precautions: z.string()
  })),
  openUncertainties: z.array(z.string()),
  unresolvedContradictions: z.array(z.string()).default([]),
  freshnessStatus: FreshnessStatusEnum.default('CURRENT'),
  contactEmergencyServices: z.array(z.string()),
  containsRedactedMedical: z.boolean(),
  confidentialityNote: z.string()
});
export type ResponderBrief = z.infer<typeof ResponderBriefSchema>;

// Emergency Numbers Mapping (Jurisdiction aware)
export const EMERGENCY_NUMBERS = [
  { jurisdiction: 'India', service: 'National Emergency', number: '112', notes: 'Unified Emergency Helpline' },
  { jurisdiction: 'India', service: 'Police', number: '100', notes: 'Immediate law enforcement' },
  { jurisdiction: 'India', service: 'Fire & Rescue', number: '101', notes: 'Fire and structural hazards' },
  { jurisdiction: 'India', service: 'Ambulance / Medical', number: '108', notes: 'Disaster and medical response' },
  { jurisdiction: 'India', service: 'Disaster Management Helpline (NDRF)', number: '1078', notes: 'National Disaster response' },
  { jurisdiction: 'India', service: 'Women Helpline', number: '1091', notes: 'Women distress response' },
  { jurisdiction: 'United States & Canada', service: 'Emergency Dispatch', number: '911', notes: 'Police / Fire / EMS' },
  { jurisdiction: 'United Kingdom', service: 'Emergency Services', number: '999', notes: 'Emergency response' },
  { jurisdiction: 'European Union', service: 'Emergency', number: '112', notes: 'Pan-European helpline' }
];

// Configurable Category Freshness Thresholds (Minutes)
export const CATEGORY_FRESHNESS_THRESHOLDS: Record<IncidentCategory, { currentMax: number; agingMax: number }> = {
  TRAFFIC_ACCIDENT: { currentMax: 20, agingMax: 60 },
  NATURAL_DISASTER: { currentMax: 45, agingMax: 120 },
  INFRASTRUCTURE_FAILURE: { currentMax: 30, agingMax: 90 },
  MEDICAL_EMERGENCY: { currentMax: 15, agingMax: 45 },
  PUBLIC_SAFETY: { currentMax: 30, agingMax: 90 },
  OTHER: { currentMax: 30, agingMax: 90 }
};

// 8 Realistic Sample Scenarios (5 Original + 3 Distinctive Phase-2 Intelligence Scenarios)
export const DEMO_SCENARIOS = [
  {
    id: 'demo-1-flood-waterlogging',
    title: 'Flash Waterlogging & Blocked Arterial Underpass',
    category: 'NATURAL_DISASTER' as IncidentCategory,
    description: 'Heavy continuous monsoon downpour over 3 hours has flooded the Milan Subway underpass. Water level is estimated at 3.5 to 4 feet. Two compact cars are submerged up to windshield level; drivers have evacuated to the elevated walkway. Electrical junction box nearby is sparking intermittently. Traffic is jammed for 2 km on SV Road towards Santacruz.',
    inputPayload: {
      text: 'Heavy continuous monsoon downpour for the last 3 hours has flooded the Milan Subway underpass. Water is at least 3.5 to 4 feet deep. Two cars are stuck, water is up to the windshields. Drivers climbed out onto the high walkway. A roadside electric junction box is sparking occasionally near the north entrance. SV Road is totally choked with traffic back towards Santacruz.',
      pastedReport: 'IMD Alert (15 mins ago): Heavy to very heavy rainfall warning for Mumbai Suburbs next 6 hours. High tide of 4.12m expected at 14:30 IST.',
      pastedReportSource: 'Regional Meteorological Department Flash Advisory',
      consentGivenForLocation: true,
      consentGivenForMedical: false,
      languagePreference: 'en' as const
    },
    urgency: 'HIGH' as UrgencyLevel,
    urgencyScore: 82,
    locationText: 'Milan Subway Underpass, SV Road, Santacruz West, Mumbai',
    hazards: [
      { id: 'h1', description: 'Active electrical sparking near flooded water creates severe electrocution risk', severity: 'SEVERE' as const, precautions: 'Maintain 50m perimeter; do not enter standing water near the north junction box; alert utility department immediately', evidenceLabel: 'USER-REPORTED' as EvidenceLabel },
      { id: 'h2', description: 'Submerged vehicles could be swept further if water rises; potential open manholes invisible beneath floodwaters', severity: 'SEVERE' as const, precautions: 'Do not attempt to push or wade into vehicles; stay on elevated concrete walkway', evidenceLabel: 'AI-INFERRED' as EvidenceLabel },
      { id: 'h3', description: 'Severe gridlock delaying potential emergency vehicles and municipal pumps', severity: 'MODERATE' as const, precautions: 'Divert approaching traffic 1 km prior at SV Road junction', evidenceLabel: 'USER-REPORTED' as EvidenceLabel }
    ]
  },
  {
    id: 'demo-2-highway-collision',
    title: 'Multi-Vehicle Highway Collision with Fuel Spill & Uncertain Mile Marker',
    category: 'TRAFFIC_ACCIDENT' as IncidentCategory,
    description: 'Collision between a transport tanker and two passenger SUVs on Pune-Mumbai Expressway. Diesel fuel leakage detected on the asphalt. Visibility compromised due to dense early morning fog. Mile marker reported ambiguously as "between km 42 and 46 near Khandala exit". One passenger in SUV complains of chest tightness; both drivers conscious.',
    inputPayload: {
      text: 'Accident on the expressway! A transport tanker and two SUVs crashed just past the tunnel. Heavy diesel smell and fuel is leaking on the road. Super foggy, cannot see 20 meters ahead. Someone is sitting on the side with bad chest pain from the seatbelt. Mile marker says either km 42 or 46 near Khandala cut, not 100% sure.',
      speechTranscript: 'Please hurry, fuel is spreading across two lanes. We need fire brigade and traffic police to stop cars speeding into this fog.',
      consentGivenForLocation: true,
      consentGivenForMedical: true,
      medicalContext: 'Passenger has history of hypertension and asthma. Complaining of chest tightness post-impact. No visible external bleeding, alert and speaking.',
      languagePreference: 'en' as const
    },
    urgency: 'CRITICAL' as UrgencyLevel,
    urgencyScore: 92,
    locationText: 'Pune-Mumbai Expressway, Approx km 42-46 westbound near Khandala Exit (Unconfirmed exact km)',
    hazards: [
      { id: 'h1', description: 'Flammable fuel spill (diesel) across high-speed expressway lanes under low visibility', severity: 'SEVERE' as const, precautions: 'STRICT NO-SMOKING / NO OPEN FLAMES; place hazard triangles 100m upstream; keep bystanders away from pooling fuel', evidenceLabel: 'USER-REPORTED' as EvidenceLabel },
      { id: 'h2', description: 'Secondary collision hazard from incoming vehicles traveling at highway speeds in dense fog', severity: 'SEVERE' as const, precautions: 'Clear lanes immediately; all occupants must move behind steel crash barrier away from road shoulder', evidenceLabel: 'AI-INFERRED' as EvidenceLabel }
    ]
  },
  {
    id: 'demo-3-unverified-cyclone-alert',
    title: 'Forwarded Cyclone Warning & Evacuation Rumor Verification',
    category: 'PUBLIC_SAFETY' as IncidentCategory,
    description: 'Viral message circulating on community WhatsApp groups alleging an immediate Category-4 cyclone landfall in 2 hours with order to evacuate entire coastal district. Official IMD tracking shows deep depression 320 km offshore moving north-northwest, with wind advisory but no immediate landfall or district evacuation order issued.',
    inputPayload: {
      text: 'Everyone in our apartment society is panicking and packing cars to leave. A forwarded voice note says Cyclone Mahasen is hitting our beach in exactly 2 hours and everyone must run inland immediately.',
      pastedReport: 'URGENT FORWARD: Red alert declared! Category 4 Cyclone hitting coast at 3 PM today. District collector has ordered complete evacuation of all coastal sectors within 10 km. Share with everyone immediately!',
      pastedReportSource: 'Unverified Viral Messaging Group (WhatsApp Forward)',
      consentGivenForLocation: false,
      consentGivenForMedical: false,
      languagePreference: 'en' as const
    },
    urgency: 'MEDIUM' as UrgencyLevel,
    urgencyScore: 58,
    locationText: 'Coastal District Sector 4 (Unspecified jurisdiction)',
    hazards: [
      { id: 'h1', description: 'Stampede and mass panic on egress roads caused by unverified viral alert', severity: 'MODERATE' as const, precautions: 'Verify solely through official District Disaster Management Authority (DDMA) or National Meteorological Service handles before mobilizing', evidenceLabel: 'AI-INFERRED' as EvidenceLabel },
      { id: 'h2', description: 'Unverified source claiming official evacuation mandate without verifiable government communique', severity: 'MODERATE' as const, precautions: 'Do not circulate unverified WhatsApp forwards; tune in to official All India Radio / DD News bulletins', evidenceLabel: 'SOURCE-VERIFIED' as EvidenceLabel }
    ]
  },
  {
    id: 'demo-4-structural-collapse-missing-facts',
    title: 'Old Commercial Building Partial Ceiling Collapse with Missing Occupancy Data',
    category: 'INFRASTRUCTURE_FAILURE' as IncidentCategory,
    description: 'A portion of the second-floor slab and ceiling collapsed in a 45-year-old commercial complex during morning renovation work. Loud crash reported, dust plume visible. Ground floor shops are open. Number of workers on the second floor at the time is unknown (estimated 2 to 6). Access staircase is partially obstructed by rubble.',
    inputPayload: {
      text: 'Loud thud and cloud of plaster dust at Star Plaza commercial complex. The second floor slab gave way. Some renovation guys were working up there earlier, but no one knows if they were inside when it dropped or down for tea. Staircase has chunks of concrete blocking the way. Downstairs chemists and groceries are screaming.',
      consentGivenForLocation: true,
      consentGivenForMedical: false,
      languagePreference: 'en' as const
    },
    urgency: 'CRITICAL' as UrgencyLevel,
    urgencyScore: 89,
    locationText: 'Star Plaza Commercial Complex, Market Road',
    hazards: [
      { id: 'h1', description: 'Secondary structural collapse of weakened adjacent floor slabs and beams', severity: 'SEVERE' as const, precautions: 'Immediate evacuation of ground floor shops; do NOT re-enter building to retrieve belongings; cordoning off 30m radius', evidenceLabel: 'AI-INFERRED' as EvidenceLabel },
      { id: 'h2', description: 'Unknown number of trapped persons requiring specialized search and rescue (NDRF / Fire Rescue)', severity: 'SEVERE' as const, precautions: 'Establish contact without entering compromised structure; verify attendance roll with contractor', evidenceLabel: 'USER-REPORTED' as EvidenceLabel }
    ]
  },
  {
    id: 'demo-5-elderly-collapse-medical-context',
    title: 'Elderly Individual Sudden Collapse at Community Center (Privacy-Consented)',
    category: 'MEDICAL_EMERGENCY' as IncidentCategory,
    description: '68-year-old individual collapsed suddenly during morning yoga session. Breathing is shallow and irregular. Eyes open but unresponsive to verbal cues. User consented to sharing relevant medical summary (diabetic on insulin, pacemaker implanted 2021). Conservative first-aid guidance generated without prescribing medication or attempting diagnosis.',
    inputPayload: {
      text: 'A senior citizen collapsed 4 minutes ago on the lawn at the community park. Breathing sounds very faint and raspy. He is not answering when we shake his shoulder. His wife is here and gave his medical history.',
      consentGivenForLocation: true,
      consentGivenForMedical: true,
      medicalContext: 'Age 68. History of Type 2 Diabetes (takes insulin daily), Pacemaker implant in 2021. No known allergies.',
      languagePreference: 'en' as const
    },
    urgency: 'CRITICAL' as UrgencyLevel,
    urgencyScore: 98,
    locationText: 'Shivaji Community Park, Sector 9 Lawn',
    hazards: [
      { id: 'h1', description: 'Airway obstruction or acute cardiac / hypoglycemic crisis requiring immediate professional life support', severity: 'SEVERE' as const, precautions: 'Call 108 / 112 immediately; place patient in recovery position if breathing; check for clear airway without forcing foreign objects into mouth', evidenceLabel: 'USER-REPORTED' as EvidenceLabel },
      { id: 'h2', description: 'Medical intervention risks: Bystanders attempting to give water or oral medication to an unresponsive person', severity: 'SEVERE' as const, precautions: 'STRICT WARNING: DO NOT administer fluids, food, or oral sugar to an unconscious/unresponsive person due to severe choking/aspiration risk', evidenceLabel: 'AI-INFERRED' as EvidenceLabel }
    ]
  },
  // --- DISTINCTIVE FEATURE 6 EXTENDED SCENARIOS ---
  {
    id: 'demo-6-road-condition-contradiction',
    title: 'Disputed Milan Subway Passability (Genuine Contradiction Review)',
    category: 'INFRASTRUCTURE_FAILURE' as IncidentCategory,
    description: 'Two contemporaneous reports from motorists at Milan Subway submit completely contradictory claims: Report A claims subway is dry and cars are flowing freely; Report B with photo submitted 6 minutes later claims underpass is submerged in 3.8 feet of water with drowned engines. Demonstrates side-by-side contradiction detection, unresolved status alert, and conservative action prioritization.',
    inputPayload: {
      text: 'Report A (Commuter Voice Note, 10:14 AM): "Milan Subway is completely clear and open! Drove through 2 minutes ago, water is barely tire deep, cars moving normally."\n\nReport B (Local Shopkeeper with Photo, 10:20 AM): "ALERT: Milan Subway is TOTALLY BLOCKED and submerged under 4 feet of fast water! A hatchback just stalled and drowned its engine. Road is impassable!"',
      pastedReport: 'Traffic Control Room Log (10:18 AM): Conflicting calls received regarding Milan Subway passability. Patrol unit dispatched to verify physical barricade status.',
      pastedReportSource: 'Traffic Police Control Room CAD Feed',
      consentGivenForLocation: true,
      consentGivenForMedical: false,
      languagePreference: 'en' as const
    },
    urgency: 'HIGH' as UrgencyLevel,
    urgencyScore: 84,
    locationText: 'Milan Subway Underpass, SV Road, Santacruz West',
    hazards: [
      { id: 'h1', description: 'Severe flash waterlogging with submerged vehicles trapped in low-lying underpass', severity: 'SEVERE' as const, precautions: 'CONSERVATIVE ACTION: Treat underpass as impassable until on-scene confirmation; deploy physical barricades at north entrance.', evidenceLabel: 'USER-REPORTED' as EvidenceLabel }
    ]
  },
  {
    id: 'demo-7-stale-landslide-photo',
    title: 'Stale Ghat Road Landslide Photo (Captured 95 Mins Ago, No Current Confirmation)',
    category: 'NATURAL_DISASTER' as IncidentCategory,
    description: 'A road obstruction photo was just uploaded to the platform, but image metadata and timestamp indicate it was captured 95 minutes ago on Khandala Ghat. Demonstrates the Information Freshness Engine: marks visual evidence STALE, explains that recent clearing crews may have altered the scene, and cautions responders against acting on outdated visual data.',
    inputPayload: {
      text: 'Just sharing this photo of huge boulders blocking the Pune-Mumbai Ghat road near Amrutanjan bridge. Traffic stopped behind rocks.',
      imageName: 'khandala_boulders_clearing.jpg',
      mediaCapturedAt: new Date(Date.now() - 95 * 60 * 1000).toISOString(), // 95 minutes ago
      eventObservedAt: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
      consentGivenForLocation: true,
      consentGivenForMedical: false,
      languagePreference: 'en' as const
    },
    urgency: 'HIGH' as UrgencyLevel,
    urgencyScore: 68,
    locationText: 'Old Pune-Mumbai Highway, Km 48 near Amrutanjan Point',
    hazards: [
      { id: 'h1', description: 'Possible road blockage by falling debris; condition currently unconfirmed due to stale evidence age (95m)', severity: 'MODERATE' as const, precautions: 'Do not assume highway is closed without active confirmation from Highway Safety Patrol.', evidenceLabel: 'AI-INFERRED' as EvidenceLabel }
    ]
  },
  {
    id: 'demo-8-unverified-viral-dam-breach',
    title: 'Unverified Viral Dam Breach Forward vs Official Irrigation Department Bulletin',
    category: 'PUBLIC_SAFETY' as IncidentCategory,
    description: 'Panicked WhatsApp voice notes claim a dam wall has fractured with 15-minute downstream flooding. Official State Water Resources Department telemetry issued 8 minutes ago confirms the reservoir is at 71% safe capacity with zero sluice releases. Trust Trace exposes the viral note as UNVERIFIED, flags the contradiction, and prevents community panic.',
    inputPayload: {
      text: 'Viral voice message circulating: "Everyone run! The dam wall at Khadakwasla has cracked and water will reach Sinhagad road in 15 minutes! Evacuate immediately!"',
      pastedReport: 'OFFICIAL IRRIGATION BULLETIN (8 mins ago): Water Resources Dept confirms Khadakwasla dam structural health is 100% normal. Reservoir level at 71.4%. Sluice gates are closed. Disregard false viral audio clips.',
      pastedReportSource: 'Maharashtra Water Resources Dept Emergency Desk',
      consentGivenForLocation: true,
      consentGivenForMedical: false,
      languagePreference: 'en' as const
    },
    urgency: 'MEDIUM' as UrgencyLevel,
    urgencyScore: 54,
    locationText: 'Khadakwasla Dam & Sinhagad Road Catchment, Pune',
    hazards: [
      { id: 'h1', description: 'Severe public panic, road congestion, and potential pedestrian stampedes from unverified viral dam breach claims', severity: 'SEVERE' as const, precautions: 'Disseminate verified Irrigation Department bulletin immediately via local radio and police loudspeaker vehicles.', evidenceLabel: 'SOURCE-VERIFIED' as EvidenceLabel }
    ]
  }
];
