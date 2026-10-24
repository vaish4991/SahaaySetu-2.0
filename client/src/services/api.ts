import {
  IncidentInputPayload,
  IncidentRecord,
  ResponderBrief,
  DEMO_SCENARIOS,
  DuplicateSuggestion,
  IncidentSubReport
} from '@sahaaysetu/shared';

const API_BASE = typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null'
  ? (typeof (globalThis as unknown as { process?: { env?: { NODE_ENV?: string } } }).process !== 'undefined' && (globalThis as unknown as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV === 'test' ? `${window.location.origin}/api` : '/api')
  : '/api';

export interface HealthStatus {
  status: string;
  application: string;
  version: string;
  mode: string;
  geminiConfigured: boolean;
  model: string;
  totalIncidents: number;
}

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Failed to reach backend health service');
  return res.json();
}

export async function fetchIncidents(filters?: {
  category?: string;
  urgency?: string;
  search?: string;
}): Promise<IncidentRecord[]> {
  const params = new URLSearchParams();
  if (filters?.category) params.append('category', filters.category);
  if (filters?.urgency) params.append('urgency', filters.urgency);
  if (filters?.search) params.append('search', filters.search);

  const res = await fetch(`${API_BASE}/incidents?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch incidents list');
  const data = await res.json();
  return data.incidents || [];
}

export async function fetchIncidentById(id: string): Promise<IncidentRecord> {
  const res = await fetch(`${API_BASE}/incidents/${id}`);
  if (!res.ok) throw new Error('Incident not found');
  const data = await res.json();
  return data.incident;
}

export async function analyzeIncidentApi(
  payload: IncidentInputPayload
): Promise<{ incident: IncidentRecord; possibleDuplicates: DuplicateSuggestion[] }> {
  const res = await fetch(`${API_BASE}/incidents/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Crisis analysis failed. Please review your input.');
  }

  return res.json();
}

export async function updateIncidentApi(
  id: string,
  updates: Partial<IncidentRecord>
): Promise<IncidentRecord> {
  const res = await fetch(`${API_BASE}/incidents/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  if (!res.ok) throw new Error('Failed to update incident');
  const data = await res.json();
  return data.incident;
}

export async function generateBriefApi(
  id: string,
  options: { scrubMedical?: boolean; scrubLocation?: boolean }
): Promise<ResponderBrief> {
  const res = await fetch(`${API_BASE}/incidents/${id}/brief`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(options)
  });

  if (!res.ok) throw new Error('Failed to generate responder brief');
  const data = await res.json();
  return data.brief;
}

export async function clearAllUserDataApi(): Promise<string> {
  const res = await fetch(`${API_BASE}/incidents/clear-all`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to clear session data');
  const data = await res.json();
  return data.message;
}

export async function addSubReportApi(
  incidentId: string,
  subReport: Partial<IncidentSubReport>
): Promise<IncidentRecord> {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/sub-reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subReport)
  });
  if (!res.ok) throw new Error('Failed to add sub-report');
  const data = await res.json();
  return data.incident;
}

export async function resolveContradictionApi(
  incidentId: string,
  contradictionId: string,
  resolution: { resolutionRationale: string; acceptedClaimId?: string; additionalEvidenceSubmitted?: string; resolvedBy?: string }
): Promise<IncidentRecord> {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/contradictions/${contradictionId}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(resolution)
  });
  if (!res.ok) throw new Error('Failed to record contradiction resolution');
  const data = await res.json();
  return data.incident;
}

export async function addConfirmationApi(
  incidentId: string,
  confirmation: { confirmedBy: string; source: string; note?: string }
): Promise<IncidentRecord> {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/confirmations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(confirmation)
  });
  if (!res.ok) throw new Error('Failed to record confirmation');
  const data = await res.json();
  return data.incident;
}

export async function correctFactApi(
  incidentId: string,
  factId: string,
  correctionText: string,
  reviewerName?: string
): Promise<IncidentRecord> {
  const res = await fetch(`${API_BASE}/incidents/${incidentId}/facts/${factId}/correction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correctionText, reviewerName })
  });
  if (!res.ok) throw new Error('Failed to record fact correction');
  const data = await res.json();
  return data.incident;
}

export async function resetDemoScenariosApi(): Promise<string> {
  const res = await fetch(`${API_BASE}/incidents/reset-demos`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to reset demonstration scenarios');
  const data = await res.json();
  return data.message;
}

// Offline Draft Storage
const DRAFT_KEY = 'sahaaysetu_incident_draft_v1';

export function saveLocalDraft(draft: Partial<IncidentInputPayload>): void {
  try {
    // Exclude sensitive medical context from raw persistent storage if consent was not checked
    const safeDraft = { ...draft };
    if (!safeDraft.consentGivenForMedical) {
      delete safeDraft.medicalContext;
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(safeDraft));
  } catch (err) {
    console.warn('Could not save draft to local storage:', err);
  }
}

export function loadLocalDraft(): Partial<IncidentInputPayload> | null {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function clearLocalDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}
