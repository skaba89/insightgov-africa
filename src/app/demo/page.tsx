/**
 * InsightGov Africa - Demo Page
 * ==============================
 * Page de démonstration avec données fictives
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Heart,
  Building2,
  Globe,
  Download,
  Share2,
  Sparkles,
  Play,
  PieChart,
  LineChart,
  Calendar,
  MapPin,
} from 'lucide-react';

// =============================================================================
// DEMO DATA
// =============================================================================

const DEMO_KPIS = [
  {
    title: 'Consultations totales',
    value: '124,567',
    change: '+12.5%',
    trend: 'up',
    period: 'vs mois dernier',
  },
  {
    title: 'Vaccinations',
    value: '45,892',
    change: '+8.3%',
    trend: 'up',
    period: 'vs mois dernier',
  },
  {
    title: 'Taux de couverture',
    value: '87.3%',
    change: '+2.1%',
    trend: 'up',
    period: 'objectif: 90%',
  },
  {
    title: 'Accouchements assistés',
    value: '8,234',
    change: '-1.2%',
    trend: 'down',
    period: 'vs mois dernier',
  },
];

const DEMO_REGIONS = [
  { name: 'Dakar', consultations: 45000, percentage: 36 },
  { name: 'Thiès', consultations: 28000, percentage: 22 },
  { name: 'Saint-Louis', consultations: 18000, percentage: 14 },
  { name: 'Kaolack', consultations: 15000, percentage: 12 },
  { name: 'Ziguinchor', consultations: 12000, percentage: 10 },
  { name: 'Autres', consultations: 6567, percentage: 6 },
];

const DEMO_MONTHLY = [
  { month: 'Jan', consultations: 8500, vaccinations: 3200 },
  { month: 'Fév', consultations: 9200, vaccinations: 3500 },
  { month: 'Mar', consultations: 8800, vaccinations: 3800 },
  { month: 'Avr', consultations: 10500, vaccinations: 4100 },
  { month: 'Mai', consultations: 11200, vaccinations: 3900 },
  { month: 'Juin', consultations: 10800, vaccinations: 4200 },
  { month: 'Juil', consultations: 12500, vaccinations: 4500 },
  { month: 'Aoû', consultations: 11800, vaccinations: 4100 },
  { month: 'Sep', consultations: 13200, vaccinations: 4800 },
  { month: 'Oct', consultations: 14500, vaccinations: 5200 },
  { month: 'Nov', consultations: 13800, vaccinations: 4900 },
  { month: 'Déc', consultations: 15000, vaccinations: 5500 },
];

const DEMO_TEMPLATES = [
  {
    id: 'health',
    name: 'Santé Publique',
    description: 'Indicateurs de santé pour ministères et ONG',
    icon: Heart,
    color: 'text-red-500 bg-red-100',
    kpis: ['Consultations', 'Vaccinations', 'Hospitalisations', 'Décès'],
  },
  {
    id: 'education',
    name: 'Éducation',
    description: 'Statistiques scolaires et universitaires',
    icon: Building2,
    color: 'text-blue-500 bg-blue-100',
    kpis: ['Effectifs', 'Taux réussite', 'Enseignants', 'Écoles'],
  },
  {
    id: 'agriculture',
    name: 'Agriculture',
    description: 'Production et rendements agricoles',
    icon: Globe,
    color: 'text-green-500 bg-green-100',
    kpis: ['Production', 'Surface', 'Rendement', 'Producteurs'],
  },
];

// =============================================================================
// COMPONENTS
// =============================================================================

function DemoHeader() {
  return (
    <header className="bg-white dark:bg-gray-900 border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                InsightGov<span className="text-blue-600">Africa</span>
              </h1>
              <p className="text-xs text-gray-500">Mode Démonstration</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              Données fictives
            </Badge>
            <Link href="/onboarding">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                Créer mon dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function KPICard({ kpi }: { kpi: typeof DEMO_KPIS[0] }) {
  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardContent className="p-6">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{kpi.title}</p>
        <div className="flex items-end justify-between">
          <div>
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{kpi.value}</span>
          </div>
          <div className={`flex items-center gap-1 text-sm ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {kpi.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {kpi.change}
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">{kpi.period}</p>
      </CardContent>
    </Card>
  );
}

function BarChart({ data, valueKey, labelKey }: { data: any[]; valueKey: string; labelKey: string }) {
  const maxValue = Math.max(...data.map(d => d[valueKey]));
  
  return (
    <div className="space-y-3">
      {data.map((item, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <div className="w-24 text-sm text-gray-600 dark:text-gray-400 truncate">{item[labelKey]}</div>
          <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${(item[valueKey] / maxValue) * 100}%` }}
            />
          </div>
          <div className="w-20 text-sm text-gray-900 dark:text-white text-right font-medium">
            {typeof item[valueKey] === 'number' ? item[valueKey].toLocaleString() : item[valueKey]}
            {item.percentage && <span className="text-xs text-gray-400 ml-1">({item.percentage}%)</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function SimpleLineChart({ data }: { data: typeof DEMO_MONTHLY }) {
  const maxValue = Math.max(...data.map(d => d.consultations));
  const chartHeight = 200;
  
  return (
    <div className="relative" style={{ height: chartHeight }}>
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map(percent => (
        <div
          key={percent}
          className="absolute left-0 right-0 border-t border-gray-100 dark:border-gray-700"
          style={{ top: `${percent}%` }}
        >
          <span className="absolute -left-2 -top-2 text-xs text-gray-400">
            {Math.round(maxValue * (100 - percent) / 100 / 1000)}k
          </span>
        </div>
      ))}
      
      {/* Bars */}
      <div className="flex items-end justify-between h-full pt-4 gap-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-300 hover:from-blue-600 hover:to-blue-500"
              style={{ height: `${(item.consultations / maxValue) * 100}%` }}
              title={`${item.consultations.toLocaleString()} consultations`}
            />
            <span className="text-xs text-gray-400 mt-2">{item.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TemplateCard({ template }: { template: typeof DEMO_TEMPLATES[0] }) {
  const Icon = template.icon;
  
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200">
      <CardHeader>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${template.color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <CardTitle className="text-lg">{template.name}</CardTitle>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {template.kpis.map((kpi, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {kpi}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DemoHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo Info Banner */}
        <div className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">Bienvenue dans la démonstration</h2>
              <p className="text-blue-100">
                Explorez un dashboard type généré automatiquement par notre IA à partir de données fictives.
              </p>
            </div>
            <Play className="w-12 h-12 text-white/50" />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white dark:bg-gray-800">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="exports">Exports</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Dashboard Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Ministère de la Santé - Rapport Mensuel
                </h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Décembre 2024
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    Sénégal
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
              </div>
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {DEMO_KPIS.map((kpi, idx) => (
                <KPICard key={idx} kpi={kpi} />
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Evolution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-blue-600" />
                    Évolution mensuelle
                  </CardTitle>
                  <CardDescription>Consultations et vaccinations par mois</CardDescription>
                </CardHeader>
                <CardContent>
                  <SimpleLineChart data={DEMO_MONTHLY} />
                </CardContent>
              </Card>

              {/* Regional Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-purple-600" />
                    Répartition par région
                  </CardTitle>
                  <CardDescription>Consultations par zone géographique</CardDescription>
                </CardHeader>
                <CardContent>
                  <BarChart data={DEMO_REGIONS} valueKey="consultations" labelKey="name" />
                </CardContent>
              </Card>
            </div>

            {/* AI Insights */}
            <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-900/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Insights IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-green-600 font-medium mb-1">Tendance positive</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Les consultations ont augmenté de 12.5% ce mois, principalement dans la région de Dakar (+18%).
                    </p>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-yellow-600 font-medium mb-1">Point d'attention</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Le taux de couverture vaccinale stagne à 87.3%. Un effort ciblé est recommandé pour atteindre l'objectif de 90%.
                    </p>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
                    <div className="text-blue-600 font-medium mb-1">Recommandation</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Augmenter les campagnes de vaccination dans les régions de Thiès et Kaolack pour améliorer la couverture.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Templates disponibles
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Choisissez un template préconfiguré pour votre secteur d'activité
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {DEMO_TEMPLATES.map((template, idx) => (
                <TemplateCard key={idx} template={template} />
              ))}
            </div>
          </TabsContent>

          {/* Exports Tab */}
          <TabsContent value="exports">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Formats d'export
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Exportez vos dashboards dans le format de votre choix
              </p>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { name: 'PDF', icon: '📄', desc: 'Rapports imprimables' },
                { name: 'Excel', icon: '📊', desc: 'Données exploitables' },
                { name: 'PowerPoint', icon: '📽️', desc: 'Présentations' },
                { name: 'Image', icon: '🖼️', desc: 'PNG haute résolution' },
              ].map((format, idx) => (
                <Card key={idx} className="hover:shadow-lg transition-shadow cursor-pointer text-center">
                  <CardContent className="p-6">
                    <div className="text-4xl mb-3">{format.icon}</div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{format.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{format.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* CTA Footer */}
      <div className="bg-white dark:bg-gray-800 border-t py-12 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Prêt à créer votre propre dashboard ?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Importez vos données et laissez notre IA générer vos KPIs automatiquement.
          </p>
          <Link href="/onboarding">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Commencer maintenant
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
