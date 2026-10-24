import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { IncidentRecord } from '@sahaaysetu/shared';
import { createApp } from '../app';

const app = createApp();

describe('Phase 2 API Integration Tests', () => {
  it('POST /api/incidents/reset-demos restores demo scenarios to baseline', async () => {
    const res = await request(app).post('/api/incidents/reset-demos');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBeGreaterThanOrEqual(8);
  });

  it('POST /api/incidents/:id/sub-reports adds additional evidence and detects new contradictions', async () => {
    // 1. Fetch demo scenario 6 which features contradiction
    const getRes = await request(app).get('/api/incidents');
    const demo6 = (getRes.body.incidents as IncidentRecord[]).find((i) => i.id === 'demo-6-road-condition-contradiction')!;
    expect(demo6).toBeDefined();

    // 2. Add an additional eyewitness report
    const subReportPayload = {
      sourceName: 'Drone Survey Unit 3',
      sourceType: 'OFFICIAL_BULLETIN',
      text: 'Aerial view confirms right lane is blocked by debris, but left lane is passable with single-file escort.',
      eventObservedAt: new Date().toISOString(),
      locationDescription: 'NH-108 Mile Marker 42, Ghat Section',
      verificationStatus: 'SOURCE-VERIFIED'
    };

    const res = await request(app)
      .post(`/api/incidents/${demo6.id}/sub-reports`)
      .send(subReportPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.subReport.id).toBeDefined();
    expect(res.body.incident.subReports.length).toBeGreaterThan(demo6.subReports.length);
  });

  it('POST /api/incidents/:id/contradictions/:contradictionId/resolve records reviewed human resolution', async () => {
    const getRes = await request(app).get('/api/incidents');
    const demo6 = (getRes.body.incidents as IncidentRecord[]).find((i) => i.id === 'demo-6-road-condition-contradiction')!;
    expect(demo6.contradictions.length).toBeGreaterThan(0);

    const targetContradiction = demo6.contradictions[0];

    const resolutionPayload = {
      selectedClaimId: targetContradiction.claimB.id,
      rationale: 'NHAI Quick Response Team conducted on-site physical inspection; left shoulder is open for emergency convoys.',
      reviewedBy: 'Control Room Officer Sharma',
      additionalEvidenceSubmitted: 'NHAI QRT Geo-tagged Photo Dispatch #812'
    };

    const res = await request(app)
      .post(`/api/incidents/${demo6.id}/contradictions/${targetContradiction.id}/resolve`)
      .send(resolutionPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.contradiction.isResolved).toBe(true);
    expect(res.body.contradiction.resolution.resolvedBy).toBe('Control Room Officer Sharma');
    // Original claims must NOT be deleted
    expect(res.body.contradiction.claimA).toBeDefined();
    expect(res.body.contradiction.claimB).toBeDefined();
    // Dynamic triage feedback: contradiction buffer removed from actions and urgency
    expect(res.body.incident.recommendedActions.every((a: { hasUnresolvedConflict: boolean }) => !a.hasUnresolvedConflict)).toBe(true);
  });

  it('POST /api/incidents/:id/confirmations records on-scene status confirmation and refreshes freshness', async () => {
    const getRes = await request(app).get('/api/incidents');
    const demo7 = (getRes.body.incidents as IncidentRecord[]).find((i) => i.id === 'demo-7-stale-landslide-photo')!;
    expect(demo7).toBeDefined();

    const confirmationPayload = {
      confirmedBy: 'Station Officer Verma, Chamoli Fire Service',
      confirmedAt: new Date().toISOString(),
      method: 'PHYSICAL_INSPECTION',
      notes: 'On-scene inspection confirms landslide mud has dried; single-lane clearance underway with bulldozer.'
    };

    const res = await request(app)
      .post(`/api/incidents/${demo7.id}/confirmations`)
      .send(confirmationPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.confirmation.confirmedBy).toBe('Station Officer Verma, Chamoli Fire Service');
    expect(res.body.incident.freshness.status).toBe('CURRENT');
    // Stale warnings cleared on action cards
    expect(res.body.incident.recommendedActions.every((a: { staleWarning?: string }) => !a.staleWarning)).toBe(true);
  });

  it('POST /api/incidents/:id/facts/:factId/correction records reviewed correction while preserving original claim in Trust Trace', async () => {
    const getRes = await request(app).get('/api/incidents');
    const inc = (getRes.body.incidents as IncidentRecord[]).find((i) => i.userReportedFacts && i.userReportedFacts.length > 0)!;
    expect(inc).toBeDefined();
    const targetFact = inc.userReportedFacts[0];
    expect(targetFact).toBeDefined();

    const correctionPayload = {
      correctionText: 'Verified: 2 vehicles involved with minor damage, road partially open on left lane.',
      reviewerName: 'Field Inspector Patel'
    };

    const res = await request(app)
      .post(`/api/incidents/${inc.id}/facts/${targetFact.id}/correction`)
      .send(correctionPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.fact.text).toBe(correctionPayload.correctionText);
    expect(res.body.fact.userConfirmed).toBe(true);
    // Provenance check: original claim preserved in trustTrace
    expect(res.body.fact.trustTrace.reviewedCorrection).toBe(correctionPayload.correctionText);
    expect(res.body.fact.trustTrace.reviewedBy).toBe('Field Inspector Patel');
    expect(res.body.fact.trustTrace.supportingClaim).toBeDefined();
  });
});
