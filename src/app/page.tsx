/**
 * InsightGov Africa - Landing Page
 * =================================
 * Page d'accueil commerciale pour une SaaS B2B africain
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  BarChart3,
  Sparkles,
  Shield,
  Clock,
  Users,
  Building2,
  Globe,
  TrendingUp,
  FileSpreadsheet,
  Zap,
  Check,
  Star,
  ChevronRight,
  Play,
  Database,
  PieChart,
  LineChart,
  Activity,
  Target,
  MessageSquare,
  Download,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// CONFIGURATION
// =============================================================================

const NAV_LINKS = [
  { href: '#features', label: 'Fonctionnalités' },
  { href: '#how-it-works', label: 'Comment ça marche' },
  { href: '#pricing', label: 'Tarifs' },
  { href: '#testimonials', label: 'Témoignages' },
  { href: '#faq', label: 'FAQ' },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: 'IA Intelligente',
    description: 'Analyse automatique de vos données avec génération de KPIs pertinents sans configuration technique.',
    color: 'text-purple-600 bg-purple-100',
  },
  {
    icon: Clock,
    title: 'Gain de Temps',
    description: 'Réduisez de 90% le temps de création de vos rapports et tableaux de bord mensuels.',
    color: 'text-blue-600 bg-blue-100',
  },
  {
    icon: Shield,
    title: 'Sécurité Avancée',
    description: 'Vos données restent en Afrique. Conformité RGPD et hébergement local garanti.',
    color: 'text-green-600 bg-green-100',
  },
  {
    icon: Users,
    title: 'Collaboration',
    description: 'Partagez vos dashboards avec vos équipes et collaborez en temps réel.',
    color: 'text-orange-600 bg-orange-100',
  },
  {
    icon: Download,
    title: 'Exports Multiples',
    description: 'Exportez en PDF, Excel, PowerPoint ou images pour vos présentations.',
    color: 'text-red-600 bg-red-100',
  },
  {
    icon: Target,
    title: 'Sur Mesure',
    description: 'Templates personnalisés pour Ministères, ONG et Entreprises africaines.',
    color: 'text-teal-600 bg-teal-100',
  },
];

const STATS = [
  { value: '50+', label: 'Organisations' },
  { value: '10K+', label: 'Dashboards créés' },
  { value: '15+', label: 'Pays africains' },
  { value: '99.9%', label: 'Disponibilité' },
];

const TESTIMONIALS = [
  {
    quote: "InsightGov a transformé notre façon de reporter les indicateurs de santé. Ce qui prenait 3 jours prend maintenant 30 minutes.",
    author: "Dr. Aminata Diallo",
    role: "Directrice des Statistiques",
    org: "Ministère de la Santé, Sénégal",
    avatar: "AD",
  },
  {
    quote: "L'IA comprend nos données agricoles et génère des visualisations pertinentes automatiquement. Un gain de productivité exceptionnel.",
    author: "Jean-Baptiste Ouédraogo",
    role: "Chef de Projet M&E",
    org: "FAO Burkina Faso",
    avatar: "JO",
  },
  {
    quote: "Enfin une solution pensée pour les réalités africaines. Le support en français et l'hébergement local font toute la différence.",
    author: "Fatoumata Keïta",
    role: "Responsable Monitoring",
    org: "UNICEF Mali",
    avatar: "FK",
  },
];

const PRICING_PLANS = [
  {
    name: 'Starter',
    price: '250',
    description: 'Pour les petites équipes',
    features: [
      '1 utilisateur',
      '5 dashboards/mois',
      'Export PDF',
      'Support email',
      'Templates standards',
    ],
    cta: 'Commencer',
    popular: false,
  },
  {
    name: 'Professional',
    price: '750',
    description: 'Pour les équipes structurées',
    features: [
      '5 utilisateurs',
      'Dashboards illimités',
      'Tous les exports',
      'Support prioritaire',
      'Templates personnalisés',
      'API Access',
    ],
    cta: 'Essai gratuit 14 jours',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '2 500+',
    description: 'Pour les grandes organisations',
    features: [
      'Utilisateurs illimités',
      'Tout Professional +',
      'Hébergement dédié',
      'SSO/SAML',
      'Account Manager',
      'Formation sur site',
      'SLA 99.99%',
    ],
    cta: 'Nous contacter',
    popular: false,
  },
];

const FAQ_ITEMS = [
  {
    q: 'Comment fonctionne l\'analyse automatique ?',
    a: 'Notre IA analyse la structure de vos données (colonnes, types, valeurs) et suggère automatiquement les KPIs les plus pertinents pour votre secteur d\'activité. Vous pouvez ensuite personnaliser chaque indicateur.',
  },
  {
    q: 'Mes données sont-elles sécurisées ?',
    a: 'Absolument. Vos données sont hébergées en Afrique (Datacenter à Dakar et Abidjan). Nous sommes conformes au RGPD et aux réglementations locales. Vos données ne quittent jamais le continent.',
  },
  {
    q: 'Quels formats de fichiers sont acceptés ?',
    a: 'Nous acceptons les fichiers Excel (.xlsx, .xls), CSV, et nous travaillons sur l\'intégration de connecteurs directs (API) pour les principales bases de données.',
  },
  {
    q: 'Puis-je essayer avant de m\'engager ?',
    a: 'Oui ! Nous offrons un essai gratuit de 14 jours sur le plan Professional, sans carte bancaire requise. Vous pouvez aussi demander une démo personnalisée.',
  },
  {
    q: 'Le support est-il disponible en français ?',
    a: 'Oui, tout notre support technique et notre documentation sont disponibles en français. Notre équipe est basée à Dakar et Paris.',
  },
];

const SECTORS = [
  { icon: Activity, name: 'Santé', slug: 'health', color: 'text-red-500' },
  { icon: PieChart, name: 'Éducation', slug: 'education', color: 'text-blue-500' },
  { icon: Database, name: 'Agriculture', slug: 'agriculture', color: 'text-green-500' },
  { icon: TrendingUp, name: 'Finance', slug: 'finance', color: 'text-yellow-500' },
  { icon: Building2, name: 'Infrastructure', slug: 'infrastructure', color: 'text-gray-500' },
  { icon: Users, name: 'Social', slug: 'social', color: 'text-purple-500' },
];

// =============================================================================
// COMPONENTS
// =============================================================================

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setIsOpen(false);
      }
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white">
              InsightGov<span className="text-blue-600">Africa</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Connexion</Button>
            </Link>
            <Link href="/onboarding">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Essai gratuit
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-gray-600 dark:text-gray-400"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex gap-2 px-4 pt-4">
                <Link href="/login" className="flex-1">
                  <Button variant="outline" className="w-full">Connexion</Button>
                </Link>
                <Link href="/onboarding" className="flex-1">
                  <Button className="w-full">Essai gratuit</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMzQjgyRjYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Propulsé par l'Intelligence Artificielle</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight mb-6">
            Transformez vos données en
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              dashboards décisionnels
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
            La première plateforme SaaS de génération automatique de tableaux de bord,
            conçue pour les Ministères, ONG et Entreprises africaines.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/onboarding">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-6 h-auto">
                Démarrer gratuitement
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto">
                <Play className="w-5 h-5 mr-2" />
                Voir la démo
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t">
            {STATS.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-900 to-transparent z-10 pointer-events-none" />
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border overflow-hidden">
            <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">Dashboard - Ministère de la Santé</span>
            </div>
            <div className="p-6 grid grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-900">
              <div className="col-span-1 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">Consultations totales</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">124,567</div>
                <div className="text-xs text-green-600 mt-1">+12.5% ce mois</div>
              </div>
              <div className="col-span-1 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">Vaccinations</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">45,892</div>
                <div className="text-xs text-green-600 mt-1">+8.3% ce mois</div>
              </div>
              <div className="col-span-1 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-500 mb-1">Taux couverture</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">87.3%</div>
                <div className="text-xs text-blue-600 mt-1">Objectif: 90%</div>
              </div>
              <div className="col-span-2 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm h-32">
                <div className="text-xs text-gray-500 mb-2">Évolution mensuelle</div>
                <div className="flex items-end gap-1 h-20">
                  {[40, 55, 45, 60, 50, 70, 65, 80, 75, 90, 85, 95].map((h, i) => (
                    <div key={i} className="flex-1 bg-blue-500 rounded-t" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              <div className="col-span-1 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm h-32">
                <div className="text-xs text-gray-500 mb-2">Répartition par région</div>
                <div className="flex items-center justify-center h-20">
                  <div className="w-16 h-16 rounded-full border-4 border-blue-500 border-t-purple-500 border-r-green-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectorsSection() {
  return (
    <section className="py-16 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Des solutions adaptées à chaque secteur
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Templates préconfigurés pour les domaines clés du développement africain
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
          {SECTORS.map((sector, idx) => {
            const Icon = sector.icon;
            return (
              <Link
                key={idx}
                href={`/onboarding?sector=${sector.slug}`}
                className="flex flex-col items-center p-6 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
              >
                <div className={cn('p-3 rounded-lg mb-3', sector.color)}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                  {sector.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Pourquoi choisir InsightGov Africa ?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Une plateforme complète conçue pour les réalités du continent africain
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <Card key={idx} className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white dark:bg-gray-900">
                <CardHeader>
                  <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center mb-4', feature.color)}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      title: 'Importez vos données',
      description: 'Téléchargez votre fichier Excel ou CSV. Notre IA analyse automatiquement la structure.',
      icon: Database,
    },
    {
      step: '02',
      title: 'Sélectionnez votre secteur',
      description: 'Choisissez parmi nos templates optimisés pour chaque domaine d\'activité.',
      icon: Target,
    },
    {
      step: '03',
      title: 'L\'IA génère votre dashboard',
      description: 'En quelques secondes, obtenez un tableau de bord complet avec KPIs pertinents.',
      icon: Sparkles,
    },
    {
      step: '04',
      title: 'Personnalisez et partagez',
      description: 'Ajustez les visualisations et exportez en PDF, Excel ou PowerPoint.',
      icon: FileSpreadsheet,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            De l'import à l'export en 4 étapes simples
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="relative">
                {/* Connector Line */}
                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-blue-300 to-transparent" />
                )}
                <div className="text-center">
                  <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white mb-6">
                    <Icon className="w-7 h-7" />
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white dark:bg-gray-800 text-xs font-bold text-blue-600 flex items-center justify-center border-2 border-blue-600">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Ils nous font confiance
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Découvrez comment InsightGov Africa transforme la prise de décision
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((testimonial, idx) => (
            <Card key={idx} className="bg-white dark:bg-gray-900 border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-gray-700 dark:text-gray-300 mb-6">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {testimonial.role}
                    </div>
                    <div className="text-xs text-blue-600">
                      {testimonial.org}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Certifications et partenaires
          </p>
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
            <div className="px-4 py-2 bg-white dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 font-medium">
              RGPD Compliant
            </div>
            <div className="px-4 py-2 bg-white dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 font-medium">
              ISO 27001
            </div>
            <div className="px-4 py-2 bg-white dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 font-medium">
              SOC 2 Type II
            </div>
            <div className="px-4 py-2 bg-white dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 font-medium">
              Hébergé en Afrique
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Des tarifs adaptés à votre organisation
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Choisissez le plan qui correspond à vos besoins. Tous les plans incluent le support en français.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PRICING_PLANS.map((plan, idx) => (
            <Card
              key={idx}
              className={cn(
                'relative border-2',
                plan.popular ? 'border-blue-600 shadow-xl scale-105' : 'border-gray-200 dark:border-gray-700'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-4">
                    Le plus populaire
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {plan.price}€
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">/mois</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href={plan.name === 'Enterprise' ? '/contact' : '/onboarding'}>
                  <Button
                    className={cn(
                      'w-full',
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                        : ''
                    )}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ROI Calculator Teaser */}
        <div className="mt-16 text-center p-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white">
          <h3 className="text-2xl font-bold mb-4">
            Calculez votre retour sur investissement
          </h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Nos clients économisent en moyenne 20 heures par mois sur la création de rapports.
            Découvrez combien vous pourriez économiser.
          </p>
          <Link href="/contact">
            <Button variant="secondary" size="lg">
              Demander une étude personnalisée
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Questions fréquentes
          </h2>
        </div>

        <div className="space-y-4">
          {FAQ_ITEMS.map((item, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full px-6 py-4 text-left flex items-center justify-between font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {item.q}
                <ChevronRight
                  className={cn(
                    'w-5 h-5 text-gray-400 transition-transform',
                    openIndex === idx && 'rotate-90'
                  )}
                />
              </button>
              {openIndex === idx && (
                <div className="px-6 pb-4 text-gray-600 dark:text-gray-400">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          Prêt à transformer vos données en décisions ?
        </h2>
        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
          Rejoignez les organisations africaines qui font confiance à InsightGov Africa
          pour leur reporting et leur prise de décision.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/onboarding">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6 h-auto bg-white text-blue-600 hover:bg-gray-100">
              Démarrer l'essai gratuit
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link href="/demo">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto border-white text-white hover:bg-white/10">
              Demander une démo
            </Button>
          </Link>
        </div>
        <p className="mt-6 text-sm text-blue-200">
          Pas de carte bancaire requise • Essai 14 jours • Annulation à tout moment
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-white">
                InsightGov<span className="text-blue-500">Africa</span>
              </span>
            </div>
            <p className="text-sm mb-4">
              La plateforme de génération automatique de dashboards pour l'Afrique.
            </p>
            <div className="flex gap-4">
              <a href="https://linkedin.com/company/insightgov-africa" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">LinkedIn</a>
              <a href="https://twitter.com/insightgov_africa" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Twitter</a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Produit</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Tarifs</a></li>
              <li><Link href="/demo" className="hover:text-white transition-colors">Templates</Link></li>
              <li><Link href="/api-docs" className="hover:text-white transition-colors">API</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Entreprise</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors">À propos</Link></li>
              <li><Link href="/careers" className="hover:text-white transition-colors">Carrières</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/api-docs" className="hover:text-white transition-colors">Documentation</Link></li>
              <li><Link href="/help" className="hover:text-white transition-colors">Centre d'aide</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><a href="https://status.insightgov.africa" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Statut</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">
            © 2024 InsightGov Africa. Tous droits réservés.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/legal/terms" className="hover:text-white transition-colors">Conditions</Link>
            <Link href="/legal/privacy" className="hover:text-white transition-colors">Confidentialité</Link>
            <Link href="/legal/mentions" className="hover:text-white transition-colors">Mentions légales</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      <main>
        <HeroSection />
        <SectorsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
