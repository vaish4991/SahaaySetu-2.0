import { createApp } from './app';
import { env, isGeminiConfigured } from './config/env';

const app = createApp();

const server = app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 SahaaySetu Server active on http://0.0.0.0:${env.PORT}`);
  console.log(`🌐 Mode: ${isGeminiConfigured ? 'LIVE GEMINI ENABLED' : 'DETERMINISTIC DEMO MODE'}`);
  if (isGeminiConfigured) {
    console.log(`🤖 Model: ${env.GEMINI_MODEL}`);
  } else {
    console.log(`ℹ️  GEMINI_API_KEY is not set. Deterministic crisis simulator is active.`);
  }
  console.log(`=======================================================`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server gracefully.');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});
