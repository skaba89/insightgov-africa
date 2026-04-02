// ============================================
// InsightGov Africa - SMS Service Tests
// ============================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SMSServiceClass, SMS_TEMPLATES, formatPhoneNumber } from '@/lib/sms-service';

// Mock environment variables
vi.mock('process.env', () => ({
  SMS_PROVIDER: 'twilio',
  TWILIO_ACCOUNT_SID: 'test_account_sid',
  TWILIO_AUTH_TOKEN: 'test_auth_token',
  TWILIO_PHONE_NUMBER: '+1234567890',
}));

describe('SMS Service', () => {
  describe('Phone Number Formatting', () => {
    it('should format Senegal numbers correctly', () => {
      const result = formatPhoneNumber('771234567');
      expect(result).toBe('+221771234567');
    });

    it('should format numbers with leading zero', () => {
      const result = formatPhoneNumber('0771234567');
      expect(result).toBe('+221771234567');
    });

    it('should preserve international format', () => {
      const result = formatPhoneNumber('+221771234567');
      expect(result).toBe('+221771234567');
    });

    it('should handle numbers with spaces and dashes', () => {
      const result = formatPhoneNumber('77 123-45 67');
      expect(result).toBe('+221771234567');
    });
  });

  describe('SMS Templates', () => {
    it('should have verification code template', () => {
      expect(SMS_TEMPLATES.VERIFICATION_CODE).toBeDefined();
      expect(SMS_TEMPLATES.VERIFICATION_CODE.template).toContain('{code}');
    });

    it('should have MFA code template', () => {
      expect(SMS_TEMPLATES.MFA_CODE).toBeDefined();
      expect(SMS_TEMPLATES.MFA_CODE.category).toBe('verification');
    });

    it('should have login alert template', () => {
      expect(SMS_TEMPLATES.LOGIN_ALERT).toBeDefined();
      expect(SMS_TEMPLATES.LOGIN_ALERT.category).toBe('alert');
    });

    it('should have backup notification templates', () => {
      expect(SMS_TEMPLATES.BACKUP_COMPLETE).toBeDefined();
      expect(SMS_TEMPLATES.BACKUP_FAILED).toBeDefined();
    });

    it('should have all required variables in templates', () => {
      const verificationTemplate = SMS_TEMPLATES.VERIFICATION_CODE;
      expect(verificationTemplate.variables).toContain('code');
      expect(verificationTemplate.variables).toContain('validity');
    });
  });

  describe('SMS Service Class', () => {
    let smsService: SMSServiceClass;

    beforeEach(() => {
      smsService = new SMSServiceClass();
    });

    it('should initialize without config when env vars are missing', () => {
      // In test environment without real credentials
      const result = smsService.initialize();
      // Should return false if no real credentials
      expect(typeof result).toBe('boolean');
    });

    it('should return error when sending without configuration', async () => {
      // Service not configured
      const result = await smsService.send({
        to: '771234567',
        message: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not configured');
    });

    it('should validate phone number length', async () => {
      const result = await smsService.send({
        to: '123', // Too short
        message: 'Test message',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid phone number');
    });

    it('should validate message length', async () => {
      const longMessage = 'A'.repeat(1600); // Too long
      const result = await smsService.send({
        to: '771234567',
        message: longMessage,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('too long');
    });

    it('should reject invalid template ID', async () => {
      const result = await smsService.sendTemplate(
        '771234567',
        'INVALID_TEMPLATE' as any,
        {}
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Template not found');
    });
  });
});

describe('SMS Template Rendering', () => {
  it('should render verification code template correctly', () => {
    const template = SMS_TEMPLATES.VERIFICATION_CODE.template;
    let message = template
      .replace('{code}', '123456')
      .replace('{validity}', '10');

    expect(message).toBe('Votre code de vérification InsightGov est: 123456. Valide 10 minutes.');
  });

  it('should render login alert template correctly', () => {
    const template = SMS_TEMPLATES.LOGIN_ALERT.template;
    const message = template.replace('{location}', 'Dakar, Sénégal');

    expect(message).toContain('Dakar, Sénégal');
    expect(message).toContain('Nouvelle connexion');
  });

  it('should render KPI alert template correctly', () => {
    const template = SMS_TEMPLATES.ALERT_THRESHOLD.template;
    const message = template
      .replace('{kpi_name}', 'Taux de vaccination')
      .replace('{value}', '45%')
      .replace('{change}', '-15%')
      .replace('{threshold}', '80%');

    expect(message).toContain('Taux de vaccination');
    expect(message).toContain('45%');
    expect(message).toContain('-15%');
    expect(message).toContain('80%');
  });
});

describe('Bulk SMS', () => {
  it('should handle empty bulk send request', async () => {
    const smsService = new SMSServiceClass();
    const result = await smsService.sendBulk([]);

    expect(result.total).toBe(0);
    expect(result.sent).toBe(0);
    expect(result.failed).toBe(0);
  });
});
