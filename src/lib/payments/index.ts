// =============================================================================
// InsightGov Africa - Payments Module Index
// Export all payment services
// =============================================================================

export { orangeMoneyService, type OrangeMoneyConfig, type OrangePaymentRequest, type OrangePaymentResponse } from './orange-money';
export { mtnMoneyService, type MTNMoneyConfig, type MTNPaymentRequest, type MTNPaymentResponse } from './mtn-money';
export { walletService, type WalletBalance, type TransactionData, type TransactionResult } from './wallet-service';

// Supported payment providers
export const PAYMENT_PROVIDERS = {
  ORANGE_MONEY: 'orange',
  MTN_MONEY: 'mtn',
  WAVE: 'wave',
  BANK: 'bank',
  CASH: 'cash',
} as const;

// Payment types
export const PAYMENT_TYPES = {
  DEPOSIT: 'deposit',
  WITHDRAW: 'withdraw',
  TRANSFER: 'transfer',
  PAYMENT: 'payment',
  REFUND: 'refund',
  AIRTIME: 'airtime',
} as const;

// Payment categories
export const PAYMENT_CATEGORIES = {
  AIRTIME: 'airtime',
  ELECTRICITY: 'electricity',
  WATER: 'water',
  TAX: 'tax',
  MERCHANT: 'merchant',
  TRANSFER: 'transfer',
  INTERNET: 'internet',
  TV: 'tv',
} as const;

// Currencies
export const CURRENCIES = {
  GNF: 'GNF',  // Franc Guinéen
  USD: 'USD',  // US Dollar
  EUR: 'EUR',  // Euro
} as const;
