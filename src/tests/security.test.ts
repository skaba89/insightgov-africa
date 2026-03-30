// ============================================
// InsightGov Africa - Tests Intégration API
// ============================================

import { describe, it, expect } from 'vitest';
import { validateFile, validatePassword, sanitizeInput, schemas } from '@/lib/security';

describe('Security Module', () => {
  describe('Input Sanitization', () => {
    it('should remove script tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello');
    });

    it('should escape HTML entities', () => {
      const input = '<div>Test</div>';
      const result = sanitizeInput(input);
      expect(result).toBe('&lt;div&gt;Test&lt;/div&gt;');
    });

    it('should remove javascript: protocol', () => {
      const input = 'javascript:alert(1)';
      const result = sanitizeInput(input);
      expect(result).not.toContain('javascript:');
    });

    it('should handle normal text', () => {
      const input = 'Normal text with numbers 123';
      const result = sanitizeInput(input);
      expect(result).toBe(input);
    });
  });

  describe('File Validation', () => {
    it('should accept CSV files', () => {
      const result = validateFile({
        name: 'data.csv',
        type: 'text/csv',
        size: 1024,
      });
      expect(result.valid).toBe(true);
    });

    it('should accept XLSX files', () => {
      const result = validateFile({
        name: 'data.xlsx',
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 1024,
      });
      expect(result.valid).toBe(true);
    });

    it('should reject invalid extensions', () => {
      const result = validateFile({
        name: 'malware.exe',
        type: 'application/octet-stream',
        size: 1024,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('non autorisée');
    });

    it('should reject files too large', () => {
      const result = validateFile({
        name: 'large.csv',
        type: 'text/csv',
        size: 100 * 1024 * 1024, // 100MB
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('volumineux');
    });
  });

  describe('Password Validation', () => {
    it('should accept strong passwords', () => {
      const result = validatePassword('StrongP@ss123');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject short passwords', () => {
      const result = validatePassword('Short1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Au moins 8 caractères');
    });

    it('should reject passwords without numbers', () => {
      const result = validatePassword('NoNumbers!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Au moins un chiffre');
    });

    it('should reject passwords without special chars', () => {
      const result = validatePassword('NoSpecial123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Au moins un caractère spécial');
    });

    it('should reject common passwords', () => {
      const result = validatePassword('Password123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Mot de passe trop commun');
    });
  });

  describe('Validation Schemas', () => {
    describe('Login Schema', () => {
      it('should validate correct login data', () => {
        const result = schemas.login.safeParse({
          email: 'test@example.com',
          password: 'password123',
        });
        expect(result.success).toBe(true);
      });

      it('should reject invalid email', () => {
        const result = schemas.login.safeParse({
          email: 'not-an-email',
          password: 'password123',
        });
        expect(result.success).toBe(false);
      });

      it('should reject short password', () => {
        const result = schemas.login.safeParse({
          email: 'test@example.com',
          password: 'short',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('Register Schema', () => {
      it('should validate correct registration data', () => {
        const result = schemas.register.safeParse({
          email: 'test@example.com',
          password: 'StrongP@ss123',
          name: 'Test User',
          organizationName: 'Test Org',
          organizationType: 'COMPANY',
        });
        expect(result.success).toBe(true);
      });

      it('should reject weak password', () => {
        const result = schemas.register.safeParse({
          email: 'test@example.com',
          password: 'weak',
          name: 'Test User',
          organizationName: 'Test Org',
          organizationType: 'COMPANY',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('Payment Schema', () => {
      it('should validate correct payment data', () => {
        const result = schemas.payment.safeParse({
          organizationId: '123e4567-e89b-12d3-a456-426614174000',
          plan: 'STARTER',
          email: 'test@example.com',
        });
        expect(result.success).toBe(true);
      });

      it('should reject invalid plan', () => {
        const result = schemas.payment.safeParse({
          organizationId: '123e4567-e89b-12d3-a456-426614174000',
          plan: 'INVALID_PLAN',
          email: 'test@example.com',
        });
        expect(result.success).toBe(false);
      });

      it('should reject non-UUID organizationId', () => {
        const result = schemas.payment.safeParse({
          organizationId: 'not-a-uuid',
          plan: 'STARTER',
          email: 'test@example.com',
        });
        expect(result.success).toBe(false);
      });
    });
  });
});

describe('Rate Limiting', () => {
  it('should be defined', () => {
    const { rateLimiters } = require('@/lib/security');
    expect(rateLimiters.api).toBeDefined();
    expect(rateLimiters.auth).toBeDefined();
    expect(rateLimiters.upload).toBeDefined();
    expect(rateLimiters.payment).toBeDefined();
  });
});

describe('CSRF Protection', () => {
  it('should generate CSRF token', () => {
    const { generateCsrfToken } = require('@/lib/security');
    const token = generateCsrfToken();
    expect(token).toBeDefined();
    expect(token.length).toBe(64); // 32 bytes = 64 hex chars
  });
});
