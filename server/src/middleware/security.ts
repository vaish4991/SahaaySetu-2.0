import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { env } from '../config/env';

/**
 * Rate limiter for AI analysis endpoints to prevent quota exhaustion and DoS.
 */
export const aiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many analysis requests from this IP. Please wait before submitting another incident.'
  }
});

/**
 * General API rate limiter.
 */
export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS * 3,
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Secure multer upload handler with memory storage, strict MIME filtering, and size bounds.
 */
const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_UPLOAD_SIZE_BYTES, // 5MB limit
    files: 1
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type '${file.mimetype}'. Allowed types: JPEG, PNG, WEBP, GIF.`));
    }
  }
});

/**
 * Request logger that omits sensitive medical context, personal details, or image binary data.
 */
export function secureRequestLogger(req: Request, _res: Response, next: NextFunction) {
  const sanitizedPath = req.path;
  const method = req.method;
  const ip = req.ip || req.socket.remoteAddress;
  console.log(`[${new Date().toISOString()}] ${method} ${sanitizedPath} - Remote: ${ip}`);
  next();
}

export interface SafeHttpError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
  errors?: unknown[];
}

/**
 * Centralized safe error handler.
 * Does NOT expose stack traces or internal server paths in non-development environments.
 */
export function errorHandler(
  err: SafeHttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.status || err.statusCode || (err.name === 'ZodError' ? 400 : 500);
  const isDev = env.NODE_ENV === 'development';

  if (statusCode >= 500) {
    console.error('[SERVER_ERROR]', {
      message: err.message,
      name: err.name,
      code: err.code,
      stack: isDev ? err.stack : undefined
    });
  } else if (env.NODE_ENV !== 'test') {
    console.warn(`[CLIENT_ERROR_${statusCode}]`, err.message);
  }

  res.status(statusCode).json({
    success: false,
    error: err.name === 'ZodError' ? 'Validation error' : (err.message || 'An internal error occurred'),
    details: err.name === 'ZodError' ? err.errors : undefined,
    timestamp: new Date().toISOString()
  });
}
