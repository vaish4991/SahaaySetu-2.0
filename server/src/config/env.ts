import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const envSchema = z.object({
  PORT: z.union([z.string(), z.number()]).default('3000').transform(v => {
    const p = typeof v === 'number' ? v : parseInt(v, 10);
    return (p === 8080 || !p) ? 3000 : p;
  }),
  NODE_ENV: z.string().default('development'),
  CLIENT_ORIGIN: z.string().default('http://localhost:3000'),
  GEMINI_API_KEY: z.string().optional().default('').transform(v => v.trim()),
  GEMINI_MODEL: z.string().default('gemini-3.8-flash'),
  RATE_LIMIT_WINDOW_MS: z.string().default('60000').transform(v => parseInt(v, 10)),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('30').transform(v => parseInt(v, 10)),
  MAX_UPLOAD_SIZE_BYTES: z.string().default('5242880').transform(v => parseInt(v, 10)) // 5MB
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
export const isGeminiConfigured = Boolean(
  env.NODE_ENV !== 'test' &&
  process.env.NODE_ENV !== 'test' &&
  !process.env.VITEST &&
  env.GEMINI_API_KEY &&
  env.GEMINI_API_KEY.trim().length > 15 &&
  !env.GEMINI_API_KEY.includes('your_gemini_api_key') &&
  !env.GEMINI_API_KEY.includes('your_actual_gemini_api_key')
);
