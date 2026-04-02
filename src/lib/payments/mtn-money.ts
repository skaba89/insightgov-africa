// =============================================================================
// InsightGov Africa - MTN Money Payment Service
// Service de paiement Mobile Money - MTN Guinée
// =============================================================================

import { db } from '@/lib/db';
import { nanoid } from 'nanoid';
import crypto from 'crypto';

// Types
export interface MTNMoneyConfig {
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

export interface MTNPaymentRequest {
  amount: number;
  currency?: string;
  phoneNumber: string;
  reference?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface MTNPaymentResponse {
  success: boolean;
  status: 'success' | 'failed' | 'pending';
  transactionId?: string;
  message?: string;
  error?: string;
}

class MTNMoneyService {
  private config: MTNMoneyConfig | null = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.config = {
      merchantCode: process.env.MTN_MERCHANT_CODE || '',
      merchantName: process.env.MTN_MERCHANT_NAME || 'InsightGov Africa',
      merchantPhone: process.env.MTN_MERCHANT_PHONE || '',
      apiKey: process.env.MTN_API_KEY || '',
      apiSecret: process.env.MTN_API_SECRET || '',
      apiBaseUrl: process.env.MTN_API_BASE_URL || 'https://api.mtn.com',
      currency: process.env.MTN_CURRENCY || 'GNF',
      callbackUrl: process.env.MTN_CALLBACK_URL || '',
      webhookUrl: process.env.MTN_WEBHOOK_URL || '',
    };

    if (!this.config.apiKey) {
      console.warn('[MTN Money] Configuration missing - set MTN_API_KEY');
    } else {
      console.log('[MTN Money] Service initialized');
    }
  }

  isConfigured(): boolean {
    return !!(this.config?.apiKey && this.config?.merchantCode);
  }

  /**
   * Validate Guinea phone number
   */
  private validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^(\+224|00224)?\s?\d{3}\s?\d{3}\s?\d{3}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Format phone number for MTN API
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
  async initiatePayment(request: MTNPaymentRequest): Promise<MTNPaymentResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        status: 'failed',
        error: 'MTN Money non configuré',
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
    const reference = request.reference || `MTN-${Date.now()}-${nanoid(8)}`;

    // Format phone number
    const formattedPhone = this.formatPhoneNumber(request.phoneNumber);

    // Build request body
    const body = new URLSearchParams({
      merchant_code: this.config!.merchantCode,
      api_user: this.config!.apiKey,
      api_key: this.config!.apiSecret,
      amount: request.amount.toString(),
      currency: request.currency || this.config!.currency,
      phone_number: formattedPhone,
      reference: reference,
      description: request.description || 'Paiement InsightGov Africa',
      callback_url: this.config!.callbackUrl,
    });

    try {
      const response = await fetch(
        `${this.config!.apiBaseUrl}/payment/initiate`,
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

      // Check response status (MTN uses response_code)
      if (data.response_code === '00' || data.response_code === '0000') {
        return {
          success: true,
          status: 'success',
          transactionId: data.transaction_id,
          message: 'Paiement effectué avec succès',
        };
      }

      // Transaction pending
      if (data.response_code === '01') {
        return {
          success: true,
          status: 'pending',
          transactionId: data.transaction_id,
          message: 'Paiement en attente de validation',
        };
      }

      return {
        success: false,
        status: 'failed',
        error: data.message || 'Échec de paiement',
      };
    } catch (error) {
      console.error('[MTN Money] Payment error:', error);
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
        `${this.config!.apiBaseUrl}/payment/status/${reference}`,
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
      const reference = data.reference as string;
      const status = data.status as string;
      const transactionId = data.transaction_id as string;
      const message = data.message as string;

      console.log(`[MTN Money] Webhook received: ${reference} - ${status}`);

      if (!db) return;

      // Update transaction in database
      switch (status) {
        case 'SUCCESS':
        case 'success':
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
        case 'failed':
          await db.transaction.update({
            where: { reference },
            data: {
              status: 'failed',
              failureReason: message || 'Payment failed',
            },
          });
          break;

        default:
          console.log(`[MTN Money] Unknown status: ${status}`);
      }
    } catch (error) {
      console.error('[MTN Money] Webhook processing error:', error);
    }
  }
}

// Export singleton instance
export const mtnMoneyService = new MTNMoneyService();
