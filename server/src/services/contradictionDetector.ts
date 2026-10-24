import {
  IncidentSubReport,
  ContradictionItem,
  ContradictionResolution,
  EvidenceLabel
} from '@sahaaysetu/shared';

// Semantic Oppositions for Crisis Domains
const CONTRADICTION_PAIRS = [
  {
    topic: 'Road Passability & Access',
    groupPositive: ['passable', 'clear', 'open', 'flowing', 'cars moving', 'dry', 'no water', 'navigable'],
    groupNegative: ['blocked', 'submerged', 'flooded', 'closed', 'impassable', 'underwater', 'stalled', 'drowned', 'choked'],
    severity: 'HIGH' as const
  },
  {
    topic: 'Structural Integrity & Collapse',
    groupPositive: ['intact', 'minor damage', 'safe', 'no structural damage', 'standing firm', 'cosmetic'],
    groupNegative: ['collapsed', 'slab gave way', 'ceiling fell', 'cracking', 'debris', 'compromised', 'falling down'],
    severity: 'HIGH' as const
  },
  {
    topic: 'Casualties & Trapped Occupants',
    groupPositive: ['no injuries', 'zero casualties', 'everyone evacuated', 'all safe', 'unhurt', 'empty'],
    groupNegative: ['trapped', 'fatalities', 'casualties', 'crushed', 'unconscious', 'screaming inside', 'buried'],
    severity: 'HIGH' as const
  },
  {
    topic: 'Emergency Release & Evacuation Mandate',
    groupPositive: ['gates closed', 'safe level', 'normal capacity', 'no evacuation', 'disregard rumor', 'calm'],
    groupNegative: ['dam breach', 'dam cracked', 'gates opened', 'evacuate immediately', 'run inland', 'wall broke'],
    severity: 'HIGH' as const
  }
];

function extractWords(text: string): Set<string> {
  return new Set(
    (text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2)
  );
}

/**
 * Checks whether two locations are distinctly different locations (e.g. Bandra vs Khandala).
 * If locations are completely distinct without landmark overlap, differences are NOT contradictions.
 */
function areLocationsDistinct(locA?: string, locB?: string): boolean {
  if (!locA || !locB) return false;
  const wordsA = extractWords(locA);
  const wordsB = extractWords(locB);

  // Check for common geographic tokens
  let sharedCount = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) sharedCount++;
  }

  // If no common landmark or area token, they refer to different locations
  return sharedCount === 0;
}

/**
 * Checks whether two timestamps are separated by a significant duration (> 90 minutes).
 * State transitions over time are chronological changes, not contradictions.
 */
function isSeparatedByTime(timeStrA?: string, timeStrB?: string): boolean {
  if (!timeStrA || !timeStrB) return false;
  const timeA = Date.parse(timeStrA);
  const timeB = Date.parse(timeStrB);
  if (isNaN(timeA) || isNaN(timeB)) return false;

  const diffMinutes = Math.abs(timeA - timeB) / (60 * 1000);
  return diffMinutes > 90; // Over 90 mins apart represents chronological evolution
}

function matchesTerm(text: string, term: string): boolean {
  if (term === 'passable') {
    // Avoid false positive on "impassable"
    return /\bpassable\b/i.test(text.replace(/\bimpassable\b/gi, ''));
  }
  return text.includes(term);
}

/**
 * Detects genuine semantic contradictions across sub-reports or primary claims.
 * Adheres strictly to spatio-temporal filtering: does not treat differing locations or times as contradictions.
 */
export function detectContradictions(reports: IncidentSubReport[]): ContradictionItem[] {
  if (!reports || reports.length < 2) return [];

  const contradictions: ContradictionItem[] = [];

  for (let i = 0; i < reports.length; i++) {
    for (let j = i + 1; j < reports.length; j++) {
      const repA = reports[i];
      const repB = reports[j];

      // 1. Spatio-temporal filtering:
      // If reports clearly describe different locations, skip!
      const locA = repA.locationDescription || (repA as any).location;
      const locB = repB.locationDescription || (repB as any).location;
      if (areLocationsDistinct(locA, locB)) {
        continue;
      }

      // If reports describe observations hours apart, skip!
      const timeA = repA.eventObservedAt || repA.submittedAt;
      const timeB = repB.eventObservedAt || repB.submittedAt;
      if (isSeparatedByTime(timeA, timeB)) {
        continue;
      }

      // 2. Semantic Polarity Check
      const textA = (repA.text || (repA as any).content || '').toLowerCase();
      const textB = (repB.text || (repB as any).content || '').toLowerCase();

      for (const pair of CONTRADICTION_PAIRS) {
        const aHasPos = pair.groupPositive.some(p => matchesTerm(textA, p));
        const aHasNeg = pair.groupNegative.some(p => matchesTerm(textA, p));
        const bHasPos = pair.groupPositive.some(p => matchesTerm(textB, p));
        const bHasNeg = pair.groupNegative.some(p => matchesTerm(textB, p));

        const isAposBneg = aHasPos && !aHasNeg && bHasNeg && !bHasPos;
        const isAnegBpos = aHasNeg && !aHasPos && bHasPos && !bHasNeg;

        if (isAposBneg || isAnegBpos) {
          const contradictionId = `contra-${repA.id}-${repB.id}-${pair.topic.replace(/\s+/g, '-').toLowerCase()}`;

          // Avoid duplicate topic items
          if (!contradictions.some(c => c.topic === pair.topic)) {
            contradictions.push({
              id: contradictionId,
              topic: pair.topic,
              explanation: `Direct disagreement regarding ${pair.topic}. ${repA.sourceName} asserts condition is ${isAposBneg ? 'normal/passable' : 'blocked/severe'}, whereas ${repB.sourceName} asserts condition is ${isAposBneg ? 'blocked/severe' : 'normal/passable'}.`,
              claimA: {
                id: repA.id,
                claimText: repA.text || (repA as any).content || '',
                sourceName: repA.sourceName,
                submittedAt: repA.submittedAt,
                eventObservedAt: repA.eventObservedAt,
                location: locA,
                verificationStatus: repA.verificationStatus
              },
              claimB: {
                id: repB.id,
                claimText: repB.text || (repB as any).content || '',
                sourceName: repB.sourceName,
                submittedAt: repB.submittedAt,
                eventObservedAt: repB.eventObservedAt,
                location: locB,
                verificationStatus: repB.verificationStatus
              },
              isResolved: false,
              severity: pair.severity
            });
          }
        }
      }
    }
  }

  return contradictions;
}

/**
 * Records a verified human resolution for a contradiction without deleting either original claim.
 */
export function resolveContradiction(
  contradiction: ContradictionItem,
  resolution: {
    selectedClaimId?: string;
    acceptedClaimId?: string;
    rationale?: string;
    resolutionRationale?: string;
    reviewedBy?: string;
    resolvedBy?: string;
    resolvedAt?: string;
    additionalEvidenceSubmitted?: string;
  }
): ContradictionItem {
  return {
    ...contradiction,
    isResolved: true,
    resolution: {
      resolvedAt: resolution.resolvedAt || new Date().toISOString(),
      resolvedBy: resolution.resolvedBy || resolution.reviewedBy || 'Authorized Reviewer',
      resolutionRationale: resolution.resolutionRationale || resolution.rationale || '',
      acceptedClaimId: resolution.acceptedClaimId || resolution.selectedClaimId,
      additionalEvidenceSubmitted: resolution.additionalEvidenceSubmitted
    }
  };
}

export const applyContradictionResolution = resolveContradiction;
