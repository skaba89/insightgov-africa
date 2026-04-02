// ============================================
// InsightGov Africa - Service Email (Resend)
// Envoi d'emails transactionnels
// ============================================

import type { NextRequest } from 'next/server';

// ============================================
// CONFIGURATION
// ============================================

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'InsightGov Africa <noreply@insightgov.africa>';
const EMAIL_ENABLED = !!RESEND_API_KEY;

// Lazy load Resend only when needed
let resendClient: any = null;

async function getResendClient() {
  if (!RESEND_API_KEY) return null;
  
  if (!resendClient) {
    try {
      const Resend = (await import('resend')).default;
      resendClient = new Resend(RESEND_API_KEY);
    } catch {
      console.warn('[Email] Resend package not installed, email sending disabled');
      return null;
    }
  }
  return resendClient;
}

// ============================================
// TYPES
// ============================================

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: Record<string, string>;
}

interface WelcomeEmailData {
  name: string;
  email: string;
  organizationName: string;
}

interface AnalysisCompleteData {
  name: string;
  email: string;
  datasetName: string;
  kpiCount: number;
  dashboardUrl: string;
}

interface SubscriptionData {
  name: string;
  email: string;
  planName: string;
  amount: number;
  currency: string;
  nextBillingDate?: Date;
}

interface LimitAlertData {
  name: string;
  email: string;
  limitType: string;
  currentUsage: number;
  maxLimit: number;
  upgradeUrl: string;
}

interface EmailVerificationData {
  name: string;
  email: string;
  verificationUrl: string;
}

// ============================================
// SERVICE EMAIL
// ============================================

export class EmailService {
  private enabled: boolean;

  constructor() {
    this.enabled = EMAIL_ENABLED;
  }

  /**
   * Vérifier si l'email est configuré
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Envoyer un email
   */
  async send(options: EmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
    const client = await getResendClient();
    
    if (!client) {
      console.log('[Email] Service not configured, would send:', options.subject, 'to:', options.to);
      return { success: true, id: 'mock-email-id' };
    }

    try {
      const { data, error } = await client.emails.send({
        from: EMAIL_FROM,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo,
        tags: options.tags ? Object.entries(options.tags).map(([name, value]) => ({ name, value })) : undefined,
      });

      if (error) {
        console.error('[Email] Send error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, id: data?.id };
    } catch (error: any) {
      console.error('[Email] Exception:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // EMAILS TEMPLATES
  // ============================================

  /**
   * Email de bienvenue
   */
  async sendWelcome(data: WelcomeEmailData): Promise<{ success: boolean }> {
    const result = await this.send({
      to: data.email,
      subject: `Bienvenue sur InsightGov Africa, ${data.name} !`,
      html: this.renderWelcomeTemplate(data),
      text: `Bienvenue ${data.name} ! Votre compte InsightGov Africa pour ${data.organizationName} est prêt.`,
      tags: { type: 'welcome', organization: data.organizationName },
    });

    return { success: result.success };
  }

  /**
   * Email de confirmation d'analyse
   */
  async sendAnalysisComplete(data: AnalysisCompleteData): Promise<{ success: boolean }> {
    const result = await this.send({
      to: data.email,
      subject: `Analyse terminée : ${data.datasetName}`,
      html: this.renderAnalysisTemplate(data),
      text: `Votre analyse de ${data.datasetName} est terminée avec ${data.kpiCount} KPIs générés.`,
      tags: { type: 'analysis', dataset: data.datasetName },
    });

    return { success: result.success };
  }

  /**
   * Email de confirmation d'abonnement
   */
  async sendSubscriptionConfirmation(data: SubscriptionData): Promise<{ success: boolean }> {
    const result = await this.send({
      to: data.email,
      subject: `Confirmation de votre abonnement ${data.planName}`,
      html: this.renderSubscriptionTemplate(data),
      text: `Votre abonnement ${data.planName} est confirmé. Montant: ${data.amount} ${data.currency}/mois.`,
      tags: { type: 'subscription', plan: data.planName },
    });

    return { success: result.success };
  }

  /**
   * Email d'alerte de limite
   */
  async sendLimitAlert(data: LimitAlertData): Promise<{ success: boolean }> {
    const result = await this.send({
      to: data.email,
      subject: `Alerte : Limite ${data.limitType} atteinte`,
      html: this.renderLimitAlertTemplate(data),
      text: `Vous avez atteint ${data.currentUsage}/${data.maxLimit} pour ${data.limitType}.`,
      tags: { type: 'limit-alert', limit: data.limitType },
    });

    return { success: result.success };
  }

  /**
   * Email de réinitialisation de mot de passe
   */
  async sendPasswordReset(email: string, resetUrl: string, name: string): Promise<{ success: boolean }> {
    const result = await this.send({
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      html: this.renderPasswordResetTemplate(name, resetUrl),
      text: `Cliquez sur ce lien pour réinitialiser votre mot de passe: ${resetUrl}`,
      tags: { type: 'password-reset' },
    });

    return { success: result.success };
  }

  /**
   * Email de vérification d'adresse email
   */
  async sendEmailVerification(data: EmailVerificationData): Promise<{ success: boolean }> {
    const result = await this.send({
      to: data.email,
      subject: 'Vérifiez votre adresse email - InsightGov Africa',
      html: this.renderEmailVerificationTemplate(data),
      text: `Vérifiez votre email en cliquant sur ce lien: ${data.verificationUrl}`,
      tags: { type: 'email-verification' },
    });

    return { success: result.success };
  }

  /**
   * Renvoyer l'email de vérification
   */
  async resendVerification(email: string, verificationUrl: string, name: string): Promise<{ success: boolean }> {
    return this.sendEmailVerification({ name, email, verificationUrl });
  }

  // ============================================
  // TEMPLATES
  // ============================================

  private renderWelcomeTemplate(data: WelcomeEmailData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Bienvenue sur InsightGov Africa</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
              <div style="width: 60px; height: 60px; background: white; border-radius: 12px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 24px; font-weight: bold; color: #10b981;">IG</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 24px;">Bienvenue sur InsightGov Africa</h1>
            </div>
            <div style="padding: 40px;">
              <p style="font-size: 18px; color: #1f2937; margin-bottom: 20px;">
                Bonjour <strong>${data.name}</strong>,
              </p>
              <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
                Votre compte pour <strong>${data.organizationName}</strong> a été créé avec succès. Vous pouvez maintenant commencer à transformer vos données en insights actionnables.
              </p>
              <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px; color: #1f2937;">Prochaines étapes :</h3>
                <ol style="margin: 0; padding-left: 20px; color: #4b5563;">
                  <li style="margin-bottom: 10px;">Importez votre premier fichier CSV ou Excel</li>
                  <li style="margin-bottom: 10px;">Laissez notre IA analyser vos données</li>
                  <li style="margin-bottom: 10px;">Explorez vos dashboards personnalisés</li>
                </ol>
              </div>
              <a href="${process.env.NEXTAUTH_URL || 'https://insightgov.africa'}" style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Accéder à mon espace
              </a>
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                L'équipe InsightGov Africa<br>
                <a href="mailto:support@insightgov.africa" style="color: #10b981;">support@insightgov.africa</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private renderAnalysisTemplate(data: AnalysisCompleteData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>Analyse terminée</title></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 22px;">✅ Analyse terminée</h1>
            </div>
            <div style="padding: 30px;">
              <p style="font-size: 16px; color: #1f2937; margin-bottom: 15px;">
                Bonjour <strong>${data.name}</strong>,
              </p>
              <p style="color: #4b5563; line-height: 1.6;">
                L'analyse de votre dataset <strong>"${data.datasetName}"</strong> est terminée !
              </p>
              <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <div style="font-size: 36px; font-weight: bold; color: #10b981;">${data.kpiCount}</div>
                <div style="color: #059669;">KPIs générés</div>
              </div>
              <a href="${data.dashboardUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Voir le dashboard
              </a>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private renderSubscriptionTemplate(data: SubscriptionData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>Confirmation d'abonnement</title></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 22px;">🎉 Abonnement confirmé</h1>
            </div>
            <div style="padding: 30px;">
              <p style="font-size: 16px; color: #1f2937; margin-bottom: 15px;">
                Bonjour <strong>${data.name}</strong>,
              </p>
              <p style="color: #4b5563; line-height: 1.6;">
                Votre abonnement <strong>${data.planName}</strong> est maintenant actif.
              </p>
              <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <table style="width: 100%;">
                  <tr>
                    <td style="color: #6b7280; padding: 8px 0;">Plan</td>
                    <td style="text-align: right; font-weight: 600; padding: 8px 0;">${data.planName}</td>
                  </tr>
                  <tr>
                    <td style="color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">Montant</td>
                    <td style="text-align: right; font-weight: 600; padding: 8px 0; border-top: 1px solid #e5e7eb;">${data.amount / 100} ${data.currency}/mois</td>
                  </tr>
                  ${data.nextBillingDate ? `
                  <tr>
                    <td style="color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">Prochaine facturation</td>
                    <td style="text-align: right; padding: 8px 0; border-top: 1px solid #e5e7eb;">${data.nextBillingDate.toLocaleDateString('fr-FR')}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              <a href="${process.env.NEXTAUTH_URL || 'https://insightgov.africa'}/settings" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Gérer mon abonnement
              </a>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private renderLimitAlertTemplate(data: LimitAlertData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>Alerte de limite</title></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: #f59e0b; padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 22px;">⚠️ Alerte de limite</h1>
            </div>
            <div style="padding: 30px;">
              <p style="font-size: 16px; color: #1f2937; margin-bottom: 15px;">
                Bonjour <strong>${data.name}</strong>,
              </p>
              <p style="color: #4b5563; line-height: 1.6;">
                Vous avez atteint la limite de votre plan pour <strong>${data.limitType}</strong>.
              </p>
              <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #d97706;">${data.currentUsage} / ${data.maxLimit}</div>
                <div style="color: #92400e;">${data.limitType}</div>
              </div>
              <a href="${data.upgradeUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Upgrader mon plan
              </a>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private renderPasswordResetTemplate(name: string, resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>Réinitialisation du mot de passe</title></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 22px;">Réinitialisation du mot de passe</h1>
            </div>
            <div style="padding: 30px;">
              <p style="font-size: 16px; color: #1f2937; margin-bottom: 15px;">
                Bonjour <strong>${name}</strong>,
              </p>
              <p style="color: #4b5563; line-height: 1.6;">
                Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous :
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Réinitialiser mon mot de passe
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private renderEmailVerificationTemplate(data: EmailVerificationData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"><title>Vérifiez votre email</title></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; padding: 40px 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
              <div style="width: 60px; height: 60px; background: white; border-radius: 12px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 24px; font-weight: bold; color: #10b981;">IG</span>
              </div>
              <h1 style="color: white; margin: 0; font-size: 24px;">Vérifiez votre adresse email</h1>
            </div>
            <div style="padding: 40px;">
              <p style="font-size: 18px; color: #1f2937; margin-bottom: 20px;">
                Bonjour <strong>${data.name}</strong>,
              </p>
              <p style="color: #4b5563; line-height: 1.6; margin-bottom: 20px;">
                Merci de vous être inscrit sur InsightGov Africa. Pour activer votre compte et commencer à utiliser notre plateforme, veuillez vérifier votre adresse email.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.verificationUrl}" style="display: inline-block; background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                  Vérifier mon email
                </a>
              </div>
              <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  <strong>Ce lien expire dans 24 heures.</strong><br><br>
                  Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
                  <span style="color: #10b981; word-break: break-all;">${data.verificationUrl}</span>
                </p>
              </div>
              <p style="color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                Si vous n'avez pas créé de compte InsightGov Africa, vous pouvez ignorer cet email.
              </p>
              <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                L'équipe InsightGov Africa<br>
                <a href="mailto:support@insightgov.africa" style="color: #10b981;">support@insightgov.africa</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

// ============================================
// EXPORT SINGLETON
// ============================================

export const emailService = new EmailService();
export default emailService;
