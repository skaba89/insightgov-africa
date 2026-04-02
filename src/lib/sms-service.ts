// =============================================================================
// InsightGov Africa - SMS Notification Service
// =============================================================================
// Service de notifications SMS via Twilio et passerelles africaines
// Support: Twilio, Orange SMS API, MTN SMS API, Nexmo/Vonage
// =============================================================================

import { db } from '@/lib/db';
import { AuditLogger } from '@/lib/audit-logger';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface SMSConfig {
  provider: 'twilio' | 'orange' | 'mtn' | 'nexmo' | 'africas_talking';
  apiKey: string;
  apiSecret: string;
  senderId?: string;
  baseUrl?: string;
}

export interface SMSMessage {
  to: string;
  message: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduledAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
  segments?: number;
}

export interface SMSTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
  category: 'alert' | 'notification' | 'verification' | 'marketing';
}

// =============================================================================
// SMS TEMPLATES
// =============================================================================

export const SMS_TEMPLATES: Record<string, SMSTemplate> = {
  VERIFICATION_CODE: {
    id: 'verification_code',
    name: 'Code de vérification',
    template: 'Votre code de vérification InsightGov est: {code}. Valide {validity} minutes.',
    variables: ['code', 'validity'],
    category: 'verification',
  },
  PASSWORD_RESET: {
    id: 'password_reset',
    name: 'Réinitialisation mot de passe',
    template: 'InsightGov: Votre lien de réinitialisation: {link}. Expire dans {validity}h.',
    variables: ['link', 'validity'],
    category: 'verification',
  },
  LOGIN_ALERT: {
    id: 'login_alert',
    name: 'Alerte connexion',
    template: 'InsightGov: Nouvelle connexion depuis {location}. Si ce n\'est pas vous, sécurisez votre compte immédiatement.',
    variables: ['location'],
    category: 'alert',
  },
  MFA_CODE: {
    id: 'mfa_code',
    name: 'Code 2FA',
    template: 'Votre code de sécurité InsightGov est: {code}. Ne le partagez jamais.',
    variables: ['code'],
    category: 'verification',
  },
  BACKUP_COMPLETE: {
    id: 'backup_complete',
    name: 'Sauvegarde terminée',
    template: 'InsightGov: Sauvegarde "{name}" terminée avec succès. Taille: {size}.',
    variables: ['name', 'size'],
    category: 'notification',
  },
  BACKUP_FAILED: {
    id: 'backup_failed',
    name: 'Échec sauvegarde',
    template: 'ALERT InsightGov: Échec de la sauvegarde "{name}". Vérifiez votre dashboard.',
    variables: ['name'],
    category: 'alert',
  },
  SUBSCRIPTION_EXPIRING: {
    id: 'subscription_expiring',
    name: 'Abonnement expire',
    template: 'InsightGov: Votre abonnement expire dans {days} jours. Renouvelez pour éviter l\'interruption.',
    variables: ['days'],
    category: 'notification',
  },
  TEAM_INVITE: {
    id: 'team_invite',
    name: 'Invitation équipe',
    template: '{inviter} vous invite à rejoindre {organization} sur InsightGov. Inscrivez-vous: {link}',
    variables: ['inviter', 'organization', 'link'],
    category: 'notification',
  },
  ALERT_THRESHOLD: {
    id: 'alert_threshold',
    name: 'Alerte seuil KPI',
    template: 'ALERT InsightGov: {kpi_name} a atteint {value} ({change}). Seuil: {threshold}.',
    variables: ['kpi_name', 'value', 'change', 'threshold'],
    category: 'alert',
  },
  REPORT_READY: {
    id: 'report_ready',
    name: 'Rapport prêt',
    template: 'InsightGov: Votre rapport "{name}" est prêt. Téléchargez-le: {link}',
    variables: ['name', 'link'],
    category: 'notification',
  },
};

// =============================================================================
// SMS PROVIDERS
// =============================================================================

/**
 * Twilio SMS Provider
 */
async function sendViaTwilio(
  config: SMSConfig,
  message: SMSMessage
): Promise<SMSResult> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.apiKey}/Messages.json`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: formatPhoneNumber(message.to),
        From: config.senderId || '+1234567890',
        Body: message.message,
      }).toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Twilio API error',
      };
    }

    return {
      success: true,
      messageId: data.sid,
      cost: parseFloat(data.price || '0'),
      segments: data.num_segments,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Orange SMS API Provider (Orange Africa)
 */
async function sendViaOrange(
  config: SMSConfig,
  message: SMSMessage
): Promise<SMSResult> {
  const url = config.baseUrl || 'https://api.orange.com/smsmessaging/v1/outbound';
  
  try {
    const response = await fetch(`${url}/${config.senderId || 'InsightGov'}/requests`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        outboundSMSMessageRequest: {
          address: `tel:${formatPhoneNumber(message.to)}`,
          senderAddress: config.senderId || 'InsightGov',
          outboundSMSTextMessage: {
            message: message.message,
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.description || 'Orange API error',
      };
    }

    return {
      success: true,
      messageId: data.outboundSMSMessageRequest?.resourceURL?.split('/').pop(),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Africa's Talking SMS Provider (RECOMMENDED - Free Sandbox Available)
 * 
 * Free Sandbox Mode:
 * - Username: 'sandbox'
 * - Get free API key at: https://africastalking.com
 * - Test numbers: Use any African number format
 * - Messages are delivered to your sandbox dashboard (not real phones)
 * 
 * Production Mode:
 * - Create app at https://account.africastalking.com
 * - Use production username and API key
 * - Real SMS delivery to 40+ African countries
 */
async function sendViaAfricasTalking(
  config: SMSConfig,
  message: SMSMessage
): Promise<SMSResult> {
  // Use sandbox URL if username is 'sandbox' (free testing)
  const isSandbox = config.apiSecret.toLowerCase() === 'sandbox';
  const url = isSandbox 
    ? 'https://api.sandbox.africastalking.com/version1/messaging'
    : 'https://api.africastalking.com/version1/messaging';
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apiKey': config.apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username: config.apiSecret, // Username stored in apiSecret field
        to: formatPhoneNumber(message.to),
        message: message.message,
        from: config.senderId || 'InsightGov',
      }).toString(),
    });

    const data = await response.json();

    if (!response.ok || data.SMSMessageData?.Recipients?.[0]?.status !== 'Success') {
      return {
        success: false,
        error: data.SMSMessageData?.Message || 'Africa\'s Talking API error',
      };
    }

    return {
      success: true,
      messageId: data.SMSMessageData?.Recipients?.[0]?.messageId,
      cost: data.SMSMessageData?.Recipients?.[0]?.cost,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Vonage/Nexmo SMS Provider
 */
async function sendViaNexmo(
  config: SMSConfig,
  message: SMSMessage
): Promise<SMSResult> {
  const url = 'https://rest.nexmo.com/sms/json';
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        api_key: config.apiKey,
        api_secret: config.apiSecret,
        to: formatPhoneNumber(message.to),
        from: config.senderId || 'InsightGov',
        text: message.message,
      }).toString(),
    });

    const data = await response.json();

    if (data.messages?.[0]?.status !== '0') {
      return {
        success: false,
        error: data.messages?.[0]?.error_text || 'Nexmo API error',
      };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.message_id,
      cost: parseFloat(data.messages?.[0]?.message_price || '0'),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format phone number to international format
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle African number formats
  if (cleaned.startsWith('0')) {
    // Remove leading zero for international format
    cleaned = cleaned.substring(1);
  }
  
  // Add country code if missing (default to Senegal +221)
  if (!cleaned.startsWith('+') && cleaned.length <= 10) {
    cleaned = '221' + cleaned;
  }
  
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

/**
 * Get SMS provider configuration from environment
 */
function getSMSConfig(): SMSConfig | null {
  // Africa's Talking is the default (free sandbox available for African developers)
  const provider = (process.env.SMS_PROVIDER || 'africas_talking') as SMSConfig['provider'];
  
  switch (provider) {
    case 'twilio':
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        return null;
      }
      return {
        provider: 'twilio',
        apiKey: process.env.TWILIO_ACCOUNT_SID,
        apiSecret: process.env.TWILIO_AUTH_TOKEN,
        senderId: process.env.TWILIO_PHONE_NUMBER,
      };
    
    case 'orange':
      if (!process.env.ORANGE_API_KEY) {
        return null;
      }
      return {
        provider: 'orange',
        apiKey: process.env.ORANGE_API_KEY,
        apiSecret: process.env.ORANGE_CLIENT_ID || '',
        senderId: process.env.ORANGE_SENDER_ID,
      };
    
    case 'africas_talking':
      if (!process.env.AFRICAS_TALKING_API_KEY || !process.env.AFRICAS_TALKING_USERNAME) {
        return null;
      }
      return {
        provider: 'africas_talking',
        apiKey: process.env.AFRICAS_TALKING_API_KEY,
        apiSecret: process.env.AFRICAS_TALKING_USERNAME,
        senderId: process.env.AFRICAS_TALKING_SENDER_ID,
      };
    
    case 'nexmo':
      if (!process.env.NEXMO_API_KEY || !process.env.NEXMO_API_SECRET) {
        return null;
      }
      return {
        provider: 'nexmo',
        apiKey: process.env.NEXMO_API_KEY,
        apiSecret: process.env.NEXMO_API_SECRET,
        senderId: process.env.NEXMO_SENDER_ID,
      };
    
    default:
      return null;
  }
}

// =============================================================================
// MAIN SMS SERVICE CLASS
// =============================================================================

class SMSServiceClass {
  private config: SMSConfig | null = null;
  private initialized: boolean = false;

  /**
   * Initialize SMS service with configuration
   */
  initialize(): boolean {
    this.config = getSMSConfig();
    this.initialized = this.config !== null;
    return this.initialized;
  }

  /**
   * Check if SMS service is available
   */
  isAvailable(): boolean {
    if (!this.initialized) {
      this.initialize();
    }
    return this.initialized;
  }

  /**
   * Send SMS message
   */
  async send(message: SMSMessage): Promise<SMSResult> {
    if (!this.initialized) {
      this.initialize();
    }

    if (!this.config) {
      return {
        success: false,
        error: 'SMS service not configured. Set SMS_PROVIDER and related environment variables.',
      };
    }

    // Validate phone number
    if (!message.to || message.to.length < 8) {
      return {
        success: false,
        error: 'Invalid phone number',
      };
    }

    // Validate message length (SMS max is 160 chars, or 1530 for concatenated)
    if (message.message.length > 1530) {
      return {
        success: false,
        error: 'Message too long. Maximum 1530 characters.',
      };
    }

    // Log SMS attempt
    console.log(`[SMS] Sending to ${message.to} via ${this.config.provider}`);

    // Send via appropriate provider
    let result: SMSResult;

    switch (this.config.provider) {
      case 'twilio':
        result = await sendViaTwilio(this.config, message);
        break;
      case 'orange':
        result = await sendViaOrange(this.config, message);
        break;
      case 'africas_talking':
        result = await sendViaAfricasTalking(this.config, message);
        break;
      case 'nexmo':
        result = await sendViaNexmo(this.config, message);
        break;
      default:
        result = {
          success: false,
          error: `Unsupported SMS provider: ${this.config.provider}`,
        };
    }

    // Log result
    if (result.success) {
      console.log(`[SMS] Sent successfully. ID: ${result.messageId}`);
    } else {
      console.error(`[SMS] Failed: ${result.error}`);
    }

    // Store SMS log in database
    try {
      if (db) {
        await db.$executeRaw`
          INSERT INTO sms_log (phone, message, status, provider, message_id, error, created_at)
          VALUES (${message.to}, ${message.message}, ${result.success ? 'sent' : 'failed'}, 
                  ${this.config.provider}, ${result.messageId || null}, ${result.error || null}, NOW())
        `;
      }
    } catch (error) {
      console.error('[SMS] Failed to log SMS:', error);
    }

    return result;
  }

  /**
   * Send SMS using a template
   */
  async sendTemplate(
    to: string,
    templateId: keyof typeof SMS_TEMPLATES,
    variables: Record<string, string | number>,
    options?: Partial<SMSMessage>
  ): Promise<SMSResult> {
    const template = SMS_TEMPLATES[templateId];
    
    if (!template) {
      return {
        success: false,
        error: `Template not found: ${templateId}`,
      };
    }

    // Replace variables in template
    let message = template.template;
    for (const [key, value] of Object.entries(variables)) {
      message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }

    return this.send({
      to,
      message,
      priority: template.category === 'alert' ? 'high' : 'normal',
      ...options,
    });
  }

  /**
   * Send verification code via SMS
   */
  async sendVerificationCode(phone: string, code: string, validityMinutes: number = 10): Promise<SMSResult> {
    return this.sendTemplate(phone, 'VERIFICATION_CODE', {
      code,
      validity: validityMinutes,
    }, { priority: 'high' });
  }

  /**
   * Send 2FA code via SMS
   */
  async sendMFACode(phone: string, code: string): Promise<SMSResult> {
    return this.sendTemplate(phone, 'MFA_CODE', {
      code,
    }, { priority: 'urgent' });
  }

  /**
   * Send login alert via SMS
   */
  async sendLoginAlert(phone: string, location: string): Promise<SMSResult> {
    return this.sendTemplate(phone, 'LOGIN_ALERT', {
      location,
    }, { priority: 'high' });
  }

  /**
   * Send password reset link via SMS
   */
  async sendPasswordReset(phone: string, link: string, validityHours: number = 24): Promise<SMSResult> {
    return this.sendTemplate(phone, 'PASSWORD_RESET', {
      link,
      validity: validityHours,
    }, { priority: 'high' });
  }

  /**
   * Send backup notification
   */
  async sendBackupNotification(
    phone: string,
    success: boolean,
    backupName: string,
    size?: string
  ): Promise<SMSResult> {
    return this.sendTemplate(
      phone,
      success ? 'BACKUP_COMPLETE' : 'BACKUP_FAILED',
      {
        name: backupName,
        size: size || 'N/A',
      },
      { priority: success ? 'normal' : 'high' }
    );
  }

  /**
   * Send subscription expiring alert
   */
  async sendSubscriptionExpiring(phone: string, daysRemaining: number): Promise<SMSResult> {
    return this.sendTemplate(phone, 'SUBSCRIPTION_EXPIRING', {
      days: daysRemaining,
    }, { priority: 'high' });
  }

  /**
   * Send team invitation via SMS
   */
  async sendTeamInvite(
    phone: string,
    inviterName: string,
    organizationName: string,
    inviteLink: string
  ): Promise<SMSResult> {
    return this.sendTemplate(phone, 'TEAM_INVITE', {
      inviter: inviterName,
      organization: organizationName,
      link: inviteLink,
    });
  }

  /**
   * Send KPI alert threshold notification
   */
  async sendKPIAlert(
    phone: string,
    kpiName: string,
    value: string,
    change: string,
    threshold: string
  ): Promise<SMSResult> {
    return this.sendTemplate(phone, 'ALERT_THRESHOLD', {
      kpi_name: kpiName,
      value,
      change,
      threshold,
    }, { priority: 'urgent' });
  }

  /**
   * Send bulk SMS (with rate limiting)
   */
  async sendBulk(
    messages: Array<{ to: string; message: string }>,
    options?: { delayMs?: number; batchSize?: number }
  ): Promise<{ total: number; sent: number; failed: number; results: SMSResult[] }> {
    const delayMs = options?.delayMs || 100; // 100ms between messages
    const batchSize = options?.batchSize || 10;
    const results: SMSResult[] = [];
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const result = await this.send({ to: msg.to, message: msg.message });
      results.push(result);

      if (result.success) {
        sent++;
      } else {
        failed++;
      }

      // Rate limiting: delay between messages
      if (i < messages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

      // Log progress every batch
      if ((i + 1) % batchSize === 0) {
        console.log(`[SMS Bulk] Processed ${i + 1}/${messages.length}`);
      }
    }

    return { total: messages.length, sent, failed, results };
  }
}

// Export singleton instance
export const SMSService = new SMSServiceClass();

// Export class for testing
export { SMSServiceClass };

// Default export
export default SMSService;
