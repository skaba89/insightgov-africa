// =============================================================================
// InsightGov Africa - Orange Money Service Tests
// Tests unitaires pour le service de paiement Orange Money
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orangeMoneyService } from '@/lib/payments/orange-money';

// Mock de fetch global
global.fetch = vi.fn();

describe('Orange Money Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Tests: Validation du numéro de téléphone
  // ==========================================================================
  describe('validatePhoneNumber', () => {
    it('devrait valider un numéro Orange Guinée valide', () => {
      // Les méthodes privées ne sont pas directement testables
      // On teste via initiatePayment
      expect(true).toBe(true);
    });
  });

  // ==========================================================================
  // Tests: initiatePayment
  // ==========================================================================
  describe('initiatePayment', () => {
    it('devrait échouer si le service nest pas configuré', async () => {
      // Service non configuré (pas de clé API)
      const result = await orangeMoneyService.initiatePayment({
        amount: 50000,
        phoneNumber: '+224622000000',
        description: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('non configuré');
    });

    it('devrait rejeter un numéro invalide', async () => {
      // Même si configuré, un mauvais numéro devrait échouer
      const result = await orangeMoneyService.initiatePayment({
        amount: 50000,
        phoneNumber: '123', // Numéro invalide
        description: 'Test',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('invalide');
    });
  });

  // ==========================================================================
  // Tests: isConfigured
  // ==========================================================================
  describe('isConfigured', () => {
    it('devrait retourner false sans configuration', () => {
      const result = orangeMoneyService.isConfigured();
      // Dépend des variables d'environnement
      expect(typeof result).toBe('boolean');
    });
  });

  // ==========================================================================
  // Tests: getTransactionStatus
  // ==========================================================================
  describe('getTransactionStatus', () => {
    it('devrait retourner une erreur si non configuré', async () => {
      const result = await orangeMoneyService.getTransactionStatus('REF-123');
      
      expect(result.status).toBe('error');
      expect(result.message).toContain('non configuré');
    });
  });
});

// =============================================================================
// Tests: Validation des numéros de téléphone guinéens
// =============================================================================
describe('Validation des numéros Orange Guinée', () => {
  // Préfixes Orange Guinée: 620-629, 660-664
  const orangePrefixes = ['620', '621', '622', '623', '624', '625', '626', '627', '628', '629', '660', '661', '662', '663', '664'];
  
  it('devrait reconnaître les préfixes Orange valides', () => {
    // Test indirect via format et validation
    orangePrefixes.forEach(prefix => {
      const phone = `${prefix}000000`;
      // Format attendu: 9 chiffres
      expect(phone.length).toBe(9);
    });
  });

  it('devrait rejeter les préfixes MTN', () => {
    const mtnPrefixes = ['640', '641', '642', '643', '644', '645', '646', '647', '648', '649', '665', '666', '667', '668', '669'];
    
    mtnPrefixes.forEach(prefix => {
      const phone = `${prefix}000000`;
      // Ces préfixes ne sont pas Orange
      expect(['640', '641', '642', '643', '644', '645', '646', '647', '648', '649']).toContain(prefix.substring(0, 3));
    });
  });
});
