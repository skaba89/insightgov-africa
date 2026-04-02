// =============================================================================
// InsightGov Africa - KYC (Know Your Customer) Service
// =============================================================================
// Service de vérification d'identité pour les utilisateurs
// Niveaux: basic, intermediate, advanced
// Documents: CNI, Passport, Carte Électeur
// =============================================================================

import { db } from '@/lib/db';
import { AuditLogger } from '@/lib/audit-logger';
import { nanoid } from 'nanoid';
import { createHash, randomBytes } from 'crypto';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export type KYCLevel = 'basic' | 'intermediate' | 'advanced';
export type KYCStatus = 'none' | 'pending' | 'verified' | 'rejected';
export type IDType = 'cni' | 'passport' | 'carte_electeur';

export interface KYCDocument {
  type: IDType;
  number: string;
  documentUrl: string;
  selfieUrl?: string;
  issueDate?: string;
  expiryDate?: string;
  country?: string;
}

export interface KYCSubmission {
  userId: string;
  documents: KYCDocument[];
  level: KYCLevel;
}

export interface KYCResult {
  success: boolean;
  kycId?: string;
  status?: KYCStatus;
  level?: KYCLevel;
  error?: string;
  message?: string;
}

export interface KYCStatusInfo {
  status: KYCStatus;
  level: KYCLevel;
  idType?: IDType;
  idNumber?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  features: KYCFeatures;
}

export interface KYCFeatures {
  maxTransactionAmount: number;
  dailyLimit: number;
  monthlyLimit: number;
  allowedProviders: string[];
  requiresManualApproval: boolean;
  canWithdraw: boolean;
  canTransfer: boolean;
}

export interface KYCVerificationData {
  reviewerId: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// KYC LEVEL CONFIGURATIONS
// =============================================================================

const KYC_LEVEL_CONFIG: Record<KYCLevel, KYCFeatures> = {
  basic: {
    maxTransactionAmount: 100000, // 100,000 GNF
    dailyLimit: 500000, // 500,000 GNF
    monthlyLimit: 2000000, // 2,000,000 GNF
    allowedProviders: ['orange', 'mtn'],
    requiresManualApproval: false,
    canWithdraw: true,
    canTransfer: true,
  },
  intermediate: {
    maxTransactionAmount: 500000, // 500,000 GNF
    dailyLimit: 2000000, // 2,000,000 GNF
    monthlyLimit: 10000000, // 10,000,000 GNF
    allowedProviders: ['orange', 'mtn', 'bank'],
    requiresManualApproval: false,
    canWithdraw: true,
    canTransfer: true,
  },
  advanced: {
    maxTransactionAmount: 5000000, // 5,000,000 GNF
    dailyLimit: 10000000, // 10,000,000 GNF
    monthlyLimit: 50000000, // 50,000,000 GNF
    allowedProviders: ['orange', 'mtn', 'bank', 'wave'],
    requiresManualApproval: true,
    canWithdraw: true,
    canTransfer: true,
  },
};

// Valid ID types for Guinea
const VALID_ID_TYPES: IDType[] = ['cni', 'passport', 'carte_electeur'];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Validate ID number format
 */
function validateIDNumber(type: IDType, number: string): boolean {
  const cleaned = number.replace(/\s/g, '');
  
  switch (type) {
    case 'cni':
      // Guinea CNI: typically 9-12 digits
      return /^\d{9,12}$/.test(cleaned);
    case 'passport':
      // Passport: alphanumeric, 8-10 chars
      return /^[A-Z0-9]{8,10}$/i.test(cleaned);
    case 'carte_electeur':
      // Voter card: typically 10-15 digits
      return /^\d{10,15}$/.test(cleaned);
    default:
      return false;
  }
}

/**
 * Hash sensitive data for storage
 */
function hashSensitiveData(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Generate unique KYC reference
 */
function generateKYCReference(): string {
  return `KYC-${Date.now()}-${nanoid(8).toUpperCase()}`;
}

/**
 * Validate document URLs
 */
function isValidDocumentUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// =============================================================================
// KYC SERVICE CLASS
// =============================================================================

class KYCServiceClass {
  /**
   * Submit KYC documents for verification
   */
  async submitKYC(
    userId: string,
    documents: KYCDocument[],
    targetLevel: KYCLevel = 'basic'
  ): Promise<KYCResult> {
    if (!db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      // Validate user exists
      const user = await db.user.findUnique({
        where: { id: userId },
        include: { wallet: true },
      });

      if (!user) {
        return { success: false, error: 'Utilisateur non trouvé' };
      }

      // Check if KYC is already pending or verified at this level
      if (user.kycStatus === 'pending') {
        return { success: false, error: 'Une vérification KYC est déjà en cours' };
      }

      // Validate documents
      if (!documents || documents.length === 0) {
        return { success: false, error: 'Au moins un document est requis' };
      }

      for (const doc of documents) {
        // Validate ID type
        if (!VALID_ID_TYPES.includes(doc.type)) {
          return { success: false, error: `Type de document invalide: ${doc.type}` };
        }

        // Validate ID number format
        if (!validateIDNumber(doc.type, doc.number)) {
          return { success: false, error: `Numéro de document invalide pour ${doc.type}` };
        }

        // Validate document URL
        if (!isValidDocumentUrl(doc.documentUrl)) {
          return { success: false, error: 'URL de document invalide' };
        }
      }

      // Primary document (first one)
      const primaryDoc = documents[0];

      // Update user KYC status
      await db.user.update({
        where: { id: userId },
        data: {
          idType: primaryDoc.type,
          idNumber: hashSensitiveData(primaryDoc.number), // Hash for security
          idDocumentUrl: primaryDoc.documentUrl,
          selfieUrl: primaryDoc.selfieUrl,
          kycStatus: 'pending',
          updatedAt: new Date(),
        },
      });

      // Update wallet KYC level if exists
      if (user.wallet) {
        const targetConfig = KYC_LEVEL_CONFIG[targetLevel];
        await db.wallet.update({
          where: { userId },
          data: {
            dailyLimit: targetConfig.dailyLimit,
            monthlyLimit: targetConfig.monthlyLimit,
          },
        });
      }

      // Log audit
      await AuditLogger.log({
        action: 'KYC_SUBMITTED',
        userId,
        entityType: 'USER',
        entityId: userId,
        metadata: {
          level: targetLevel,
          documentTypes: documents.map(d => d.type),
          reference: generateKYCReference(),
        },
      });

      console.log(`[KYC] Submission received for user ${userId}, level: ${targetLevel}`);

      return {
        success: true,
        status: 'pending',
        level: targetLevel,
        message: 'Documents KYC soumis avec succès. Vérification en cours.',
      };
    } catch (error) {
      console.error('[KYC] Submit error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la soumission KYC',
      };
    }
  }

  /**
   * Verify KYC (admin action)
   */
  async verifyKYC(
    userId: string,
    verificationData: KYCVerificationData
  ): Promise<KYCResult> {
    if (!db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const user = await db.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return { success: false, error: 'Utilisateur non trouvé' };
      }

      if (user.kycStatus !== 'pending') {
        return { success: false, error: 'Aucune demande KYC en attente' };
      }

      // Update user KYC status
      await db.user.update({
        where: { id: userId },
        data: {
          kycStatus: 'verified',
          kycVerifiedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Update wallet to advanced limits
      const wallet = await db.wallet.findUnique({ where: { userId } });
      if (wallet) {
        const advancedConfig = KYC_LEVEL_CONFIG.intermediate;
        await db.wallet.update({
          where: { userId },
          data: {
            kycLevel: 'intermediate',
            dailyLimit: advancedConfig.dailyLimit,
            monthlyLimit: advancedConfig.monthlyLimit,
          },
        });
      }

      // Log audit
      await AuditLogger.log({
        action: 'KYC_VERIFIED',
        userId: verificationData.reviewerId,
        entityType: 'USER',
        entityId: userId,
        metadata: {
          verifiedBy: verificationData.reviewerId,
          notes: verificationData.notes,
          verifiedAt: new Date().toISOString(),
        },
      });

      console.log(`[KYC] User ${userId} verified by ${verificationData.reviewerId}`);

      return {
        success: true,
        status: 'verified',
        message: 'KYC vérifié avec succès',
      };
    } catch (error) {
      console.error('[KYC] Verify error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la vérification',
      };
    }
  }

  /**
   * Reject KYC submission
   */
  async rejectKYC(
    userId: string,
    reason: string,
    rejectionData: KYCVerificationData
  ): Promise<KYCResult> {
    if (!db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const user = await db.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return { success: false, error: 'Utilisateur non trouvé' };
      }

      if (user.kycStatus !== 'pending') {
        return { success: false, error: 'Aucune demande KYC en attente' };
      }

      if (!reason || reason.trim().length < 10) {
        return { success: false, error: 'La raison du rejet doit contenir au moins 10 caractères' };
      }

      // Update user KYC status
      await db.user.update({
        where: { id: userId },
        data: {
          kycStatus: 'rejected',
          updatedAt: new Date(),
        },
      });

      // Log audit
      await AuditLogger.log({
        action: 'KYC_REJECTED',
        userId: rejectionData.reviewerId,
        entityType: 'USER',
        entityId: userId,
        metadata: {
          rejectedBy: rejectionData.reviewerId,
          reason,
          rejectedAt: new Date().toISOString(),
        },
      });

      console.log(`[KYC] User ${userId} rejected: ${reason}`);

      return {
        success: true,
        status: 'rejected',
        message: 'KYC rejeté',
      };
    } catch (error) {
      console.error('[KYC] Reject error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors du rejet',
      };
    }
  }

  /**
   * Get KYC status for a user
   */
  async getKYCStatus(userId: string): Promise<KYCStatusInfo | null> {
    if (!db) {
      return null;
    }

    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        include: { wallet: true },
      });

      if (!user) {
        return null;
      }

      const level = user.wallet?.kycLevel || 'basic';
      const features = KYC_LEVEL_CONFIG[level];

      return {
        status: user.kycStatus as KYCStatus,
        level,
        idType: user.idType as IDType | undefined,
        idNumber: user.idNumber ? '***' + user.idNumber.slice(-4) : undefined,
        verifiedAt: user.kycVerifiedAt || undefined,
        features,
      };
    } catch (error) {
      console.error('[KYC] Get status error:', error);
      return null;
    }
  }

  /**
   * Upgrade KYC level
   */
  async upgradeKYCLevel(
    userId: string,
    newLevel: KYCLevel,
    additionalDocuments?: KYCDocument[]
  ): Promise<KYCResult> {
    if (!db) {
      return { success: false, error: 'Database not available' };
    }

    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        include: { wallet: true },
      });

      if (!user) {
        return { success: false, error: 'Utilisateur non trouvé' };
      }

      if (user.kycStatus !== 'verified') {
        return { success: false, error: 'KYC doit être vérifié avant de pouvoir augmenter le niveau' };
      }

      const currentLevel = user.wallet?.kycLevel || 'basic';
      const levelOrder: KYCLevel[] = ['basic', 'intermediate', 'advanced'];
      
      const currentIndex = levelOrder.indexOf(currentLevel);
      const newIndex = levelOrder.indexOf(newLevel);

      if (newIndex <= currentIndex) {
        return { success: false, error: 'Le nouveau niveau doit être supérieur au niveau actuel' };
      }

      // For advanced level, require additional documents
      if (newLevel === 'advanced' && additionalDocuments && additionalDocuments.length > 0) {
        // Submit additional documents
        await this.submitKYC(userId, additionalDocuments, newLevel);
        
        return {
          success: true,
          status: 'pending',
          level: newLevel,
          message: 'Documents additionnels soumis pour mise à niveau.',
        };
      }

      // Direct upgrade for intermediate
      if (newLevel === 'intermediate' && user.wallet) {
        const newConfig = KYC_LEVEL_CONFIG.intermediate;
        
        await db.wallet.update({
          where: { userId },
          data: {
            kycLevel: 'intermediate',
            dailyLimit: newConfig.dailyLimit,
            monthlyLimit: newConfig.monthlyLimit,
          },
        });

        // Log audit
        await AuditLogger.log({
          action: 'KYC_UPGRADED',
          userId,
          entityType: 'USER',
          entityId: userId,
          metadata: {
            previousLevel: currentLevel,
            newLevel,
            upgradedAt: new Date().toISOString(),
          },
        });

        return {
          success: true,
          status: 'verified',
          level: newLevel,
          message: 'Niveau KYC augmenté avec succès',
        };
      }

      return {
        success: false,
        error: 'Documents additionnels requis pour ce niveau',
      };
    } catch (error) {
      console.error('[KYC] Upgrade error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la mise à niveau',
      };
    }
  }

  /**
   * Check if user can perform a transaction based on KYC level
   */
  async canPerformTransaction(
    userId: string,
    amount: number,
    transactionType: 'deposit' | 'withdraw' | 'transfer'
  ): Promise<{ allowed: boolean; reason?: string; features?: KYCFeatures }> {
    if (!db) {
      return { allowed: false, reason: 'Database not available' };
    }

    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        include: { wallet: true },
      });

      if (!user) {
        return { allowed: false, reason: 'Utilisateur non trouvé' };
      }

      // Check if KYC is verified
      if (user.kycStatus !== 'verified') {
        return { allowed: false, reason: 'KYC non vérifié' };
      }

      const level = user.wallet?.kycLevel || 'basic';
      const features = KYC_LEVEL_CONFIG[level];

      // Check transaction type permissions
      if (transactionType === 'withdraw' && !features.canWithdraw) {
        return { allowed: false, reason: 'Retrait non autorisé à ce niveau', features };
      }

      if (transactionType === 'transfer' && !features.canTransfer) {
        return { allowed: false, reason: 'Transfert non autorisé à ce niveau', features };
      }

      // Check amount limits
      if (amount > features.maxTransactionAmount) {
        return {
          allowed: false,
          reason: `Montant maximum autorisé: ${features.maxTransactionAmount} GNF`,
          features,
        };
      }

      // Check daily limit
      if (user.wallet && user.wallet.currentDaily + amount > features.dailyLimit) {
        return {
          allowed: false,
          reason: `Limite journalière atteinte. Maximum: ${features.dailyLimit} GNF`,
          features,
        };
      }

      return { allowed: true, features };
    } catch (error) {
      console.error('[KYC] Transaction check error:', error);
      return { allowed: false, reason: 'Erreur lors de la vérification' };
    }
  }

  /**
   * Get all pending KYC submissions (admin)
   */
  async getPendingSubmissions(options?: {
    limit?: number;
    offset?: number;
  }): Promise<{ submissions: unknown[]; total: number }> {
    if (!db) {
      return { submissions: [], total: 0 };
    }

    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    try {
      const [users, total] = await Promise.all([
        db.user.findMany({
          where: { kycStatus: 'pending' },
          orderBy: { updatedAt: 'asc' },
          take: limit,
          skip: offset,
          select: {
            id: true,
            email: true,
            phone: true,
            firstName: true,
            lastName: true,
            idType: true,
            idDocumentUrl: true,
            selfieUrl: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        db.user.count({ where: { kycStatus: 'pending' } }),
      ]);

      return { submissions: users, total };
    } catch (error) {
      console.error('[KYC] Get pending error:', error);
      return { submissions: [], total: 0 };
    }
  }

  /**
   * Get KYC level configuration
   */
  getLevelConfig(level: KYCLevel): KYCFeatures {
    return KYC_LEVEL_CONFIG[level];
  }

  /**
   * Get all level configurations
   */
  getAllLevelConfigs(): Record<KYCLevel, KYCFeatures> {
    return KYC_LEVEL_CONFIG;
  }
}

// Export singleton instance
export const kycService = new KYCServiceClass();

// Export class for testing
export { KYCServiceClass };

// Default export
export default kycService;
