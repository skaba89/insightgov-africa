// ============================================
// InsightGov Africa - Service de Notifications
// Emails et notifications in-app
// ============================================

import { db } from '@/lib/db';

// ============================================
// TYPES
// ============================================

export interface NotificationData {
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  title: string;
  message: string;
  link?: string;
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// ============================================
// SERVICE DE NOTIFICATIONS
// ============================================

export class NotificationService {
  /**
   * Créer une notification in-app
   */
  async createNotification(
    userId: string,
    data: NotificationData
  ): Promise<void> {
    // Note: Dans une vraie implémentation, on aurait une table Notification
    // Pour l'instant, on log juste
    console.log(`[Notification] User ${userId}: ${data.title} - ${data.message}`);
  }

  /**
   * Notifier tous les utilisateurs d'une organisation
   */
  async notifyOrganization(
    organizationId: string,
    data: NotificationData
  ): Promise<void> {
    const users = await db.user.findMany({
      where: { organizationId },
      select: { id: true },
    });

    for (const user of users) {
      await this.createNotification(user.id, data);
    }
  }

  /**
   * Envoyer un email
   */
  async sendEmail(data: EmailData): Promise<boolean> {
    // Mode développement : simuler l'envoi
    if (process.env.NODE_ENV === 'development' || !process.env.RESEND_API_KEY) {
      console.log('[Email] Simulation envoi:', {
        to: data.to,
        subject: data.subject,
      });
      return true;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'InsightGov Africa <noreply@insightgov.africa>',
          to: data.to,
          subject: data.subject,
          html: data.html,
          text: data.text,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('[Email] Error sending:', error);
      return false;
    }
  }

  // ============================================
  // EMAILS TEMPLATES
  // ============================================

  /**
   * Email de bienvenue
   */
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Bienvenue sur InsightGov Africa !',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Bienvenue sur InsightGov Africa</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <p>Bonjour ${name},</p>
            <p>Votre compte a été créé avec succès ! Vous pouvez maintenant :</p>
            <ul>
              <li>Importer vos premières données</li>
              <li>Générer des dashboards automatiques</li>
              <li>Explorer les insights IA</li>
            </ul>
            <p style="margin-top: 20px;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard"
                 style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
                Accéder à mon dashboard
              </a>
            </p>
          </div>
          <div style="padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
            © 2026 InsightGov Africa - La plateforme de dashboards IA pour l'Afrique
          </div>
        </div>
      `,
    });
  }

  /**
   * Email de confirmation d'abonnement
   */
  async sendSubscriptionConfirmation(
    email: string,
    plan: string,
    amount: number,
    currency: string
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Confirmation de votre abonnement InsightGov Africa',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">Abonnement confirmé</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <p>Merci pour votre confiance !</p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Plan :</strong> ${plan}</p>
              <p style="margin: 10px 0 0 0;"><strong>Montant :</strong> ${(amount / 100).toFixed(2)} ${currency}</p>
            </div>
            <p>Votre abonnement est maintenant actif. Profitez de toutes les fonctionnalités !</p>
          </div>
        </div>
      `,
    });
  }

  /**
   * Email d'analyse terminée
   */
  async sendAnalysisCompleteEmail(
    email: string,
    datasetName: string,
    kpiCount: number
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `Analyse terminée : ${datasetName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">✅ Analyse terminée</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <p>Bonne nouvelle ! L'analyse de votre dataset <strong>${datasetName}</strong> est terminée.</p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <p style="font-size: 48px; color: #059669; margin: 0;">${kpiCount}</p>
              <p style="color: #6b7280; margin: 5px 0 0 0;">KPIs générés</p>
            </div>
            <p style="margin-top: 20px;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard"
                 style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
                Voir mon dashboard
              </a>
            </p>
          </div>
        </div>
      `,
    });
  }

  /**
   * Alerte de limite atteinte
   */
  async sendLimitAlertEmail(
    email: string,
    limitType: string,
    current: number,
    max: number
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: `Limite atteinte : ${limitType}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f59e0b; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">⚠️ Limite atteinte</h1>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <p>Vous avez atteint la limite de votre plan :</p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>${limitType}</strong></p>
              <p style="margin: 10px 0 0 0;">${current} / ${max === -1 ? '∞' : max}</p>
            </div>
            <p>Pour continuer à utiliser InsightGov Africa sans limitation, envisagez de passer à un plan supérieur.</p>
            <p style="margin-top: 20px;">
              <a href="${process.env.NEXTAUTH_URL}/pricing"
                 style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
                Voir les plans
              </a>
            </p>
          </div>
        </div>
      `,
    });
  }
}

// Export singleton
export const notificationService = new NotificationService();
