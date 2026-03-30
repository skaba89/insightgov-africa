/**
 * InsightGov Africa - Chart Renderer Component
 * =============================================
 * Render de graphiques Tremor dynamiques basé sur la configuration KPI.
 */

'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  BarChart,
  LineChart,
  DonutChart,
  BarList,
} from '@tremor/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KPICard } from './kpi-card';
import type { KPIConfig, ChartType } from '@/types';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

interface ChartRendererProps {
  config: KPIConfig;
  data: Record<string, unknown>[];
  className?: string;
}

interface ChartDataItem {
  [key: string]: string | number;
}

// =============================================================================
// COULEURS TREMOR
// =============================================================================

const TREMOR_COLORS = [
  'blue',
  'emerald',
  'violet',
  'amber',
  'rose',
  'cyan',
  'lime',
  'orange',
  'fuchsia',
  'teal',
] as const;

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ChartRenderer({ config, data, className }: ChartRendererProps) {
  // Debug: afficher les données reçues
  console.log('ChartRenderer - config:', config.title, 'chartType:', config.chartType);
  console.log('ChartRenderer - data length:', data?.length);
  console.log('ChartRenderer - data sample:', data?.[0]);
  console.log('ChartRenderer - columns:', config.columns);

  // Transformer les données pour Tremor
  const chartData = useMemo(() => {
    return transformDataForChart(config, data);
  }, [config, data]);

  // Calculer la valeur agrégée si nécessaire
  const aggregatedValue = useMemo(() => {
    if (config.chartType === 'kpi' || config.chartType === 'metric') {
      const value = calculateAggregation(data, config);
      console.log('ChartRenderer - aggregated value:', value, 'for config:', config.title);
      return value;
    }
    return null;
  }, [data, config]);

  // Rendu selon le type de graphique
  const renderChart = () => {
    switch (config.chartType) {
      case 'kpi':
      case 'metric':
        return (
          <KPICard
            title={config.title}
            value={aggregatedValue ?? 0}
            description={config.description}
            format={config.valueFormat}
            isKeyMetric={config.isKeyMetric}
          />
        );

      case 'bar':
        return (
          <BarChart
            className="h-72"
            data={chartData}
            index={config.columns.x || 'name'}
            categories={[config.columns.y || 'value']}
            colors={config.colors?.length ? config.colors as ('blue' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan' | 'lime' | 'orange' | 'fuchsia' | 'teal')[] : ['blue']}
            valueFormatter={(value) => formatChartValue(value, config.valueFormat)}
            showLegend={false}
            showAnimation={true}
          />
        );

      case 'line':
        return (
          <LineChart
            className="h-72"
            data={chartData}
            index={config.columns.x || 'name'}
            categories={[config.columns.y || 'value']}
            colors={config.colors?.length ? config.colors as ('blue' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan' | 'lime' | 'orange' | 'fuchsia' | 'teal')[] : ['emerald']}
            valueFormatter={(value) => formatChartValue(value, config.valueFormat)}
            showLegend={false}
            showAnimation={true}
            curveType="monotone"
          />
        );

      case 'area':
        return (
          <AreaChart
            className="h-72"
            data={chartData}
            index={config.columns.x || 'name'}
            categories={[config.columns.y || 'value']}
            colors={config.colors?.length ? config.colors as ('blue' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan' | 'lime' | 'orange' | 'fuchsia' | 'teal')[] : ['cyan']}
            valueFormatter={(value) => formatChartValue(value, config.valueFormat)}
            showLegend={false}
            showAnimation={true}
            curveType="monotone"
          />
        );

      case 'donut':
        return (
          <DonutChart
            className="h-72"
            data={chartData}
            category="value"
            index="name"
            colors={config.colors?.length ? config.colors as ('blue' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan' | 'lime' | 'orange' | 'fuchsia' | 'teal')[] : ['blue', 'emerald', 'violet', 'amber', 'rose']}
            valueFormatter={(value) => formatChartValue(value, config.valueFormat)}
            showAnimation={true}
            showTooltip={true}
            variant="pie"
          />
        );

      case 'pie':
        return (
          <DonutChart
            className="h-72"
            data={chartData}
            category="value"
            index="name"
            colors={config.colors?.length ? config.colors as ('blue' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan' | 'lime' | 'orange' | 'fuchsia' | 'teal')[] : ['blue', 'emerald', 'violet', 'amber', 'rose']}
            valueFormatter={(value) => formatChartValue(value, config.valueFormat)}
            showAnimation={true}
            showTooltip={true}
            variant="donut"
          />
        );

      case 'barList':
        return (
          <BarList
            data={chartData.slice(0, 10).map((item) => ({
              name: String(item.name),
              value: Number(item.value) || 0,
            }))}
            valueFormatter={(value) => formatChartValue(value, config.valueFormat)}
            className="h-72"
          />
        );

      case 'sparkchart':
        // SparkLine simulé avec un mini line chart
        return (
          <div className="h-12 p-2 bg-gray-50 rounded">
            <div className="flex items-end gap-0.5 h-full">
              {chartData.slice(0, 20).map((item, i) => {
                const val = Number(item.value) || 0;
                const max = Math.max(...chartData.map((d) => Number(d.value) || 0));
                const height = max > 0 ? (val / max) * 100 : 0;
                return (
                  <div
                    key={i}
                    className="flex-1 bg-blue-500 rounded-t"
                    style={{ height: `${height}%`, minHeight: '2px' }}
                  />
                );
              })}
            </div>
          </div>
        );

      case 'gauge':
        // Gauge simulée avec un KPI card spécial
        return <GaugeChart value={aggregatedValue ?? 0} config={config} />;

      case 'progressBar':
        return <ProgressBarChart value={aggregatedValue ?? 0} config={config} />;

      case 'table':
        return <TableChart data={chartData} config={config} />;

      default:
        return (
          <div className="flex items-center justify-center h-48 text-gray-400">
            Type de graphique non supporté: {config.chartType}
          </div>
        );
    }
  };

  // Si c'est un KPI card, pas besoin de wrapper
  if (config.chartType === 'kpi' || config.chartType === 'metric') {
    return <div className={className}>{renderChart()}</div>;
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{config.title}</CardTitle>
        {config.description && (
          <CardDescription>{config.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>{renderChart()}</CardContent>
    </Card>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

// Gauge Chart (simulé avec CSS)
function GaugeChart({ value, config }: { value: number; config: KPIConfig }) {
  const percentage = Math.min(100, Math.max(0, value));
  const thresholds = config.thresholds;
  
  // Déterminer la couleur selon les seuils
  let color = 'text-blue-500';
  let bgColor = 'bg-blue-500';
  if (thresholds) {
    if (thresholds.critical && percentage >= thresholds.critical) {
      color = 'text-red-500';
      bgColor = 'bg-red-500';
    } else if (thresholds.warning && percentage >= thresholds.warning) {
      color = 'text-amber-500';
      bgColor = 'bg-amber-500';
    } else if (thresholds.target && percentage >= thresholds.target) {
      color = 'text-green-500';
      bgColor = 'bg-green-500';
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{config.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          {/* Cercle de progression */}
          <div className="relative w-40 h-40">
            <svg className="w-full h-full transform -rotate-90">
              {/* Fond */}
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                className="text-gray-200 dark:text-gray-700"
              />
              {/* Progression */}
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                strokeLinecap="round"
                className={color}
                strokeDasharray={`${(percentage / 100) * 440} 440`}
              />
            </svg>
            {/* Valeur au centre */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn('text-3xl font-bold', color)}>
                {formatChartValue(percentage, config.valueFormat)}
              </span>
              {config.valueFormat?.suffix && (
                <span className="text-sm text-gray-500">{config.valueFormat.suffix}</span>
              )}
            </div>
          </div>
          {/* Seuils */}
          {thresholds && (
            <div className="flex gap-4 mt-4 text-xs">
              {thresholds.target && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>Objectif: {thresholds.target}%</span>
                </div>
              )}
              {thresholds.warning && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Alerte: {thresholds.warning}%</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Progress Bar Chart
function ProgressBarChart({ value, config }: { value: number; config: KPIConfig }) {
  const percentage = Math.min(100, Math.max(0, value));
  const thresholds = config.thresholds;
  
  let barColor = 'bg-blue-500';
  if (thresholds) {
    if (thresholds.critical && percentage >= thresholds.critical) {
      barColor = 'bg-red-500';
    } else if (thresholds.warning && percentage >= thresholds.warning) {
      barColor = 'bg-amber-500';
    } else if (thresholds.target && percentage >= thresholds.target) {
      barColor = 'bg-green-500';
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{config.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">{config.description}</span>
            <span className="font-medium">{formatChartValue(percentage, config.valueFormat)}</span>
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', barColor)}
              style={{ width: `${percentage}%` }}
            />
          </div>
          {thresholds?.target && (
            <div className="flex justify-between text-xs text-gray-400">
              <span>0%</span>
              <span className="text-green-500">Objectif: {thresholds.target}%</span>
              <span>100%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Table Chart
function TableChart({ data, config }: { data: ChartDataItem[]; config: KPIConfig }) {
  if (!data.length) return null;
  
  const columns = Object.keys(data[0]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {columns.map((col) => (
              <th key={col} className="text-left py-2 px-3 font-medium text-gray-600">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 10).map((row, i) => (
            <tr key={i} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              {columns.map((col) => (
                <td key={col} className="py-2 px-3">
                  {formatCellValue(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

// Transformer les données pour les graphiques Tremor
function transformDataForChart(
  config: KPIConfig,
  rawData: Record<string, unknown>[]
): ChartDataItem[] {
  const { columns, aggregation, chartType } = config;
  const xCol = columns.x || '';
  const yCol = columns.y || '';

  if (chartType === 'donut' || chartType === 'pie' || chartType === 'barList') {
    // Grouper et agréger
    const grouped = new Map<string, number[]>();

    rawData.forEach((row) => {
      const key = String(row[xCol] || 'Autre');
      const value = Number(row[yCol]) || 0;
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(value);
    });

    // Appliquer l'agrégation
    return Array.from(grouped.entries())
      .map(([name, values]) => ({
        name,
        value: applyAggregation(values, aggregation),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }

  // Pour les graphiques en série (bar, line, area)
  if (chartType === 'bar' || chartType === 'line' || chartType === 'area') {
    const grouped = new Map<string, number[]>();

    rawData.forEach((row) => {
      const key = String(row[xCol] || 'Autre');
      const value = Number(row[yCol]) || 0;
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(value);
    });

    return Array.from(grouped.entries())
      .map(([key, values]) => ({
        [xCol]: key,
        [yCol]: applyAggregation(values, aggregation),
      }))
      .slice(0, 50); // Limiter pour la performance
  }

  // Pour les autres types, retourner les données brutes
  return rawData.map((row) => ({
    name: String(row[xCol] || ''),
    value: Number(row[yCol]) || 0,
  }));
}

// Calculer l'agrégation pour un KPI simple
function calculateAggregation(
  data: Record<string, unknown>[],
  config: KPIConfig
): number {
  const yCol = config.columns.y || '';
  
  // Si pas de colonne Y spécifiée, essayer de trouver une colonne numérique
  if (!yCol && data.length > 0) {
    const firstRow = data[0];
    const numericCol = Object.keys(firstRow).find(key => {
      const val = firstRow[key];
      return typeof val === 'number' || (!isNaN(Number(val)) && val !== null && val !== '');
    });
    if (numericCol) {
      const values = data.map((row) => Number(row[numericCol]) || 0);
      console.log(`calculateAggregation - Using auto-detected column "${numericCol}", values:`, values.slice(0, 5));
      return applyAggregation(values, config.aggregation);
    }
  }
  
  // Vérifier si la colonne existe dans les données
  if (data.length > 0 && !(yCol in data[0])) {
    console.warn(`calculateAggregation - Column "${yCol}" not found in data. Available columns:`, Object.keys(data[0]));
    
    // Essayer de trouver une correspondance insensible à la casse
    const matchingCol = Object.keys(data[0]).find(
      key => key.toLowerCase() === yCol.toLowerCase()
    );
    
    if (matchingCol) {
      console.log(`calculateAggregation - Found matching column "${matchingCol}"`);
      const values = data.map((row) => Number(row[matchingCol]) || 0);
      return applyAggregation(values, config.aggregation);
    }
    
    return 0;
  }
  
  const values = data.map((row) => Number(row[yCol]) || 0);
  console.log(`calculateAggregation - Column "${yCol}", values:`, values.slice(0, 5), 'sum:', values.reduce((a, b) => a + b, 0));
  return applyAggregation(values, config.aggregation);
}

// Appliquer l'agrégation
function applyAggregation(
  values: number[],
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'countDistinct'
): number {
  if (!values.length) return 0;

  switch (aggregation) {
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'count':
      return values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'countDistinct':
      return new Set(values).size;
    case 'sum':
    default:
      return values.reduce((a, b) => a + b, 0);
  }
}

// Formater la valeur pour l'affichage
function formatChartValue(
  value: number,
  format?: { prefix?: string; suffix?: string; decimals?: number; compact?: boolean }
): string {
  const { prefix = '', suffix = '', decimals = 0, compact = false } = format || {};

  let formattedNumber: string;

  if (compact && Math.abs(value) >= 1000000) {
    formattedNumber = (value / 1000000).toFixed(1) + 'M';
  } else if (compact && Math.abs(value) >= 1000) {
    formattedNumber = (value / 1000).toFixed(1) + 'K';
  } else {
    formattedNumber = value.toLocaleString('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  return `${prefix}${formattedNumber}${suffix}`;
}

// Formater une valeur de cellule
function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') {
    return value.toLocaleString('fr-FR');
  }
  return String(value);
}

export default ChartRenderer;
