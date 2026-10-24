import { Router, Request, Response } from 'express';
import { env, isGeminiConfigured } from '../config/env';
import { incidentStore } from '../storage/incidentStore';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  const incidents = incidentStore.getAll();
  res.json({
    status: 'OK',
    application: 'SahaaySetu — The AI Crisis-to-Action Bridge',
    version: '1.0.0',
    mode: isGeminiConfigured ? 'LIVE_GEMINI' : 'DETERMINISTIC_DEMO_MODE',
    geminiConfigured: isGeminiConfigured,
    model: isGeminiConfigured ? env.GEMINI_MODEL : 'Deterministic Engine (No Key Set)',
    totalIncidents: incidents.length,
    timestamp: new Date().toISOString()
  });
});
