import { describe, it, expect, beforeEach } from 'vitest';
import {
  signInWithGoogleService,
  registerWithEmailService,
  loginWithEmailService
} from '../services/firebase';

describe('Authentication & User Identity System', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('signs in with Google and attaches verified crisis operational role', async () => {
    const user = await signInWithGoogleService('COORDINATOR');

    expect(user).toBeDefined();
    expect(user.displayName).toContain('Vikramaditya');
    expect(user.role).toBe('COORDINATOR');
    expect(user.authProvider).toBe('google');
    expect(user.email).toContain('@');
  });

  it('registers a new user and creates an account with chosen agency & role', async () => {
    const newUser = await registerWithEmailService(
      'Dr. Sameer Kulkarni',
      'sameer.kulkarni@hospital.org',
      'SecurePass123!',
      'FIRST_RESPONDER',
      'Pune Trauma Resuscitation Unit'
    );

    expect(newUser).toBeDefined();
    expect(newUser.displayName).toBe('Dr. Sameer Kulkarni');
    expect(newUser.role).toBe('FIRST_RESPONDER');
    expect(newUser.roleTitle).toContain('Emergency Services');
    expect(newUser.agency).toBe('Pune Trauma Resuscitation Unit');
    expect(newUser.isNewUser).toBe(true);
  });

  it('signs in an existing user with verified credentials', async () => {
    const existing = await loginWithEmailService(
      'officer.sharma@police.gov.in',
      'SecurePass123!'
    );

    expect(existing).toBeDefined();
    expect(existing.email).toBe('officer.sharma@police.gov.in');
    expect(existing.role).toBe('COORDINATOR');
  });
});
