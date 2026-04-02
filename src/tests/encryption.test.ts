import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  encrypt,
  decrypt,
  hash,
  generateSecureToken,
  generateApiKey,
  secureCompare,
  maskSensitiveData,
  generateHmacSignature,
  verifyHmacSignature,
} from '../lib/encryption';

describe('Encryption Utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ENCRYPTION_KEY: 'test-encryption-key-32-characters!',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt a string correctly', () => {
      const plaintext = 'my-secret-data';
      const encrypted = encrypt(plaintext);
      
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted).toContain(':'); // Contains salt:iv:authTag:ciphertext
      
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext for same plaintext', () => {
      const plaintext = 'same-data';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);
      
      expect(encrypted1).not.toBe(encrypted2); // Different due to random salt/IV
    });

    it('should fail to decrypt with wrong format', () => {
      expect(() => decrypt('invalid-format')).toThrow();
    });

    it('should fail to decrypt with missing parts', () => {
      expect(() => decrypt('part1:part2:part3')).toThrow('Invalid encrypted data format');
    });
  });

  describe('hash', () => {
    it('should produce consistent SHA-256 hash', () => {
      const value = 'test-value';
      const hash1 = hash(value);
      const hash2 = hash(value);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex chars
    });

    it('should produce different hashes for different values', () => {
      const hash1 = hash('value1');
      const hash2 = hash('value2');
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateSecureToken', () => {
    it('should generate token of default length', () => {
      const token = generateSecureToken();
      expect(token).toHaveLength(64); // 32 bytes = 64 hex chars
    });

    it('should generate token of specified length', () => {
      const token = generateSecureToken(16);
      expect(token).toHaveLength(32); // 16 bytes = 32 hex chars
    });

    it('should generate unique tokens', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('generateApiKey', () => {
    it('should generate API key with default prefix', () => {
      const key = generateApiKey();
      expect(key).toMatch(/^iga_[A-Za-z0-9_-]+$/);
    });

    it('should generate API key with custom prefix', () => {
      const key = generateApiKey('custom_');
      expect(key).toMatch(/^custom_[A-Za-z0-9_-]+$/);
    });
  });

  describe('secureCompare', () => {
    it('should return true for equal strings', () => {
      expect(secureCompare('test', 'test')).toBe(true);
    });

    it('should return false for different strings', () => {
      expect(secureCompare('test1', 'test2')).toBe(false);
    });

    it('should return false for different lengths', () => {
      expect(secureCompare('short', 'longer-string')).toBe(false);
    });
  });

  describe('maskSensitiveData', () => {
    it('should mask data with default visible chars', () => {
      const result = maskSensitiveData('abcdefghij');
      expect(result).toBe('abcd****fghi');
    });

    it('should mask short strings completely', () => {
      const result = maskSensitiveData('ab');
      expect(result).toBe('**');
    });

    it('should respect custom visible chars', () => {
      const result = maskSensitiveData('abcdefghijklmnop', 6);
      expect(result.startsWith('abcdef')).toBe(true);
      expect(result.endsWith('nop')).toBe(true);
    });
  });

  describe('HMAC signatures', () => {
    const secret = 'test-secret';

    it('should generate valid HMAC signature', () => {
      const payload = 'test-payload';
      const signature = generateHmacSignature(payload, secret);
      
      expect(signature).toHaveLength(64);
      expect(signature).toMatch(/^[a-f0-9]+$/);
    });

    it('should verify valid HMAC signature', () => {
      const payload = 'test-payload';
      const signature = generateHmacSignature(payload, secret);
      
      expect(verifyHmacSignature(payload, signature, secret)).toBe(true);
    });

    it('should reject invalid HMAC signature', () => {
      const payload = 'test-payload';
      const signature = 'invalid-signature';
      
      expect(verifyHmacSignature(payload, signature, secret)).toBe(false);
    });

    it('should reject tampered payload', () => {
      const payload = 'test-payload';
      const signature = generateHmacSignature(payload, secret);
      
      expect(verifyHmacSignature('tampered-payload', signature, secret)).toBe(false);
    });
  });
});

describe('Input Validation Security', () => {
  it('should detect SQL injection patterns', async () => {
    const { detectSqlInjection } = await import('../lib/security-monitor');
    
    expect(detectSqlInjection("SELECT * FROM users")).toBe(true);
    expect(detectSqlInjection("'; DROP TABLE users; --")).toBe(true);
    expect(detectSqlInjection("1 OR 1=1")).toBe(true);
    expect(detectSqlInjection("Normal text")).toBe(false);
  });

  it('should detect XSS patterns', async () => {
    const { detectXss } = await import('../lib/security-monitor');
    
    expect(detectXss("<script>alert('xss')</script>")).toBe(true);
    expect(detectXss("<img src=x onerror=alert('xss')>")).toBe(true);
    expect(detectXss("javascript:alert('xss')")).toBe(true);
    expect(detectXss("Normal text")).toBe(false);
  });
});

describe('Rate Limiting', () => {
  it('should track rate limit correctly', async () => {
    const { detectBruteForce } = await import('../lib/security-monitor');
    
    // First attempts should not be blocked
    for (let i = 0; i < 4; i++) {
      const result = await detectBruteForce('test-user', '127.0.0.1');
      expect(result.isBlocked).toBe(false);
    }
    
    // 5th attempt should block
    const result = await detectBruteForce('test-user', '127.0.0.1');
    expect(result.isBlocked).toBe(true);
  });
});

// Import afterEach
import { afterEach } from 'vitest';
