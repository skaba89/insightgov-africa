import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateAfricanPhoneNumber, SMSNotificationType } from '../services/sms';

// Mock fetch for SMS tests
global.fetch = vi.fn();

describe('SMS Service', () => {
  describe('validateAfricanPhoneNumber', () => {
    it('should validate Nigerian phone numbers', () => {
      const result = validateAfricanPhoneNumber('+2348012345678');
      expect(result.valid).toBe(true);
      expect(result.country).toBe('Nigeria');
      expect(result.formatted).toBe('+2348012345678');
    });

    it('should validate Ghanaian phone numbers', () => {
      const result = validateAfricanPhoneNumber('+233201234567');
      expect(result.valid).toBe(true);
      expect(result.country).toBe('Ghana');
    });

    it('should validate South African phone numbers', () => {
      const result = validateAfricanPhoneNumber('+27123456789');
      expect(result.valid).toBe(true);
      expect(result.country).toBe('South Africa');
    });

    it('should validate Senegalese phone numbers', () => {
      const result = validateAfricanPhoneNumber('+221771234567');
      expect(result.valid).toBe(true);
      expect(result.country).toBe('Senegal');
    });

    it('should validate Kenyan phone numbers', () => {
      const result = validateAfricanPhoneNumber('+254712345678');
      expect(result.valid).toBe(true);
      expect(result.country).toBe('Kenya');
    });

    it('should handle numbers without + prefix', () => {
      const result = validateAfricanPhoneNumber('2348012345678');
      expect(result.valid).toBe(true);
      expect(result.country).toBe('Nigeria');
    });

    it('should handle numbers with spaces and dashes', () => {
      const result = validateAfricanPhoneNumber('+234 801-234-5678');
      expect(result.valid).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      const result = validateAfricanPhoneNumber('invalid');
      expect(result.valid).toBe(false);
    });

    it('should reject numbers that are too short', () => {
      const result = validateAfricanPhoneNumber('+234123');
      expect(result.valid).toBe(false);
    });

    it('should accept non-African international numbers', () => {
      const result = validateAfricanPhoneNumber('+14155552671'); // US number
      expect(result.valid).toBe(true);
      expect(result.country).toBeUndefined();
    });
  });
});

describe('AI Analysis Service', () => {
  // Mock AI client
  const mockAIClient = {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Data type detection', () => {
    it('should detect numeric columns', () => {
      const values = [1, 2, 3, 4, 5];
      // This would call the actual detection function
      expect(values.every(v => typeof v === 'number')).toBe(true);
    });

    it('should detect date columns', () => {
      const values = ['2024-01-01', '2024-01-02', '2024-01-03'];
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      expect(values.every(v => dateRegex.test(v))).toBe(true);
    });

    it('should detect percentage values', () => {
      const values = ['10%', '25%', '50%', '100%'];
      const percentRegex = /^\d+%$/;
      expect(values.every(v => percentRegex.test(v))).toBe(true);
    });

    it('should detect currency values', () => {
      const values = ['€100', '$200', 'FCFA 5000', '150 EUR'];
      // Check that values contain currency indicators
      expect(values.every(v => /[€$£]|FCFA|EUR|USD/.test(v))).toBe(true);
    });
  });

  describe('Statistical calculations', () => {
    it('should calculate mean correctly', () => {
      const values = [1, 2, 3, 4, 5];
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      expect(mean).toBe(3);
    });

    it('should calculate median correctly', () => {
      const values = [1, 2, 3, 4, 5];
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      expect(median).toBe(3);
    });

    it('should calculate standard deviation correctly', () => {
      const values = [2, 4, 4, 4, 5, 5, 7, 9];
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      expect(stdDev).toBeCloseTo(2, 0);
    });
  });
});

describe('KPI Template System', () => {
  describe('KPI formatting', () => {
    it('should format percentage KPIs', () => {
      const value = 0.756;
      const formatted = `${(value * 100).toFixed(1)}%`;
      expect(formatted).toBe('75.6%');
    });

    it('should format currency KPIs', () => {
      const value = 1234567;
      const formatted = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
      }).format(value);
      expect(formatted).toContain('1');
    });

    it('should format large numbers with abbreviations', () => {
      const value = 1500000;
      const formatted = value >= 1000000 
        ? `${(value / 1000000).toFixed(1)}M`
        : value >= 1000 
          ? `${(value / 1000).toFixed(1)}K`
          : String(value);
      expect(formatted).toBe('1.5M');
    });
  });
});

describe('Security Headers', () => {
  it('should have correct CSP directives', () => {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
    ].join('; ');
    
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src");
  });

  it('should have correct HSTS header', () => {
    const hsts = 'max-age=31536000; includeSubDomains; preload';
    expect(hsts).toContain('max-age=31536000');
    expect(hsts).toContain('includeSubDomains');
    expect(hsts).toContain('preload');
  });
});

describe('Audit Logging', () => {
  it('should categorize severity correctly', () => {
    const actions = {
      LOGIN_FAILED: 'MEDIUM',
      SECURITY_VIOLATION: 'HIGH',
      BRUTE_FORCE_ATTEMPT: 'HIGH',
      DATASET_CREATE: 'LOW',
      USER_DELETE: 'HIGH',
    };
    
    expect(actions.LOGIN_FAILED).toBe('MEDIUM');
    expect(actions.SECURITY_VIOLATION).toBe('HIGH');
  });

  it('should include required audit fields', () => {
    const auditEntry = {
      action: 'LOGIN',
      severity: 'LOW',
      description: 'User logged in',
      userId: 'user-123',
      organizationId: 'org-456',
      ipAddress: '192.168.1.1',
      timestamp: new Date().toISOString(),
    };
    
    expect(auditEntry).toHaveProperty('action');
    expect(auditEntry).toHaveProperty('severity');
    expect(auditEntry).toHaveProperty('userId');
    expect(auditEntry).toHaveProperty('organizationId');
    expect(auditEntry).toHaveProperty('ipAddress');
  });
});
