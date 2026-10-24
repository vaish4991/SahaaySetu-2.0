/**
 * Input sanitization, Prompt Injection Defense, and PII protection utilities.
 */

// Patterns indicating potential prompt injection attacks
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/gi,
  /you\s+are\s+now\s+a/gi,
  /system\s+prompt\s*:/gi,
  /system\s*:\s*override/gi,
  /disregard\s+(the\s+)?above/gi,
  /jailbreak/gi,
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi
];

export interface SanitizationResult {
  cleanedText: string;
  flaggedInjection: boolean;
  sanitizationNotes: string[];
}

/**
 * Sanitizes input text, strips malicious HTML/scripts, detects prompt injection, and limits length.
 */
export function sanitizeInputText(rawText: string, maxLength = 10000): SanitizationResult {
  if (!rawText || typeof rawText !== 'string') {
    return { cleanedText: '', flaggedInjection: false, sanitizationNotes: [] };
  }

  const notes: string[] = [];
  let flagged = false;
  let text = rawText.trim();

  if (text.length > maxLength) {
    text = text.substring(0, maxLength);
    notes.push(`Input truncated to maximum allowed length of ${maxLength} characters.`);
  }

  // Detect and neutralize prompt injection attempts
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      flagged = true;
      notes.push(`Potential prompt injection or script pattern detected and neutralized: ${pattern.source}`);
      text = text.replace(pattern, '[REDACTED_SECURITY_FILTER]');
    }
  }

  // Encode angle brackets to neutralize raw HTML injection
  text = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  return {
    cleanedText: text,
    flaggedInjection: flagged,
    sanitizationNotes: notes
  };
}

/**
 * Redacts personal identifiable information (PII) like phone numbers and email addresses.
 */
export function redactPII(text: string): string {
  if (!text) return '';
  return text
    // Redact email addresses
    .replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, '[EMAIL_REDACTED]')
    // Redact 16-digit credit/debit card numbers (before 12-digit Aadhaar)
    .replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, '[CARD_REDACTED]')
    // Redact 12-digit Aadhaar / National ID numbers
    .replace(/\b\d{4}[-\s]\d{4}[-\s]\d{4}\b/g, '[AADHAAR_REDACTED]')
    // Redact phone numbers (including Indian format with +91 and standard international)
    .replace(/(?:\+?91[-.\s]?)?[6-9]\d{4}[-.\s]?\d{5}\b/g, '[PHONE_REDACTED]')
    .replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[PHONE_REDACTED]');
}

/**
 * Redacts medical context if explicit consent was NOT provided.
 */
export function sanitizeMedicalContext(medicalContext: string, consentGiven: boolean): string {
  if (!medicalContext || !medicalContext.trim()) {
    return '';
  }
  if (!consentGiven) {
    return '[MEDICAL CONTEXT REDACTED - EXPLICIT USER CONSENT WAS NOT PROVIDED]';
  }
  return sanitizeInputText(medicalContext, 2000).cleanedText;
}
