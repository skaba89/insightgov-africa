/**
 * InsightGov Africa - Enhanced Chart Components
 * ==============================================
 * Composants de graphiques modernes avec Recharts
 * Pour une meilleure visualisation des données
 */

'use client';

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadialBarChart,
  RadialBar,
  ComposedChart,
  Scatter,
  ScatterChart,
  Treemap,
  TooltipProps,
} from 'recharts';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatNumber, formatCurrency, formatPercent } from '@/lib/utils';

// =============================================================================
// THÈME DE COULEURS AFRICAIN MODERNE
// =============================================================================

export const CHART_COLORS = {
  primary: ['#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'],
  african: ['#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2', '#65A30D', '#DB2777', '#4F46E5'],
  pastel: ['#93C5FD', '#6EE7B7', '#FCD34D', '#FCA5A5', '#C4B5FD', '#F9A8D4', '#67E8F9', '#BEF264'],
  gradient: {
    emerald: ['#10B981', '#059669', '#047857'],
    blue: ['#3B82F6', '#2563EB', '#1D4ED8'],
    amber: ['#F59E0B', '#D97706', '#B45309'],
    rose: ['#F43F5E', '#E11D48', '#BE123C'],
  },
};

// =============================================================================
// TOOLTIP PERSONNALISÉ
// =============================================================================

interface CustomTooltipProps extends TooltipProps<number, string> {
  formatter?: (value: number, name: string) => string;
}

function CustomTooltip({ active, payload, label, formatter }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-xl border border-gray-100">
      {label && (
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
      )}
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-medium text-gray-900">
            {formatter
              ? formatter(entry.value as number, entry.name || '')
              : formatNumber(entry.value as number)}
          </span>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// BAR CHART MODERNE
// =============================================================================

interface ModernBarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKeys: { key: string; name?: string; color?: string }[];
  title?: string;
  description?: string;
  stacked?: boolean;
  horizontal?: boolean;
  showGrid?: boolean;
  valueFormat?: 'number' | 'currency' | 'percent';
}

export function ModernBarChart({
  data,
  xKey,
  yKeys,
  title,
  description,
  stacked = false,
  horizontal = false,
  showGrid = true,
  valueFormat = 'number',
}: ModernBarChartProps) {
  const formatter = useMemo(() => {
    switch (valueFormat) {
      case 'currency':
        return (v: number) => formatCurrency(v);
      case 'percent':
        return (v: number) => formatPercent(v);
      default:
        return (v: number) => formatNumber(v);
    }
  }, [valueFormat]);

  const chartData = useMemo(() => {
    // Grouper et agréger les données
    const grouped = data.reduce((acc, row) => {
      const key = String(row[xKey] || 'Autre');
      if (!acc[key]) {
        acc[key] = { [xKey]: key };
        yKeys.forEach(({ key: yKey }) => {
          acc[key][yKey] = 0;
        });
      }
      yKeys.forEach(({ key: yKey }) => {
        const value = Number(row[yKey]) || 0;
        acc[key][yKey] = (acc[key][yKey] || 0) + value;
      });
      return acc;
    }, {} as Record<string, Record<string, unknown>>);

    return Object.values(grouped).slice(0, 15);
  }, [data, xKey, yKeys]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="h-full">
        {title && (
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              layout={horizontal ? 'vertical' : 'horizontal'}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
              {horizontal ? (
                <>
                  <XAxis type="number" tickFormatter={formatter} />
                  <YAxis dataKey={xKey} type="category" width={100} />
                </>
              ) : (
                <>
                  <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={formatter} tick={{ fontSize: 12 }} />
                </>
              )}
              <Tooltip content={<CustomTooltip formatter={formatter} />} />
              <Legend />
              {yKeys.map((yKey, index) => (
                <Bar
                  key={yKey.key}
                  dataKey={yKey.key}
                  name={yKey.name || yKey.key}
                  fill={yKey.color || CHART_COLORS.primary[index % CHART_COLORS.primary.length]}
                  stackId={stacked ? 'stack' : undefined}
                  radius={stacked ? undefined : [4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// =============================================================================
// LINE CHART AVEC GRADIENT
// =============================================================================

interface ModernLineChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKeys: { key: string; name?: string; color?: string }[];
  title?: string;
  description?: string;
  showArea?: boolean;
  valueFormat?: 'number' | 'currency' | 'percent';
}

export function ModernLineChart({
  data,
  xKey,
  yKeys,
  title,
  description,
  showArea = false,
  valueFormat = 'number',
}: ModernLineChartProps) {
  const formatter = useMemo(() => {
    switch (valueFormat) {
      case 'currency':
        return (v: number) => formatCurrency(v);
      case 'percent':
        return (v: number) => formatPercent(v);
      default:
        return (v: number) => formatNumber(v);
    }
  }, [valueFormat]);

  const chartData = useMemo(() => {
    // Trier par date si applicable
    return [...data].sort((a, b) => {
      const aVal = a[xKey];
      const bVal = b[xKey];
      if (aVal instanceof Date && bVal instanceof Date) {
        return aVal.getTime() - bVal.getTime();
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal);
      }
      return 0;
    }).slice(0, 50);
  }, [data, xKey]);

  const ChartComponent = showArea ? AreaChart : LineChart;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="h-full">
        {title && (
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={300}>
            <ChartComponent
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                {yKeys.map((yKey, index) => (
                  <linearGradient
                    key={`gradient-${yKey.key}`}
                    id={`gradient-${yKey.key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={yKey.color || CHART_COLORS.primary[index]}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={yKey.color || CHART_COLORS.primary[index]}
                      stopOpacity={0}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={formatter} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip formatter={formatter} />} />
              <Legend />
              {yKeys.map((yKey, index) =>
                showArea ? (
                  <Area
                    key={yKey.key}
                    type="monotone"
                    dataKey={yKey.key}
                    name={yKey.name || yKey.key}
                    stroke={yKey.color || CHART_COLORS.primary[index]}
                    fill={`url(#gradient-${yKey.key})`}
                    strokeWidth={2}
                  />
                ) : (
                  <Line
                    key={yKey.key}
                    type="monotone"
                    dataKey={yKey.key}
                    name={yKey.name || yKey.key}
                    stroke={yKey.color || CHART_COLORS.primary[index]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                )
              )}
            </ChartComponent>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// =============================================================================
// DONUT CHART AMÉLIORÉ
// =============================================================================

interface ModernDonutChartProps {
  data: Record<string, unknown>[];
  nameKey: string;
  valueKey: string;
  title?: string;
  description?: string;
  innerRadius?: number;
  outerRadius?: number;
  showLabels?: boolean;
}

export function ModernDonutChart({
  data,
  nameKey,
  valueKey,
  title,
  description,
  innerRadius = 60,
  outerRadius = 100,
  showLabels = true,
}: ModernDonutChartProps) {
  const chartData = useMemo(() => {
    // Grouper par nameKey et sommer valueKey
    const grouped = data.reduce((acc, row) => {
      const key = String(row[nameKey] || 'Autre');
      const value = Number(row[valueKey]) || 0;
      acc[key] = (acc[key] || 0) + value;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [data, nameKey, valueKey]);

  const total = useMemo(() => 
    chartData.reduce((sum, item) => sum + item.value, 0),
    [chartData]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="h-full">
        {title && (
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                dataKey="value"
                nameKey="name"
                paddingAngle={2}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHART_COLORS.primary[index % CHART_COLORS.primary.length]}
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [formatNumber(value), 'Valeur']}
              />
              <Legend 
                layout="vertical" 
                align="right" 
                verticalAlign="middle"
                formatter={(value) => (
                  <span className="text-sm text-gray-600">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Total au centre */}
          <div className="text-center -mt-52 pointer-events-none">
            <p className="text-3xl font-bold text-gray-900">{formatNumber(total)}</p>
            <p className="text-sm text-gray-500">Total</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// =============================================================================
// GAUGE CHART (INDICATEUR DE PERFORMANCE)
// =============================================================================

interface GaugeChartProps {
  value: number;
  max?: number;
  title?: string;
  description?: string;
  thresholds?: { warning: number; target: number };
  unit?: string;
}

export function GaugeChart({
  value,
  max = 100,
  title,
  description,
  thresholds = { warning: 60, target: 80 },
  unit = '%',
}: GaugeChartProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const getColor = () => {
    if (percentage >= thresholds.target) return '#10B981'; // emerald
    if (percentage >= thresholds.warning) return '#F59E0B'; // amber
    return '#EF4444'; // red
  };

  const chartData = [{ name: 'value', value: percentage, fill: getColor() }];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="h-full">
        {title && (
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart
              cx="50%"
              cy="100%"
              innerRadius="60%"
              outerRadius="100%"
              startAngle={180}
              endAngle={0}
              data={chartData}
            >
              <RadialBar
                background={{ fill: '#E5E7EB' }}
                dataKey="value"
                cornerRadius={10}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="text-center -mt-32">
            <p className="text-4xl font-bold text-gray-900">
              {value.toFixed(1)}{unit}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {percentage >= thresholds.target ? 'Objectif atteint' : 
               percentage >= thresholds.warning ? 'En progression' : 'À améliorer'}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// =============================================================================
// KPI CARD MODERNE
// =============================================================================

interface ModernKpiCardProps {
  title: string;
  value: number | string;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: number;
  format?: 'number' | 'currency' | 'percent';
  icon?: React.ReactNode;
  color?: string;
}

export function ModernKpiCard({
  title,
  value,
  description,
  trend,
  trendValue,
  format = 'number',
  icon,
  color = 'blue',
}: ModernKpiCardProps) {
  const formattedValue = useMemo(() => {
    if (typeof value === 'string') return value;
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percent':
        return formatPercent(value);
      default:
        return formatNumber(value);
    }
  }, [value, format]);

  const trendColors = {
    up: 'text-emerald-500 bg-emerald-50',
    down: 'text-red-500 bg-red-50',
    neutral: 'text-gray-500 bg-gray-50',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
    >
      <Card className="h-full hover:shadow-lg transition-all duration-300 overflow-hidden">
        <div className={`h-1 bg-${color}-500`} style={{ backgroundColor: `var(--color-${color}-500, #3B82F6)` }} />
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-sm font-medium">
              {title}
            </CardDescription>
            {icon && (
              <div className={`p-2 rounded-lg bg-${color}-50`} style={{ backgroundColor: `color-mix(in srgb, var(--color-${color}-500, #3B82F6) 10%, white)` }}>
                {icon}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold text-gray-900">
              {formattedValue}
            </span>
            {trend && trendValue !== undefined && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${trendColors[trend]}`}>
                {trend === 'up' && '↑'}
                {trend === 'down' && '↓'}
                {trendValue > 0 ? '+' : ''}{trendValue.toFixed(1)}%
              </div>
            )}
          </div>
          {description && (
            <p className="text-sm text-gray-500 mt-2">{description}</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  CHART_COLORS as chartColors,
  CustomTooltip,
};
