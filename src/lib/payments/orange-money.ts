// =============================================================================
// InsightGov Africa - Orange Money Payment Service
// Service de paiement Mobile Money - Orange Guinée
// =============================================================================

import { db } from '@/lib/db';
import { nanoid } from 'nanoid';
import crypto from 'crypto';

// Types
export interface OrangeMoneyConfig {
  merchantCode: string;
  merchantName: string;
  merchantPhone: string;
  apiKey: string;
  apiSecret: string;
  apiBaseUrl: string;
  currency: string;
  callbackUrl: string;
  webhookUrl: string;
}

export interface OrangePaymentRequest {
  amount: number;
  currency?: string;
  phoneNumber: string;
  reference?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface OrangePaymentResponse {
  success: boolean;
  status: 'success' | 'failed' | 'pending';
  transactionId?: string;
  message?: string;
  error?: string;
}

class OrangeMoneyService {
  private config: OrangeMoneyConfig | null = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.config = {
      merchantCode: process.env.ORANGE_MERCHANT_CODE || '',
      merchantName: process.env.ORANGE_MERCHANT_NAME || 'InsightGov Africa',
      merchantPhone: process.env.ORANGE_MERCHANT_PHONE || '',
      apiKey: process.env.ORANGE_API_KEY || '',
      apiSecret: process.env.ORANGE_API_SECRET || '',
      apiBaseUrl: process.env.ORANGE_API_BASE_URL || 'https://api.orange.com',
      currency: process.env.ORANGE_CURRENCY || 'GNF',
      callbackUrl: process.env.ORANGE_CALLBACK_URL || '',
      webhookUrl: process.env.ORANGE_WEBHOOK_URL || '',
    };

    if (!this.config.apiKey) {
      console.warn('[Orange Money] Configuration missing - set ORANGE_API_KEY');
    } else {
      console.log('[Orange Money] Service initialized');
    }
  }

  isConfigured(): boolean {
    return !!(this.config?.apiKey && this.config?.merchantCode);
  }

  /**
   * Validate Guinea phone number
   */
  private validatePhoneNumber(phone: string): boolean {
    // Guinea format: +224 XXX XXX XXX or 00224 XXX XXX XXX or local format
    const phoneRegex = /^(\+224|00224)?\s?\d{3}\s?\d{3}\s?\d{3}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Format phone number for Orange API
   */
  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\s/g, '');
    if (!cleaned.startsWith('+224') && !cleaned.startsWith('00224')) {
      cleaned = '+224' + cleaned;
    }
    return cleaned;
  }

  /**
   * Initiate a payment request
   */
  async initiatePayment(request: OrangePaymentRequest): Promise<OrangePaymentResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        status: 'failed',
        error: 'Orange Money non configuré',
      };
    }

    // Validate phone number
    if (!this.validatePhoneNumber(request.phoneNumber)) {
      return {
        success: false,
        status: 'failed',
        error: 'Numéro de téléphone invalide. Format: +224 XXX XXX XXX',
      };
    }

    // Generate unique reference
    const reference = request.reference || `TXN-${Date.now()}-${nanoid(8)}`;

    // Format phone number
    const formattedPhone = this.formatPhoneNumber(request.phoneNumber);

    // Build request body
    const body = new URLSearchParams({
      merchant_code: this.config!.merchantCode,
      pay_token: this.config!.apiKey,
      amount: request.amount.toString(),
      currency: request.currency || this.config!.currency,
      phone_number: formattedPhone,
      order_id: reference,
      description: request.description || 'Paiement InsightGov Africa',
      callback_url: this.config!.callbackUrl,
    });

    try {
      const response = await fetch(
        `${this.config!.apiBaseUrl}/collection/payment/initiate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept-Language': 'fr',
          },
          body: body.toString(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          status: 'failed',
          error: data.message || 'Échec de paiement',
          message: data.message,
        };
      }

      // Check response status
      if (data.status === 'SUCCESS' || data.response_code === '00') {
        return {
          success: true,
          status: 'success',
          transactionId: data.transaction_id || data.transactionId,
          message: 'Paiement effectué avec succès',
        };
      }

      if (data.status === 'PENDING' || data.response_code === '01') {
        return {
          success: true,
          status: 'pending',
          transactionId: data.transaction_id || data.transactionId,
          message: 'Paiement en attente de validation',
        };
      }

      return {
        success: false,
        status: 'failed',
        error: data.message || 'Échec de paiement',
      };
    } catch (error) {
      console.error('[Orange Money] Payment error:', error);
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Erreur de connexion',
      };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.config?.apiSecret) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.config.apiSecret)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(reference: string): Promise<{ status: string; message?: string; data?: unknown }> {
    if (!this.isConfigured()) {
      return { status: 'error', message: 'Service non configuré' };
    }

    try {
      const response = await fetch(
        `${this.config!.apiBaseUrl}/collection/payment/status/${reference}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.config!.apiKey}`,
            'Accept-Language': 'fr',
          },
        }
      );

      const data = await response.json();

      return {
        status: data.status || 'unknown',
        message: data.message,
        data,
      };
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Erreur de connexion',
      };
    }
  }

  /**
   * Process webhook callback
   */
  async handleWebhookCallback(data: Record<string, unknown>): Promise<void> {
    try {
      const reference = data.order_id as string;
      const status = data.status as string;
      const transactionId = data.transaction_id as string;
      const message = data.message as string;

      console.log(`[Orange Money] Webhook received: ${reference} - ${status}`);

      if (!db) return;

      // Update transaction in database
      switch (status) {
        case 'SUCCESS':
          await db.transaction.update({
            where: { reference },
            data: {
              status: 'success',
              providerRef: transactionId,
              processedAt: new Date(),
              description: message,
            },
          });
          break;

        case 'FAILED':
          await db.transaction.update({
            where: { reference },
            data: {
              status: 'failed',
              failureReason: message || 'Payment failed',
            },
          });
          break;

        default:
          console.log(`[Orange Money] Unknown status: ${status}`);
      }
    } catch (error) {
      console.error('[Orange Money] Webhook processing error:', error);
    }
  }
}

// Export singleton instance
export const orangeMoneyService = new OrangeMoneyService();
