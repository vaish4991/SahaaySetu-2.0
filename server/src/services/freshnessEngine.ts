import {
  IncidentCategory,
  FreshnessStatus,
  FreshnessEvaluation,
  CATEGORY_FRESHNESS_THRESHOLDS
} from '@sahaaysetu/shared';

export interface FreshnessCalculationInput {
  category: IncidentCategory;
  submittedAt?: string | null;
  eventObservedAt?: string | null;
  mediaCapturedAt?: string | null;
  lastConfirmedAt?: string | null;
  referenceNow?: Date; // Injected for deterministic testing
}

/**
 * Deterministic Information Freshness Engine.
 * Evaluates evidence age, verifies category thresholds, flags stale media,
 * and handles invalid, future, or missing timestamps safely.
 */
export function calculateFreshness(input: FreshnessCalculationInput): FreshnessEvaluation {
  const now = input.referenceNow || new Date();
  const thresholds = CATEGORY_FRESHNESS_THRESHOLDS[input.category] || {
    currentMax: 30,
    agingMax: 90
  };

  // 1. Check if we have a valid reference timestamp
  // If lastConfirmedAt is provided and valid, it takes priority as the most recent verification
  // If mediaCapturedAt is provided (e.g. photo), the photo capture age determines visual freshness!
  // Otherwise eventObservedAt or submittedAt is used.
  let effectiveTimeStr: string | null | undefined = null;
  let isMediaGoverned = false;

  if (input.lastConfirmedAt) {
    effectiveTimeStr = input.lastConfirmedAt;
  } else if (input.mediaCapturedAt) {
    effectiveTimeStr = input.mediaCapturedAt;
    isMediaGoverned = true;
  } else if (input.eventObservedAt) {
    effectiveTimeStr = input.eventObservedAt;
  } else if (input.submittedAt) {
    effectiveTimeStr = input.submittedAt;
  }

  // Handle missing timestamps safely
  if (!effectiveTimeStr || typeof effectiveTimeStr !== 'string' || !effectiveTimeStr.trim()) {
    return {
      status: 'UNKNOWN',
      ageMinutes: null,
      ageFormatted: 'Unknown observation timestamp',
      lastConfirmedAt: input.lastConfirmedAt || undefined,
      warning: 'Event observation timestamp was not provided by reporter; cannot infer current scene conditions.',
      thresholdMinutes: thresholds.currentMax
    };
  }

  const effectiveTimeMs = Date.parse(effectiveTimeStr);

  // Handle invalid dates
  if (isNaN(effectiveTimeMs)) {
    return {
      status: 'UNKNOWN',
      ageMinutes: null,
      ageFormatted: 'Invalid date format',
      lastConfirmedAt: input.lastConfirmedAt || undefined,
      warning: `Provided timestamp '${effectiveTimeStr}' is invalid or malformed; treated as unverified age.`,
      thresholdMinutes: thresholds.currentMax
    };
  }

  const diffMs = now.getTime() - effectiveTimeMs;

  // Handle clock skew / future timestamps (allow 2 minutes grace for clock drift)
  if (diffMs < -2 * 60 * 1000) {
    return {
      status: 'UNKNOWN',
      ageMinutes: null,
      ageFormatted: 'Future timestamp detected',
      lastConfirmedAt: input.lastConfirmedAt || undefined,
      warning: 'Timestamp is in the future. Clock skew or invalid metadata detected.',
      thresholdMinutes: thresholds.currentMax
    };
  }

  // Age in minutes (non-negative)
  const ageMinutes = Math.max(0, Math.floor(diffMs / (60 * 1000)));
  const ageFormatted = formatAge(ageMinutes);

  // Determine freshness status based on category thresholds
  let status: FreshnessStatus = 'CURRENT';
  let warning: string | undefined = undefined;

  if (ageMinutes > thresholds.agingMax) {
    status = 'STALE';
    if (isMediaGoverned) {
      warning = `Visual media was captured ${ageFormatted} (exceeds ${thresholds.agingMax}m stale limit for ${input.category}). On-scene conditions may have shifted significantly.`;
    } else {
      warning = `Evidence was observed ${ageFormatted} (exceeds ${thresholds.agingMax}m threshold). Do NOT assume situation remains unchanged or safe.`;
    }
  } else if (ageMinutes > thresholds.currentMax) {
    status = 'AGING';
    warning = `Evidence is ${ageFormatted} (past ${thresholds.currentMax}m current window). Re-confirmation recommended before deploying resources.`;
  } else {
    status = 'CURRENT';
  }

  return {
    status,
    ageMinutes,
    ageFormatted,
    lastConfirmedAt: input.lastConfirmedAt || undefined,
    warning,
    thresholdMinutes: thresholds.currentMax
  };
}

export function formatAge(minutes: number): string {
  if (minutes < 1) return 'Just now (<1m)';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (remainingMins === 0) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  return `${hours}h ${remainingMins}m ago`;
}

export const evaluateFreshness = calculateFreshness;

export function getCategoryFreshnessThreshold(category: IncidentCategory): number {
  return CATEGORY_FRESHNESS_THRESHOLDS[category]?.currentMax || 30;
}
