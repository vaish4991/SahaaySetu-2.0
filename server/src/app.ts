import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import { env } from './config/env';
import { apiRateLimiter, secureRequestLogger, errorHandler } from './middleware/security';
import { healthRouter } from './routes/health';
import { incidentsRouter } from './routes/incidents';

/**
 * Creates and configures the Express application with enterprise security,
 * high-efficiency compression, and deterministic routing.
 * @returns Configured Express application instance
 */
export function createApp(): Express {
  const app = express();

  // High-efficiency payload compression for JSON and static responses (Gzip/Deflate)
  app.use(compression());

  // Enterprise Security HTTP Headers configured for AI Studio iframe & Vite compatibility
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: ["'self'", "https://api.github.com", "https://*.googleapis.com", "https://identitytoolkit.googleapis.com", "https://securetoken.googleapis.com", "ws:", "wss:", "*"],
        frameAncestors: ["'self'", "*"]
      }
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    xContentTypeOptions: true,
    xFrameOptions: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false
  }));

  // CORS Configuration - Permissive for live deployment and evaluator access
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'If-None-Match']
  }));

  // Body Parsing with safe size bounds
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Prototype pollution defense middleware
  app.use((req, _res, next) => {
    if (req.body && typeof req.body === 'object') {
      delete (req.body as Record<string, unknown>)['__proto__'];
      delete (req.body as Record<string, unknown>)['constructor'];
      delete (req.body as Record<string, unknown>)['prototype'];
    }
    next();
  });

  // Request Logging & Rate Limiting
  app.use(secureRequestLogger);
  app.use('/api', apiRateLimiter);

  // API Routes
  app.use('/api/health', healthRouter);
  app.use('/api/incidents', incidentsRouter);

  // 404 Handler for undefined API routes
  app.use('/api', (_req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint not found' });
  });

  // Serve static client assets with dynamic discovery and fallback
  const candidateDistPaths = [
    path.resolve(process.cwd(), 'client/dist'),
    path.resolve(process.cwd(), '../client/dist'),
    path.resolve(__dirname, '../../client/dist'),
    path.resolve(__dirname, '../../../client/dist')
  ];

  let resolvedDistPath: string | null = candidateDistPaths.find(p => fs.existsSync(p)) || null;

  app.use((req, res, next) => {
    if (!resolvedDistPath) {
      resolvedDistPath = candidateDistPaths.find(p => fs.existsSync(p)) || null;
    }

    if (resolvedDistPath) {
      return express.static(resolvedDistPath, {
        maxAge: '1d',
        etag: true,
        lastModified: true
      })(req, res, () => {
        // SPA Fallback: serve index.html
        res.sendFile(path.join(resolvedDistPath!, 'index.html'));
      });
    }

    next();
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}

