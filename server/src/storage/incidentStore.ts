import {
  IncidentRecord,
  ResponderBrief,
  ResponderBriefSchema,
  DEMO_SCENARIOS,
  IncidentSubReport,
  ContradictionResolution,
  ConfirmationRecord
} from '@sahaaysetu/shared';
import { analyzeIncident } from '../services/gemini';
import { findPossibleDuplicates } from '../services/duplicateDetector';
import { calculateUrgency } from '../services/prioritization';
import { calculateFreshness } from '../services/freshnessEngine';
import { detectContradictions, applyContradictionResolution } from '../services/contradictionDetector';

class IncidentStore {
  private incidents: Map<string, IncidentRecord> = new Map();
  private initialized = false;

  constructor() {
    this.seedDemoScenarios();
  }

  public async seedDemoScenarios() {
    this.incidents.clear();
    for (const demo of DEMO_SCENARIOS) {
      try {
        const incident = await analyzeIncident(demo.inputPayload as any, true);
        incident.id = demo.id;
        incident.isDemoScenario = true;
        this.incidents.set(incident.id, incident);
      } catch (err) {
        console.error(`Failed to seed demo scenario ${demo.id}:`, err);
      }
    }
    this.initialized = true;
  }

  public getAll(filters?: {
    category?: string;
    urgency?: string;
    search?: string;
  }): IncidentRecord[] {
    let list = Array.from(this.incidents.values());

    if (filters?.category && filters.category !== 'ALL') {
      list = list.filter(inc => inc.category === filters.category);
    }

    if (filters?.urgency && filters.urgency !== 'ALL') {
      list = list.filter(inc => inc.estimatedUrgency === filters.urgency);
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(inc =>
        inc.title.toLowerCase().includes(q) ||
        inc.situationSummary.toLowerCase().includes(q) ||
        inc.location.rawText.toLowerCase().includes(q) ||
        inc.potentialHazards.some(h => h.description.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getById(id: string): IncidentRecord | undefined {
    return this.incidents.get(id);
  }

  public save(record: IncidentRecord): IncidentRecord {
    // Check duplicates against existing incidents
    const duplicates = findPossibleDuplicates(
      record.title,
      record.situationSummary,
      record.location.rawText,
      Array.from(this.incidents.values()).filter(i => i.id !== record.id)
    );
    record.possibleDuplicates = duplicates;

    this.incidents.set(record.id, record);
    return record;
  }

  public update(id: string, updates: Partial<IncidentRecord>): IncidentRecord | null {
    const existing = this.incidents.get(id);
    if (!existing) return null;

    const updated: IncidentRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    // Re-check duplicates if title/location changed
    if (updates.title || updates.location || updates.situationSummary) {
      updated.possibleDuplicates = findPossibleDuplicates(
        updated.title,
        updated.situationSummary,
        updated.location.rawText,
        Array.from(this.incidents.values()).filter(i => i.id !== id)
      );
    }

    this.incidents.set(id, updated);
    return updated;
  }

  public delete(id: string): boolean {
    return this.incidents.delete(id);
  }

  public clearUserData(): number {
    let deletedCount = 0;
    for (const [id, record] of this.incidents.entries()) {
      if (!record.isDemoScenario) {
        this.incidents.delete(id);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  /**
   * Appends an additional sub-report, updates contradictions, freshness, and timeline.
   */
  public addSubReport(id: string, subReport: IncidentSubReport): IncidentRecord | null {
    const inc = this.incidents.get(id);
    if (!inc) return null;

    const subReports = [...(inc.subReports || []), subReport];

    // Re-detect contradictions across all sub-reports
    const contradictions = detectContradictions(subReports);

    // Re-calculate freshness
    const freshness = calculateFreshness({
      category: inc.category,
      submittedAt: inc.createdAt,
      eventObservedAt: subReport.eventObservedAt,
      lastConfirmedAt: inc.confirmations?.[0]?.confirmedAt
    });

    // Re-calculate urgency
    const urgency = calculateUrgency({
      text: `${inc.situationSummary} ${subReports.map(s => s.text).join(' ')}`,
      category: inc.category,
      hasUnresolvedContradictions: contradictions.some(c => !c.isResolved),
      freshnessStatus: freshness.status
    });

    // Add timeline event
    const newTimelineEvent = {
      id: `evt-${subReport.id}`,
      eventType: 'REPORT_SUBMITTED' as const,
      title: `${subReport.sourceName} Update Submitted`,
      description: subReport.text,
      timestamp: subReport.submittedAt,
      displayTime: new Date(subReport.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      eventTime: subReport.eventObservedAt,
      submissionTime: subReport.submittedAt,
      isEventTimeUnknown: subReport.isEventTimeUnknown,
      sourceName: subReport.sourceName,
      evidenceLabel: subReport.verificationStatus,
      statusBadge: subReport.verificationStatus
    };

    const updatedTimeline = [...(inc.timelineEvents || []), newTimelineEvent].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const updated: IncidentRecord = {
      ...inc,
      subReports,
      contradictions,
      freshness,
      estimatedUrgency: urgency.urgencyLevel,
      urgencyExplanation: urgency.explanation,
      urgencyScore: urgency.score,
      timelineEvents: updatedTimeline,
      updatedAt: new Date().toISOString()
    };

    this.incidents.set(id, updated);
    return updated;
  }

  /**
   * Resolves a contradiction without deleting conflicting claims.
   */
  public resolveContradiction(
    id: string,
    contradictionId: string,
    resolution: ContradictionResolution
  ): IncidentRecord | null {
    const inc = this.incidents.get(id);
    if (!inc) return null;

    const updatedContradictions = (inc.contradictions || []).map(c => {
      if (c.id === contradictionId) {
        return applyContradictionResolution(c, resolution);
      }
      return c;
    });

    const hasRemainingUnresolved = updatedContradictions.some(c => !c.isResolved);

    // Re-evaluate actions to update conflict warnings
    const updatedActions = (inc.recommendedActions || []).map(a => ({
      ...a,
      hasUnresolvedConflict: hasRemainingUnresolved,
      conflictWarning: hasRemainingUnresolved ? a.conflictWarning : undefined
    }));

    // Dynamic Triage Recalculation: Remove contradiction buffer if all contradictions resolved
    const subReports = inc.subReports || [];
    const updatedUrgency = calculateUrgency({
      text: `${inc.situationSummary} ${subReports.map(s => s.text).join(' ')}`,
      category: inc.category,
      hasUnresolvedContradictions: hasRemainingUnresolved,
      freshnessStatus: inc.freshness?.status
    });

    // Add resolution timeline event
    const resolutionEvent = {
      id: `evt-res-${Date.now()}`,
      eventType: 'USER_VERIFICATION' as const,
      title: 'Contradiction Formally Resolved',
      description: `Disagreement resolved by ${resolution.resolvedBy}. Rationale: "${resolution.resolutionRationale}".`,
      timestamp: resolution.resolvedAt || new Date().toISOString(),
      displayTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isEventTimeUnknown: false,
      sourceName: resolution.resolvedBy,
      statusBadge: 'RESOLVED'
    };

    const updatedTimeline = [...(inc.timelineEvents || []), resolutionEvent].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const updated: IncidentRecord = {
      ...inc,
      contradictions: updatedContradictions,
      recommendedActions: updatedActions,
      estimatedUrgency: updatedUrgency.urgencyLevel,
      urgencyExplanation: updatedUrgency.explanation,
      urgencyScore: updatedUrgency.score,
      timelineEvents: updatedTimeline,
      updatedAt: new Date().toISOString()
    };

    this.incidents.set(id, updated);
    return updated;
  }

  /**
   * Records a status confirmation and updates freshness.
   */
  public addConfirmation(id: string, confirmation: ConfirmationRecord): IncidentRecord | null {
    const inc = this.incidents.get(id);
    if (!inc) return null;

    const confirmations = [confirmation, ...(inc.confirmations || [])];

    const freshness = calculateFreshness({
      category: inc.category,
      submittedAt: inc.createdAt,
      lastConfirmedAt: confirmation.confirmedAt
    });

    const hasUnresolved = (inc.contradictions || []).some(c => !c.isResolved);
    const subReports = inc.subReports || [];
    const updatedUrgency = calculateUrgency({
      text: `${inc.situationSummary} ${subReports.map(s => s.text).join(' ')}`,
      category: inc.category,
      hasUnresolvedContradictions: hasUnresolved,
      freshnessStatus: freshness.status
    });

    // Clear stale warnings on actions if freshness is restored to CURRENT
    const isStale = freshness.status === 'STALE' || freshness.status === 'UNKNOWN';
    const updatedActions = (inc.recommendedActions || []).map(a => ({
      ...a,
      freshnessStatus: freshness.status,
      staleWarning: isStale ? a.staleWarning : undefined,
      requiresConfirmation: Boolean(a.hasUnresolvedConflict || isStale)
    }));

    const confirmEvent = {
      id: `evt-conf-${Date.now()}`,
      eventType: 'STATUS_CONFIRMED' as const,
      title: `On-Scene Status Re-Confirmed by ${confirmation.source}`,
      description: confirmation.note || `Condition verified as CURRENT at ${confirmation.confirmedAt}.`,
      timestamp: confirmation.confirmedAt,
      displayTime: new Date(confirmation.confirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isEventTimeUnknown: false,
      sourceName: confirmation.source,
      statusBadge: 'CONFIRMED'
    };

    const updatedTimeline = [...(inc.timelineEvents || []), confirmEvent].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const updated: IncidentRecord = {
      ...inc,
      confirmations,
      freshness,
      recommendedActions: updatedActions,
      estimatedUrgency: updatedUrgency.urgencyLevel,
      urgencyExplanation: updatedUrgency.explanation,
      urgencyScore: updatedUrgency.score,
      timelineEvents: updatedTimeline,
      updatedAt: new Date().toISOString()
    };

    this.incidents.set(id, updated);
    return updated;
  }

  /**
   * Records a reviewed correction on a fact while preserving original text and provenance in Trust Trace.
   */
  public correctFact(
    id: string,
    factId: string,
    correctionText: string,
    reviewerName: string
  ): IncidentRecord | null {
    const inc = this.incidents.get(id);
    if (!inc) return null;

    const updatedFacts = inc.userReportedFacts.map(f => {
      if (f.id === factId) {
        return {
          ...f,
          text: correctionText,
          userConfirmed: true,
          trustTrace: {
            targetId: f.id,
            supportingClaim: f.trustTrace?.supportingClaim || f.text, // Preserves original claim!
            sourceName: f.trustTrace?.sourceName || f.sourceReference || 'User Submission',
            sourceType: f.trustTrace?.sourceType || 'USER_TEXT',
            submissionTime: f.trustTrace?.submissionTime || inc.createdAt,
            evidenceLabel: f.evidenceLabel,
            supportExplanation: f.trustTrace?.supportExplanation || 'Human-reviewed correction.',
            verificationDetails: `Reviewed and corrected by ${reviewerName}. Original text preserved in provenance.`,
            reviewedCorrection: correctionText,
            reviewedBy: reviewerName,
            reviewedAt: new Date().toISOString()
          }
        };
      }
      return f;
    });

    const correctionEvent = {
      id: `evt-corr-${Date.now()}`,
      eventType: 'USER_VERIFICATION' as const,
      title: `Fact #${factId} Corrected by Reviewer`,
      description: `Correction applied: "${correctionText}". Original provenance preserved in Trust Trace.`,
      timestamp: new Date().toISOString(),
      displayTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isEventTimeUnknown: false,
      sourceName: reviewerName,
      statusBadge: 'CORRECTED'
    };

    const updatedTimeline = [...(inc.timelineEvents || []), correctionEvent].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const updated: IncidentRecord = {
      ...inc,
      userReportedFacts: updatedFacts,
      timelineEvents: updatedTimeline,
      updatedAt: new Date().toISOString()
    };

    this.incidents.set(id, updated);
    return updated;
  }

  public generateResponderBrief(
    id: string,
    options: { scrubMedical?: boolean; scrubLocation?: boolean } = {}
  ): ResponderBrief | null {
    const inc = this.incidents.get(id);
    if (!inc) return null;

    const containsMedical = inc.medicalContextIncluded;
    const shouldScrub = Boolean(options.scrubMedical && containsMedical);

    const unresolvedConflicts = (inc.contradictions || [])
      .filter(c => !c.isResolved)
      .map(c => `[UNRESOLVED] ${c.topic}: ${c.explanation}`);

    const brief: ResponderBrief = {
      incidentId: inc.id,
      generatedAt: new Date().toISOString(),
      title: inc.title,
      category: inc.category,
      urgency: inc.estimatedUrgency,
      urgencyScore: inc.urgencyScore,
      locationSummary: options.scrubLocation
        ? '[LOCATION WITHHELD PER PRIVACY PREFERENCE]'
        : `${inc.location.rawText} (${inc.location.confidence} confidence)`,
      situationOverview: inc.situationSummary,
      keyFacts: inc.userReportedFacts.map(f => ({
        fact: f.text,
        evidence: f.evidenceLabel
      })),
      criticalHazards: inc.potentialHazards.map(h => `[${h.severity}] ${h.description} (Precautions: ${h.precautions})`),
      topActionPriorities: inc.recommendedActions.slice(0, 4).map(a => ({
        step: a.stepNumber,
        title: a.title,
        precautions: a.safetyPrecautions
      })),
      openUncertainties: inc.uncertainties.map(u => `${u.description} (${u.type}: ${u.mitigationSuggestion})`),
      unresolvedContradictions: unresolvedConflicts,
      freshnessStatus: inc.freshness?.status || 'CURRENT',
      contactEmergencyServices: [
        'National Emergency Helpline: 112',
        'Ambulance / Medical Response: 108',
        'Fire & Rescue: 101',
        'Disaster Management Authority: 1078'
      ],
      containsRedactedMedical: shouldScrub,
      confidentialityNote: shouldScrub
        ? 'CONFIDENTIAL: Sensitive medical context was redacted at user request for privacy protection.'
        : 'SahaaySetu Responder Brief. Verified for field situational coordination.'
    };

    return ResponderBriefSchema.parse(brief);
  }
}

export const incidentStore = new IncidentStore();
