import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('API Integration Tests', () => {
  it('GET /api/health returns 200 and valid service metadata', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.application).toContain('SahaaySetu');
    expect(typeof res.body.geminiConfigured).toBe('boolean');
  });

  it('GET /api/incidents returns pre-seeded demo incidents', async () => {
    const res = await request(app).get('/api/incidents');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.incidents)).toBe(true);
    expect(res.body.incidents.length).toBeGreaterThan(0);
  });

  it('POST /api/incidents/analyze accepts valid crisis input and produces structured record', async () => {
    const payload = {
      text: 'Heavy tree fallen on 11kV live power cable across MG Road. Sparking visible near auto stand.',
      consentGivenForLocation: true,
      consentGivenForMedical: false,
      languagePreference: 'en'
    };

    const res = await request(app)
      .post('/api/incidents/analyze')
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.incident).toBeDefined();
    expect(res.body.incident.id).toBeDefined();
    expect(res.body.incident.userReportedFacts.length).toBeGreaterThan(0);
    expect(res.body.incident.potentialHazards.length).toBeGreaterThan(0);
    expect(res.body.incident.recommendedActions.length).toBeGreaterThan(0);
    expect(res.body.incident.urgencyScore).toBeGreaterThanOrEqual(50);
  });

  it('POST /api/incidents/analyze rejects malformed empty input with 400', async () => {
    const emptyPayload = {
      text: '',
      speechTranscript: '',
      pastedReport: '',
      consentGivenForLocation: false
    };

    const res = await request(app)
      .post('/api/incidents/analyze')
      .send(emptyPayload);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/incidents/:id/brief exports sanitized responder brief', async () => {
    // List incidents to get an existing ID
    const listRes = await request(app).get('/api/incidents');
    const targetId = listRes.body.incidents[0].id;

    const briefRes = await request(app)
      .post(`/api/incidents/${targetId}/brief`)
      .send({ scrubMedical: true, scrubLocation: false });

    expect(briefRes.status).toBe(200);
    expect(briefRes.body.success).toBe(true);
    expect(briefRes.body.brief.incidentId).toBe(targetId);
    expect(briefRes.body.brief.topActionPriorities.length).toBeGreaterThan(0);
  });

  it('POST /api/incidents/clear-all successfully clears user created records', async () => {
    const clearRes = await request(app).post('/api/incidents/clear-all');
    expect(clearRes.status).toBe(200);
    expect(clearRes.body.success).toBe(true);
  });
});
