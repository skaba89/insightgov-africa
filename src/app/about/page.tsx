/**
 * InsightGov Africa - About Page
 * Page À propos
 */

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Globe,
  Users,
  Heart,
  Target,
  Award,
  MapPin,
  Mail,
  ArrowRight,
} from 'lucide-react';

const TEAM = [
  {
    name: 'Amadou Diallo',
    role: 'CEO & Co-fondateur',
    bio: '15 ans d\'expérience en transformation digitale en Afrique',
    avatar: 'AD',
  },
  {
    name: 'Fatou Ndiaye',
    role: 'CTO & Co-fondatrice',
    bio: 'Experte en IA et Data Science, ancienne Google',
    avatar: 'FN',
  },
  {
    name: 'Ibrahima Sow',
    role: 'Head of Product',
    bio: 'Spécialiste UX pour les marchés africains',
    avatar: 'IS',
  },
];

const VALUES = [
  {
    icon: Globe,
    title: 'Impact Africain',
    description: 'Nous croyons en une Afrique qui prend ses décisions basées sur des données fiables.',
  },
  {
    icon: Users,
    title: 'Accessibilité',
    description: 'Des solutions adaptées aux réalités et aux budgets des organisations africaines.',
  },
  {
    icon: Heart,
    title: 'Engagement',
    description: 'Support en français, équipes locales, et compréhension des contextes régionaux.',
  },
  {
    icon: Target,
    title: 'Excellence',
    description: 'Technologie de pointe avec les meilleures pratiques en visualisation de données.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="bg-white/20 text-white border-0 mb-4">Notre Histoire</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Construire l'avenir de la données en Afrique
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              InsightGov Africa est né d'un constat simple: les organisations africaines 
              méritent des outils de reporting à la hauteur de leurs ambitions.
            </p>
          </div>
        </div>
      </header>

      {/* Mission */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Notre Mission
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Nous démocratisons l'accès à l'intelligence de données pour les organisations 
                africaines. Chaque ministère, chaque ONG, chaque entreprise devrait pouvoir 
                prendre des décisions éclairées sans avoir besoin d'une équipe de data scientists.
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Notre plateforme utilise l'intelligence artificielle pour transformer 
                automatiquement vos données brutes en tableaux de bord professionnels, 
                adaptés à votre secteur d'activité.
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Dakar, Sénégal
                </span>
                <span className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  contact@insightgov.africa
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">2022</div>
                <div className="text-sm text-gray-500">Année de création</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">50+</div>
                <div className="text-sm text-gray-500">Organisations</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">15+</div>
                <div className="text-sm text-gray-500">Pays africains</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">25</div>
                <div className="text-sm text-gray-500">Équipe</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Nos Valeurs
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {VALUES.map((value, idx) => (
              <Card key={idx} className="border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{value.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Notre Équipe
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Une équipe passionnée par la transformation digitale de l'Afrique
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {TEAM.map((member, idx) => (
              <Card key={idx} className="border-0 shadow-lg text-center">
                <CardContent className="p-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">{member.avatar}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{member.name}</h3>
                  <p className="text-sm text-blue-600 mb-2">{member.role}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Rejoignez l'aventure</h2>
          <p className="text-blue-100 mb-8">
            Découvrez comment InsightGov Africa peut transformer votre organisation
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/onboarding">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                Essai gratuit
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/careers">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Voir les offres
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
