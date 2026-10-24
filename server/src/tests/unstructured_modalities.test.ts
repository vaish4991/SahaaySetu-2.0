import { describe, it, expect } from 'vitest';
import { analyzeIncident } from '../services/gemini';
import { IncidentInputPayload } from '@sahaaysetu/shared';

describe('Unstructured Real-World Modalities Ingestion & Action Conversion', () => {
  it('instantly converts messy Voice Audio Note into verified life-saving actions', async () => {
    const payload: any = {
      text: 'Bystander calling from highway tunnel in panic.',
      speechTranscript: 'Help please! There is a massive chemical tanker crash right outside Khandala tunnel! Diesel is leaking across both lanes! Thick black smoke in dense fog, cars still speeding in! Two trapped in white hatchback, send ambulances and fire immediately!',
      consentGivenForLocation: true,
      consentGivenForMedical: false,
      languagePreference: 'en'
    };

    const incident = await analyzeIncident(payload);

    expect(incident).toBeDefined();
    expect(incident.category).toBe('TRAFFIC_ACCIDENT');
    expect(incident.urgencyScore).toBeGreaterThanOrEqual(70);
    expect(incident.subReports.some(r => r.sourceType === 'VOICE_TRANSCRIPT')).toBe(true);
    expect(incident.potentialHazards.some(h => h.description.toLowerCase().includes('fuel') || h.description.toLowerCase().includes('spill'))).toBe(true);
    expect(incident.recommendedActions.some(a => a.emergencyServiceContact === '101' || a.emergencyServiceContact === '112')).toBe(true);
  });

  it('instantly converts Traffic Collision & Highway Blockage into upstream warnings & life-saving detours', async () => {
    const payload: any = {
      text: 'Major multi-vehicle collision on Western Express Flyover northbound. Two SUVs and transport tanker collided in center lane. Diesel fuel pouring through expansion joint. 3km traffic queue.',
      pastedReport: 'POLICE CAD DISPATCH #402: Western Express Flyover closed. Fire tenders and hazardous spill unit en route.',
      pastedReportSource: 'Traffic Police Wireless Control Room',
      consentGivenForLocation: true,
      consentGivenForMedical: false,
      languagePreference: 'en'
    };

    const incident = await analyzeIncident(payload);

    expect(incident.category).toBe('TRAFFIC_ACCIDENT');
    expect(incident.potentialHazards.some(h => h.precautions.includes('NO-SMOKING') || h.precautions.includes('upstream'))).toBe(true);
    expect(incident.recommendedActions.some(a => a.title.includes('Fire Rescue') || a.title.includes('Hazard Warning'))).toBe(true);
  });

  it('instantly converts Cyclone & Weather Alert with submerged live wire into power grid cutoff action', async () => {
    const payload: any = {
      text: 'Severe cloudburst and waterlogging in Karve Nagar! Street submerged under 3.5ft water. High-voltage 11kV transformer wire snapped and dropped into standing water near bakery. Sparks shooting from water! Auto-rickshaw with lady and child stranded nearby!',
      consentGivenForLocation: true,
      consentGivenForMedical: false,
      languagePreference: 'en'
    };

    const incident = await analyzeIncident(payload);

    expect(incident.category).toBe('NATURAL_DISASTER');
    expect(incident.potentialHazards.some(h => h.description.toLowerCase().includes('electrocution'))).toBe(true);
    expect(incident.recommendedActions.some(a => a.title.toLowerCase().includes('power') || a.title.toLowerCase().includes('feeder'))).toBe(true);
  });

  it('instantly converts Breaking News & Viral WhatsApp Rumor with rumor mitigation & official verification', async () => {
    const payload: any = {
      text: 'Residents along riverside societies panicking due to viral audio message.',
      pastedReport: 'URGENT FORWARD: Dam gates collapsed! 75,000 cusecs surging towards city! Entire district will submerge in 20 minutes! Evacuate immediately!',
      pastedReportSource: 'Unverified Viral WhatsApp Forward',
      consentGivenForLocation: false,
      consentGivenForMedical: false,
      languagePreference: 'en'
    };

    const incident = await analyzeIncident(payload);

    expect(incident.potentialHazards.some(h => h.description.toLowerCase().includes('panic') || h.description.toLowerCase().includes('disinformation'))).toBe(true);
    expect(incident.userReportedFacts.some(f => f.evidenceLabel === 'UNVERIFIED' || f.evidenceLabel === 'SOURCE-VERIFIED')).toBe(true);
  });

  it('instantly converts Eyewitness Scene Photograph into structural collapse perimeter precautions', async () => {
    const payload: any = {
      text: 'Severe diagonal shear crack across main ground floor support pillar of commercial arcade following morning tremors. Concrete chunks breaking off onto pavement.',
      imageName: 'pillar_structural_fracture.jpg',
      imageMimeType: 'image/jpeg',
      imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
      mediaCapturedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      consentGivenForLocation: true,
      consentGivenForMedical: false,
      languagePreference: 'en'
    };

    const incident = await analyzeIncident(payload);

    expect(incident.subReports.some(r => r.sourceType === 'SCENE_PHOTO')).toBe(true);
    expect(incident.potentialHazards.some(h => h.description.toLowerCase().includes('structural') || h.description.toLowerCase().includes('collapse'))).toBe(true);
  });

  it('instantly converts a Messy Stack of Medical History (EHR / Pacemaker / Diabetes) into life-saving first-aid safeguards', async () => {
    const payload: any = {
      text: 'Elderly individual collapsed suddenly in courtyard. Breathing is shallow and rasping. Not responding to voice or shoulder shake. Pocket contained crumpled clinical sheets.',
      medicalContext: 'Messy Discharge Summary: Ramesh K., 72M. Hx: Severe 3-vessel CAD s/p CABG (2018), Medtronic Dual-Chamber Pacemaker implanted left pectoral pocket (2020), Type 2 Diabetes Mellitus (HbA1c 8.9%), on Insulin Glargine 22u qHS + Metformin 1000mg BID. Chronic Kidney Disease Stage 3. Severe Penicillin anaphylaxis. Current Rx: Clopidogrel 75mg, Atorvastatin 40mg. DO NOT administer fluids by mouth if altered sensorium.',
      consentGivenForMedical: true,
      consentGivenForLocation: true,
      languagePreference: 'en'
    };

    const incident = await analyzeIncident(payload);

    expect(incident.category).toBe('MEDICAL_EMERGENCY');
    expect(incident.urgencyScore).toBeGreaterThanOrEqual(75);
    // Verifies strict medical contraindication warnings
    expect(incident.potentialHazards.some(h => h.precautions.includes('Do NOT administer oral water'))).toBe(true);
    // Verifies pacemaker-specific AED precaution
    expect(incident.potentialHazards.some(h => h.precautions.toLowerCase().includes('pacemaker') || h.precautions.includes('AED'))).toBe(true);
    // Verifies penicillin allergy safeguard
    expect(incident.potentialHazards.some(h => h.precautions.toLowerCase().includes('allerg'))).toBe(true);
    // Verifies immediate 108 emergency contact
    expect(incident.recommendedActions.some(a => a.emergencyServiceContact === '108')).toBe(true);
  });

  it('instantly converts messy unstructured "fire forest" input into structured wildfire response and life-saving actions', async () => {
    const payload: any = {
      text: 'fire forest',
      consentGivenForLocation: true,
      consentGivenForMedical: false,
      languagePreference: 'en'
    };

    const incident = await analyzeIncident(payload);

    expect(incident.category).toBe('NATURAL_DISASTER');
    expect(incident.title).toBe('Active Wildfire / Forest Fire Emergency');
    expect(incident.urgencyScore).toBeGreaterThanOrEqual(60);
    // Verified hazards: wildfire & smoke (NOT structural collapse!)
    expect(incident.potentialHazards.some(h => h.description.toLowerCase().includes('wildfire') || h.description.toLowerCase().includes('smoke'))).toBe(true);
    expect(incident.potentialHazards.every(h => !h.description.toLowerCase().includes('slab failure'))).toBe(true);
    // Verified life-saving actions: alert forest dept / 101, downwind evacuation, smoke protection
    expect(incident.recommendedActions.some(a => a.emergencyServiceContact === '101' || a.title.toLowerCase().includes('forest'))).toBe(true);
  });

  it('instantly recognizes and provides crisis feedback when ONLY an image is provided without text', async () => {
    const payload: any = {
      text: '',
      speechTranscript: '',
      pastedReport: '',
      imageName: 'sunrise_pillar_shear_fracture.jpg',
      imageMimeType: 'image/jpeg',
      imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
      mediaCapturedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      consentGivenForLocation: true,
      consentGivenForMedical: false,
      languagePreference: 'en'
    };

    const incident = await analyzeIncident(payload);

    expect(incident.category).toBe('INFRASTRUCTURE_FAILURE');
    expect(incident.title).toContain('Structural');
    expect(incident.situationSummary).toContain('Photographic evidence');
    expect(incident.subReports.some(r => r.sourceType === 'SCENE_PHOTO')).toBe(true);
    expect(incident.evidenceReferences.some(e => e.sourceType === 'IMAGE_ANALYSIS')).toBe(true);
    expect(incident.potentialHazards.some(h => h.description.toLowerCase().includes('structural') || h.description.toLowerCase().includes('collapse'))).toBe(true);
    expect(incident.recommendedActions.some(a => a.title.toLowerCase().includes('exclusion') || a.title.toLowerCase().includes('evacuat') || a.title.toLowerCase().includes('structural'))).toBe(true);
  });
});

