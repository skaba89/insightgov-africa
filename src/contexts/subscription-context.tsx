/**
 * InsightGov Africa - Subscription Context
 * =========================================
 * Context pour gérer l'état des abonnements et les limites de features.
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Types de plans
export type SubscriptionTier = 'free' | 'starter' | 'professional' | 'enterprise';

// Limites par plan
export const PLAN_LIMITS = {
  free: {
    datasets: 1,
    kpisPerDashboard: 5,
    exportsPerMonth: 3,
    features: ['pdf-export', 'email-support'],
  },
  starter: {
    datasets: 5,
    kpisPerDashboard: 15,
    exportsPerMonth: 50,
    features: ['pdf-export', 'excel-export', 'priority-support', 'advanced-filters'],
  },
  professional: {
    datasets: -1, // illimité
    kpisPerDashboard: -1,
    exportsPerMonth: -1,
    features: [
      'pdf-export',
      'excel-export',
      'pptx-export',
      'api-access',
      'dedicated-support',
      'advanced-customization',
    ],
  },
  enterprise: {
    datasets: -1,
    kpisPerDashboard: -1,
    exportsPerMonth: -1,
    features: [
      'pdf-export',
      'excel-export',
      'pptx-export',
      'api-access',
      'dedicated-support',
      'advanced-customization',
      'dedicated-server',
      'sso-saml',
      'sla-99.9',
      'team-training',
      'support-24-7',
    ],
  },
} as const;

// Interface du contexte
interface SubscriptionContextType {
  tier: SubscriptionTier;
  isLoading: boolean;
  organizationId: string | null;
  limits: typeof PLAN_LIMITS[SubscriptionTier];
  canAccess: (feature: string) => boolean;
  canCreateDataset: (currentCount: number) => boolean;
  canCreateKPI: (currentCount: number) => boolean;
  canExport: (exportsThisMonth: number) => boolean;
  refreshSubscription: () => Promise<void>;
  setOrganizationId: (id: string | null) => void;
  setTier: (tier: SubscriptionTier) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Provider
export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  // Récupérer les limites du plan actuel
  const limits = PLAN_LIMITS[tier];

  // Vérifier l'accès à une feature
  const canAccess = useCallback(
    (feature: string) => {
      return (limits.features as readonly string[]).includes(feature);
    },
    [limits]
  );

  // Vérifier si on peut créer un dataset
  const canCreateDataset = useCallback(
    (currentCount: number) => {
      return limits.datasets === -1 || currentCount < limits.datasets;
    },
    [limits]
  );

  // Vérifier si on peut créer un KPI
  const canCreateKPI = useCallback(
    (currentCount: number) => {
      return limits.kpisPerDashboard === -1 || currentCount < limits.kpisPerDashboard;
    },
    [limits]
  );

  // Vérifier si on peut exporter
  const canExport = useCallback(
    (exportsThisMonth: number) => {
      return limits.exportsPerMonth === -1 || exportsThisMonth < limits.exportsPerMonth;
    },
    [limits]
  );

  // Rafraîchir les données d'abonnement
  const refreshSubscription = useCallback(async () => {
    if (!organizationId) {
      setTier('free');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/organizations/${organizationId}/subscription`);
      if (response.ok) {
        const data = await response.json();
        setTier(data.tier || 'free');
      }
    } catch (error) {
      console.error('Erreur récupération abonnement:', error);
      setTier('free');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  // Charger l'abonnement au montage
  useEffect(() => {
    if (organizationId) {
      refreshSubscription();
    } else {
      setIsLoading(false);
    }
  }, [organizationId, refreshSubscription]);

  return (
    <SubscriptionContext.Provider
      value={{
        tier,
        isLoading,
        organizationId,
        limits,
        canAccess,
        canCreateDataset,
        canCreateKPI,
        canExport,
        refreshSubscription,
        setOrganizationId,
        setTier,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

// Hook pour utiliser le contexte
export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription doit être utilisé dans un SubscriptionProvider');
  }
  return context;
}

// Composant de garde pour les features premium
interface PremiumFeatureGuardProps {
  feature: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
  showUpgradePrompt?: boolean;
}

export function PremiumFeatureGuard({
  feature,
  fallback,
  children,
  showUpgradePrompt = false,
}: PremiumFeatureGuardProps) {
  const { canAccess, tier } = useSubscription();

  if (!canAccess(feature)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showUpgradePrompt) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-4">
            <svg
              className="w-6 h-6 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Fonctionnalité Premium
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-4">
            Cette fonctionnalité nécessite un abonnement Starter ou supérieur.
          </p>
          <a
            href="/pricing"
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Voir les plans
          </a>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}

export default SubscriptionProvider;
