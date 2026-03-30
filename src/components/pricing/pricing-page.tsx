/**
 * InsightGov Africa - Pricing Page Component
 * ===========================================
 * Page des tarifs avec sélection de plan et paiement Paystack.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Check,
  Sparkles,
  Building2,
  Crown,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Plans de pricing
const PRICING_PLANS = {
  free: {
    name: 'Free',
    amount: 0,
    currency: 'EUR',
    features: [
      '1 dataset',
      '5 KPIs maximum',
      'Export PDF limité',
      'Support email',
    ],
  },
  starter: {
    name: 'Starter',
    amount: 9900, // 99 EUR
    currency: 'EUR',
    features: [
      '5 datasets',
      '15 KPIs par dashboard',
      'Export PDF illimité',
      'Support prioritaire',
      'Filtres avancés',
    ],
  },
  professional: {
    name: 'Professional',
    amount: 49900, // 499 EUR
    currency: 'EUR',
    features: [
      'Datasets illimités',
      'KPIs illimités',
      'Export PDF & Excel',
      'API Access',
      'Support dédié',
      'Personnalisation avancée',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    amount: 149900, // 1499 EUR
    currency: 'EUR',
    features: [
      'Tout inclus Professional',
      'Serveur dédié',
      'SSO / SAML',
      'SLA 99.9%',
      'Formation équipe',
      'Support 24/7',
    ],
  },
} as const;

type PricingPlanTier = keyof typeof PRICING_PLANS;

interface PricingPageProps {
  organizationId?: string;
  email?: string;
  currentTier?: string;
  onSelectPlan?: (tier: PricingPlanTier, billingCycle: 'monthly' | 'yearly') => void;
}

// Icônes par plan
const PLAN_ICONS = {
  free: Building2,
  starter: Sparkles,
  professional: Crown,
  enterprise: Crown,
};

// Couleurs par plan
const PLAN_COLORS = {
  free: 'border-gray-200 dark:border-gray-700',
  starter: 'border-blue-200 dark:border-blue-800',
  professional: 'border-purple-200 dark:border-purple-800 ring-2 ring-purple-500',
  enterprise: 'border-amber-200 dark:border-amber-800',
};

const PLAN_BUTTON_COLORS = {
  free: 'bg-gray-600 hover:bg-gray-700',
  starter: 'bg-blue-600 hover:bg-blue-700',
  professional: 'bg-purple-600 hover:bg-purple-700',
  enterprise: 'bg-amber-600 hover:bg-amber-700',
};

export function PricingPage({
  organizationId,
  email,
  currentTier = 'free',
  onSelectPlan,
}: PricingPageProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<PricingPlanTier | null>(null);

  // Calculer le prix avec réduction annuelle
  const getPrice = (tier: PricingPlanTier) => {
    const plan = PRICING_PLANS[tier];
    let price = plan.amount / 100; // Convertir de centimes

    if (billingCycle === 'yearly' && price > 0) {
      price = price * 12 * 0.8; // 20% de réduction
    }

    return price;
  };

  // Formater le prix
  const formatPrice = (price: number) => {
    if (price === 0) return 'Gratuit';
    return `${price.toFixed(0)} €`;
  };

  // Gérer la sélection d'un plan
  const handleSelectPlan = async (tier: PricingPlanTier) => {
    if (!organizationId || !email) {
      alert('Veuillez vous connecter pour souscrire à un abonnement');
      return;
    }

    setLoadingPlan(tier);

    try {
      const response = await fetch('/api/paystack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          organizationId,
          email,
          billingCycle,
        }),
      });

      const result = await response.json();

      if (result.success) {
        if (result.authorization_url) {
          // Rediriger vers Paystack
          window.location.href = result.authorization_url;
        } else if (onSelectPlan) {
          // Plan gratuit activé directement
          onSelectPlan(tier, billingCycle);
        }
      } else {
        alert(result.error || 'Erreur lors de la souscription');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la souscription');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Choisissez votre plan
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Des solutions adaptées aux besoins des Ministères, ONG et Entreprises africaines.
        </p>
      </div>

      {/* Toggle mensuel/annuel */}
      <div className="flex items-center justify-center gap-4 mb-10">
        <Label
          htmlFor="billing-toggle"
          className={cn(
            'text-sm font-medium cursor-pointer',
            billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'
          )}
        >
          Mensuel
        </Label>
        <Switch
          id="billing-toggle"
          checked={billingCycle === 'yearly'}
          onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
        />
        <Label
          htmlFor="billing-toggle"
          className={cn(
            'text-sm font-medium cursor-pointer',
            billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'
          )}
        >
          Annuel
          <Badge className="ml-2 bg-green-500 text-white text-xs">
            -20%
          </Badge>
        </Label>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4">
        {Object.entries(PRICING_PLANS).map(([tier, plan]) => {
          const Icon = PLAN_ICONS[tier as PricingPlanTier];
          const price = getPrice(tier as PricingPlanTier);
          const isCurrentPlan = currentTier === tier;
          const isLoading = loadingPlan === tier;
          const isPopular = tier === 'professional';

          return (
            <Card
              key={tier}
              className={cn(
                'relative flex flex-col transition-all duration-200',
                PLAN_COLORS[tier as PricingPlanTier],
                isPopular && 'scale-105 shadow-lg'
              )}
            >
              {/* Badge populaire */}
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white">
                    Plus populaire
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-3">
                  <div
                    className={cn(
                      'p-3 rounded-full',
                      tier === 'free' && 'bg-gray-100 text-gray-600',
                      tier === 'starter' && 'bg-blue-100 text-blue-600',
                      tier === 'professional' && 'bg-purple-100 text-purple-600',
                      tier === 'enterprise' && 'bg-amber-100 text-amber-600'
                    )}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {formatPrice(price)}
                    </span>
                    {price > 0 && (
                      <span className="text-gray-500 text-sm">
                        /{billingCycle === 'yearly' ? 'an' : 'mois'}
                      </span>
                    )}
                  </div>
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col">
                {/* Features */}
                <ul className="space-y-3 flex-1 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Bouton */}
                <Button
                  className={cn('w-full', PLAN_BUTTON_COLORS[tier as PricingPlanTier])}
                  onClick={() => handleSelectPlan(tier as PricingPlanTier)}
                  disabled={isCurrentPlan || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Chargement...
                    </>
                  ) : isCurrentPlan ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Plan actuel
                    </>
                  ) : (
                    tier === 'free' ? 'Commencer gratuitement' : 'Choisir ce plan'
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Garanties */}
      <div className="mt-12 text-center">
        <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            Annulation à tout moment
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            Paiement sécurisé via Paystack
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            Support réactif
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-16 max-w-3xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-8">
          Questions fréquentes
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Puis-je changer de plan à tout moment ?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. 
              La facturation sera ajustée au prorata.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Quels modes de paiement acceptez-vous ?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Nous acceptons les paiements par carte bancaire, mobile money (Orange Money, 
              Wave, MTN Mobile Money), et virement bancaire via Paystack.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Y a-t-il une période d\'essai ?
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Le plan Starter inclut 14 jours d\'essai gratuit. 
              Aucune carte de paiement n\'est requise pour commencer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PricingPage;
