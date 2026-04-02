/**
 * SMS Service for InsightGov Africa
 * Supports Africa's Talking and Twilio for SMS notifications
 * Critical for African market penetration
 */

import { prisma } from '@/lib/db';

// SMS Provider types
type SMSProvider = 'africas_talking' | 'twilio' | 'mock';

interface SMSConfig {
  provider: SMSProvider;
  apiKey?: string;
  apiSecret?: string;
  username?: string;
  senderId?: string;
  from?: string;
}

interface SMSMessage {
  to: string;
  message: string;
  organizationId?: string;
  userId?: string;
  type: SMSNotificationType;
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
}

export enum SMSNotificationType {
  OTP = 'OTP',
  ALERT = 'ALERT',
  SUBSCRIPTION = 'SUBSCRIPTION',
  INVOICE = 'INVOICE',
  REMINDER = 'REMINDER',
  SECURITY = 'SECURITY',
  MARKETING = 'MARKETING',
}

/**
 * Get SMS configuration from environment
 */
function getSMSConfig(): SMSConfig {
  const provider = (process.env.SMS_PROVIDER as SMSProvider) || 'mock';
  
  return {
    provider,
    apiKey: process.env.SMS_API_KEY,
    apiSecret: process.env.SMS_API_SECRET,
    username: process.env.SMS_USERNAME,
    senderId: process.env.SMS_SENDER_ID || 'InsightGov',
    from: process.env.SMS_FROM || 'InsightGov',
  };
}

/**
 * Send SMS via Africa's Talking API
 * Most popular SMS gateway for African businesses
 */
async function sendViaAfricasTalking(
  to: string,
  message: string,
  config: SMSConfig
): Promise<SMSResponse> {
  const username = config.username || 'sandbox';
  const apiKey = config.apiKey;
  
  if (!apiKey) {
    return { success: false, error: 'Africa\'s Talking API key not configured' };
  }

  // Format phone number (remove + and ensure country code)
  const formattedTo = to.replace(/\+/g, '').replace(/^0/, '');
  
  try {
    const response = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'ApiKey': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        username,
        to: formattedTo,
        message,
        from: config.senderId || '',
      }).toString(),
    });

    const data = await response.json();
    
    if (data.SMSMessageData?.Recipients?.[0]?.statusCode === 101) {
      return {
        success: true,
        messageId: data.SMSMessageData.MessageId,
        cost: data.SMSMessageData.Recipients[0].cost,
      };
    }
    
    return {
      success: false,
      error: data.SMSMessageData?.Message || 'Unknown error',
    };
  } catch (error) {
    console.error('Africa\'s Talking SMS error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Send SMS via Twilio API
 * Global SMS gateway with good African coverage
 */
async function sendViaTwilio(
  to: string,
  message: string,
  config: SMSConfig
): Promise<SMSResponse> {
  const accountSid = config.apiKey;
  const authToken = config.apiSecret;
  
  if (!accountSid || !authToken) {
    return { success: false, error: 'Twilio credentials not configured' };
  }

  // Format phone number with +
  const formattedTo = to.startsWith('+') ? to : `+${to}`;
  
  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: formattedTo,
          From: config.from || '',
          Body: message,
        }).toString(),
      }
    );

    const data = await response.json();
    
    if (data.status === 'queued' || data.status === 'sent') {
      return {
        success: true,
        messageId: data.sid,
        cost: data.price ? parseFloat(data.price) : undefined,
      };
    }
    
    return {
      success: false,
      error: data.message || 'Unknown error',
    };
  } catch (error) {
    console.error('Twilio SMS error:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Mock SMS sender for development
 */
async function sendViaMock(to: string, message: string): Promise<SMSResponse> {
  console.log(`[MOCK SMS] To: ${to}`);
  console.log(`[MOCK SMS] Message: ${message}`);
  
  return {
    success: true,
    messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    cost: 0,
  };
}

/**
 * Main SMS sending function
 */
export async function sendSMS(sms: SMSMessage): Promise<SMSResponse> {
  const config = getSMSConfig();
  let response: SMSResponse;

  switch (config.provider) {
    case 'africas_talking':
      response = await sendViaAfricasTalking(sms.to, sms.message, config);
      break;
    case 'twilio':
      response = await sendViaTwilio(sms.to, sms.message, config);
      break;
    default:
      response = await sendViaMock(sms.to, sms.message);
  }

  // Log SMS to database
  try {
    await prisma.activityLog.create({
      data: {
        organizationId: sms.organizationId,
        userId: sms.userId,
        action: 'sms_sent',
        entityType: 'notification',
        metadata: JSON.stringify({
          to: sms.to.replace(/\d(?=\d{4})/g, '*'), // Mask phone number
          type: sms.type,
          success: response.success,
          messageId: response.messageId,
          error: response.error,
        }),
        status: response.success ? 'success' : 'failed',
      },
    });
  } catch (error) {
    console.error('Failed to log SMS activity:', error);
  }

  return response;
}

/**
 * Send OTP via SMS
 */
export async function sendOTP(
  phoneNumber: string,
  otp: string,
  organizationId?: string,
  userId?: string
): Promise<SMSResponse> {
  const message = `Votre code de verification InsightGov est: ${otp}. Valide 10 minutes. Ne partagez pas ce code.`;
  
  return sendSMS({
    to: phoneNumber,
    message,
    organizationId,
    userId,
    type: SMSNotificationType.OTP,
  });
}

/**
 * Send security alert via SMS
 */
export async function sendSecurityAlert(
  phoneNumber: string,
  alert: {
    type: string;
    message: string;
    timestamp: Date;
  },
  organizationId?: string,
  userId?: string
): Promise<SMSResponse> {
  const message = `ALERTE SECURITE InsightGov: ${alert.type} - ${alert.message}. ${alert.timestamp.toLocaleString('fr-FR')}. Si vous n'etes pas a l'origine, contactez le support.`;
  
  return sendSMS({
    to: phoneNumber,
    message,
    organizationId,
    userId,
    type: SMSNotificationType.SECURITY,
  });
}

/**
 * Send invoice notification via SMS
 */
export async function sendInvoiceNotification(
  phoneNumber: string,
  invoice: {
    number: string;
    amount: string;
    currency: string;
    dueDate: Date;
  },
  organizationId?: string,
  userId?: string
): Promise<SMSResponse> {
  const message = `Facture InsightGov #${invoice.number}: ${invoice.amount} ${invoice.currency}. Echeance: ${invoice.dueDate.toLocaleDateString('fr-FR')}. Connectez-vous pour voir les details.`;
  
  return sendSMS({
    to: phoneNumber,
    message,
    organizationId,
    userId,
    type: SMSNotificationType.INVOICE,
  });
}

/**
 * Send subscription notification via SMS
 */
export async function sendSubscriptionNotification(
  phoneNumber: string,
  subscription: {
    plan: string;
    status: string;
    renewalDate?: Date;
  },
  organizationId?: string,
  userId?: string
): Promise<SMSResponse> {
  const renewalInfo = subscription.renewalDate 
    ? ` Renouvellement: ${subscription.renewalDate.toLocaleDateString('fr-FR')}.`
    : '';
  
  const message = `InsightGov: Votre abonnement ${subscription.plan} est ${subscription.status}.${renewalInfo} Merci de votre confiance!`;
  
  return sendSMS({
    to: phoneNumber,
    message,
    organizationId,
    userId,
    type: SMSNotificationType.SUBSCRIPTION,
  });
}

/**
 * Send reminder via SMS
 */
export async function sendReminder(
  phoneNumber: string,
  reminder: {
    title: string;
    message: string;
  },
  organizationId?: string,
  userId?: string
): Promise<SMSResponse> {
  const smsMessage = `Rappel InsightGov: ${reminder.title} - ${reminder.message}`;
  
  return sendSMS({
    to: phoneNumber,
    message: smsMessage.slice(0, 160), // SMS limit
    organizationId,
    userId,
    type: SMSNotificationType.REMINDER,
  });
}

/**
 * Validate phone number for African countries
 */
export function validateAfricanPhoneNumber(phone: string): { 
  valid: boolean; 
  country?: string;
  formatted?: string;
} {
  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '');
  
  // Common African country codes
  const africanCodes: Record<string, string> = {
    '233': 'Ghana',
    '234': 'Nigeria',
    '225': 'Côte d\'Ivoire',
    '226': 'Burkina Faso',
    '227': 'Niger',
    '228': 'Togo',
    '229': 'Benin',
    '230': 'Mauritius',
    '231': 'Liberia',
    '232': 'Sierra Leone',
    '242': 'Congo',
    '243': 'DRC',
    '254': 'Kenya',
    '255': 'Tanzania',
    '256': 'Uganda',
    '257': 'Burundi',
    '258': 'Mozambique',
    '260': 'Zambia',
    '261': 'Madagascar',
    '263': 'Zimbabwe',
    '264': 'Namibia',
    '265': 'Malawi',
    '266': 'Lesotho',
    '267': 'Botswana',
    '27': 'South Africa',
    '221': 'Senegal',
    '222': 'Mauritania',
    '223': 'Mali',
    '224': 'Guinea',
    '235': 'Chad',
    '236': 'CAR',
    '237': 'Cameroon',
    '238': 'Cape Verde',
    '239': 'Sao Tome',
    '240': 'Equatorial Guinea',
    '241': 'Gabon',
    '244': 'Angola',
    '245': 'Guinea-Bissau',
    '246': 'Diego Garcia',
    '248': 'Seychelles',
    '249': 'Sudan',
    '250': 'Rwanda',
    '251': 'Ethiopia',
    '252': 'Somalia',
    '253': 'Djibouti',
    '259': 'Zanzibar',
    '269': 'Comoros',
  };
  
  // Check for + prefix
  const withPlus = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  const withoutPlus = withPlus.slice(1);
  
  // Find matching country code
  for (const [code, country] of Object.entries(africanCodes)) {
    if (withoutPlus.startsWith(code)) {
      const numberPart = withoutPlus.slice(code.length);
      // Validate number length (typically 8-10 digits after country code)
      if (numberPart.length >= 8 && numberPart.length <= 10 && /^\d+$/.test(numberPart)) {
        return {
          valid: true,
          country,
          formatted: `+${code}${numberPart}`,
        };
      }
    }
  }
  
  // If not African, validate as general international number
  if (/^\+\d{10,15}$/.test(withPlus)) {
    return {
      valid: true,
      formatted: withPlus,
    };
  }
  
  return { valid: false };
}

export default {
  sendSMS,
  sendOTP,
  sendSecurityAlert,
  sendInvoiceNotification,
  sendSubscriptionNotification,
  sendReminder,
  validateAfricanPhoneNumber,
};
