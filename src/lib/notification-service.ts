// =============================================================================
// InsightGov Africa - Notification Service
// =============================================================================
// Service de notifications SMS avancé avec support OTP
// Providers: Africa's Talking, Orange SMS, MTN SMS, Twilio
// =============================================================================

import { db } from '@/lib/db';
import { AuditLogger } from '@/lib/audit-logger';
import { SMSService, SMS_TEMPLATES } from '@/lib/sms-service';
import { createHash, randomBytes } from 'crypto';
import { nanoid } from 'nanoid';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export type NotificationType = 'sms' | 'email' | 'push' | 'in_app';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface SendSMSOptions {
  priority?: NotificationPriority;
  scheduledAt?: Date;
  metadata?: Record<string, unknown>;
  userId?: string;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
}

export interface OTPData {
  phone: string;
  code: string;
  type: 'verification' | 'transaction' | 'login' | 'password_reset';
  expiresAt: Date;
  attempts: number;
  verified: boolean;
}

export interface TransactionNotification {
  type: 'deposit' | 'withdraw' | 'transfer' | 'payment';
  amount: number;
  currency: string;
  reference: string;
  status: string;
  recipientName?: string;
  recipientPhone?: string;
}

export interface PaymentReminder {
  amount: number;
  currency: string;
  dueDate: Date;
  description: string;
}

export interface LowBalanceAlert {
  currentBalance: number;
  currency: string;
  threshold: number;
}

// =============================================================================
// OTP CONFIGURATION
// =============================================================================

const OTP_CONFIG = {
  length: 6,
  expiryMinutes: 10,
  maxAttempts: 3,
  cooldownSeconds: 60,
  resendLimit: 3,
  resendWindowMinutes: 60,
};

// =============================================================================
// NOTIFICATION TEMPLATES
// =============================================================================

const NOTIFICATION_TEMPLATES = {
  // Transaction notifications
  TRANSACTION_SUCCESS: {
    fr: 'InsightGov: {type} de {amount} {currency} effectué(e). Réf: {reference}',
    en: 'InsightGov: {type} of {amount} {currency} completed. Ref: {reference}',
  },
  TRANSACTION_PENDING: {
    fr: 'InsightGov: {type} de {amount} {currency} en cours. Réf: {reference}',
    en: 'InsightGov: {type} of {amount} {currency} pending. Ref: {reference}',
  },
  TRANSACTION_FAILED: {
    fr: 'InsightGov: {type} de {amount} {currency} échoué(e). Raison: {reason}',
    en: 'InsightGov: {type} of {amount} {currency} failed. Reason: {reason}',
  },
  
  // OTP notifications
  OTP_CODE: {
    fr: 'InsightGov: Votre code de sécurité est {code}. Valide {validity} minutes. Ne le partagez jamais.',
    en: 'InsightGov: Your security code is {code}. Valid for {validity} minutes. Never share it.',
  },
  
  // Payment reminders
  PAYMENT_REMINDER: {
    fr: 'InsightGov: Rappel - Paiement de {amount} {currency} prévu le {date}. {description}',
    en: 'InsightGov: Reminder - Payment of {amount} {currency} due on {date}. {description}',
  },
  
  // Low balance alerts
  LOW_BALANCE: {
    fr: 'InsightGov: Alerte - Votre solde est bas ({balance} {currency}). Seuil: {threshold} {currency}',
    en: 'InsightGov: Alert - Your balance is low ({balance} {currency}). Threshold: {threshold} {currency}',
  },
  
  // KYC notifications
  KYC_VERIFIED: {
    fr: 'InsightGov: Félicitations! Votre KYC a été vérifié avec succès.',
    en: 'InsightGov: Congratulations! Your KYC has been successfully verified.',
  },
  KYC_REJECTED: {
    fr: 'InsightGov: Votre KYC a été rejeté. Raison: {reason}. Veuillez soumettre de nouveaux documents.',
    en: 'InsightGov: Your KYC was rejected. Reason: {reason}. Please submit new documents.',
  },
  KYC_PENDING: {
    fr: 'InsightGov: Votre vérification KYC est en cours. Vous serez notifié(e) une fois terminé.',
    en: 'InsightGov: Your KYC verification is in progress. You will be notified once completed.',
  },
  
  // Security alerts
  LOGIN_ALERT: {
    fr: 'InsightGov: Nouvelle connexion détectée depuis {location}. Si ce n\'est pas vous, sécurisez votre compte.',
    en: 'InsightGov: New login detected from {location}. If this wasn\'t you, secure your account.',
  },
  PASSWORD_CHANGE: {
    fr: 'InsightGov: Votre mot de passe a été modifié. Si ce n\'est pas vous, contactez le support.',
    en: 'InsightGov: Your password has been changed. If this wasn\'t you, contact support.',
  },
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a random OTP code
 */
function generateOTP(length: number = 6): string {
  const digits = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

/**
 * Hash phone number for storage
 */
function hashPhone(phone: string): string {
  return createHash('sha256').update(phone).digest('hex');
}

/**
 * Format phone number to international format
 */
function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle Guinea numbers
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Add Guinea country code if missing
  if (!cleaned.startsWith('224') && cleaned.length <= 10) {
    cleaned = '224' + cleaned;
  }
  
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

/**
 * Get template in user's preferred language
 */
function getTemplate(
  templateKey: keyof typeof NOTIFICATION_TEMPLATES,
  language: string = 'fr'
): string {
  const template = NOTIFICATION_TEMPLATES[templateKey];
  return template[language as keyof typeof template] || template.fr;
}

/**
 * Replace template variables
 */
function renderTemplate(template: string, variables: Record<string, string | number>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return result;
}

// =============================================================================
// NOTIFICATION SERVICE CLASS
// =============================================================================

class NotificationServiceClass {
  private otpStore: Map<string, OTPData> = new Map();
  private rateLimitStore: Map<string, { count: number; resetAt: Date }> = new Map();

  /**
   * Send SMS notification
   */
  async sendSMS(
    phone: string,
    message: string,
    options: SendSMSOptions = {}
  ): Promise<SMSResult> {
    try {
      // Validate phone number
      if (!phone || phone.length < 8) {
        return { success: false, error: 'Numéro de téléphone invalide' };
      }

      // Validate message length
      if (!message || message.length === 0) {
        return { success: false, error: 'Message vide' };
      }

      if (message.length > 1530) {
        return { success: false, error: 'Message trop long (max 1530 caractères)' };
      }

      // Check rate limit
      if (!this.checkRateLimit(phone)) {
        return { success: false, error: 'Trop de SMS envoyés. Veuillez patienter.' };
      }

      // Format phone number
      const formattedPhone = formatPhoneNumber(phone);

      // Send via SMS service
      const result = await SMSService.send({
        to: formattedPhone,
        message,
        priority: options.priority,
        scheduledAt: options.scheduledAt,
        metadata: options.metadata,
      });

      // Log notification
      if (result.success && db) {
        await this.logNotification({
          type: 'sms',
          userId: options.userId,
          phone: formattedPhone,
          message,
          status: 'sent',
          messageId: result.messageId,
          metadata: options.metadata,
        });
      }

      return result;
    } catch (error) {
      console.error('[Notification] SMS send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de l\'envoi du SMS',
      };
    }
  }

  /**
   * Send transaction notification
   */
  async sendTransactionNotification(
    userId: string,
    transaction: TransactionNotification,
    language: string = 'fr'
  ): Promise<SMSResult> {
    if (!db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { phone: true, language: true },
      });

      if (!user?.phone) {
        return { success: false, error: 'Numéro de téléphone non trouvé' };
      }

      const lang = language || user.language || 'fr';
      const typeLabels: Record<string, Record<string, string>> = {
        deposit: { fr: 'Dépôt', en: 'Deposit' },
        withdraw: { fr: 'Retrait', en: 'Withdrawal' },
        transfer: { fr: 'Transfert', en: 'Transfer' },
        payment: { fr: 'Paiement', en: 'Payment' },
      };

      const typeLabel = typeLabels[transaction.type]?.[lang] || transaction.type;
      const templateKey = transaction.status === 'success' 
        ? 'TRANSACTION_SUCCESS' 
        : transaction.status === 'pending'
        ? 'TRANSACTION_PENDING'
        : 'TRANSACTION_FAILED';

      const template = getTemplate(templateKey, lang);
      const message = renderTemplate(template, {
        type: typeLabel,
        amount: transaction.amount.toLocaleString(),
        currency: transaction.currency,
        reference: transaction.reference,
        reason: transaction.status === 'failed' ? 'Erreur' : '',
      });

      return this.sendSMS(user.phone, message, {
        priority: 'high',
        userId,
        metadata: { transactionId: transaction.reference },
      });
    } catch (error) {
      console.error('[Notification] Transaction notification error:', error);
      return { success: false, error: 'Erreur lors de l\'envoi de la notification' };
    }
  }

  /**
   * Send OTP code
   */
  async sendOTP(
    phone: string,
    type: OTPData['type'] = 'verification',
    language: string = 'fr'
  ): Promise<SMSResult & { code?: string }> {
    try {
      const formattedPhone = formatPhoneNumber(phone);
      const phoneHash = hashPhone(formattedPhone);

      // Check cooldown
      const existingOTP = this.otpStore.get(phoneHash);
      if (existingOTP) {
        const cooldownEnd = new Date(existingOTP.expiresAt.getTime() - OTP_CONFIG.expiryMinutes * 60000 + OTP_CONFIG.cooldownSeconds * 1000);
        if (new Date() < cooldownEnd) {
          const remaining = Math.ceil((cooldownEnd.getTime() - Date.now()) / 1000);
          return {
            success: false,
            error: `Veuillez attendre ${remaining} secondes avant de demander un nouveau code`,
          };
        }
      }

      // Check resend limit
      const rateLimitKey = `otp_${phoneHash}`;
      const rateLimit = this.rateLimitStore.get(rateLimitKey);
      if (rateLimit && rateLimit.count >= OTP_CONFIG.resendLimit) {
        const remaining = Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 60000);
        return {
          success: false,
          error: `Limite de renvoi atteinte. Réessayez dans ${remaining} minutes`,
        };
      }

      // Generate new OTP
      const code = generateOTP(OTP_CONFIG.length);
      const expiresAt = new Date(Date.now() + OTP_CONFIG.expiryMinutes * 60000);

      // Store OTP
      this.otpStore.set(phoneHash, {
        phone: formattedPhone,
        code,
        type,
        expiresAt,
        attempts: 0,
        verified: false,
      });

      // Update rate limit
      if (rateLimit) {
        rateLimit.count++;
      } else {
        this.rateLimitStore.set(rateLimitKey, {
          count: 1,
          resetAt: new Date(Date.now() + OTP_CONFIG.resendWindowMinutes * 60000),
        });
      }

      // Send OTP via SMS
      const template = getTemplate('OTP_CODE', language);
      const message = renderTemplate(template, {
        code,
        validity: OTP_CONFIG.expiryMinutes,
      });

      const result = await this.sendSMS(formattedPhone, message, {
        priority: 'urgent',
        metadata: { type: 'otp', otpType: type },
      });

      // Log OTP attempt
      console.log(`[OTP] Generated for ${formattedPhone.slice(-4)}, type: ${type}`);

      return { ...result, code }; // Return code for testing purposes (remove in production)
    } catch (error) {
      console.error('[Notification] OTP send error:', error);
      return { success: false, error: 'Erreur lors de l\'envoi du code OTP' };
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(phone: string, code: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const formattedPhone = formatPhoneNumber(phone);
      const phoneHash = hashPhone(formattedPhone);

      const otpData = this.otpStore.get(phoneHash);

      if (!otpData) {
        return { valid: false, error: 'Aucun code OTP trouvé pour ce numéro' };
      }

      // Check if already verified
      if (otpData.verified) {
        return { valid: false, error: 'Code déjà utilisé' };
      }

      // Check if expired
      if (new Date() > otpData.expiresAt) {
        this.otpStore.delete(phoneHash);
        return { valid: false, error: 'Code OTP expiré' };
      }

      // Check attempts
      if (otpData.attempts >= OTP_CONFIG.maxAttempts) {
        this.otpStore.delete(phoneHash);
        return { valid: false, error: 'Trop de tentatives. Demandez un nouveau code' };
      }

      // Verify code
      if (otpData.code !== code) {
        otpData.attempts++;
        const remaining = OTP_CONFIG.maxAttempts - otpData.attempts;
        return {
          valid: false,
          error: `Code incorrect. ${remaining} tentative(s) restante(s)`,
        };
      }

      // Mark as verified
      otpData.verified = true;
      this.otpStore.delete(phoneHash);

      console.log(`[OTP] Verified for ${formattedPhone.slice(-4)}`);

      return { valid: true };
    } catch (error) {
      console.error('[Notification] OTP verify error:', error);
      return { valid: false, error: 'Erreur lors de la vérification' };
    }
  }

  /**
   * Send payment reminder
   */
  async sendPaymentReminder(
    userId: string,
    reminder: PaymentReminder,
    language: string = 'fr'
  ): Promise<SMSResult> {
    if (!db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { phone: true, language: true },
      });

      if (!user?.phone) {
        return { success: false, error: 'Numéro de téléphone non trouvé' };
      }

      const lang = language || user.language || 'fr';
      const template = getTemplate('PAYMENT_REMINDER', lang);
      const message = renderTemplate(template, {
        amount: reminder.amount.toLocaleString(),
        currency: reminder.currency,
        date: reminder.dueDate.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US'),
        description: reminder.description,
      });

      return this.sendSMS(user.phone, message, {
        priority: 'high',
        userId,
        metadata: { type: 'payment_reminder', dueDate: reminder.dueDate.toISOString() },
      });
    } catch (error) {
      console.error('[Notification] Payment reminder error:', error);
      return { success: false, error: 'Erreur lors de l\'envoi du rappel' };
    }
  }

  /**
   * Send low balance alert
   */
  async sendLowBalanceAlert(
    userId: string,
    alert: LowBalanceAlert,
    language: string = 'fr'
  ): Promise<SMSResult> {
    if (!db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { phone: true, language: true },
      });

      if (!user?.phone) {
        return { success: false, error: 'Numéro de téléphone non trouvé' };
      }

      const lang = language || user.language || 'fr';
      const template = getTemplate('LOW_BALANCE', lang);
      const message = renderTemplate(template, {
        balance: alert.currentBalance.toLocaleString(),
        currency: alert.currency,
        threshold: alert.threshold.toLocaleString(),
      });

      return this.sendSMS(user.phone, message, {
        priority: 'high',
        userId,
        metadata: { type: 'low_balance', threshold: alert.threshold },
      });
    } catch (error) {
      console.error('[Notification] Low balance alert error:', error);
      return { success: false, error: 'Erreur lors de l\'envoi de l\'alerte' };
    }
  }

  /**
   * Send KYC status notification
   */
  async sendKYCNotification(
    userId: string,
    status: 'verified' | 'rejected' | 'pending',
    reason?: string,
    language: string = 'fr'
  ): Promise<SMSResult> {
    if (!db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { phone: true, language: true },
      });

      if (!user?.phone) {
        return { success: false, error: 'Numéro de téléphone non trouvé' };
      }

      const lang = language || user.language || 'fr';
      const templateKey = status === 'verified' 
        ? 'KYC_VERIFIED' 
        : status === 'rejected'
        ? 'KYC_REJECTED'
        : 'KYC_PENDING';

      const template = getTemplate(templateKey, lang);
      const message = renderTemplate(template, {
        reason: reason || '',
      });

      return this.sendSMS(user.phone, message, {
        priority: status === 'rejected' ? 'high' : 'normal',
        userId,
        metadata: { type: 'kyc_status', status },
      });
    } catch (error) {
      console.error('[Notification] KYC notification error:', error);
      return { success: false, error: 'Erreur lors de l\'envoi de la notification KYC' };
    }
  }

  /**
   * Send security alert
   */
  async sendSecurityAlert(
    userId: string,
    alertType: 'login' | 'password_change',
    location: string,
    language: string = 'fr'
  ): Promise<SMSResult> {
    if (!db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { phone: true, language: true },
      });

      if (!user?.phone) {
        return { success: false, error: 'Numéro de téléphone non trouvé' };
      }

      const lang = language || user.language || 'fr';
      const templateKey = alertType === 'login' ? 'LOGIN_ALERT' : 'PASSWORD_CHANGE';
      const template = getTemplate(templateKey, lang);
      const message = renderTemplate(template, { location });

      return this.sendSMS(user.phone, message, {
        priority: 'urgent',
        userId,
        metadata: { type: 'security_alert', alertType },
      });
    } catch (error) {
      console.error('[Notification] Security alert error:', error);
      return { success: false, error: 'Erreur lors de l\'envoi de l\'alerte de sécurité' };
    }
  }

  /**
   * Check rate limit for phone number
   */
  private checkRateLimit(phone: string): boolean {
    const key = hashPhone(phone);
    const rateLimit = this.rateLimitStore.get(key);

    if (!rateLimit) {
      this.rateLimitStore.set(key, {
        count: 1,
        resetAt: new Date(Date.now() + 3600000), // 1 hour
      });
      return true;
    }

    if (new Date() > rateLimit.resetAt) {
      this.rateLimitStore.set(key, {
        count: 1,
        resetAt: new Date(Date.now() + 3600000),
      });
      return true;
    }

    if (rateLimit.count >= 10) { // Max 10 SMS per hour
      return false;
    }

    rateLimit.count++;
    return true;
  }

  /**
   * Log notification to database
   */
  private async logNotification(data: {
    type: string;
    userId?: string;
    phone: string;
    message: string;
    status: string;
    messageId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    if (!db) return;

    try {
      // Create notification record
      if (data.userId) {
        await db.notification.create({
          data: {
            userId: data.userId,
            type: data.type,
            title: 'SMS Notification',
            message: data.message,
            data: JSON.stringify(data.metadata || {}),
            isRead: false,
          },
        });
      }

      // Log audit
      await AuditLogger.log({
        action: 'NOTIFICATION_SENT',
        userId: data.userId,
        entityType: 'NOTIFICATION',
        metadata: {
          type: data.type,
          phone: data.phone.slice(-4), // Only last 4 digits
          status: data.status,
          messageId: data.messageId,
        },
      });
    } catch (error) {
      console.error('[Notification] Log error:', error);
    }
  }

  /**
   * Clean up expired OTPs and rate limits
   */
  cleanupExpired(): void {
    const now = new Date();

    // Clean expired OTPs
    for (const [key, otp] of this.otpStore.entries()) {
      if (now > otp.expiresAt) {
        this.otpStore.delete(key);
      }
    }

    // Clean expired rate limits
    for (const [key, rateLimit] of this.rateLimitStore.entries()) {
      if (now > rateLimit.resetAt) {
        this.rateLimitStore.delete(key);
      }
    }

    console.log('[Notification] Cleaned up expired entries');
  }
}

// Export singleton instance
export const notificationService = new NotificationServiceClass();

// Export class for testing
export { NotificationServiceClass };

// Default export
export default notificationService;
