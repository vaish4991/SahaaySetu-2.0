import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EvidenceBadge } from '../components/EvidenceBadge';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { EmergencyContactsBar } from '../components/EmergencyContactsBar';
import { ActionCenter } from '../pages/ActionCenter';
import { SubmitIncident } from '../pages/SubmitIncident';
import { IncidentExplorer } from '../pages/IncidentExplorer';
import { IncidentRecord } from '@sahaaysetu/shared';

describe('UI Component Tests', () => {
  it('EvidenceBadge renders all 4 evidence statuses with accessible roles', () => {
    const { rerender } = render(<EvidenceBadge label="USER-REPORTED" />);
    expect(screen.getByRole('status')).toHaveTextContent('USER-REPORTED');

    rerender(<EvidenceBadge label="SOURCE-VERIFIED" />);
    expect(screen.getByRole('status')).toHaveTextContent('SOURCE-VERIFIED');

    rerender(<EvidenceBadge label="AI-INFERRED" />);
    expect(screen.getByRole('status')).toHaveTextContent('AI-INFERRED');

    rerender(<EvidenceBadge label="UNVERIFIED" />);
    expect(screen.getByRole('status')).toHaveTextContent('UNVERIFIED');
  });

  it('UrgencyBadge renders urgency level and transparent score', () => {
    render(<UrgencyBadge urgency="CRITICAL" score={92} />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('CRITICAL');
    expect(badge).toHaveTextContent('(92/100)');
  });

  it('EmergencyContactsBar renders essential helplines (112, 108, 101)', () => {
    render(<EmergencyContactsBar />);
    expect(screen.getByText('112')).toBeInTheDocument();
    expect(screen.getByText('108')).toBeInTheDocument();
    expect(screen.getByText('101')).toBeInTheDocument();
  });

  it('ActionCenter displays prioritized actions and allows toggling completion', () => {
    const mockIncident: IncidentRecord = {
      id: 'inc-test-1',
      category: 'TRAFFIC_ACCIDENT',
      title: 'Highway accident',
      situationSummary: 'Collision between two cars',
      userReportedFacts: [],
      location: { rawText: 'Expressway', confidence: 'EXACT', userConfirmed: true },
      estimatedUrgency: 'HIGH',
      urgencyExplanation: 'Active hazard on roadway',
      urgencyScore: 78,
      potentialHazards: [],
      peopleAffected: { vulnerableGroups: [] },
      uncertainties: [],
      recommendedActions: [
        {
          id: 'act-1',
          stepNumber: 1,
          title: 'Establish safety perimeter',
          description: 'Place warning signs 50m behind vehicles',
          priority: 'IMMEDIATE',
          safetyPrecautions: 'Do not walk into traffic',
          rationale: 'Prevent pileup',
          evidenceLabel: 'AI-INFERRED',
          requiresConfirmation: false,
          isCompleted: false,
          hasUnresolvedConflict: false
        }
      ],
      evidenceReferences: [],
      subReports: [],
      contradictions: [],
      confirmations: [],
      timelineEvents: [],
      freshness: {
        status: 'CURRENT',
        ageMinutes: 0,
        ageFormatted: 'Just submitted',
        thresholdMinutes: 30
      },
      verificationStatus: 'REQUIRES_HUMAN_REVIEW',
      lifecycleStatus: 'ANALYZED',
      possibleDuplicates: [],
      medicalContextIncluded: false,
      medicalContextConsentGiven: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      language: 'en',
      isDemoScenario: false,
      disclaimer: ''
    };

    const mockUpdate = vi.fn();
    const mockBack = vi.fn();
    const mockBrief = vi.fn();

    render(
      <ActionCenter
        incident={mockIncident}
        onUpdateIncident={mockUpdate}
        onBackToReview={mockBack}
        onOpenBrief={mockBrief}
        language="en"
      />
    );

    expect(screen.getByText('Establish safety perimeter')).toBeInTheDocument();
    expect(screen.getByText('IMMEDIATE PRIORITY')).toBeInTheDocument();
    expect(screen.getByText(/0 of 1 Completed/i)).toBeInTheDocument();

    const toggleBtn = screen.getByRole('button', { name: /Mark step 1 complete/i });
    fireEvent.click(toggleBtn);
  });

  it('SubmitIncident renders all 6 unstructured real-world input presets and unlocks medical context on focus', () => {
    const mockSuccess = vi.fn();

    render(
      <SubmitIncident
        onAnalysisSuccess={mockSuccess}
        language="en"
      />
    );

    expect(screen.getByText('Panicked Voice Note')).toBeInTheDocument();
    expect(screen.getByText('Highway Traffic & Fuel Spill')).toBeInTheDocument();
    expect(screen.getByText('Severe Weather & Live Wire')).toBeInTheDocument();
    expect(screen.getByText('Breaking News & Viral Forward')).toBeInTheDocument();
    expect(screen.getByText('Eyewitness Scene Damage Photo')).toBeInTheDocument();
    expect(screen.getByText('Messy Medical History Stack')).toBeInTheDocument();

    // Verify medical context can be unlocked without disabled/non-clickable blocks
    const unlockBtn = screen.getByRole('button', { name: /Click to Unlock Consent/i });
    fireEvent.click(unlockBtn);
    expect(screen.getByText(/Consent Active/i)).toBeInTheDocument();
  });

  it('IncidentExplorer filters records by search query and category', () => {
    const mockIncidents: IncidentRecord[] = [
      {
        id: 'inc-1',
        category: 'NATURAL_DISASTER',
        title: 'Flash Flood in City',
        situationSummary: 'Water levels rising rapidly on main avenue',
        userReportedFacts: [],
        location: { rawText: 'City Center', confidence: 'EXACT', userConfirmed: true },
        estimatedUrgency: 'CRITICAL',
        urgencyExplanation: 'Life safety risk',
        urgencyScore: 90,
        potentialHazards: [],
        peopleAffected: { vulnerableGroups: [] },
        uncertainties: [],
        recommendedActions: [],
        evidenceReferences: [],
        subReports: [],
        contradictions: [],
        confirmations: [],
        timelineEvents: [],
        freshness: {
          status: 'CURRENT',
          ageMinutes: 0,
          ageFormatted: 'Just submitted',
          thresholdMinutes: 30
        },
        verificationStatus: 'REQUIRES_HUMAN_REVIEW',
        lifecycleStatus: 'ANALYZED',
        possibleDuplicates: [],
        medicalContextIncluded: false,
        medicalContextConsentGiven: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        language: 'en',
        isDemoScenario: false,
        disclaimer: ''
      },
      {
        id: 'inc-2',
        category: 'TRAFFIC_ACCIDENT',
        title: 'Expressway Multi-Car Crash',
        situationSummary: 'Three vehicles collided in foggy conditions',
        userReportedFacts: [],
        location: { rawText: 'Highway Mile 12', confidence: 'EXACT', userConfirmed: true },
        estimatedUrgency: 'HIGH',
        urgencyExplanation: 'Traffic blocked',
        urgencyScore: 75,
        potentialHazards: [],
        peopleAffected: { vulnerableGroups: [] },
        uncertainties: [],
        recommendedActions: [],
        evidenceReferences: [],
        subReports: [],
        contradictions: [],
        confirmations: [],
        timelineEvents: [],
        freshness: {
          status: 'CURRENT',
          ageMinutes: 0,
          ageFormatted: 'Just submitted',
          thresholdMinutes: 30
        },
        verificationStatus: 'REQUIRES_HUMAN_REVIEW',
        lifecycleStatus: 'ANALYZED',
        possibleDuplicates: [],
        medicalContextIncluded: false,
        medicalContextConsentGiven: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        language: 'en',
        isDemoScenario: false,
        disclaimer: ''
      }
    ];

    const mockSelect = vi.fn();
    const mockBrief = vi.fn();

    render(
      <IncidentExplorer
        incidents={mockIncidents}
        onSelectIncident={mockSelect}
        onOpenBrief={mockBrief}
        language="en"
      />
    );

    expect(screen.getByText('Flash Flood in City')).toBeInTheDocument();
    expect(screen.getByText('Expressway Multi-Car Crash')).toBeInTheDocument();

    // Search query test
    const searchInput = screen.getByLabelText(/Search incident records/i);
    fireEvent.change(searchInput, { target: { value: 'Flood' } });

    expect(screen.getByText('Flash Flood in City')).toBeInTheDocument();
    expect(screen.queryByText('Expressway Multi-Car Crash')).not.toBeInTheDocument();
  });
});
