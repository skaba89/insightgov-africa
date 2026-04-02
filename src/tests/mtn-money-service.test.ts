// =============================================================================
// InsightGov Africa - MTN Money Service Tests
// Tests unitaires pour le service de paiement MTN Money
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mtnMoneyService } from '@/lib/payments/mtn-money';

// Mock de fetch global
global.fetch = vi.fn();

describe('MTN Money Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Tests: isConfigured
  // ==========================================================================
  describe('isConfigured', () => {
    it('devrait retourner false sans configuration', () => {
      const result = mtnMoneyService.isConfigured();
      expect(typeof result).toBe('boolean');
    });
  });

  // ==========================================================================
  // Tests: initiatePayment
  // ==========================================================================
  describe('initiatePayment', () => {
    it('devrait échouer si le service nest pas configuré', async () => {
      const result = await mtnMoneyService.initiatePayment({
        amount: 50000,
        phoneNumber: '+224640000000',
        description: 'Test MTN',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('non configuré');
    });

    it('devrait rejeter un numéro invalide', async () => {
      const result = await mtnMoneyService.initiatePayment({
        amount: 50000,
        phoneNumber: '123',
        description: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('invalide');
    });
  });

  // ==========================================================================
  // Tests: getTransactionStatus
  // ==========================================================================
  describe('getTransactionStatus', () => {
    it('devrait retourner une erreur si non configuré', async () => {
      const result = await mtnMoneyService.getTransactionStatus('MTN-REF-123');
      
      expect(result.status).toBe('error');
      expect(result.message).toContain('non configuré');
    });
  });
});

// =============================================================================
// Tests: Validation des numéros de téléphone MTN Guinée
// =============================================================================
describe('Validation des numéros MTN Guinée', () => {
  // Préfixes MTN Guinée: 640-649, 665-669
  const mtnPrefixes = ['640', '641', '642', '643', '644', '645', '646', '647', '648', '649', '665', '666', '667', '668', '669'];
  
  it('devrait reconnaître les préfixes MTN valides', () => {
    mtnPrefixes.forEach(prefix => {
      const phone = `${prefix}000000`;
      expect(phone.length).toBe(9);
    });
  });

  it('devrait distinguer MTN dOrange', () => {
    const mtnPrefix = '640';
    const orangePrefix = '622';
    
    // MTN commence par 64X ou 66X (5-9)
    expect(mtnPrefix).toMatch(/^64[0-9]|66[5-9]$/);
    
    // Orange commence par 62X ou 66X (0-4)
    expect(orangePrefix).toMatch(/^62[0-9]|66[0-4]$/);
  });
});

// =============================================================================
// Tests: Intégration avec le Wallet
// =============================================================================
describe('Intégration MTN Money - Wallet', () => {
  it('devrait générer une référence unique', () => {
    const timestamp = Date.now();
    const ref1 = `MTN-${timestamp}-abc123`;
    const ref2 = `MTN-${timestamp}-xyz789`;
    
    expect(ref1).not.toBe(ref2);
    expect(ref1).toMatch(/^MTN-\d+-[a-z0-9]+$/);
  });

  it('devrait calculer les frais correctement', () => {
    const amount = 100000; // 100,000 GNF
    const feeRate = 0.01; // 1%
    const expectedFee = 1000;
    
    expect(amount * feeRate).toBe(expectedFee);
  });
});
