// ============================================
// InsightGov Africa - Composants KPI Avancés
// Cartes KPI avec tendances et sparklines
// ============================================

'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  SparkAreaChart,
  SparkBarChart,
  BadgeDelta,
  Card as TremorCard,
  Flex,
  Text,
  Bold,
  DeltaType,
} from '@tremor/react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatNumber, formatCurrency, formatPercent } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

interface AdvancedKpiCardProps {
  title: string;
  value: number;
  unit?: string;
  format?: 'number' | 'currency' | 'percent';
  previousValue?: number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  sparklineData?: number[];
  sparklineType?: 'area' | 'bar';
  description?: string;
  insight?: string;
  category?: string;
  className?: string;
}

interface KpiGridProps {
  kpis: AdvancedKpiCardProps[];
  columns?: 2 | 3 | 4;
}

// ============================================
// CARTE KPI AVANCÉE
// ============================================

export function AdvancedKpiCard({
  title,
  value,
  unit = '',
  format = 'number',
  previousValue,
  trend,
  trendValue,
  sparklineData,
  sparklineType = 'area',
  description,
  insight,
  category,
  className,
}: AdvancedKpiCardProps) {
  // Calculer la tendance si non fournie
  const calculatedTrend = useMemo(() => {
    if (trend) return trend;
    if (previousValue !== undefined && previousValue !== 0) {
      const change = ((value - previousValue) / previousValue) * 100;
      if (change > 2) return 'up';
      if (change < -2) return 'down';
      return 'neutral';
    }
    return undefined;
  }, [trend, value, previousValue]);

  // Calculer le pourcentage de changement
  const changePercent = useMemo(() => {
    if (trendValue !== undefined) return trendValue;
    if (previousValue !== undefined && previousValue !== 0) {
      return parseFloat((((value - previousValue) / previousValue) * 100).toFixed(1));
    }
    return undefined;
  }, [trendValue, value, previousValue]);

  // Formater la valeur
  const formattedValue = useMemo(() => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percent':
        return formatPercent(value);
      default:
        return formatNumber(value);
    }
  }, [value, format]);

  // Couleurs selon la tendance
  const trendColors = {
    up: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      icon: TrendingUp,
      delta: 'increase' as DeltaType,
    },
    down: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      icon: TrendingDown,
      delta: 'decrease' as DeltaType,
    },
    neutral: {
      bg: 'bg-gray-50',
      text: 'text-gray-600',
      icon: Minus,
      delta: 'unchanged' as DeltaType,
    },
  };

  const trendStyle = calculatedTrend ? trendColors[calculatedTrend] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn('h-full overflow-hidden', className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-sm font-medium text-gray-600">
              {title}
            </CardDescription>
            {category && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                {category}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Valeur principale + Tendance */}
          <div className="flex items-end justify-between">
            <div>
              <span className="text-3xl font-bold text-gray-900">
                {formattedValue}
              </span>
              {unit && format === 'number' && (
                <span className="text-sm text-gray-500 ml-1">{unit}</span>
              )}
            </div>

            {/* Indicateur de tendance */}
            {trendStyle && changePercent !== undefined && (
              <div
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-full',
                  trendStyle.bg
                )}
              >
                <trendStyle.icon className={cn('w-4 h-4', trendStyle.text)} />
                <span className={cn('text-sm font-medium', trendStyle.text)}>
                  {changePercent > 0 ? '+' : ''}
                  {changePercent}%
                </span>
              </div>
            )}
          </div>

          {/* Sparkline */}
          {sparklineData && sparklineData.length > 0 && (
            <div className="h-12">
              {sparklineType === 'area' ? (
                <SparkAreaChart
                  data={sparklineData.map((v, i) => ({ value: v }))}
                  index="value"
                  categories={['value']}
                  colors={[calculatedTrend === 'down' ? 'red' : 'emerald']}
                  className="h-12"
                  showAnimation={true}
                />
              ) : (
                <SparkBarChart
                  data={sparklineData.map((v, i) => ({ value: v }))}
                  index="value"
                  categories={['value']}
                  colors={[calculatedTrend === 'down' ? 'red' : 'emerald']}
                  className="h-12"
                  showAnimation={true}
                />
              )}
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="text-sm text-gray-500 line-clamp-2">{description}</p>
          )}

          {/* Insight */}
          {insight && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-xs text-amber-800 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                {insight}
              </p>
            </div>
          )}

          {/* Comparaison avec période précédente */}
          {previousValue !== undefined && (
            <div className="pt-2 border-t border-gray-100">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Période précédente</span>
                <span className="font-medium text-gray-700">
                  {format === 'currency'
                    ? formatCurrency(previousValue)
                    : format === 'percent'
                    ? formatPercent(previousValue)
                    : formatNumber(previousValue)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ============================================
// GRILLE DE KPIs
// ============================================

export function KpiGrid({ kpis, columns = 4 }: KpiGridProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns])}>
      {kpis.map((kpi, index) => (
        <AdvancedKpiCard key={index} {...kpi} />
      ))}
    </div>
  );
}

// ============================================
// CARTE DE STATISTIQUES RÉSUMÉES
// ============================================

interface SummaryStatsProps {
  title: string;
  stats: {
    label: string;
    value: number;
    format?: 'number' | 'currency' | 'percent';
    change?: number;
  }[];
  className?: string;
}

export function SummaryStats({ title, stats, className }: SummaryStatsProps) {
  return (
    <Card className={cn('bg-gradient-to-r from-gray-900 to-gray-800 text-white', className)}>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div key={index} className="space-y-1">
              <p className="text-sm text-gray-400">{stat.label}</p>
              <p className="text-2xl font-bold">
                {stat.format === 'currency'
                  ? formatCurrency(stat.value)
                  : stat.format === 'percent'
                  ? formatPercent(stat.value)
                  : formatNumber(stat.value)}
              </p>
              {stat.change !== undefined && (
                <p
                  className={cn(
                    'text-xs flex items-center gap-1',
                    stat.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                  )}
                >
                  {stat.change >= 0 ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {Math.abs(stat.change)}% vs période préc.
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// BADGE DELTA TREMOR
// ============================================

export function TrendBadge({
  value,
  showIcon = true,
}: {
  value: number;
  showIcon?: boolean;
}) {
  const deltaType: DeltaType =
    value > 0 ? 'increase' : value < 0 ? 'decrease' : 'unchanged';

  return (
    <BadgeDelta deltaType={deltaType} className="ml-2">
      {value > 0 ? '+' : ''}
      {value}%
    </BadgeDelta>
  );
}

export default AdvancedKpiCard;
