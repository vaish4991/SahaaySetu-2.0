import { describe, it, expect } from 'vitest';
import { calculateUrgency } from '../services/prioritization';

describe('Evidence-Aware Urgency Prioritization (Phase 2)', () => {
  it('applies cautionary urgency buffer when unresolved contradictions exist', () => {
    const baseResult = calculateUrgency({
      text: 'Bridge supports have sustained structural damage from flash flood',
      category: 'INFRASTRUCTURE_FAILURE',
      hasUnresolvedContradictions: false
    });

    const contradictedResult = calculateUrgency({
      text: 'Bridge supports have sustained structural damage from flash flood',
      category: 'INFRASTRUCTURE_FAILURE',
      hasUnresolvedContradictions: true
    });

    // Unresolved contradictions must increase the caution/urgency buffer
    expect(contradictedResult.score).toBeGreaterThan(baseResult.score);
    expect(contradictedResult.contributingFactors.some(f => f.includes('Unresolved contradictory reports'))).toBe(true);
  });

  it('reflects stale information status in contributing factors without assuming safety', () => {
    const staleResult = calculateUrgency({
      text: 'Water level rising near low-lying settlement, submerged road and power lines',
      category: 'NATURAL_DISASTER',
      freshnessStatus: 'STALE'
    });

    expect(staleResult.contributingFactors.some(f => f.includes('Information freshness is STALE'))).toBe(true);
    // Even if stale, it must NOT infer safety or demote urgency to LOW without confirmation
    expect(staleResult.urgencyLevel).not.toBe('LOW');
  });

  it('keeps deterministic safety rules separate from AI suggestions (no claim of dispatch)', () => {
    const result = calculateUrgency({
      text: 'Critical chemical gas leak near elementary school, two victims trapped inside',
      category: 'PUBLIC_SAFETY',
      hasCasualtiesOrTrapped: true,
      hasFireOrElectricalHazard: true
    });

    expect(result.urgencyLevel).toBe('CRITICAL');
    expect(result.score).toBeGreaterThanOrEqual(80);
    // Explicitly avoids claiming physical response has arrived
    expect(result.contributingFactors.every(f => !f.toLowerCase().includes('en route'))).toBe(true);
  });
});
