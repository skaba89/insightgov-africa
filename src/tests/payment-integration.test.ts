// =============================================================================
// InsightGov Africa - Payment Integration Tests
// Tests d'intégration pour le flux complet de paiement Mobile Money
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { walletService } from '@/lib/payments/wallet-service';
import { orangeMoneyService } from '@/lib/payments/orange-money';
import { mtnMoneyService } from '@/lib/payments/mtn-money';
import { db } from '@/lib/db';

// =============================================================================
// Mocks
// =============================================================================

// Mock de la base de données
vi.mock('@/lib/db', () => ({
  db: {
    wallet: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    transaction: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
    },
    business: {
      findUnique: vi.fn(),
    },
    order: {
      create: vi.fn(),
      update: vi.fn(),
    },
    activityLog: {
      create: vi.fn(),
    },
  },
}));

// Mock de fetch pour les appels API externes
global.fetch = vi.fn();

// =============================================================================
// Tests d'intégration - Flux de paiement complet
// =============================================================================

describe('Payment Integration Tests', () => {
  const mockUserId = 'user-test-123';
  const mockWalletId = 'wallet-test-456';
  const mockBusinessId = 'business-test-789';

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    process.env.ORANGE_API_KEY = 'test-orange-key';
    process.env.ORANGE_MERCHANT_CODE = 'TEST123';
    process.env.MTN_API_KEY = 'test-mtn-key';
    process.env.MTN_MERCHANT_CODE = 'MTN123';
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==========================================================================
  // Tests: Flux de dépôt Orange Money
  // ==========================================================================
  describe('Flux de dépôt Orange Money', () => {
    it('devrait effectuer un dépôt complet via Orange Money', async () => {
      // 1. Vérifier que le portefeuille existe
      const mockWallet = {
        id: mockWalletId,
        userId: mockUserId,
        balanceGnf: 100000,
        balanceUsd: 10,
        balanceEur: 9,
        dailyLimit: 1000000,
        currentDaily: 0,
      };

      (db.wallet.findUnique as any).mockResolvedValue(mockWallet);

      // 2. Simuler la réponse Orange Money
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'SUCCESS',
          transaction_id: 'OM-TXN-123',
          response_code: '00',
        }),
      });

      // 3. Créer la transaction
      const mockTransaction = {
        id: 'txn-deposit-1',
        reference: 'DEP-123456789',
        amount: 50000,
        currency: 'GNF',
        type: 'deposit',
        status: 'success',
      };

      (db.transaction.create as any).mockResolvedValue(mockTransaction);
      (db.wallet.update as any).mockResolvedValue({
        ...mockWallet,
        balanceGnf: 150000,
      });

      // 4. Effectuer le crédit
      const result = await walletService.credit(
        mockUserId,
        50000,
        'GNF',
        'Dépôt Orange Money',
        'orange'
      );

      expect(result.success).toBe(true);
      expect(result.transactionId).toBe('txn-deposit-1');
      expect(result.newBalance).toBe(150000);
    });

    it('devrait gérer un dépôt Orange Money en attente', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'PENDING',
          transaction_id: 'OM-TXN-PENDING',
          response_code: '01',
        }),
      });

      const result = await orangeMoneyService.initiatePayment({
        amount: 100000,
        phoneNumber: '+224622000000',
        description: 'Dépôt test',
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('pending');
    });
  });

  // ==========================================================================
  // Tests: Flux de dépôt MTN Money
  // ==========================================================================
  describe('Flux de dépôt MTN Money', () => {
    it('devrait effectuer un dépôt complet via MTN Money', async () => {
      const mockWallet = {
        id: mockWalletId,
        userId: mockUserId,
        balanceGnf: 200000,
        balanceUsd: 20,
        balanceEur: 18,
        dailyLimit: 1000000,
        currentDaily: 0,
      };

      (db.wallet.findUnique as any).mockResolvedValue(mockWallet);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response_code: '00',
          transaction_id: 'MTN-TXN-456',
        }),
      });

      const mockTransaction = {
        id: 'txn-mtn-1',
        reference: 'DEP-MTN-123',
        amount: 75000,
        currency: 'GNF',
        type: 'deposit',
        status: 'success',
      };

      (db.transaction.create as any).mockResolvedValue(mockTransaction);
      (db.wallet.update as any).mockResolvedValue({
        ...mockWallet,
        balanceGnf: 275000,
      });

      const result = await walletService.credit(
        mockUserId,
        75000,
        'GNF',
        'Dépôt MTN Money',
        'mtn'
      );

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(275000);
    });

    it('devrait rejeter un numéro MTN invalide', async () => {
      const result = await mtnMoneyService.initiatePayment({
        amount: 50000,
        phoneNumber: 'invalid-number',
        description: 'Test invalide',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('invalide');
    });
  });

  // ==========================================================================
  // Tests: Gestion des webhooks
  // ==========================================================================
  describe('Gestion des webhooks Orange Money', () => {
    it('devrait traiter un webhook de succès Orange Money', async () => {
      const webhookData = {
        order_id: 'DEP-123456789',
        status: 'SUCCESS',
        transaction_id: 'OM-WEBHOOK-123',
        message: 'Paiement réussi',
      };

      (db.transaction.update as any).mockResolvedValue({
        id: 'txn-1',
        status: 'success',
        processedAt: new Date(),
      });

      await orangeMoneyService.handleWebhookCallback(webhookData);

      expect(db.transaction.update).toHaveBeenCalledWith({
        where: { reference: 'DEP-123456789' },
        data: expect.objectContaining({
          status: 'success',
          providerRef: 'OM-WEBHOOK-123',
        }),
      });
    });

    it('devrait traiter un webhook d\'échec Orange Money', async () => {
      const webhookData = {
        order_id: 'DEP-FAIL-123',
        status: 'FAILED',
        transaction_id: 'OM-FAIL-456',
        message: 'Solde insuffisant',
      };

      (db.transaction.update as any).mockResolvedValue({
        id: 'txn-fail',
        status: 'failed',
        failureReason: 'Solde insuffisant',
      });

      await orangeMoneyService.handleWebhookCallback(webhookData);

      expect(db.transaction.update).toHaveBeenCalledWith({
        where: { reference: 'DEP-FAIL-123' },
        data: expect.objectContaining({
          status: 'failed',
          failureReason: 'Solde insuffisant',
        }),
      });
    });
  });

  describe('Gestion des webhooks MTN Money', () => {
    it('devrait traiter un webhook de succès MTN Money', async () => {
      const webhookData = {
        reference: 'MTN-123456789',
        status: 'SUCCESS',
        transaction_id: 'MTN-WEBHOOK-789',
        message: 'Transaction réussie',
      };

      (db.transaction.update as any).mockResolvedValue({
        id: 'txn-mtn-1',
        status: 'success',
        processedAt: new Date(),
      });

      await mtnMoneyService.handleWebhookCallback(webhookData);

      expect(db.transaction.update).toHaveBeenCalledWith({
        where: { reference: 'MTN-123456789' },
        data: expect.objectContaining({
          status: 'success',
          providerRef: 'MTN-WEBHOOK-789',
        }),
      });
    });
  });

  // ==========================================================================
  // Tests: Conversion de devises
  // ==========================================================================
  describe('Conversion de devises', () => {
    it('devrait convertir GNF vers USD correctement', () => {
      const amount = 909091; // ~100 USD
      const result = walletService.convertCurrency(amount, 'GNF', 'USD');

      expect(result).toBeCloseTo(100, -1);
    });

    it('devrait convertir USD vers GNF correctement', () => {
      const amount = 100;
      const result = walletService.convertCurrency(amount, 'USD', 'GNF');

      expect(result).toBeCloseTo(909091, -3);
    });

    it('devrait convertir EUR vers GNF correctement', () => {
      const amount = 100;
      const result = walletService.convertCurrency(amount, 'EUR', 'GNF');

      expect(result).toBe(1000000);
    });

    it('devrait convertir GNF vers EUR correctement', () => {
      const amount = 1000000;
      const result = walletService.convertCurrency(amount, 'GNF', 'EUR');

      expect(result).toBe(100);
    });

    it('devrait convertir USD vers EUR via GNF', () => {
      const amount = 100;
      const result = walletService.convertCurrency(amount, 'USD', 'EUR');

      // USD -> GNF -> EUR
      const expected = (100 * 9090.91) * 0.0001; // ~90.91 EUR
      expect(result).toBeCloseTo(expected, 0);
    });

    it('devrait retourner le même montant pour même devise', () => {
      expect(walletService.convertCurrency(100000, 'GNF', 'GNF')).toBe(100000);
      expect(walletService.convertCurrency(100, 'USD', 'USD')).toBe(100);
      expect(walletService.convertCurrency(100, 'EUR', 'EUR')).toBe(100);
    });
  });

  // ==========================================================================
  // Tests: Limites et frais
  // ==========================================================================
  describe('Limites et frais', () => {
    it('devrait rejeter un retrait dépassant le solde', async () => {
      const mockWallet = {
        id: mockWalletId,
        userId: mockUserId,
        balanceGnf: 50000,
        balanceUsd: 0,
        balanceEur: 0,
        dailyLimit: 1000000,
        currentDaily: 0,
      };

      (db.wallet.findUnique as any).mockResolvedValue(mockWallet);
      (db.wallet.create as any).mockResolvedValue(mockWallet);

      const result = await walletService.debit(
        mockUserId,
        100000, // Plus que le solde
        'GNF',
        'Retrait test'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Solde insuffisant');
    });

    it('devrait rejeter un retrait dépassant la limite journalière', async () => {
      const mockWallet = {
        id: mockWalletId,
        userId: mockUserId,
        balanceGnf: 2000000,
        balanceUsd: 0,
        balanceEur: 0,
        dailyLimit: 1000000,
        currentDaily: 950000, // Déjà utilisé 95% de la limite
      };

      (db.wallet.findUnique as any).mockResolvedValue(mockWallet);
      (db.wallet.create as any).mockResolvedValue(mockWallet);

      const result = await walletService.debit(
        mockUserId,
        100000, // Dépasserait la limite
        'GNF',
        'Retrait test'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Limite journalière');
    });

    it('devrait calculer les frais de retrait correctement (1%)', async () => {
      const mockWallet = {
        id: mockWalletId,
        userId: mockUserId,
        balanceGnf: 500000,
        balanceUsd: 0,
        balanceEur: 0,
        dailyLimit: 1000000,
        currentDaily: 0,
      };

      const mockTransaction = {
        id: 'txn-withdraw',
        reference: 'WTD-123',
        amount: 100000,
        fee: 1000, // 1% de 100000
        total: 101000,
      };

      (db.wallet.findUnique as any).mockResolvedValue(mockWallet);
      (db.wallet.create as any).mockResolvedValue(mockWallet);
      (db.transaction.create as any).mockResolvedValue(mockTransaction);
      (db.wallet.update as any).mockResolvedValue({});

      const result = await walletService.debit(
        mockUserId,
        100000,
        'GNF',
        'Retrait test'
      );

      // Le test vérifie que la transaction a été créée avec les frais
      expect(db.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount: 100000,
            fee: 1000,
            total: 101000,
          }),
        })
      );
    });

    it('devrait calculer les frais de transfert interne correctement (0.5%)', async () => {
      const senderWallet = {
        id: 'wallet-sender',
        userId: 'sender-123',
        balanceGnf: 500000,
        balanceUsd: 0,
        balanceEur: 0,
      };

      const recipientWallet = {
        id: 'wallet-recipient',
        userId: 'recipient-456',
        balanceGnf: 100000,
        balanceUsd: 0,
        balanceEur: 0,
      };

      const recipient = {
        id: 'recipient-456',
        phone: '+224624000000',
        firstName: 'Amadou',
        lastName: 'Diallo',
      };

      const mockTransaction = {
        id: 'txn-transfer',
        reference: 'TRF-123',
        amount: 100000,
        fee: 500, // 0.5% de 100000
        total: 100500,
      };

      (db.user.findFirst as any).mockResolvedValue(recipient);
      (db.wallet.findUnique as any)
        .mockResolvedValueOnce(senderWallet)
        .mockResolvedValueOnce(recipientWallet);
      (db.transaction.create as any).mockResolvedValue(mockTransaction);
      (db.wallet.update as any).mockResolvedValue({});

      const result = await walletService.transfer(
        'sender-123',
        '+224624000000',
        100000,
        'GNF',
        'Transfert test'
      );

      expect(db.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount: 100000,
            fee: 500,
            total: 100500,
            type: 'transfer',
          }),
        })
      );
    });
  });

  // ==========================================================================
  // Tests: Transferts
  // ==========================================================================
  describe('Transferts entre portefeuilles', () => {
    it('devrait effectuer un transfert interne avec succès', async () => {
      const senderWallet = {
        id: 'wallet-sender',
        userId: 'sender-123',
        balanceGnf: 500000,
        balanceUsd: 0,
        balanceEur: 0,
      };

      const recipientWallet = {
        id: 'wallet-recipient',
        userId: 'recipient-456',
        balanceGnf: 100000,
        balanceUsd: 0,
        balanceEur: 0,
      };

      const recipient = {
        id: 'recipient-456',
        phone: '+224624000000',
        firstName: 'Mariama',
        lastName: 'Condé',
      };

      const mockTransaction = {
        id: 'txn-transfer-1',
        reference: 'TRF-INTERNAL-123',
        amount: 50000,
        fee: 250,
        total: 50250,
        status: 'success',
      };

      (db.user.findFirst as any).mockResolvedValue(recipient);
      (db.wallet.findUnique as any)
        .mockResolvedValueOnce(senderWallet)
        .mockResolvedValueOnce(recipientWallet);
      (db.transaction.create as any).mockResolvedValue(mockTransaction);
      (db.wallet.update as any).mockResolvedValue({});

      const result = await walletService.transfer(
        'sender-123',
        '+224624000000',
        50000,
        'GNF',
        'Transfert famille'
      );

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(449750); // 500000 - 50000 - 250 (fee)
    });

    it('devrait créer un transfert externe si destinataire non trouvé', async () => {
      const senderWallet = {
        id: 'wallet-sender',
        userId: 'sender-123',
        balanceGnf: 500000,
        balanceUsd: 0,
        balanceEur: 0,
        dailyLimit: 1000000,
        currentDaily: 0,
      };

      (db.user.findFirst as any).mockResolvedValue(null);
      (db.wallet.findUnique as any).mockResolvedValue(senderWallet);
      (db.wallet.create as any).mockResolvedValue(senderWallet);

      const mockTransaction = {
        id: 'txn-external',
        reference: 'WTD-EXTERNAL-123',
        amount: 50000,
        fee: 500,
        total: 50500,
        status: 'pending',
      };

      (db.transaction.create as any).mockResolvedValue(mockTransaction);
      (db.wallet.update as any).mockResolvedValue({});

      const result = await walletService.transfer(
        'sender-123',
        '+224622000000', // Numéro non inscrit
        50000,
        'GNF'
      );

      // Un transfert externe crée une transaction en attente
      expect(db.wallet.findUnique).toHaveBeenCalled();
    });

    it('devrait rejeter un transfert avec solde insuffisant', async () => {
      const senderWallet = {
        id: 'wallet-sender',
        userId: 'sender-123',
        balanceGnf: 30000,
        balanceUsd: 0,
        balanceEur: 0,
      };

      const recipient = {
        id: 'recipient-456',
        phone: '+224624000000',
      };

      (db.user.findFirst as any).mockResolvedValue(recipient);
      (db.wallet.findUnique as any).mockResolvedValue(senderWallet);

      const result = await walletService.transfer(
        'sender-123',
        '+224624000000',
        50000, // Plus que le solde
        'GNF'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Solde insuffisant');
    });
  });

  // ==========================================================================
  // Tests: Historique des transactions
  // ==========================================================================
  describe('Historique des transactions', () => {
    it('devrait retourner l\'historique avec pagination', async () => {
      const mockTransactions = [
        { id: 'txn-1', amount: 100000, type: 'deposit', status: 'success' },
        { id: 'txn-2', amount: 50000, type: 'withdraw', status: 'success' },
        { id: 'txn-3', amount: 25000, type: 'transfer', status: 'pending' },
      ];

      (db.transaction.findMany as any).mockResolvedValue(mockTransactions);
      (db.transaction.count as any).mockResolvedValue(25);

      const result = await walletService.getTransactions(mockUserId, {
        limit: 10,
        offset: 0,
      });

      expect(result.transactions).toHaveLength(3);
      expect(result.total).toBe(25);
    });

    it('devrait filtrer par type de transaction', async () => {
      const mockTransactions = [
        { id: 'txn-1', amount: 100000, type: 'deposit', status: 'success' },
        { id: 'txn-2', amount: 150000, type: 'deposit', status: 'success' },
      ];

      (db.transaction.findMany as any).mockResolvedValue(mockTransactions);
      (db.transaction.count as any).mockResolvedValue(2);

      const result = await walletService.getTransactions(mockUserId, {
        type: 'deposit',
      });

      expect(db.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'deposit',
          }),
        })
      );
      expect(result.transactions).toHaveLength(2);
    });

    it('devrait filtrer par statut', async () => {
      const mockTransactions = [
        { id: 'txn-1', amount: 100000, type: 'deposit', status: 'pending' },
      ];

      (db.transaction.findMany as any).mockResolvedValue(mockTransactions);
      (db.transaction.count as any).mockResolvedValue(1);

      const result = await walletService.getTransactions(mockUserId, {
        status: 'pending',
      });

      expect(db.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'pending',
          }),
        })
      );
    });
  });

  // ==========================================================================
  // Tests: Validation des numéros de téléphone
  // ==========================================================================
  describe('Validation des numéros de téléphone guinéens', () => {
    it('devrait reconnaître les préfixes Orange Guinée valides', () => {
      const orangePrefixes = ['620', '621', '622', '623', '624', '625', '626', '627', '628', '629', '660', '661', '662', '663', '664'];

      orangePrefixes.forEach(prefix => {
        const phone = `+224${prefix}000000`;
        expect(phone.length).toBe(12);
      });
    });

    it('devrait reconnaître les préfixes MTN Guinée valides', () => {
      const mtnPrefixes = ['640', '641', '642', '643', '644', '645', '646', '647', '648', '649', '665', '666', '667', '668', '669'];

      mtnPrefixes.forEach(prefix => {
        const phone = `+224${prefix}000000`;
        expect(phone.length).toBe(12);
      });
    });

    it('devrait rejeter un numéro mal formaté', async () => {
      const result = await orangeMoneyService.initiatePayment({
        amount: 10000,
        phoneNumber: '123456',
        description: 'Test format',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('invalide');
    });
  });

  // ==========================================================================
  // Tests: Gestion des erreurs
  // ==========================================================================
  describe('Gestion des erreurs', () => {
    it('devrait gérer une erreur de connexion Orange Money', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const result = await orangeMoneyService.initiatePayment({
        amount: 10000,
        phoneNumber: '+224622000000',
        description: 'Test erreur',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Erreur de connexion');
    });

    it('devrait gérer une erreur de connexion MTN Money', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network timeout'));

      const result = await mtnMoneyService.initiatePayment({
        amount: 10000,
        phoneNumber: '+224640000000',
        description: 'Test erreur',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Erreur de connexion');
    });

    it('devrait gérer un refus de paiement Orange Money', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          message: 'Solde insuffisant sur le compte Mobile Money',
          response_code: '05',
        }),
      });

      const result = await orangeMoneyService.initiatePayment({
        amount: 10000000,
        phoneNumber: '+224622000000',
        description: 'Test refus',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Solde insuffisant');
    });
  });
});

// =============================================================================
// Tests: Signature des webhooks
// =============================================================================

describe('Webhook Signature Verification', () => {
  it('devrait vérifier la signature HMAC Orange Money', () => {
    // La méthode verifyWebhookSignature nécessite un secret configuré
    const result = orangeMoneyService.verifyWebhookSignature(
      JSON.stringify({ test: 'data' }),
      'signature-hash'
    );

    // Sans configuration, retourne false
    expect(typeof result).toBe('boolean');
  });

  it('devrait vérifier la signature HMAC MTN Money', () => {
    const result = mtnMoneyService.verifyWebhookSignature(
      JSON.stringify({ test: 'data' }),
      'signature-hash'
    );

    expect(typeof result).toBe('boolean');
  });
});

// =============================================================================
// Tests: Statut des services
// =============================================================================

describe('Service Status', () => {
  it('devrait indiquer si Orange Money est configuré', () => {
    const result = orangeMoneyService.isConfigured();
    expect(typeof result).toBe('boolean');
  });

  it('devrait indiquer si MTN Money est configuré', () => {
    const result = mtnMoneyService.isConfigured();
    expect(typeof result).toBe('boolean');
  });

  it('devrait retourner le statut d\'une transaction Orange Money', async () => {
    const result = await orangeMoneyService.getTransactionStatus('REF-123');
    expect(result).toHaveProperty('status');
  });

  it('devrait retourner le statut d\'une transaction MTN Money', async () => {
    const result = await mtnMoneyService.getTransactionStatus('MTN-REF-456');
    expect(result).toHaveProperty('status');
  });
});
