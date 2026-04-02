// =============================================================================
// InsightGov Africa - Wallet Service
// Service de gestion des portefeuilles électroniques
// Support: GNF (Franc Guinéen), USD, EUR
// =============================================================================

import { db } from '@/lib/db';
import { nanoid } from 'nanoid';

// Types
export interface WalletBalance {
  gnf: number;
  usd: number;
  eur: number;
}

export interface TransactionData {
  userId: string;
  amount: number;
  currency: 'GNF' | 'USD' | 'EUR';
  type: 'deposit' | 'withdraw' | 'transfer' | 'payment' | 'refund' | 'airtime';
  category?: string;
  recipientPhone?: string;
  recipientName?: string;
  description?: string;
  provider?: 'orange' | 'mtn' | 'bank' | 'cash';
  metadata?: Record<string, unknown>;
}

export interface TransactionResult {
  success: boolean;
  transactionId?: string;
  reference?: string;
  error?: string;
  newBalance?: number;
}

class WalletService {
  // Currency conversion rates (approximate - should use real API in production)
  private exchangeRates = {
    GNF_TO_USD: 0.00011,  // 1 GNF = 0.00011 USD
    GNF_TO_EUR: 0.00010,  // 1 GNF = 0.00010 EUR
    USD_TO_GNF: 9090.91,  // 1 USD = 9090.91 GNF
    EUR_TO_GNF: 10000,    // 1 EUR = 10000 GNF
  };

  /**
   * Get or create wallet for user
   */
  async getOrCreateWallet(userId: string): Promise<{ id: string; balanceGnf: number; balanceUsd: number; balanceEur: number }> {
    if (!db) {
      throw new Error('Database not available');
    }

    let wallet = await db.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await db.wallet.create({
        data: {
          userId,
          balanceGnf: 0,
          balanceUsd: 0,
          balanceEur: 0,
        },
      });
    }

    return wallet;
  }

  /**
   * Get wallet balance
   */
  async getBalance(userId: string): Promise<WalletBalance> {
    const wallet = await this.getOrCreateWallet(userId);
    return {
      gnf: wallet.balanceGnf,
      usd: wallet.balanceUsd,
      eur: wallet.balanceEur,
    };
  }

  /**
   * Credit wallet (deposit)
   */
  async credit(
    userId: string,
    amount: number,
    currency: 'GNF' | 'USD' | 'EUR',
    description?: string,
    provider?: string
  ): Promise<TransactionResult> {
    if (!db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      // Get wallet
      const wallet = await this.getOrCreateWallet(userId);

      // Generate reference
      const reference = `DEP-${Date.now()}-${nanoid(8)}`;

      // Create transaction
      const transaction = await db.transaction.create({
        data: {
          userId,
          walletId: wallet.id,
          amount,
          currency,
          fee: 0,
          total: amount,
          type: 'deposit',
          description: description || 'Dépôt',
          provider,
          reference,
          status: 'success',
          processedAt: new Date(),
        },
      });

      // Update wallet balance
      const updateData: Record<string, number> = {};
      if (currency === 'GNF') {
        updateData.balanceGnf = wallet.balanceGnf + amount;
      } else if (currency === 'USD') {
        updateData.balanceUsd = wallet.balanceUsd + amount;
      } else {
        updateData.balanceEur = wallet.balanceEur + amount;
      }

      await db.wallet.update({
        where: { userId },
        data: updateData,
      });

      return {
        success: true,
        transactionId: transaction.id,
        reference,
        newBalance: updateData[Object.keys(updateData)[0]],
      };
    } catch (error) {
      console.error('[Wallet] Credit error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors du crédit',
      };
    }
  }

  /**
   * Debit wallet (withdraw/payment)
   */
  async debit(
    userId: string,
    amount: number,
    currency: 'GNF' | 'USD' | 'EUR',
    description?: string,
    recipientPhone?: string,
    provider?: string
  ): Promise<TransactionResult> {
    if (!db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      // Get wallet
      const wallet = await this.getOrCreateWallet(userId);

      // Check balance
      const balanceField = currency === 'GNF' ? 'balanceGnf' : currency === 'USD' ? 'balanceUsd' : 'balanceEur';
      const currentBalance = wallet[balanceField as keyof typeof wallet] as number;

      if (currentBalance < amount) {
        return {
          success: false,
          error: `Solde insuffisant. Solde actuel: ${currentBalance} ${currency}`,
        };
      }

      // Check daily limit
      if (amount > wallet.dailyLimit - wallet.currentDaily) {
        return {
          success: false,
          error: `Limite journalière dépassée. Maximum: ${wallet.dailyLimit - wallet.currentDaily} ${currency}`,
        };
      }

      // Generate reference
      const reference = `WTD-${Date.now()}-${nanoid(8)}`;

      // Calculate fee (1% for withdrawals)
      const fee = amount * 0.01;
      const total = amount + fee;

      // Create transaction
      const transaction = await db.transaction.create({
        data: {
          userId,
          walletId: wallet.id,
          amount,
          currency,
          fee,
          total,
          type: 'withdraw',
          description: description || 'Retrait',
          recipientPhone,
          provider,
          reference,
          status: 'pending',
        },
      });

      // Update wallet balance
      const updateData: Record<string, number> = {};
      updateData[balanceField] = currentBalance - total;
      updateData.currentDaily = wallet.currentDaily + amount;

      await db.wallet.update({
        where: { userId },
        data: updateData,
      });

      return {
        success: true,
        transactionId: transaction.id,
        reference,
        newBalance: updateData[balanceField],
      };
    } catch (error) {
      console.error('[Wallet] Debit error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors du débit',
      };
    }
  }

  /**
   * Transfer between wallets
   */
  async transfer(
    senderId: string,
    recipientPhone: string,
    amount: number,
    currency: 'GNF' | 'USD' | 'EUR',
    description?: string
  ): Promise<TransactionResult> {
    if (!db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      // Find recipient by phone
      const recipient = await db.user.findFirst({
        where: { phone: recipientPhone },
      });

      if (!recipient) {
        // Create pending transaction for external transfer
        return this.debit(senderId, amount, currency, description || 'Transfert', recipientPhone, 'orange');
      }

      // Get wallets
      const senderWallet = await this.getOrCreateWallet(senderId);
      const recipientWallet = await this.getOrCreateWallet(recipient.id);

      // Check sender balance
      const balanceField = currency === 'GNF' ? 'balanceGnf' : currency === 'USD' ? 'balanceUsd' : 'balanceEur';
      const senderBalance = senderWallet[balanceField as keyof typeof senderWallet] as number;

      if (senderBalance < amount) {
        return {
          success: false,
          error: `Solde insuffisant. Solde actuel: ${senderBalance} ${currency}`,
        };
      }

      // Generate reference
      const reference = `TRF-${Date.now()}-${nanoid(8)}`;

      // Calculate fee (0.5% for internal transfers)
      const fee = amount * 0.005;
      const total = amount + fee;

      // Create transaction (debit sender)
      const transaction = await db.transaction.create({
        data: {
          userId: senderId,
          walletId: senderWallet.id,
          amount,
          currency,
          fee,
          total,
          type: 'transfer',
          description: description || 'Transfert',
          recipientPhone,
          recipientName: `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim(),
          reference,
          status: 'success',
          processedAt: new Date(),
        },
      });

      // Update balances
      await db.wallet.update({
        where: { userId: senderId },
        data: {
          [balanceField]: senderBalance - total,
        },
      });

      await db.wallet.update({
        where: { userId: recipient.id },
        data: {
          [balanceField]: recipientWallet[balanceField as keyof typeof recipientWallet] as number + amount,
        },
      });

      return {
        success: true,
        transactionId: transaction.id,
        reference,
        newBalance: senderBalance - total,
      };
    } catch (error) {
      console.error('[Wallet] Transfer error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors du transfert',
      };
    }
  }

  /**
   * Get transaction history
   */
  async getTransactions(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      type?: string;
      status?: string;
    }
  ): Promise<{ transactions: unknown[]; total: number }> {
    if (!db) {
      return { transactions: [], total: 0 };
    }

    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    const where: Record<string, unknown> = { userId };
    if (options?.type) where.type = options.type;
    if (options?.status) where.status = options.status;

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      db.transaction.count({ where }),
    ]);

    return { transactions, total };
  }

  /**
   * Convert currency
   */
  convertCurrency(
    amount: number,
    from: 'GNF' | 'USD' | 'EUR',
    to: 'GNF' | 'USD' | 'EUR'
  ): number {
    if (from === to) return amount;

    // Convert to GNF first, then to target
    let inGnf: number;
    if (from === 'GNF') {
      inGnf = amount;
    } else if (from === 'USD') {
      inGnf = amount * this.exchangeRates.USD_TO_GNF;
    } else {
      inGnf = amount * this.exchangeRates.EUR_TO_GNF;
    }

    if (to === 'GNF') return inGnf;
    if (to === 'USD') return inGnf * this.exchangeRates.GNF_TO_USD;
    return inGnf * this.exchangeRates.GNF_TO_EUR;
  }
}

// Export singleton instance
export const walletService = new WalletService();
