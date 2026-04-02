// ============================================
// InsightGov Africa - Dashboard Dynamique
// Rendu des KPIs et graphiques avec Tremor
// ============================================

'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  LineChart,
  AreaChart,
  DonutChart,
  BarList,
  SparkChart,
  Title,
  Text,
  Card as TremorCard,
  Badge,
  Flex,
  Bold,
  Icon,
} from '@tremor/react';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Users,
  BarChart3,
  PieChart,
  TrendingUp as TrendingUpIcon,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Kpi, ChartConfig, TremorChartType } from '@/types';
import { cn, formatNumber, formatCurrency, formatPercent } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

interface DashboardRendererProps {
  kpis: Kpi[];
  rawData: Record<string, unknown>[];
  columns: { name: string; type: string }[];
  className?: string;
}

interface KpiCardProps {
  kpi: Kpi;
  data: Record<string, unknown>[];
}

// ============================================
// COMPOSANT KPI CARD
// ============================================

function KpiCardRenderer({ kpi, data }: KpiCardProps) {
  const config = kpi.configJson as ChartConfig;
  
  // Calculer la valeur réelle si non stockée
  const calculatedValue = useMemo(() => {
    if (kpi.value !== undefined && kpi.value !== null) {
      return kpi.value;
    }
    
    // Calculer à partir des données
    const column = config.dataSource?.columns?.[0];
    if (!column || data.length === 0) return null;
    
    const values = data
      .map((row) => Number(row[column]))
      .filter((v) => !isNaN(v));
    
    if (values.length === 0) return null;
    
    const aggregation = config.dataSource?.aggregationType || 'sum';
    switch (aggregation) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'count':
        return values.length;
      case 'max':
        return Math.max(...values);
      case 'min':
        return Math.min(...values);
      default:
        return values.reduce((a, b) => a + b, 0);
    }
  }, [kpi, data, config]);

  // Formater la valeur
  const formattedValue = useMemo(() => {
    if (calculatedValue === null) return 'N/A';
    
    if (kpi.unit === '%') {
      return formatPercent(calculatedValue);
    }
    if (kpi.unit === 'FCFA' || kpi.unit === 'XOF') {
      return formatCurrency(calculatedValue);
    }
    return formatNumber(calculatedValue);
  }, [calculatedValue, kpi.unit]);

  // Icône de tendance
  const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Activity;
  const trendColor = kpi.trend === 'up' ? 'text-emerald-500' : kpi.trend === 'down' ? 'text-red-500' : 'text-gray-500';
  const trendBgColor = kpi.trend === 'up' ? 'bg-emerald-50' : kpi.trend === 'down' ? 'bg-red-50' : 'bg-gray-50';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-sm font-medium text-gray-600">
              {kpi.name}
            </CardDescription>
            {kpi.category && (
              <Badge variant="outline" className="text-xs">
                {kpi.category}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Valeur principale */}
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-gray-900">
                {formattedValue}
              </span>
              {kpi.unit && kpi.unit !== '%' && kpi.unit !== 'FCFA' && kpi.unit !== 'XOF' && (
                <span className="text-sm text-gray-500 mb-1">
                  {kpi.unit}
                </span>
              )}
            </div>

            {/* Tendance */}
            {kpi.trend && (
              <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-full w-fit', trendBgColor)}>
                <TrendIcon className={cn('w-4 h-4', trendColor)} />
                <span className={cn('text-sm font-medium', trendColor)}>
                  {kpi.trendValue ? `${kpi.trendValue > 0 ? '+' : ''}${kpi.trendValue}%` : kpi.trend}
                </span>
              </div>
            )}

            {/* Description */}
            {kpi.description && (
              <p className="text-sm text-gray-500 line-clamp-2">
                {kpi.description}
              </p>
            )}

            {/* Insight */}
            {kpi.insightText && (
              <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-xs text-amber-800 flex items-start gap-2">
                  <span className="text-amber-500">💡</span>
                  {kpi.insightText}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================
// COMPOSANT GRAPHIQUE DYNAMIQUE
// ============================================

function ChartRenderer({ 
  config, 
  data 
}: { 
  config: ChartConfig; 
  data: Record<string, unknown>[];
}) {
  const chartType = config.chartType;
  
  // Préparer les données pour le graphique
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const xAxisCol = config.xAxis?.column;
    const seriesCols = config.series?.map((s) => s.column) || [];
    
    if (!xAxisCol) return data.slice(0, 50);
    
    // Grouper par axe X
    const grouped = data.reduce((acc, row) => {
      const key = String(row[xAxisCol] || 'Autre');
      if (!acc[key]) {
        acc[key] = { [xAxisCol]: key };
      }
      
      seriesCols.forEach((col) => {
        const value = Number(row[col]) || 0;
        acc[key][col] = (acc[key][col] || 0) + value;
      });
      
      return acc;
    }, {} as Record<string, Record<string, unknown>>);
    
    return Object.values(grouped).slice(0, 20); // Limiter à 20 catégories
  }, [data, config]);

  // Couleurs Tremor
  const colors = ['emerald', 'blue', 'amber', 'violet', 'rose', 'teal', 'indigo', 'fuchsia'];

  // Rendu selon le type
  const renderChart = () => {
    switch (chartType) {
      case 'BarChart':
        return (
          <BarChart
            className="h-72"
            data={chartData}
            index={config.xAxis?.column || 'name'}
            categories={config.series?.map((s) => s.column) || []}
            colors={colors.slice(0, config.series?.length || 1)}
            yAxisWidth={48}
            showLegend={config.legend?.show !== false}
            showAnimation={true}
          />
        );

      case 'LineChart':
        return (
          <LineChart
            className="h-72"
            data={chartData}
            index={config.xAxis?.column || 'name'}
            categories={config.series?.map((s) => s.column) || []}
            colors={colors.slice(0, config.series?.length || 1)}
            yAxisWidth={48}
            showLegend={config.legend?.show !== false}
            showAnimation={true}
            curveType="monotone"
          />
        );

      case 'AreaChart':
        return (
          <AreaChart
            className="h-72"
            data={chartData}
            index={config.xAxis?.column || 'name'}
            categories={config.series?.map((s) => s.column) || []}
            colors={colors.slice(0, config.series?.length || 1)}
            yAxisWidth={48}
            showLegend={config.legend?.show !== false}
            showAnimation={true}
          />
        );

      case 'DonutChart':
        const donutData = chartData.slice(0, 8).map((row, i) => ({
          name: String(row[config.xAxis?.column || 'name'] || `Catégorie ${i + 1}`),
          value: Number(row[config.series?.[0]?.column || 'value']) || 0,
        }));
        return (
          <DonutChart
            className="h-72"
            data={donutData}
            category="value"
            index="name"
            colors={colors.slice(0, donutData.length)}
            showLabel={true}
            showAnimation={true}
          />
        );

      case 'BarList':
        const barListData = chartData.slice(0, 10).map((row, i) => ({
          name: String(row[config.xAxis?.column || 'name'] || `Item ${i + 1}`),
          value: Number(row[config.series?.[0]?.column || 'value']) || 0,
        }));
        return (
          <BarList
            data={barListData}
            className="h-72"
          />
        );

      default:
        return (
          <div className="h-72 flex items-center justify-center text-gray-400">
            <AlertCircle className="w-8 h-8 mr-2" />
            <span>Type de graphique non supporté: {chartType}</span>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">{config.title}</CardTitle>
          {config.subtitle && (
            <CardDescription>{config.subtitle}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {renderChart()}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================
// COMPOSANT PRINCIPAL DASHBOARD
// ============================================

export function DashboardRenderer({ kpis, rawData, columns, className }: DashboardRendererProps) {
  // Séparer les KPIs des graphiques
  const { kpiCards, chartKpis } = useMemo(() => {
    const cards: Kpi[] = [];
    const charts: Kpi[] = [];
    
    kpis.forEach((kpi) => {
      const config = kpi.configJson as ChartConfig;
      if (config.chartType === 'KpiCard' || config.chartType === 'DeltaCard' || config.chartType === 'MetricCard') {
        cards.push(kpi);
      } else {
        charts.push(kpi);
      }
    });
    
    return { kpiCards: cards, chartKpis: charts };
  }, [kpis]);

  if (kpis.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-20', className)}>
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <BarChart3 className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Aucun KPI généré
        </h3>
        <p className="text-gray-500 text-center max-w-md">
          Importez un fichier pour que l'IA analyse vos données et génère automatiquement les KPIs pertinents.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-8', className)}>
      {/* Section KPI Cards */}
      {kpiCards.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            Indicateurs Clés
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.map((kpi) => (
              <KpiCardRenderer key={kpi.id} kpi={kpi} data={rawData} />
            ))}
          </div>
        </section>
      )}

      {/* Section Graphiques */}
      {chartKpis.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-500" />
            Visualisations
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {chartKpis.map((kpi) => (
              <ChartRenderer 
                key={kpi.id} 
                config={kpi.configJson as ChartConfig} 
                data={rawData} 
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default DashboardRenderer;
