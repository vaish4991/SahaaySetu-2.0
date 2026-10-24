import { describe, it, expect } from 'vitest';
import { calculateUrgency } from '../services/prioritization';

describe('Urgency Prioritization Engine', () => {
  it('assigns CRITICAL priority for direct life safety and trapped victims', () => {
    const result = calculateUrgency({
      text: 'Multi-car pileup, two victims trapped inside vehicle, fuel leak on asphalt',
      category: 'TRAFFIC_ACCIDENT',
      hasCasualtiesOrTrapped: true
    });
    expect(result.urgencyLevel).toBe('CRITICAL');
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.contributingFactors.some(f => f.includes('Direct life safety'))).toBe(true);
  });

  it('assigns HIGH priority for severe waterlogging and electrical sparking', () => {
    const result = calculateUrgency({
      text: 'Waterlogging in underpass reaching 4 feet, sparking electrical box nearby',
      category: 'NATURAL_DISASTER',
      hasFireOrElectricalHazard: true
    });
    expect(['HIGH', 'CRITICAL']).toContain(result.urgencyLevel);
    expect(result.score).toBeGreaterThanOrEqual(60);
  });

  it('penalizes unverified viral social media forwards', () => {
    const unverifiedResult = calculateUrgency({
      text: 'Forwarded WhatsApp rumor about tsunami hitting coast in 10 minutes',
      category: 'PUBLIC_SAFETY',
      isUnverifiedSource: true
    });
    const verifiedResult = calculateUrgency({
      text: 'Official IMD emergency bulletin for coastal storm surge',
      category: 'PUBLIC_SAFETY',
      isUnverifiedSource: false
    });
    expect(unverifiedResult.score).toBeLessThan(verifiedResult.score);
    expect(unverifiedResult.contributingFactors.some(f => f.includes('Unverified external social media forward'))).toBe(true);
  });

  it('bounds priority scores between 10 and 100', () => {
    const lowResult = calculateUrgency({
      text: 'Minor street puddle from light drizzle'
    });
    expect(lowResult.score).toBeGreaterThanOrEqual(10);
    expect(lowResult.score).toBeLessThanOrEqual(100);
  });
});
