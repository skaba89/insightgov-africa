// ============================================
// InsightGov Africa - Landing Page
// Page d'accueil marketing
// ============================================

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  BarChart3,
  Upload,
  Sparkles,
  Shield,
  Zap,
  Globe,
  Heart,
  GraduationCap,
  Check,
  ArrowRight,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ============================================
// HERO SECTION
// ============================================

function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge className="bg-white/20 text-white border-0 px-4 py-1 text-sm mb-6">
            🌍 100% Africain • IA Puissante • Prix Accessibles
          </Badge>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Transformez vos données en
            <span className="block text-emerald-200">dashboards intelligents</span>
          </h1>

          <p className="text-xl md:text-2xl text-emerald-100 max-w-3xl mx-auto mb-10">
            La première plateforme IA de génération automatique de tableaux de bord
            pour les Ministères, ONG et Entreprises africaines.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/onboarding">
              <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 text-lg px-8 py-6">
                <Play className="w-5 h-5 mr-2" />
                Essayer gratuitement
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 text-lg px-8 py-6">
                Voir les tarifs
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '50+', label: 'Organisations' },
              { value: '500+', label: 'Dashboards créés' },
              { value: '15+', label: 'Pays africains' },
              { value: '99.9%', label: 'Disponibilité' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-white">{stat.value}</div>
                <div className="text-emerald-200 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// FEATURES SECTION
// ============================================

function FeaturesSection() {
  const features = [
    {
      icon: Upload,
      title: 'Import simple',
      description: 'Uploadez vos fichiers CSV ou Excel. L\'IA analyse automatiquement la structure.',
    },
    {
      icon: Sparkles,
      title: 'Analyse IA',
      description: 'Notre IA génère automatiquement les KPIs pertinents pour votre secteur.',
    },
    {
      icon: BarChart3,
      title: 'Dashboards instantanés',
      description: 'Visualisez vos données avec des graphiques professionnels.',
    },
    {
      icon: Shield,
      title: 'Sécurité',
      description: 'Vos données sont chiffrées. Conformité RGPD.',
    },
    {
      icon: Globe,
      title: 'Partage facile',
      description: 'Partagez vos dashboards avec un simple lien.',
    },
    {
      icon: Zap,
      title: 'Rapide',
      description: 'De l\'import au dashboard en moins de 2 minutes.',
    },
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="bg-emerald-100 text-emerald-700 mb-4">Fonctionnalités</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Tout ce dont vous avez besoin
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// SECTORS SECTION
// ============================================

function SectorsSection() {
  const sectors = [
    { icon: Heart, name: 'Santé', color: 'text-red-600', bg: 'bg-red-100' },
    { icon: GraduationCap, name: 'Éducation', color: 'text-blue-600', bg: 'bg-blue-100' },
    { icon: BarChart3, name: 'Finance', color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { icon: Globe, name: 'Agriculture', color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="bg-emerald-100 text-emerald-700 mb-4">Secteurs</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Adapté à votre secteur
          </h2>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {sectors.map((sector, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className={`w-16 h-16 ${sector.bg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <sector.icon className={`w-8 h-8 ${sector.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{sector.name}</h3>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// PRICING PREVIEW
// ============================================

function PricingPreview() {
  const plans = [
    { name: 'Gratuit', price: '0€', features: ['1 Dataset', '5 Dashboards', 'Export PDF limité'] },
    { name: 'Starter', price: '49€', features: ['10 Datasets', '25 Dashboards', 'Support prioritaire'] },
    { name: 'Pro', price: '149€', features: ['Datasets illimités', 'API Access', 'Support dédié'] },
  ];

  return (
    <section className="py-24 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="bg-emerald-500/20 text-emerald-400 mb-4">Tarifs</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Des prix adaptés à l'Afrique</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className={`h-full ${i === 2 ? 'border-emerald-500 border-2' : 'border-gray-700'} bg-gray-800`}>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold mb-4">
                    {plan.price}
                    <span className="text-lg text-gray-400">/mois</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2 text-gray-300">
                        <Check className="w-4 h-4 text-emerald-400" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href="/onboarding">
                    <Button
                      className={`w-full ${i === 2 ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                      Commencer
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// CTA SECTION
// ============================================

function CTASection() {
  return (
    <section className="py-24 bg-emerald-600">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Prêt à transformer vos données ?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Rejoignez les organisations africaines qui prennent de meilleures décisions.
          </p>
          <Link href="/onboarding">
            <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 text-lg px-8">
              Démarrer maintenant
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// FOOTER
// ============================================

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">IG</span>
              </div>
              <div>
                <span className="font-bold text-white">InsightGov</span>
                <span className="text-xs text-emerald-400 block">Africa</span>
              </div>
            </div>
            <p className="text-sm">La plateforme de dashboards IA pour l'Afrique.</p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Produit</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/pricing" className="hover:text-white">Tarifs</Link></li>
              <li><Link href="/demo" className="hover:text-white">Démo</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Légal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/legal/terms" className="hover:text-white">CGU/CGV</Link></li>
              <li><Link href="/legal/privacy" className="hover:text-white">Confidentialité</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Contact</h4>
            <p className="text-sm">contact@insightgov.africa</p>
            <div className="flex gap-4 mt-2 text-sm">
              <a href="https://linkedin.com/company/insightgov-africa" target="_blank" rel="noopener noreferrer" className="hover:text-white">LinkedIn</a>
              <a href="https://twitter.com/insightgov_africa" target="_blank" rel="noopener noreferrer" className="hover:text-white">Twitter</a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
          © 2026 InsightGov Africa. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}

// ============================================
// LANDING PAGE
// ============================================

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <SectorsSection />
      <PricingPreview />
      <CTASection />
      <Footer />
    </div>
  );
}

export default LandingPage;
