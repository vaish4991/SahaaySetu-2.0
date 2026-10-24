export type Language = 'en' | 'hi';

export interface Translations {
  appName: string;
  tagline: string;
  navDashboard: string;
  navSubmit: string;
  navReview: string;
  navActions: string;
  navExplorer: string;
  navSettings: string;
  ctaAnalyze: string;
  ctaDemoPresets: string;
  urgencyCritical: string;
  urgencyHigh: string;
  urgencyMedium: string;
  urgencyLow: string;
  badgeUserReported: string;
  badgeSourceVerified: string;
  badgeAiInferred: string;
  badgeUnverified: string;
  evidenceChainTitle: string;
  evidenceChainDesc: string;
  actionsTitle: string;
  hazardsTitle: string;
  factsTitle: string;
  uncertaintiesTitle: string;
  responderBriefBtn: string;
  callEmergencyBtn: string;
  voiceInputBtn: string;
  voiceListening: string;
  imageUploadTitle: string;
  medicalConsentTitle: string;
  medicalConsentDesc: string;
  locationConsentTitle: string;
  submitButtonText: string;
  analyzingText: string;
  disclaimerText: string;
  privacyNotice: string;
  clearDataBtn: string;
  // Phase 2 additions
  trustTraceBtn: string;
  contradictionsTitle: string;
  freshnessTitle: string;
  timelineTitle: string;
  addSubReportBtn: string;
  resetDemosBtn: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'SahaaySetu',
    tagline: 'The AI Crisis-to-Action Bridge',
    navDashboard: 'Situation Dashboard',
    navSubmit: 'Incident Studio',
    navReview: 'Review Facts',
    navActions: 'Action Plan',
    navExplorer: 'Incident Records',
    navSettings: 'Settings & Privacy',
    ctaAnalyze: 'Analyze a Situation',
    ctaDemoPresets: 'Try Demo Scenarios',
    urgencyCritical: 'CRITICAL',
    urgencyHigh: 'HIGH',
    urgencyMedium: 'MEDIUM',
    urgencyLow: 'LOW',
    badgeUserReported: 'USER-REPORTED',
    badgeSourceVerified: 'SOURCE-VERIFIED',
    badgeAiInferred: 'AI-INFERRED',
    badgeUnverified: 'UNVERIFIED',
    evidenceChainTitle: 'Evidence-to-Action Chain',
    evidenceChainDesc: 'Audit what was reported by citizens vs inferred by AI vs verified by official bulletins.',
    actionsTitle: 'Prioritized Action Plan',
    hazardsTitle: 'Identified Hazards & Precautions',
    factsTitle: 'Extracted Verified & Reported Facts',
    uncertaintiesTitle: 'Information Gaps & Conflicts',
    responderBriefBtn: 'Generate Responder Brief',
    callEmergencyBtn: 'Emergency Helplines',
    voiceInputBtn: 'Record Voice Note',
    voiceListening: 'Listening to your voice...',
    imageUploadTitle: 'Attach Scene Photo (Optional)',
    medicalConsentTitle: 'Consented Medical Context (Optional)',
    medicalConsentDesc: 'I explicitly consent to sharing relevant health history strictly for conservative scene stabilization.',
    locationConsentTitle: 'Share Approximate Incident Location',
    submitButtonText: 'Run AI Crisis Analysis',
    analyzingText: 'Gemini AI is analyzing facts, hazards, and next steps...',
    disclaimerText: 'SahaaySetu is an AI-assisted coordination bridge. For life emergencies, immediately call 112 / 911. It does not replace emergency dispatch or medical professionals.',
    privacyNotice: 'Your raw voice audio and photos are processed in memory and never permanently stored.',
    clearDataBtn: 'Clear Local Session Data',
    trustTraceBtn: 'Inspect Trust Trace',
    contradictionsTitle: 'Detected Contradictions',
    freshnessTitle: 'Information Freshness',
    timelineTitle: 'Evidence Timeline',
    addSubReportBtn: 'Submit Additional Evidence',
    resetDemosBtn: 'Reset Demo Scenarios'
  },
  hi: {
    appName: 'सहायसेतु (SahaaySetu)',
    tagline: 'आपदा से त्वरित कार्रवाई सेतु',
    navDashboard: 'स्थिति डैशबोर्ड',
    navSubmit: 'घटना स्टूडियो',
    navReview: 'तथ्य समीक्षा',
    navActions: 'कार्य योजना',
    navExplorer: 'घटना रिकॉर्ड्स',
    navSettings: 'सेटिंग्स व गोपनीयता',
    ctaAnalyze: 'नई स्थिति का विश्लेषण करें',
    ctaDemoPresets: 'डेमो परिदृश्य देखें',
    urgencyCritical: 'गंभीर (CRITICAL)',
    urgencyHigh: 'उच्च (HIGH)',
    urgencyMedium: 'मध्यम (MEDIUM)',
    urgencyLow: 'निम्न (LOW)',
    badgeUserReported: 'नागरिक-सूचित (USER-REPORTED)',
    badgeSourceVerified: 'स्रोत-सत्यापित (SOURCE-VERIFIED)',
    badgeAiInferred: 'एआई-अनुमानित (AI-INFERRED)',
    badgeUnverified: 'असत्यापित (UNVERIFIED)',
    evidenceChainTitle: 'साक्ष्य-से-कार्रवाई श्रृंखला',
    evidenceChainDesc: 'नागरिक सूचना, एआई अनुमान और आधिकारिक बुलेटिन के बीच स्पष्ट अंतर देखें।',
    actionsTitle: 'प्राथमिकता वाली कार्य योजना',
    hazardsTitle: 'पहचाने गए खतरे और सावधानियां',
    factsTitle: 'प्राप्त तथ्य एवं जानकारी',
    uncertaintiesTitle: 'अधूरी या विरोधाभासी जानकारी',
    responderBriefBtn: 'रेस्पॉन्डर ब्रीफ तैयार करें',
    callEmergencyBtn: 'आपातकालीन हेल्पलाइन',
    voiceInputBtn: 'ध्वनि रिकॉर्ड करें',
    voiceListening: 'आपकी आवाज सुनी जा रही है...',
    imageUploadTitle: 'घटनास्थल की फोटो संलग्न करें (वैकल्पिक)',
    medicalConsentTitle: 'सहमति-प्राप्त चिकित्सा संदर्भ (वैकल्पिक)',
    medicalConsentDesc: 'मैं केवल प्राथमिक स्थिति नियंत्रण हेतु प्रासंगिक चिकित्सा संदर्भ साझा करने की स्पष्ट सहमति देता/देती हूँ।',
    locationConsentTitle: 'अनुमानित स्थान साझा करें',
    submitButtonText: 'एआई विश्लेषण शुरू करें',
    analyzingText: 'जेमिनी एआई स्थिति, खतरों व आवश्यक कदमों का विश्लेषण कर रहा है...',
    disclaimerText: 'सहायसेतु एक एआई-सहायक समन्वय प्रणाली है। जानलेवा आपात स्थिति में तुरंत 112 पर कॉल करें। यह डॉक्टरों या आपातकालीन सेवाओं का विकल्प नहीं है।',
    privacyNotice: 'आपकी आवाज और फोटो केवल मेमोरी में प्रोसेस की जाती हैं और सुरक्षित रखी जाती हैं।',
    clearDataBtn: 'सत्र डेटा साफ़ करें',
    trustTraceBtn: 'ट्रस्ट ट्रेस देखें',
    contradictionsTitle: 'पहचाने गए विरोधाभास',
    freshnessTitle: 'जानकारी की ताजगी',
    timelineTitle: 'साक्ष्य समयरेखा',
    addSubReportBtn: 'अतिरिक्त साक्ष्य जोड़ें',
    resetDemosBtn: 'डेमो परिदृश्य रीसेट करें'
  }
};
