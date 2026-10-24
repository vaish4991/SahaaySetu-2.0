import { Router, Request, Response, NextFunction } from 'express';
import {
  IncidentInputPayloadSchema,
  IncidentSubReportSchema,
  ContradictionResolutionSchema,
  ConfirmationRecordSchema,
  DEMO_SCENARIOS
} from '@sahaaysetu/shared';
import { incidentStore } from '../storage/incidentStore';
import { analyzeIncident } from '../services/gemini';
import { aiRateLimiter, upload } from '../middleware/security';

export const incidentsRouter = Router();

// GET all demonstration scenarios (now 8 grounded scenarios)
incidentsRouter.get('/demos', (_req: Request, res: Response) => {
  res.json({
    success: true,
    scenarios: DEMO_SCENARIOS
  });
});

// POST reset demo scenarios to pristine state (Feature 6 requirement)
incidentsRouter.post('/reset-demos', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await incidentStore.seedDemoScenarios();
    const count = incidentStore.getAll().length;
    res.json({
      success: true,
      count,
      message: 'All 8 demonstration scenarios restored to initial sample state.'
    });
  } catch (err) {
    next(err);
  }
});

// GET all incidents (with filtering and search)
incidentsRouter.get('/', (req: Request, res: Response) => {
  const { category, urgency, search } = req.query;
  const list = incidentStore.getAll({
    category: typeof category === 'string' ? category : undefined,
    urgency: typeof urgency === 'string' ? urgency : undefined,
    search: typeof search === 'string' ? search : undefined
  });
  res.json({
    success: true,
    total: list.length,
    incidents: list
  });
});

// GET single incident
incidentsRouter.get('/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const incident = incidentStore.getById(id);
  if (!incident) {
    return res.status(404).json({ success: false, error: 'Incident not found' });
  }
  res.json({ success: true, incident });
});

// POST analyze an incident (supports JSON or multipart with image file)
incidentsRouter.post(
  '/analyze',
  aiRateLimiter,
  upload.single('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let bodyData = req.body;
      if (typeof bodyData.consentGivenForMedical === 'string') {
        bodyData.consentGivenForMedical = bodyData.consentGivenForMedical === 'true';
      }
      if (typeof bodyData.consentGivenForLocation === 'string') {
        bodyData.consentGivenForLocation = bodyData.consentGivenForLocation === 'true';
      }

      if (req.file) {
        bodyData.imageBase64 = req.file.buffer.toString('base64');
        bodyData.imageMimeType = req.file.mimetype;
        bodyData.imageName = req.file.originalname;
      }

      const validatedPayload = IncidentInputPayloadSchema.parse(bodyData);
      const analyzedRecord = await analyzeIncident(validatedPayload);
      const savedRecord = incidentStore.save(analyzedRecord);

      res.status(201).json({
        success: true,
        incident: savedRecord,
        possibleDuplicates: savedRecord.possibleDuplicates
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST append a sub-report / update (Feature 1: multi-report ingestion)
incidentsRouter.post('/:id/sub-reports', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const existing = incidentStore.getById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    const subReportData = {
      ...req.body,
      id: req.body.id || `subrep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      submittedAt: req.body.submittedAt || new Date().toISOString(),
      text: req.body.text || req.body.content || '',
      locationDescription: req.body.locationDescription || req.body.location || undefined
    };

    const validated = IncidentSubReportSchema.parse(subReportData);
    const updated = incidentStore.addSubReport(id, validated);

    res.status(201).json({
      success: true,
      incident: updated,
      subReport: validated
    });
  } catch (err) {
    next(err);
  }
});

// POST resolve a contradiction (Feature 1: reviewed resolution without deleting original claims)
incidentsRouter.post('/:id/contradictions/:contradictionId/resolve', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const contradictionId = String(req.params.contradictionId);

    const existing = incidentStore.getById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    const resolution = ContradictionResolutionSchema.parse({
      resolvedAt: new Date().toISOString(),
      resolvedBy: req.body.resolvedBy || req.body.reviewedBy || 'Authorized Reviewer',
      resolutionRationale: req.body.resolutionRationale || req.body.rationale || '',
      acceptedClaimId: req.body.acceptedClaimId || req.body.selectedClaimId,
      additionalEvidenceSubmitted: req.body.additionalEvidenceSubmitted
    });

    const updated = incidentStore.resolveContradiction(id, contradictionId, resolution);
    const targetContradiction = updated?.contradictions.find(c => c.id === contradictionId);
    res.json({
      success: true,
      incident: updated,
      contradiction: targetContradiction
    });
  } catch (err) {
    next(err);
  }
});

// POST record a confirmation (Feature 3: status confirmation updating freshness)
incidentsRouter.post('/:id/confirmations', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const existing = incidentStore.getById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    const confirmation = ConfirmationRecordSchema.parse({
      id: req.body.id || `conf-${Date.now()}`,
      confirmedAt: req.body.confirmedAt || new Date().toISOString(),
      confirmedBy: req.body.confirmedBy || 'On-Scene Observer',
      source: req.body.source || req.body.confirmedBy || 'Citizen Confirmation',
      note: req.body.note || req.body.notes
    });

    const updated = incidentStore.addConfirmation(id, confirmation);
    res.json({
      success: true,
      incident: updated,
      confirmation
    });
  } catch (err) {
    next(err);
  }
});

// POST record a reviewed fact correction (Feature 2: Trust Trace correction with provenance)
incidentsRouter.post('/:id/facts/:factId/correction', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const factId = String(req.params.factId);
    const { correctionText, reviewerName } = req.body;

    if (!correctionText || typeof correctionText !== 'string' || !correctionText.trim()) {
      return res.status(400).json({ success: false, error: 'Correction text is required' });
    }

    const existing = incidentStore.getById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    const updated = incidentStore.correctFact(
      id,
      factId,
      correctionText.trim(),
      reviewerName || 'Field Reviewer'
    );

    res.json({
      success: true,
      incident: updated,
      fact: updated?.userReportedFacts.find(f => f.id === factId)
    });
  } catch (err) {
    next(err);
  }
});

// PATCH update reviewed facts, location, or action items
incidentsRouter.patch('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const existing = incidentStore.getById(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    const updated = incidentStore.update(id, req.body);
    res.json({ success: true, incident: updated });
  } catch (err) {
    next(err);
  }
});

// POST export Responder Brief
incidentsRouter.post('/:id/brief', (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { scrubMedical, scrubLocation } = req.body;
    const brief = incidentStore.generateResponderBrief(id, {
      scrubMedical: Boolean(scrubMedical),
      scrubLocation: Boolean(scrubLocation)
    });
    if (!brief) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }
    res.json({ success: true, brief });
  } catch (err) {
    next(err);
  }
});

// DELETE single incident
incidentsRouter.delete('/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const deleted = incidentStore.delete(id);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Incident not found' });
  }
  res.json({ success: true, message: 'Incident deleted successfully' });
});

// POST clear all user-created incidents (Privacy reset)
incidentsRouter.post('/clear-all', (_req: Request, res: Response) => {
  const count = incidentStore.clearUserData();
  res.json({
    success: true,
    message: `All user-created data (${count} records) successfully cleared from session.`
  });
});
