import { describe, it, expect } from 'vitest';
import { findPossibleDuplicates } from '../services/duplicateDetector';
import { IncidentRecord } from '@sahaaysetu/shared';

describe('Duplicate Incident Detection Algorithm', () => {
  const mockExistingIncidents: IncidentRecord[] = [
    {
      id: 'inc-existing-1',
      category: 'TRAFFIC_ACCIDENT',
      title: 'Crash on Western Express Highway near Bandra',
      situationSummary: 'Overturned commercial truck causing severe traffic jam on highway',
      userReportedFacts: [],
      location: {
        rawText: 'Western Express Highway, Bandra flyover',
        confidence: 'EXACT',
        userConfirmed: true
      },
      estimatedUrgency: 'HIGH',
      urgencyExplanation: '',
      urgencyScore: 75,
      potentialHazards: [],
      peopleAffected: { vulnerableGroups: [] },
      uncertainties: [],
      recommendedActions: [],
      evidenceReferences: [],
      verificationStatus: 'REQUIRES_HUMAN_REVIEW',
      lifecycleStatus: 'ANALYZED',
      possibleDuplicates: [],
      medicalContextIncluded: false,
      medicalContextConsentGiven: false,
      subReports: [],
      contradictions: [],
      confirmations: [],
      timelineEvents: [],
      freshness: {
        status: 'CURRENT',
        ageMinutes: 0,
        ageFormatted: 'Just now',
        thresholdMinutes: 20
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      language: 'en',
      isDemoScenario: false,
      disclaimer: ''
    }
  ];

  it('detects a likely duplicate report from a different bystander', () => {
    const suggestions = findPossibleDuplicates(
      'Truck accident on Western Express Highway',
      'Overturned large truck blocking lanes near Bandra flyover',
      'Western Express Highway Bandra',
      mockExistingIncidents
    );

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].matchedIncidentId).toBe('inc-existing-1');
    expect(suggestions[0].similarityScore).toBeGreaterThanOrEqual(0.35);
  });

  it('does not flag completely unrelated incidents as duplicates', () => {
    const suggestions = findPossibleDuplicates(
      'Fire alarm at residential building',
      'Kitchen smoke detected on 4th floor in Chembur colony',
      'Chembur colony building 12',
      mockExistingIncidents
    );

    expect(suggestions.length).toBe(0);
  });
});
