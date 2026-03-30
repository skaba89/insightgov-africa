/**
 * InsightGov Africa - Dashboard Grid Component
 * =============================================
 * Grille responsive pour afficher les KPIs du dashboard.
 */

'use client';

import { useMemo } from 'react';
import { ChartRenderer } from './chart-renderer';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Lightbulb,
  Target,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Download,
} from 'lucide-react';
import type { DashboardConfig, KPIConfig } from '@/types';
import { cn } from '@/lib/utils';

interface DashboardGridProps {
  config: DashboardConfig;
  data?: Record<string, unknown>[];
  onRefresh?: () => void;
  onExport?: () => void;
}

export function DashboardGrid({ config, data, onRefresh, onExport }: DashboardGridProps) {
  // Utiliser les données passées en paramètre ou générer des données de démo si vide
  const chartData = useMemo(() => {
    if (data && data.length > 0) {
      console.log('DashboardGrid - Using provided data, length:', data.length);
      return data;
    }
    console.log('DashboardGrid - No data provided, generating demo data');
    return generateDemoData(config);
  }, [data, config]);

  // Organiser les KPIs par ordre
  const sortedKPIs = useMemo(() => {
    return [...config.kpis].sort((a, b) => a.order - b.order);
  }, [config.kpis]);

  // Séparer les métriques clés
  const keyMetrics = sortedKPIs.filter((kpi) => kpi.isKeyMetric);
  const otherKPIs = sortedKPIs.filter((kpi) => !kpi.isKeyMetric);

  return (
    <div className="space-y-6">
      {/* Header du dashboard */}
      <DashboardHeader
        title={config.title}
        description={config.description}
        onRefresh={onRefresh}
        onExport={onExport}
      />

      {/* Métriques clés */}
      {keyMetrics.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {keyMetrics.map((kpi) => (
            <ChartRenderer
              key={kpi.id}
              config={kpi}
              data={chartData}
              className="h-full"
            />
          ))}
        </div>
      )}

      {/* Résumé exécutif */}
      {config.executiveSummary && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Lightbulb className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Résumé Exécutif
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {config.executiveSummary}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights clés */}
      {config.keyInsights && config.keyInsights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-5 h-5 text-primary" />
              Points Clés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {config.keyInsights.map((insight, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-gray-600 dark:text-gray-300">{insight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Grille des autres KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {otherKPIs.map((kpi) => (
          <div
            key={kpi.id}
            className={cn(
              'col-span-1',
              kpi.size.cols === 2 && 'md:col-span-2',
              kpi.size.cols === 3 && 'md:col-span-2 lg:col-span-3',
              kpi.size.cols >= 4 && 'md:col-span-2 lg:col-span-3'
            )}
          >
            <ChartRenderer config={kpi} data={chartData} />
          </div>
        ))}
      </div>

      {/* Recommandations */}
      {config.recommendations && config.recommendations.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="w-5 h-5 text-amber-600" />
              Recommandations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {config.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 flex items-center justify-center text-sm">
                    {index + 1}
                  </span>
                  <span className="text-gray-700 dark:text-gray-200">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface DashboardHeaderProps {
  title: string;
  description?: string;
  onRefresh?: () => void;
  onExport?: () => void;
}

function DashboardHeader({ title, description, onRefresh, onExport }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        {description && (
          <p className="text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        )}
      </div>
      <div className="flex gap-2">
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        )}
        {onExport && (
          <Button variant="default" size="sm" onClick={onExport}>
            <Download className="w-4 h-4 mr-2" />
            Exporter PDF
          </Button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

// Générer des données de démo basées sur la config
function generateDemoData(config: DashboardConfig): Record<string, unknown>[] {
  const data: Record<string, unknown>[] = [];
  const rowCount = 100;

  // Régions de Guinée pour les données de démo
  const regionsGuinee = ['Conakry', 'Kankan', 'Nzérékoré', 'Labé', 'Kindia', 'Boké', 'Faranah', 'Mamou', 'Lola', 'Siguiri'];
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  // Extraire les colonnes utilisées
  const columns = new Set<string>();
  config.kpis.forEach((kpi) => {
    if (kpi.columns.x) columns.add(kpi.columns.x);
    if (kpi.columns.y) columns.add(kpi.columns.y);
    if (kpi.columns.z) columns.add(kpi.columns.z);
    if (kpi.columns.groupBy) columns.add(kpi.columns.groupBy);
  });

  console.log('generateDemoData - columns needed:', Array.from(columns));

  // Générer des données aléatoires
  for (let i = 0; i < rowCount; i++) {
    const row: Record<string, unknown> = {};
    
    columns.forEach((col) => {
      // Détecter le type de données basé sur le nom
      const colLower = col.toLowerCase();
      
      if (colLower.includes('date') || colLower.includes('mois') || colLower.includes('annee')) {
        // Dates
        const date = new Date(2024, i % 12, 1);
        row[col] = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      } else if (colLower.includes('region') || colLower.includes('zone') || colLower.includes('localite') || colLower.includes('prefecture')) {
        // Régions de Guinée
        row[col] = regionsGuinee[i % regionsGuinee.length];
      } else if (colLower.includes('taux') || colLower.includes('pourcentage') || colLower.includes('coverage') || colLower.includes('couverture')) {
        // Pourcentages entre 60 et 95
        row[col] = Math.floor(60 + Math.random() * 35);
      } else if (colLower.includes('patient') || colLower.includes('consultation') || colLower.includes('hospitalisation')) {
        // Nombres plus grands pour les patients
        row[col] = Math.floor(Math.random() * 500) + 100;
      } else if (colLower.includes('vaccin')) {
        row[col] = Math.floor(Math.random() * 200) + 50;
      } else if (colLower.includes('deces') || colLower.includes('mortalite')) {
        row[col] = Math.floor(Math.random() * 10);
      } else if (colLower.includes('accouchement') || colLower.includes('naissance')) {
        row[col] = Math.floor(Math.random() * 50) + 10;
      } else if (colLower.includes('budget') || colLower.includes('montant') || colLower.includes('cout')) {
        row[col] = Math.floor(Math.random() * 100000000);
      } else if (colLower.includes('effectif') || colLower.includes('nombre') || colLower.includes('total')) {
        row[col] = Math.floor(Math.random() * 10000) + 500;
      } else if (colLower.includes('type') || colLower.includes('categorie') || colLower.includes('categorie')) {
        // Catégories
        const categories = ['Type A', 'Type B', 'Type C', 'Type D'];
        row[col] = categories[i % categories.length];
      } else {
        // Valeurs numériques par défaut avec variation réaliste
        const baseValue = 100 + Math.sin(i * 0.3) * 50 + Math.random() * 200;
        row[col] = Math.floor(baseValue);
      }
    });

    data.push(row);
  }

  console.log('generateDemoData - generated', data.length, 'rows, sample:', data[0]);

  return data;
}

export default DashboardGrid;
