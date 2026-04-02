/**
 * InsightGov Africa - Careers Page
 * Page Carrières
 */

'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Clock,
  Briefcase,
  Users,
  Heart,
  Coffee,
  Laptop,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

const JOBS = [
  {
    title: 'Senior Full-Stack Developer',
    department: 'Engineering',
    location: 'Dakar, Sénégal',
    type: 'Full-time',
    level: 'Senior',
  },
  {
    title: 'Data Scientist',
    department: 'Data',
    location: 'Dakar, Sénégal',
    type: 'Full-time',
    level: 'Mid-Senior',
  },
  {
    title: 'Product Manager',
    department: 'Product',
    location: 'Dakar, Sénégal',
    type: 'Full-time',
    level: 'Senior',
  },
  {
    title: 'UX/UI Designer',
    department: 'Design',
    location: 'Remote',
    type: 'Full-time',
    level: 'Mid',
  },
  {
    title: 'Customer Success Manager',
    department: 'Sales',
    location: 'Dakar, Sénégal',
    type: 'Full-time',
    level: 'Mid',
  },
];

const BENEFITS = [
  {
    icon: TrendingUp,
    title: 'Equity',
    description: 'Participez à la croissance de l\'entreprise',
  },
  {
    icon: Heart,
    title: 'Santé',
    description: 'Assurance maladie pour vous et votre famille',
  },
  {
    icon: Coffee,
    title: 'Flexibilité',
    description: 'Horaires flexibles et télétravail',
  },
  {
    icon: Laptop,
    title: 'Équipement',
    description: 'MacBook et outils de pointe',
  },
  {
    icon: Users,
    title: 'Équipe',
    description: 'Ambiance startup et équipe passionnée',
  },
  {
    icon: TrendingUp,
    title: 'Croissance',
    description: 'Formations et opportunités d\'évolution',
  },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="bg-white/20 text-white border-0 mb-4">Rejoignez-nous</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Carrières</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Construisez l'avenir de la data en Afrique avec nous
            </p>
          </div>
        </div>
      </header>

      {/* Culture */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Pourquoi nous rejoindre ?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Chez InsightGov Africa, nous croyons que l'Afrique mérite les meilleurs outils 
              pour prendre des décisions éclairées. Rejoignez une équipe passionnée.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((benefit, idx) => (
              <Card key={idx} className="border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Postes ouverts
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {JOBS.length} opportunités disponibles
            </p>
          </div>
          <div className="space-y-4">
            {JOBS.map((job, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {job.department}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {job.type}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{job.level}</Badge>
                      <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                        Postuler
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Vous ne trouvez pas votre poste ?</h2>
          <p className="text-blue-100 mb-8">
            Envoyez-nous votre candidature spontanée à careers@insightgov.africa
          </p>
          <Link href="/contact">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Nous contacter
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
