// =============================================================================
// InsightGov Africa - Wallet Service Tests
// Tests unitaires pour le service de portefeuille électronique
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { walletService } from '@/lib/payments/wallet-service';
import { db } from '@/lib/db';

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
      count: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
    },
  },
}));

describe('WalletService', () => {
  const mockUserId = 'user-test-123';
  const mockWalletId = 'wallet-test-456';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ==========================================================================
  // Tests: getOrCreateWallet
  // ==========================================================================
  describe('getOrCreateWallet', () => {
    it('devrait retourner un portefeuille existant', async () => {
      const mockWallet = {
        id: mockWalletId,
        userId: mockUserId,
        balanceGnf: 500000,
        balanceUsd: 50,
        balanceEur: 45,
      };

      (db.wallet.findUnique as any).mockResolvedValue(mockWallet);

      const result = await walletService.getOrCreateWallet(mockUserId);

      expect(db.wallet.findUnique).toHaveBeenCalledWith({
        where: { userId: mockUserId },
      });
      expect(result).toEqual(mockWallet);
    });

    it('devrait créer un nouveau portefeuille si inexistant', async () => {
      const mockNewWallet = {
        id: mockWalletId,
        userId: mockUserId,
        balanceGnf: 0,
        balanceUsd: 0,
        balanceEur: 0,
      };

      (db.wallet.findUnique as any).mockResolvedValue(null);
      (db.wallet.create as any).mockResolvedValue(mockNewWallet);

      const result = await walletService.getOrCreateWallet(mockUserId);

      expect(db.wallet.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          balanceGnf: 0,
          balanceUsd: 0,
          balanceEur: 0,
        },
      });
      expect(result).toEqual(mockNewWallet);
    });
  });

  // ==========================================================================
  // Tests: getBalance
  // ==========================================================================
  describe('getBalance', () => {
    it('devrait retourner les soldes dans les 3 devises', async () => {
      const mockWallet = {
        id: mockWalletId,
        userId: mockUserId,
        balanceGnf: 1500000,
        balanceUsd: 165,
        balanceEur: 150,
      };

      (db.wallet.findUnique as any).mockResolvedValue(mockWallet);
      (db.wallet.create as any).mockResolvedValue(mockWallet);

      const balance = await walletService.getBalance(mockUserId);

      expect(balance).toEqual({
        gnf: 1500000,
        usd: 165,
        eur: 150,
      });
    });
  });

  // ==========================================================================
  // Tests: credit (dépôt)
  // ==========================================================================
  describe('credit', () => {
    it('devrait créditer le portefeuille en GNF', async () => {
      const mockWallet = {
        id: mockWalletId,
        userId: mockUserId,
        balanceGnf: 500000,
        balanceUsd: 0,
        balanceEur: 0,
      };

      const mockTransaction = {
        id: 'txn-123',
        reference: 'DEP-test',
        amount: 100000,
      };

      (db.wallet.findUnique as any).mockResolvedValue(mockWallet);
      (db.wallet.create as any).mockResolvedValue(mockWallet);
      (db.transaction.create as any).mockResolvedValue(mockTransaction);
      (db.wallet.update as any).mockResolvedValue({
        ...mockWallet,
        balanceGnf: 600000,
      });

      const result = await walletService.credit(
        mockUserId,
        100000,
        'GNF',
        'Dépôt Orange Money',
        'orange'
      );

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(600000);
    });

    it('devrait créditer le portefeuille en USD', async () => {
      const mockWallet = {
        id: mockWalletId,
        userId: mockUserId,
        balanceGnf: 0,
        balanceUsd: 100,
        balanceEur: 0,
      };

      const mockTransaction = {
        id: 'txn-123',
        reference: 'DEP-usd',
        amount: 50,
      };

      (db.wallet.findUnique as any).mockResolvedValue(mockWallet);
      (db.wallet.create as any).mockResolvedValue(mockWallet);
      (db.transaction.create as any).mockResolvedValue(mockTransaction);
      (db.wallet.update as any).mockResolvedValue({
        ...mockWallet,
        balanceUsd: 150,
      });

      const result = await walletService.credit(
        mockUserId,
        50,
        'USD',
        'Dépôt USD'
      );

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(150);
    });
  });

  // ==========================================================================
  // Tests: debit (retrait)
  // ==========================================================================
  describe('debit', () => {
    it('devrait échouer si solde insuffisant', async () => {
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
        'Retrait'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Solde insuffisant');
    });

    it('devrait échouer si limite journalière dépassée', async () => {
      const mockWallet = {
        id: mockWalletId,
        userId: mockUserId,
        balanceGnf: 2000000,
        balanceUsd: 0,
        balanceEur: 0,
        dailyLimit: 1000000,
        currentDaily: 950000,
      };

      (db.wallet.findUnique as any).mockResolvedValue(mockWallet);
      (db.wallet.create as any).mockResolvedValue(mockWallet);

      const result = await walletService.debit(
        mockUserId,
        100000, // Dépasserait la limite
        'GNF',
        'Retrait'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Limite journalière');
    });

    it('devrait débiter avec succès', async () => {
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
        id: 'txn-456',
        reference: 'WTD-test',
        amount: 100000,
        fee: 1000,
      };

      (db.wallet.findUnique as any).mockResolvedValue(mockWallet);
      (db.wallet.create as any).mockResolvedValue(mockWallet);
      (db.transaction.create as any).mockResolvedValue(mockTransaction);
      (db.wallet.update as any).mockResolvedValue({
        ...mockWallet,
        balanceGnf: 399000,
      });

      const result = await walletService.debit(
        mockUserId,
        100000,
        'GNF',
        'Retrait MTN Money',
        '+224624000000',
        'mtn'
      );

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(399000);
    });
  });

  // ==========================================================================
  // Tests: transfer
  // ==========================================================================
  describe('transfer', () => {
    it('devrait transférer vers un utilisateur interne', async () => {
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
        reference: 'TRF-test',
        amount: 50000,
        fee: 250,
      };

      (db.user.findFirst as any).mockResolvedValue(recipient);
      (db.wallet.findUnique as any)
        .mockResolvedValueOnce(senderWallet)
        .mockResolvedValueOnce(recipientWallet);
      (db.wallet.create as any).mockResolvedValue(senderWallet);
      (db.transaction.create as any).mockResolvedValue(mockTransaction);
      (db.wallet.update as any).mockResolvedValue({});

      const result = await walletService.transfer(
        'sender-123',
        '+224624000000',
        50000,
        'GNF',
        'Transfert test'
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

      // Devrait appeler debit pour un transfert externe
      const result = await walletService.transfer(
        'sender-123',
        '+224622000000',
        50000,
        'GNF'
      );

      // Le transfert externe crée une transaction en attente
      expect(db.wallet.findUnique).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Tests: getTransactions
  // ==========================================================================
  describe('getTransactions', () => {
    it('devrait retourner les transactions avec pagination', async () => {
      const mockTransactions = [
        { id: 'txn-1', amount: 100000, type: 'deposit' },
        { id: 'txn-2', amount: 50000, type: 'withdraw' },
      ];

      (db.transaction.findMany as any).mockResolvedValue(mockTransactions);
      (db.transaction.count as any).mockResolvedValue(25);

      const result = await walletService.getTransactions(mockUserId, {
        limit: 10,
        offset: 0,
      });

      expect(result.transactions).toHaveLength(2);
      expect(result.total).toBe(25);
    });

    it('devrait filtrer par type', async () => {
      const mockTransactions = [
        { id: 'txn-1', amount: 100000, type: 'deposit' },
      ];

      (db.transaction.findMany as any).mockResolvedValue(mockTransactions);
      (db.transaction.count as any).mockResolvedValue(1);

      const result = await walletService.getTransactions(mockUserId, {
        type: 'deposit',
      });

      expect(result.transactions).toHaveLength(1);
    });
  });

  // ==========================================================================
  // Tests: convertCurrency
  // ==========================================================================
  describe('convertCurrency', () => {
    it('devrait convertir GNF vers USD', () => {
      const result = walletService.convertCurrency(909091, 'GNF', 'USD');
      expect(result).toBeCloseTo(100, 0);
    });

    it('devrait convertir USD vers GNF', () => {
      const result = walletService.convertCurrency(100, 'USD', 'GNF');
      expect(result).toBeCloseTo(909091, 0);
    });

    it('devrait convertir EUR vers GNF', () => {
      const result = walletService.convertCurrency(100, 'EUR', 'GNF');
      expect(result).toBe(1000000);
    });

    it('devrait retourner le même montant si même devise', () => {
      const result = walletService.convertCurrency(100000, 'GNF', 'GNF');
      expect(result).toBe(100000);
    });
  });
});
