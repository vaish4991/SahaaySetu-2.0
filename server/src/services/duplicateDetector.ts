import { DuplicateSuggestion, IncidentRecord } from '@sahaaysetu/shared';

function tokenize(text: string): Set<string> {
  const words = (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3);
  return new Set(words);
}

function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersectionSize = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionSize++;
    }
  }
  const unionSize = new Set([...setA, ...setB]).size;
  return unionSize > 0 ? intersectionSize / unionSize : 0;
}

/**
 * Checks existing incident records and returns possible duplicate suggestions with explainable similarity scores.
 */
export function findPossibleDuplicates(
  currentTitle: string,
  currentSummary: string,
  currentLocation: string,
  existingIncidents: IncidentRecord[]
): DuplicateSuggestion[] {
  const currentTokens = tokenize(`${currentTitle} ${currentSummary} ${currentLocation}`);
  const currentLocationTokens = tokenize(currentLocation);
  const suggestions: DuplicateSuggestion[] = [];

  for (const existing of existingIncidents) {
    const existingTokens = tokenize(`${existing.title} ${existing.situationSummary} ${existing.location.rawText}`);
    const existingLocationTokens = tokenize(existing.location.rawText);

    const textSim = calculateJaccardSimilarity(currentTokens, existingTokens);
    const locSim = calculateJaccardSimilarity(currentLocationTokens, existingLocationTokens);

    // Weighted composite similarity
    const compositeScore = (textSim * 0.6) + (locSim * 0.4);

    if (compositeScore >= 0.35) {
      let reason = `Shared key vocabulary (${Math.round(textSim * 100)}% keyword overlap)`;
      if (locSim > 0.4) {
        reason += ` and similar reported location (${existing.location.rawText})`;
      }
      suggestions.push({
        matchedIncidentId: existing.id,
        title: existing.title,
        similarityScore: Math.min(0.98, Math.round(compositeScore * 100) / 100),
        reason
      });
    }
  }

  // Sort descending by similarity
  return suggestions.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, 3);
}
