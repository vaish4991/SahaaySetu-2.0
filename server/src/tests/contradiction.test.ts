import { describe, it, expect } from 'vitest';
import { detectContradictions, resolveContradiction } from '../services/contradictionDetector';
import { IncidentSubReport, ContradictionItem } from '@sahaaysetu/shared';

describe('Real Contradiction Detection Engine', () => {
  it('detects genuine semantic contradictions on road passability at the same place and time', () => {
    const now = new Date().toISOString();
    const subReports: IncidentSubReport[] = [
      {
        id: 'rep-1',
        sourceName: 'Citizen Eyewitness A',
        sourceType: 'CITIZEN_TEXT',
        text: 'NH-44 is completely blocked near Mile 42 by fallen tree. Total gridlock, completely impassable.',
        submittedAt: now,
        eventObservedAt: now,
        locationDescription: 'NH-44 Mile 42',
        verificationStatus: 'USER-REPORTED',
        isEventTimeUnknown: false
      },
      {
        id: 'rep-2',
        sourceName: 'Driver B',
        sourceType: 'CITIZEN_TEXT',
        text: 'NH-44 is open and clear near Mile 42. Traffic is flowing smoothly, passable for all cars.',
        submittedAt: now,
        eventObservedAt: now,
        locationDescription: 'NH-44 Mile 42',
        verificationStatus: 'USER-REPORTED',
        isEventTimeUnknown: false
      }
    ];

    const contradictions = detectContradictions(subReports);
    expect(contradictions.length).toBeGreaterThanOrEqual(1);
    expect(contradictions[0].topic).toContain('Road Passability');
    expect(contradictions[0].isResolved).toBe(false);
    expect(contradictions[0].claimA.sourceName).toBe('Citizen Eyewitness A');
    expect(contradictions[0].claimB.sourceName).toBe('Driver B');
  });

  it('does NOT flag contradiction when reports describe different geographic locations', () => {
    const now = new Date().toISOString();
    const subReports: IncidentSubReport[] = [
      {
        id: 'rep-1',
        sourceName: 'North Ward Observer',
        sourceType: 'CITIZEN_TEXT',
        text: 'Road blocked completely by water at North Suburb Junction.',
        submittedAt: now,
        eventObservedAt: now,
        locationDescription: 'North Suburb Junction',
        verificationStatus: 'USER-REPORTED',
        isEventTimeUnknown: false
      },
      {
        id: 'rep-2',
        sourceName: 'South Ward Observer',
        sourceType: 'CITIZEN_TEXT',
        text: 'Road clear and passable at South Harbor Overpass.',
        submittedAt: now,
        eventObservedAt: now,
        locationDescription: 'South Harbor Overpass',
        verificationStatus: 'USER-REPORTED',
        isEventTimeUnknown: false
      }
    ];

    const contradictions = detectContradictions(subReports);
    // Distinct locations must NOT be treated as a contradiction
    expect(contradictions.length).toBe(0);
  });

  it('does NOT flag contradiction when reports describe times separated by more than 90 minutes', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const justNow = new Date().toISOString();

    const subReports: IncidentSubReport[] = [
      {
        id: 'rep-1',
        sourceName: 'Early Morning Commuter',
        sourceType: 'CITIZEN_TEXT',
        text: 'Bridge road blocked by fallen timber near Central Valley.',
        submittedAt: threeHoursAgo,
        eventObservedAt: threeHoursAgo,
        locationDescription: 'Central Valley Bridge',
        verificationStatus: 'USER-REPORTED',
        isEventTimeUnknown: false
      },
      {
        id: 'rep-2',
        sourceName: 'Highway Patrol Officer',
        sourceType: 'CITIZEN_TEXT',
        text: 'Central Valley Bridge road cleared and passable now after maintenance work.',
        submittedAt: justNow,
        eventObservedAt: justNow,
        locationDescription: 'Central Valley Bridge',
        verificationStatus: 'SOURCE-VERIFIED',
        isEventTimeUnknown: false
      }
    ];

    const contradictions = detectContradictions(subReports);
    // Chronological change over 3 hours should not be flagged as a simultaneous contradiction
    expect(contradictions.length).toBe(0);
  });

  it('allows user to record reviewed resolution without deleting original claims', () => {
    const item: ContradictionItem = {
      id: 'conflict-test-1',
      topic: 'Structural Collapse Discrepancy',
      explanation: 'Reports disagree on building integrity',
      claimA: {
        id: 'cl-1',
        claimText: 'Building has fully collapsed',
        sourceName: 'Panicked Bystander',
        submittedAt: '2026-10-23T05:00:00Z',
        verificationStatus: 'USER-REPORTED'
      },
      claimB: {
        id: 'cl-2',
        claimText: 'Building is intact with minor facade cracking',
        sourceName: 'Fire Safety Inspector',
        submittedAt: '2026-10-23T05:05:00Z',
        verificationStatus: 'SOURCE-VERIFIED'
      },
      isResolved: false,
      severity: 'HIGH'
    };

    const resolved = resolveContradiction(item, {
      selectedClaimId: 'cl-2',
      rationale: 'Fire safety inspector conducted on-site physical structural survey.',
      reviewedBy: 'Incident Commander Rao',
      additionalEvidenceSubmitted: 'Official inspection memo #402 attached'
    });

    expect(resolved.isResolved).toBe(true);
    expect(resolved.resolution?.acceptedClaimId).toBe('cl-2');
    expect(resolved.resolution?.resolvedBy).toBe('Incident Commander Rao');
    // Original conflicting claims MUST remain intact for transparency
    expect(resolved.claimA.claimText).toBe('Building has fully collapsed');
    expect(resolved.claimB.claimText).toBe('Building is intact with minor facade cracking');
  });
});
