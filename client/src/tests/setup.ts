import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Global mock for fetch to cleanly handle UI tests without network side effects
global.fetch = vi.fn().mockImplementation((url: string) => {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({
      success: true,
      incident: { id: 'mock-incident' },
      incidents: []
    }),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob())
  } as unknown as Response);
});
