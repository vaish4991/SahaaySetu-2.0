import { describe, it, expect } from 'vitest';
import { evaluateFreshness, getCategoryFreshnessThreshold } from '../services/freshnessEngine';

describe('Information Freshness Engine', () => {
  it('applies category-specific freshness thresholds', () => {
    expect(getCategoryFreshnessThreshold('NATURAL_DISASTER')).toBe(45);
    expect(getCategoryFreshnessThreshold('TRAFFIC_ACCIDENT')).toBe(20);
    expect(getCategoryFreshnessThreshold('INFRASTRUCTURE_FAILURE')).toBe(30);
    expect(getCategoryFreshnessThreshold('PUBLIC_SAFETY')).toBe(30);
    expect(getCategoryFreshnessThreshold('MEDICAL_EMERGENCY')).toBe(15);
    expect(getCategoryFreshnessThreshold('OTHER')).toBe(30);
  });

  it('marks evidence as CURRENT when observed recently within category threshold', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const evaluation = evaluateFreshness({
      eventObservedAt: fiveMinutesAgo,
      category: 'TRAFFIC_ACCIDENT'
    });

    expect(evaluation.status).toBe('CURRENT');
    expect(evaluation.ageMinutes).toBeLessThanOrEqual(6);
    expect(evaluation.thresholdMinutes).toBe(20);
    expect(evaluation.warning).toBeUndefined();
  });

  it('marks evidence as AGING when approaching the freshness threshold', () => {
    // 25 minutes old for a 20-minute threshold category (TRAFFIC_ACCIDENT)
    const twentyFiveMinutesAgo = new Date(Date.now() - 25 * 60 * 1000).toISOString();
    const evaluation = evaluateFreshness({
      eventObservedAt: twentyFiveMinutesAgo,
      category: 'TRAFFIC_ACCIDENT'
    });

    expect(evaluation.status).toBe('AGING');
    expect(evaluation.warning).toContain('past 20m current window');
  });

  it('marks evidence as STALE when exceeding category threshold', () => {
    // 95 minutes old for a 60-minute aging threshold category (TRAFFIC_ACCIDENT)
    const ninetyFiveMinutesAgo = new Date(Date.now() - 95 * 60 * 1000).toISOString();
    const evaluation = evaluateFreshness({
      eventObservedAt: ninetyFiveMinutesAgo,
      category: 'TRAFFIC_ACCIDENT'
    });

    expect(evaluation.status).toBe('STALE');
    expect(evaluation.warning).toContain('exceeds 60m threshold');
  });

  it('stale media detection: a fresh report containing an old photo is flagged as STALE', () => {
    const now = new Date().toISOString();
    const photoTaken95MinutesAgo = new Date(Date.now() - 95 * 60 * 1000).toISOString();

    const evaluation = evaluateFreshness({
      submittedAt: now,
      mediaCapturedAt: photoTaken95MinutesAgo,
      category: 'TRAFFIC_ACCIDENT'
    });

    // Despite just being submitted, the visual evidence is 95m old (past 60m stale threshold)
    expect(evaluation.status).toBe('STALE');
    expect(evaluation.warning).toContain('Visual media was captured');
  });

  it('handles missing or unknown event timestamps safely without inferring current safety', () => {
    const evaluation = evaluateFreshness({
      category: 'INFRASTRUCTURE_FAILURE'
    });

    expect(evaluation.status).toBe('UNKNOWN');
    expect(evaluation.ageMinutes).toBeNull();
    expect(evaluation.warning).toContain('not provided');
  });

  it('handles invalid date strings safely without crashing', () => {
    const evaluation = evaluateFreshness({
      eventObservedAt: 'invalid-non-iso-date-string-xyz',
      category: 'PUBLIC_SAFETY'
    });

    expect(evaluation.status).toBe('UNKNOWN');
    expect(evaluation.warning).toContain('invalid or malformed');
  });

  it('handles future timestamps gracefully by marking UNKNOWN and warning reviewer', () => {
    const futureTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const evaluation = evaluateFreshness({
      eventObservedAt: futureTime,
      category: 'NATURAL_DISASTER'
    });

    expect(evaluation.status).toBe('UNKNOWN');
    expect(evaluation.warning).toContain('in the future');
  });

  it('resets freshness evaluation when an authorized confirmation is recorded', () => {
    const ninetyMinutesAgo = new Date(Date.now() - 90 * 60 * 1000).toISOString();
    const justConfirmed = new Date().toISOString();

    const evaluation = evaluateFreshness({
      eventObservedAt: ninetyMinutesAgo,
      lastConfirmedAt: justConfirmed,
      category: 'TRAFFIC_ACCIDENT'
    });

    expect(evaluation.status).toBe('CURRENT');
    expect(evaluation.lastConfirmedAt).toBe(justConfirmed);
  });
});
