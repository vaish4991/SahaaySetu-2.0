# SahaaySetu (सहायसेतु) — The AI Crisis-to-Action Bridge
**PromptWars — Societal Benefit Challenge (Phase 2 Distinctive AI Intelligence Upgrade)**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Google Gemini](https://img.shields.io/badge/Gemini_AI-2.5_Flash-orange.svg)](https://ai.google.dev/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Tests-57_Passed-emerald.svg)](https://vitest.dev/)
[![Accessibility](https://img.shields.io/badge/WCAG-2.2_AA_Compliant-purple.svg)](https://www.w3.org/WAI/standards-guidelines/wcag/)

> **SahaaySetu** is an emergency coordination bridge that converts fragmented, messy, unstructured crisis inputs — voice notes, eyewitness photos, chaotic bystander descriptions, and forwarded alerts — into verified structured intelligence, explainable triage scores, and prioritized, life-saving next steps.

---

## 1. Problem Statement & Societal Impact

In natural disasters, structural collapses, multi-vehicle crashes, or sudden medical emergencies, incoming information is chaotic, contradictory, and fast-decaying:
- **Disagreement Between Observers**: One commuter reports a road is passable while another warns it is completely blocked.
- **Viral Forwarded Rumors**: Unverified social media messages announce imminent dam breaches or toxic leaks, triggering mass panic and stampedes.
- **Stale Visual Evidence**: An eyewitness submits a photo taken 90 minutes ago showing clear roads, unaware that mudslides occurred 15 minutes ago.
- **Black-box AI Hallucinations**: Generic AI models hallucinate facts, claim physical rescue teams have been dispatched, or assume newer messages are automatically more true.

**SahaaySetu solves this crisis intelligence breakdown** by serving as an auditable, time-aware, deterministic bridge between chaotic human intent and coordinated emergency action.

```
MULTI-SOURCE CRISIS INPUTS             DISTINCTIVE INTELLIGENCE ENGINE           TRACEABLE ACTION PIPELINE
┌─────────────────────────────┐       ┌─────────────────────────────────┐       ┌─────────────────────────────┐
│ • Panicked Voice Audio      │       │ • Contradiction Detector        │       │ • Side-by-Side Review Card  │
│ • Eyewitness Photos (EXIF)  │  ───► │   (Semantic Polarity + Space/   │  ───► │ • Trust Trace Audit Drawer  │
│ • Bystander Text Messages   │       │    Time Spatio-Temporal Filter) │       │ • Information Freshness     │
│ • Official Authority Alerts │       │ • Information Freshness Engine  │       │   Engine (Aging/Stale)      │
│ • Consented Medical History │       │   (Deterministic Thresholds)    │       │ • Interactive Timeline      │
│ • Multi-Report Submissions  │       │ • Evidence-Aware Prioritization │       │ • Conservative Action Plan  │
└─────────────────────────────┘       │   (+10 Contradiction Buffer)    │       │ • One-Click Responder Brief │
                                      └─────────────────────────────────┘       └─────────────────────────────┘
```

---

## 2. Phase 2 Signature AI Intelligence Features

### Feature 1: Real Contradiction Detection
- **Multi-Report Ingestion**: Allows multiple reports and sub-reports to associate with a single incident.
- **Semantic Polarity Analysis**: Analyzes opposing claims across critical crisis dimensions (e.g., road passability vs. blockage, structure integrity vs. collapse, rising vs. receding floodwaters, casualties reported vs. zero casualties). Uses regex boundary isolation to eliminate substring collision bugs (e.g. `passable` inside `impassable`).
- **Spatio-Temporal Disambiguation**: Intelligently distinguishes genuine contradictions from reports describing **different geographic points** (e.g., North Pier vs. South Abutment) or **different observation times** (>90 minutes apart).
- **Side-by-Side Review & Non-Destructive Resolution**: Presents Claim A vs. Claim B with sources, observation timestamps, locations, and verification statuses. Authorized reviewers can record a resolution without deleting original claims, maintaining complete auditability.

### Feature 2: Trust Trace (Traceable Evidence System)
- **Deep Provenance Tracking**: Every extracted fact, hazard, and recommended action is tied to supporting claims, source type, submission timestamp, event timestamp, and explicit verification method.
- **Four-Tier Provenance Labels**:
  - `[USER-REPORTED]`: Directly submitted by a bystander or citizen without external corroboration.
  - `[SOURCE-VERIFIED]`: Confirmed against an official agency bulletin, verified dispatch feed, or validated sensor.
  - `[AI-INFERRED]`: Inferred by the Gemini reasoning engine; marked as an unconfirmed deduction requiring human review.
  - `[UNVERIFIED]`: Forwarded rumors, anonymous tips, or claims with known conflicting accounts.
- **Transparent Limitation Disclosures**: Clearly flags when a source cannot be reached or verified, preventing false confidence.
- **Non-Destructive Corrections**: Allows human fact adjustments while logging the original statement, reviewer identity, timestamp, and justification.

### Feature 3: Information Freshness Engine
- **Time-Aware Evidence Tracking**: Explicitly separates **report submission time** from **event occurrence time** and **on-scene confirmation time**.
- **Stale Media Safeguard**: If an eyewitness uploads a photo captured 90+ minutes ago with a recent submission timestamp, the engine uses `mediaCapturedAt` for freshness scoring. A fresh submission containing an old photo is never falsely classified as fresh.
- **Deterministic Category Thresholds**:
  - *Flash Floods / Waterlogging*: Aging at 15m, Stale at 45m.
  - *Fire / Hazmat*: Aging at 10m, Stale at 30m.
  - *Traffic & Road Blockages*: Aging at 30m, Stale at 90m.
  - *Landslides & Weather*: Aging at 45m, Stale at 120m.
  - *Structural Collapses*: Aging at 20m, Stale at 60m.
- **Safe Timestamp Parsing**: Gracefully handles missing timestamps, invalid date strings, and future timestamps by defaulting to `UNKNOWN` or `CURRENT` safely without inferring safety from outdated evidence.
- **On-Scene Confirmations**: Responders can record new ground-truth confirmations that refresh evaluation without altering original reports.

### Feature 4: Interactive Evidence Timeline
- **Chronological Evidence Map**: Organizes reports, official updates, detected contradictions, human reviews, and on-scene confirmations into a clean timeline.
- **Event Time vs. Submission Time**: Visually contrasts when an event happened against when it was reported, with clear "Unknown" markers instead of invented timestamps.
- **Keyboard & Screen-Reader Accessible**: Implements `role="button"`, `tabIndex={0}`, enter/space activation, and color-independent iconography (WCAG 2.2 AA).

### Feature 5: Evidence-Aware Action Prioritization
- **Algorithmic + AI Urgency Fusion**: Urgency score (0–100) is deterministically computed from life threats, trap hazards, vulnerable populations, and temporal decay.
- **Contradiction Safety Buffer**: Automatically adds a **+10 point urgency caution buffer** when unresolved contradictions exist.
- **Freshness Advisories**: Actions dependent on `AGING` or `STALE` evidence are flagged with cautionary warnings (e.g., verifying with scouts before routing traffic).
- **Strict Guardrail Separation**: Deterministic safety rules always override Gemini suggestions. The model cannot bypass validation or falsely report that responders are en route.

---

## 3. Eight Working Demonstration Scenarios

SahaaySetu provides 8 grounded crisis scenarios accessible directly from the Dashboard:

| # | Scenario Title | Incident Type | Distinctive Feature Demonstrated |
| :---: | :--- | :--- | :--- |
| **1** | **Flash Waterlogging & Blocked Arterial Underpass** | Flood / Hazard | Active electrocution hazard, rising tide data, multi-modal audio input. |
| **2** | **Multi-Vehicle Expressway Collision in Fog** | Highway Pileup | Flammable fuel spill across lanes, visual damage assessment, mile marker ambiguity. |
| **3** | **Forwarded Cyclone Warning Verification** | Public Safety | Flagging viral unverified WhatsApp forwards (-20 urgency score penalty) to avert panic. |
| **4** | **Partial Slab Collapse in Commercial Complex** | Infrastructure | Information gap tracking: surfaces missing worker headcounts and blocked stairways. |
| **5** | **Sudden Collapse with Consented Medical History** | Medical Distress | Consented medical history (pacemaker/diabetes) generating conservative first-aid precautions. |
| **6** | **Road Condition Disagreement (Contradiction)** | Infrastructure / Road | **Two reports disagree**: Commuter claims flyover is passable; resident reports it is blocked. Surfaces side-by-side comparison, +10 safety buffer, and non-destructive resolution. |
| **7** | **Stale Landslide Photo (Freshness Engine)** | Landslide / Weather | **Old photo submitted recently**: Photo taken 95 minutes ago triggers `STALE` freshness alert despite recent submission, advising verification before sending clearing crews. |
| **8** | **Viral Dam Breach Forward vs Official Bulletin** | Public Safety / Flood | **Contradiction & Trust Trace**: Forwarded WhatsApp panic message claiming dam gates collapsed contradicted by Official Irrigation Dept bulletin confirming normal discharge. |

> **Reset Demo State**: A dedicated button in the Dashboard and Action Center allows instant restoration of the default scenario suite at any time via `POST /api/incidents/reset-demos`.

---

## 4. Architecture & Technology Stack

- **Shared Domain Layer (`shared/`)**: Zod schemas, TypeScript types, and preset scenarios shared between client and server.
- **Backend API (`server/`)**: Express, Node.js, `@google/genai` (Gemini 2.5 Flash), Zod validation, Helmet, rate limiting, and in-memory thread-safe store.
- **Frontend Client (`client/`)**: React 18, Vite, TailwindCSS, Lucide icons, responsive drawer components, and bilingual (English/Hindi) localization.

```
Promt Wars/
├── shared/                         # Domain Core (Zod Schemas & Types)
│   ├── src/index.ts                # Freshness, Contradiction, TrustTrace, Actions, Scenarios
│   └── tsconfig.json
├── server/                         # Express & AI Backend
│   ├── src/
│   │   ├── config/env.ts           # Environment schema validation
│   │   ├── middleware/security.ts  # Helmet, rate limiting, multer memory storage
│   │   ├── services/
│   │   │   ├── gemini.ts           # Gemini 2.5 Flash SDK + JSON parser + simulator fallback
│   │   │   ├── contradictionDetector.ts # Semantic polarity & spatio-temporal filter
│   │   │   ├── freshnessEngine.ts  # Deterministic category freshness & stale media detection
│   │   │   ├── prioritization.ts   # 0-100 Urgency scoring engine with contradiction buffer
│   │   │   ├── duplicateDetector.ts# Jaccard token & location similarity algorithm
│   │   │   └── sanitizer.ts        # Prompt injection neutralizer & PII redactor
│   │   ├── storage/incidentStore.ts # Thread-safe store, sub-reports, confirmations, corrections
│   │   ├── routes/incidents.ts     # REST endpoints for analysis, reviews, and updates
│   │   └── tests/                  # 37 Automated backend Vitest tests
│   └── package.json
├── client/                         # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ContradictionReviewCard.tsx # Side-by-side claim comparison & resolution
│   │   │   ├── EvidenceTimeline.tsx        # Keyboard accessible chronological timeline
│   │   │   ├── FreshnessBadge.tsx          # Real-time age & category freshness badge
│   │   │   ├── TrustTraceDrawer.tsx        # Full evidence provenance & correction drawer
│   │   │   ├── EvidenceBadge.tsx           # Provenance tier indicator
│   │   │   ├── UrgencyBadge.tsx            # Transparent urgency score chip
│   │   │   ├── AudioInput.tsx              # Web Speech voice recording interface
│   │   │   ├── ImageDropzone.tsx           # Photo upload with thumbnail preview
│   │   │   └── ResponderBriefModal.tsx     # One-click sanitized print/markdown export
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx               # Incident situation room with 8 demo scenarios
│   │   │   ├── SubmitIncident.tsx          # Multi-modal reporting studio
│   │   │   ├── AnalysisReview.tsx          # Detailed intelligence, timeline & contradictions
│   │   │   ├── ActionCenter.tsx            # Evidence-aware prioritized next steps
│   │   │   ├── IncidentExplorer.tsx        # Filterable multi-incident list
│   │   │   └── SettingsPrivacy.tsx         # Data governance & memory scrub controls
│   │   ├── locales/translations.ts         # English & Hindi bilingual dictionaries
│   │   └── tests/                          # 7 React Testing Library unit tests
│   └── package.json
└── package.json                    # Workspace scripts
```

---

## 5. API Reference

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/health` | `GET` | Health check, API mode (`LIVE_GEMINI` vs `SIMULATOR`), and total incident count |
| `/api/incidents` | `GET` | List all incidents with freshness status, urgency, and conflict counts |
| `/api/incidents/:id` | `GET` | Get full incident record with contradictions, sub-reports, and trust trace |
| `/api/incidents/analyze` | `POST` | Analyze multi-modal input through Gemini / Fallback Simulator |
| `/api/incidents/:id/sub-reports` | `POST` | Ingest an additional report or eyewitness update to an existing incident |
| `/api/incidents/:id/contradictions/:cid/resolve` | `POST` | Record a non-destructive human resolution for a contradiction |
| `/api/incidents/:id/confirmations` | `POST` | Record an on-scene status confirmation to refresh evidence age |
| `/api/incidents/:id/facts/:fid/correction` | `POST` | Submit an audited fact correction with preserved original provenance |
| `/api/incidents/reset-demos` | `POST` | Reset in-memory database to default 8 demonstration scenarios |

---

## 6. Verification & Test Suite

All checks are executable directly from the repository root:

```bash
# 1. Typecheck all workspaces (shared, server, client)
npm run typecheck

# 2. Run all 57 automated unit and integration tests
npm run test

# 3. Code quality and linting verification
npm run lint

# 4. Production bundle build
npm run build
```

### Automated Test Breakdown (57 Tests, 100% Pass)
- `server/src/tests/unstructured_modalities.test.ts` (8 tests): Real-world messy inputs (panicked voice transcripts, expressway fog pileups, cyclone storm surges, breaking news tickers, photos, clinical medical history stacks).
- `server/src/tests/contradiction.test.ts` (4 tests): Genuine semantic polarity detection, location distinction filtering, temporal separation filtering (>90m), and non-destructive resolution recording.
- `server/src/tests/freshness.test.ts` (9 tests): Category-based freshness thresholds, CURRENT/AGING/STALE status transitions, 95-minute stale photo detection, missing timestamps, invalid dates, future timestamps, and on-scene confirmation refreshes.
- `server/src/tests/prioritization_freshness.test.ts` (3 tests): +10 urgency safety buffer on active contradictions, cautious next steps for stale information, and strict isolation of deterministic safety rules from AI suggestions.
- `server/src/tests/api_phase2.test.ts` (5 tests): Sub-report ingestion, contradiction resolution API with dynamic urgency recalculation, on-scene confirmations with action warning clearing, audited fact corrections, and demo reset endpoint.
- `server/src/tests/sanitizer.test.ts` (4 tests): Prompt injection defense, script tag stripping, phone number/email PII masking.
- `server/src/tests/duplicates.test.ts` (2 tests): Jaccard token and geographical incident deduplication.
- `server/src/tests/prioritization.test.ts` (4 tests): Base urgency score calculation, hazard penalties, medical boosts.
- `server/src/tests/api.test.ts` (6 tests): Input validation, medical consent barriers, and responder brief formatting.
- `client/src/tests/auth.test.tsx` (3 tests): Firebase authentication state management, guest mode transitions, and auth guard behaviors.
- `client/src/tests/phase2_components.test.tsx` (3 tests): FreshnessBadge rendering, EvidenceTimeline keyboard navigation and unknown event times, ContradictionReviewCard side-by-side comparison and resolution trigger.
- `client/src/tests/components.test.tsx` (6 tests): EvidenceBadge provenance chips, UrgencyBadge scoring, EmergencyContactsBar accessibility, ActionCenter checklist toggles, IncidentExplorer filtering.

---

## 7. Security, Privacy & Ethical Guardrails

1. **Conservative Medical Scope**: Strictly enforces no medical diagnosis or drug prescriptions; prioritizes scene stabilization and emergency escalation (108/112).
2. **Honesty in Dispatch**: Never claims physical responders have been dispatched. Direct one-touch tel links allow citizens to initiate actual emergency calls.
3. **Prompt Injection & XSS Neutralization**: Strips dangerous injection keywords and HTML tags before forwarding text to Gemini.
4. **Ephemeral In-Memory Storage**: Zero storage of raw audio or photo files to permanent disk; all demonstration and session data resides in a thread-safe in-memory store.
5. **Data Privacy Scrubbing**: Responder briefs offer one-click scrubbing of citizen PII and sensitive medical history before handover.

---

## 8. License & Attribution

Developed for **PromptWars — Societal Benefit Challenge**. Built by pairing human civic engineering with Google Gemini AI.
