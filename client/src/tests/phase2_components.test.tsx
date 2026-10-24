import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EvidenceTimeline } from '../components/EvidenceTimeline';
import { FreshnessBadge } from '../components/FreshnessBadge';
import { ContradictionReviewCard } from '../components/ContradictionReviewCard';
import { TimelineEvent, ContradictionItem } from '@sahaaysetu/shared';

describe('Phase 2 UI Component Tests', () => {
  it('FreshnessBadge renders CURRENT, AGING, STALE, and UNKNOWN with proper accessibility attributes', () => {
    const { rerender } = render(
      <FreshnessBadge
        status="CURRENT"
        ageFormatted="Just now"
        warning="All good"
      />
    );
    const badge = screen.getByRole('status');
    expect(badge).toHaveTextContent('CURRENT');
    expect(badge).toHaveTextContent('Just now');

    rerender(
      <FreshnessBadge
        status="STALE"
        ageFormatted="95 mins ago"
        warning="Evidence exceeds freshness window"
      />
    );
    expect(screen.getByRole('status')).toHaveTextContent('STALE');
    expect(screen.getByRole('status')).toHaveTextContent('95 mins ago');

    rerender(
      <FreshnessBadge
        status="UNKNOWN"
        warning="Event time unknown"
      />
    );
    expect(screen.getByRole('status')).toHaveTextContent('UNKNOWN');
  });

  it('EvidenceTimeline renders chronological items, distinguishes event time from submission time, and supports keyboard navigation', () => {
    const events: TimelineEvent[] = [
      {
        id: 'evt-1',
        eventType: 'REPORT_SUBMITTED',
        title: 'Initial Citizen Eyewitness Report',
        description: 'Bystander reports fallen electric pole blocking intersection',
        timestamp: '2026-10-23T05:00:00Z',
        displayTime: '10:30 AM',
        isEventTimeUnknown: false,
        sourceName: 'Citizen Eyewitness (Ankit)',
        statusBadge: 'USER-REPORTED'
      },
      {
        id: 'evt-2',
        eventType: 'CONTRADICTION_DETECTED',
        title: 'Active Disagreement Flagged: Road Passability',
        description: 'Report from driver asserts intersection is clear, conflicting with wire hazard',
        timestamp: '2026-10-23T05:10:00Z',
        displayTime: '10:40 AM',
        isEventTimeUnknown: true, // Unknown event time test!
        sourceName: 'Automated Discrepancy Analyzer',
        statusBadge: 'UNRESOLVED CONFLICT'
      }
    ];

    const onSelectEvent = vi.fn();

    render(
      <EvidenceTimeline
        events={events}
        onSelectEvent={onSelectEvent}
      />
    );

    // Timeline header
    expect(screen.getByText('Chronological Evidence Timeline')).toBeInTheDocument();

    // Distinguishes unknown event time
    expect(screen.getByText(/Unknown \(Not provided by eyewitness\)/i)).toBeInTheDocument();

    // Renders event titles
    expect(screen.getByText('Initial Citizen Eyewitness Report')).toBeInTheDocument();
    expect(screen.getByText('Active Disagreement Flagged: Road Passability')).toBeInTheDocument();

    // Interactive button with accessibility
    const itemButton = screen.getByText('Initial Citizen Eyewitness Report').closest('div[role="button"]');
    expect(itemButton).not.toBeNull();

    // Keyboard trigger
    fireEvent.click(itemButton!);
    expect(onSelectEvent).toHaveBeenCalledWith(events[0]);
  });

  it('ContradictionReviewCard renders side-by-side claims, verification statuses, and resolution modal trigger', () => {
    const contradiction: ContradictionItem = {
      id: 'contra-test-1',
      topic: 'Road Passability & Access',
      explanation: 'Reports disagree on whether Milan subway is passable or submerged under 4 feet of water.',
      claimA: {
        id: 'cl-a',
        claimText: 'Subway is clear and open! Drove through 2 minutes ago, water is barely tire deep.',
        sourceName: 'Motorist Voice Note',
        submittedAt: '2026-10-23T05:00:00Z',
        eventObservedAt: '2026-10-23T04:58:00Z',
        location: 'Milan Subway Underpass',
        verificationStatus: 'USER-REPORTED'
      },
      claimB: {
        id: 'cl-b',
        claimText: 'Subway is TOTALLY BLOCKED and submerged under 4 feet of water. Hatchback engine drowned.',
        sourceName: 'Shopkeeper with Photo',
        submittedAt: '2026-10-23T05:06:00Z',
        eventObservedAt: '2026-10-23T05:05:00Z',
        location: 'Milan Subway Underpass',
        verificationStatus: 'USER-REPORTED'
      },
      isResolved: false,
      severity: 'HIGH'
    };

    const onResolve = vi.fn();

    render(
      <ContradictionReviewCard
        contradiction={contradiction}
        onResolve={onResolve}
      />
    );

    expect(screen.getByText(/Contradiction Alert: Road Passability & Access/i)).toBeInTheDocument();
    expect(screen.getByText('UNRESOLVED CONFLICT')).toBeInTheDocument();

    // Check side-by-side claims
    expect(screen.getByText(/Subway is clear and open!/i)).toBeInTheDocument();
    expect(screen.getByText(/Subway is TOTALLY BLOCKED/i)).toBeInTheDocument();

    // Click Resolve button opens form
    const resolveBtn = screen.getByRole('button', { name: /Record Reviewed Resolution/i });
    expect(resolveBtn).toBeInTheDocument();
    fireEvent.click(resolveBtn);

    // Resolution section is now expanded
    expect(screen.getByText('Which claim is accepted or synthesized?')).toBeInTheDocument();
  });
});
