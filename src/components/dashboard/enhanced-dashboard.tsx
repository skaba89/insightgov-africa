// ============================================
// InsightGov Africa - Dashboard Layout Pro
// Layout amélioré avec toutes les fonctionnalités
// ============================================

'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  LineChart,
  AreaChart,
  DonutChart,
  BarList,
  Title,
  Text,
  Card as TremorCard,
  Badge,
  Flex,
  Bold,
} from '@tremor/react';
import {
  Activity,
  PieChart,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Layers,
  Grid3X3,
  List,
  Maximize2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge as UIBadge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Kpi, ChartConfig } from '@/types';
import { cn, formatNumber, formatCurrency, formatPercent } from '@/lib/utils';
import { DashboardFilters, applyFilters, ActiveFilter } from './simple-filters';
import { AdvancedKpiCard, KpiGrid, SummaryStats } from './advanced-kpi-card';
import { DataTable } from './data-table';

// ============================================
// TYPES
// ============================================

interface EnhancedDashboardProps {
  kpis: Kpi[];
  rawData: Record<string, unknown>[];
  columns: { name: string; type: string }[];
  organizationName?: string;
  className?: string;
}

type ViewMode = 'grid' | 'list' | 'compact';

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export function EnhancedDashboard({
  kpis,
  rawData,
  columns,
  organizationName,
  className,
}: EnhancedDashboardProps) {
  const [filters, setFilters] = useState<ActiveFilter[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeTab, setActiveTab] = useState('overview');

  // Appliquer les filtres aux données
  const filteredData = useMemo(() => {
    return applyFilters(rawData, filters);
  }, [rawData, filters]);

  // Séparer les KPIs des graphiques
  const { kpiCards, chartKpis } = useMemo(() => {
    const cards: Kpi[] = [];
    const charts: Kpi[] = [];

    kpis.forEach((kpi) => {
      const config = kpi.configJson as ChartConfig;
      if (
        config.chartType === 'KpiCard' ||
        config.chartType === 'DeltaCard' ||
        config.chartType === 'MetricCard'
      ) {
        cards.push(kpi);
      } else {
        charts.push(kpi);
      }
    });

    return { kpiCards: cards, chartKpis: charts };
  }, [kpis]);

  // Préparer les données de sparkline
  const getSparklineData = (columnName: string): number[] => {
    return rawData.slice(0, 12).map((row) => Number(row[columnName]) || 0);
  };

  // Couleurs Tremor
  const colors = ['emerald', 'blue', 'amber', 'violet', 'rose', 'teal', 'indigo', 'fuchsia'];

  if (kpis.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-20', className)}>
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <BarChart3 className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun KPI généré</h3>
        <p className="text-gray-500 text-center max-w-md">
          Importez un fichier pour que l'IA analyse vos données et génère automatiquement les KPIs.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Filtres */}
      <DashboardFilters
        columns={columns}
        data={rawData}
        onFilterChange={setFilters}
      />

      {/* Indicateur de filtres actifs */}
      {filters.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-3 px-4">
              <p className="text-sm text-blue-700">
                📊 Affichage de <strong>{formatNumber(filteredData.length)}</strong> lignes sur{' '}
                <strong>{formatNumber(rawData.length)}</strong>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <PieChart className="w-4 h-4" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="kpis" className="gap-2">
              <Activity className="w-4 h-4" />
              KPIs
            </TabsTrigger>
            <TabsTrigger value="charts" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Graphiques
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <List className="w-4 h-4" />
              Données
            </TabsTrigger>
          </TabsList>

          {/* Sélecteur de vue */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('list')}
            >
              <Layers className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'compact' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode('compact')}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Stats résumées */}
          <SummaryStats
            title="Résumé des données"
            stats={[
              {
                label: 'Total lignes',
                value: filteredData.length,
                format: 'number',
              },
              {
                label: 'Colonnes analysées',
                value: columns.length,
                format: 'number',
              },
              {
                label: 'KPIs générés',
                value: kpis.length,
                format: 'number',
              },
              {
                label: 'Graphiques',
                value: chartKpis.length,
                format: 'number',
              },
            ]}
          />

          {/* KPIs principaux */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              Indicateurs Clés
            </h2>
            <div
              className={cn(
                'grid gap-4',
                viewMode === 'grid' && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
                viewMode === 'list' && 'grid-cols-1 md:grid-cols-2',
                viewMode === 'compact' && 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-6'
              )}
            >
              {kpiCards.slice(0, viewMode === 'compact' ? 6 : 8).map((kpi, index) => (
                <motion.div
                  key={kpi.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={cn(
                    'h-full hover:shadow-lg transition-all duration-300',
                    viewMode === 'compact' && 'p-3'
                  )}>
                    <CardHeader className={cn('pb-2', viewMode === 'compact' && 'p-0 pb-1')}>
                      <CardDescription className="text-xs font-medium text-gray-600 truncate">
                        {kpi.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className={cn(viewMode === 'compact' && 'p-0 pt-1')}>
                      <div className="flex items-end gap-2">
                        <span className={cn(
                          'font-bold text-gray-900',
                          viewMode === 'compact' ? 'text-xl' : 'text-3xl'
                        )}>
                          {kpi.value !== undefined
                            ? kpi.unit === 'FCFA' || kpi.unit === 'XOF'
                              ? formatCurrency(kpi.value)
                              : kpi.unit === '%'
                              ? formatPercent(kpi.value)
                              : formatNumber(kpi.value)
                            : 'N/A'}
                        </span>
                        {kpi.unit && kpi.unit !== 'FCFA' && kpi.unit !== 'XOF' && kpi.unit !== '%' && (
                          <span className="text-xs text-gray-500">{kpi.unit}</span>
                        )}
                      </div>
                      {kpi.trend && viewMode !== 'compact' && (
                        <div
                          className={cn(
                            'flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full w-fit text-xs',
                            kpi.trend === 'up'
                              ? 'bg-emerald-50 text-emerald-600'
                              : kpi.trend === 'down'
                              ? 'bg-red-50 text-red-600'
                              : 'bg-gray-50 text-gray-600'
                          )}
                        >
                          {kpi.trend === 'up' && <TrendingUp className="w-3 h-3" />}
                          {kpi.trend === 'down' && <TrendingDown className="w-3 h-3" />}
                          {kpi.trendValue && `${kpi.trendValue > 0 ? '+' : ''}${kpi.trendValue}%`}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Graphiques */}
          {chartKpis.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
                Visualisations
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {chartKpis.slice(0, 4).map((kpi, index) => {
                  const config = kpi.configJson as ChartConfig;
                  return (
                    <ChartRenderer
                      key={kpi.id}
                      config={config}
                      data={filteredData}
                      index={index}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </TabsContent>

        {/* Onglet KPIs */}
        <TabsContent value="kpis" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.map((kpi, index) => (
              <AdvancedKpiCard
                key={kpi.id}
                title={kpi.name}
                value={kpi.value || 0}
                unit={kpi.unit}
                format={kpi.unit === 'FCFA' || kpi.unit === 'XOF' ? 'currency' : kpi.unit === '%' ? 'percent' : 'number'}
                trend={kpi.trend as 'up' | 'down' | 'neutral' | undefined}
                trendValue={kpi.trendValue}
                description={kpi.description}
                insight={kpi.insightText}
                category={kpi.category}
              />
            ))}
          </div>
        </TabsContent>

        {/* Onglet Graphiques */}
        <TabsContent value="charts" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {chartKpis.map((kpi, index) => {
              const config = kpi.configJson as ChartConfig;
              return (
                <ChartRenderer
                  key={kpi.id}
                  config={config}
                  data={filteredData}
                  index={index}
                />
              );
            })}
          </div>
        </TabsContent>

        {/* Onglet Données */}
        <TabsContent value="data" className="mt-6">
          <DataTable
            data={filteredData}
            columns={columns}
            title="Données analysées"
            pageSize={15}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================
// RENDU DE GRAPHIQUE
// ============================================

function ChartRenderer({
  config,
  data,
  index,
}: {
  config: ChartConfig;
  data: Record<string, unknown>[];
  index: number;
}) {
  const colors = ['emerald', 'blue', 'amber', 'violet', 'rose', 'teal', 'indigo', 'fuchsia'];

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

    return Object.values(grouped).slice(0, 20);
  }, [data, config]);

  const renderChart = () => {
    switch (config.chartType) {
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
        return <BarList data={barListData} className="h-72" />;

      default:
        return (
          <div className="h-72 flex items-center justify-center text-gray-400">
            <AlertCircle className="w-8 h-8 mr-2" />
            <span>Type de graphique non supporté: {config.chartType}</span>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="h-full hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-lg">{config.title}</CardTitle>
          {config.subtitle && <CardDescription>{config.subtitle}</CardDescription>}
        </CardHeader>
        <CardContent>{renderChart()}</CardContent>
      </Card>
    </motion.div>
  );
}

export default EnhancedDashboard;
