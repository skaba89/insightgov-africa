/**
 * InsightGov Africa - Chart Renderer Component
 * Rendu des graphiques avec couleurs visibles et labels en français
 */

'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KPICard } from './kpi-card';
import type { KPIConfig } from '@/types';
import { cn } from '@/lib/utils';

// Dictionnaire étendu pour la traduction des noms de KPI
const KPI_TRANSLATIONS: Record<string, string> = {
  'patients': 'Patients',
  'consultations': 'Consultations',
  'hospitalisations': 'Hospitalisations',
  'vaccinations': 'Vaccinations',
  'deces': 'Décès',
  'mortalite': 'Mortalité',
  'mortality': 'Mortalité',
  'accouchements': 'Accouchements',
  'naissances': 'Naissances',
  'couverture': 'Couverture',
  'coverage': 'Couverture',
  'budget': 'Budget',
  'montant': 'Montant',
  'cout': 'Coût',
  'cost': 'Coût',
  'revenus': 'Revenus',
  'revenue': 'Revenus',
  'depenses': 'Dépenses',
  'expenses': 'Dépenses',
  'total': 'Total',
  'nombre': 'Nombre',
  'count': 'Nombre',
  'effectif': 'Effectif',
  'taux': 'Taux',
  'rate': 'Taux',
  'pourcentage': 'Pourcentage',
  'percentage': 'Pourcentage',
  'moyenne': 'Moyenne',
  'average': 'Moyenne',
  'sum': 'Somme',
  'max': 'Maximum',
  'min': 'Minimum',
  'production': 'Production',
  'recolte': 'Récolte',
  'harvest': 'Récolte',
  'superficie': 'Superficie',
  'area': 'Superficie',
  'region': 'Région',
  'district': 'District',
  'country': 'Pays',
  'city': 'Ville',
  'year': 'Année',
  'month': 'Mois',
  'quarter': 'Trimestre',
  'week': 'Semaine',
  'day': 'Jour',
  'source': 'Source',
  'category': 'Catégorie',
  'type': 'Type',
  'status': 'Statut',
};

// Couleurs vibrantes pour les graphiques
const CHART_COLORS = [
  '#6366f1', // Indigo
  '#22c55e', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#ec4899', // Pink
  '#14b8a6', // Teal
];

function formatKPIName(name: string): string {
  let cleanName = name.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim().toLowerCase();
  
  if (KPI_TRANSLATIONS[cleanName]) {
    return KPI_TRANSLATIONS[cleanName];
  }
  
  for (const [key, value] of Object.entries(KPI_TRANSLATIONS)) {
    if (cleanName.includes(key)) {
      return value;
    }
  }
  
  return cleanName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

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
// MAIN COMPONENT
// =============================================================================

export function ChartRenderer({ config, data, className }: ChartRendererProps) {
  console.log('ChartRenderer - config:', config.title, 'chartType:', config.chartType);
  console.log('ChartRenderer - data length:', data?.length);

  const chartData = useMemo(() => {
    return transformDataForChart(config, data);
  }, [config, data]);

  const aggregatedValue = useMemo(() => {
    if (config.chartType === 'kpi' || config.chartType === 'metric') {
      return calculateAggregation(data, config);
    }
    return null;
  }, [data, config]);

  const renderChart = () => {
    switch (config.chartType) {
      case 'kpi':
      case 'metric': {
        let kpiStatus: 'success' | 'warning' | 'danger' | 'neutral' = 'neutral';
        const val = aggregatedValue ?? 0;
        
        if (config.thresholds) {
          if (config.thresholds.critical && val >= config.thresholds.critical) {
            kpiStatus = 'danger';
          } else if (config.thresholds.warning && val >= config.thresholds.warning) {
            kpiStatus = 'warning';
          } else if (config.thresholds.target && val >= config.thresholds.target) {
            kpiStatus = 'success';
          }
        } else {
          if (val >= 80) kpiStatus = 'success';
          else if (val >= 50) kpiStatus = 'neutral';
          else if (val >= 25) kpiStatus = 'warning';
          else if (val > 0) kpiStatus = 'danger';
        }
        
        return (
          <KPICard
            title={formatKPIName(config.title)}
            value={aggregatedValue ?? 0}
            description={config.description}
            format={config.valueFormat}
            isKeyMetric={config.isKeyMetric}
            status={kpiStatus}
          />
        );
      }

      case 'bar':
        return <SimpleBarChart data={chartData} config={config} />;

      case 'line':
        return <SimpleLineChart data={chartData} config={config} />;

      case 'area':
        return <SimpleAreaChart data={chartData} config={config} />;

      case 'donut':
      case 'pie':
        return <SimplePieChart data={chartData} config={config} />;

      case 'barList':
        return <SimpleBarList data={chartData} config={config} />;

      case 'gauge':
        return <GaugeChart value={aggregatedValue ?? 0} config={config} />;

      case 'progressBar':
        return <ProgressBarChart value={aggregatedValue ?? 0} config={config} />;

      case 'table':
        return <TableChart data={chartData} config={config} />;

      default:
        return (
          <div className="flex items-center justify-center h-48 text-gray-500 bg-gray-50 rounded-lg">
            Type de graphique: {config.chartType}
          </div>
        );
    }
  };

  if (config.chartType === 'kpi' || config.chartType === 'metric') {
    return <div className={className}>{renderChart()}</div>;
  }

  return (
    <Card className={cn('overflow-hidden shadow-md hover:shadow-lg transition-shadow', className)}>
      <CardHeader className="pb-2 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
        <CardTitle className="text-base font-bold text-gray-800 dark:text-gray-100">
          {formatKPIName(config.title)}
        </CardTitle>
        {config.description && (
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {config.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-4">{renderChart()}</CardContent>
    </Card>
  );
}

// =============================================================================
// SIMPLE CHART COMPONENTS - Avec couleurs explicites
// =============================================================================

// Bar Chart simple avec couleurs
function SimpleBarChart({ data, config }: { data: ChartDataItem[]; config: KPIConfig }) {
  if (!data || data.length === 0) {
    return <div className="h-72 flex items-center justify-center text-gray-400">Aucune donnée</div>;
  }

  const xKey = config.columns.x || Object.keys(data[0] || {})[0] || 'name';
  const yKey = config.columns.y || Object.keys(data[0] || {}).find(k => typeof data[0][k] === 'number') || 'value';
  
  const maxValue = Math.max(...data.map(d => Number(d[yKey]) || 0));
  const color = CHART_COLORS[0];

  return (
    <div className="h-72 flex flex-col">
      {/* Bar Chart */}
      <div className="flex-1 flex items-end gap-2 px-4 pb-8 pt-4">
        {data.slice(0, 10).map((item, index) => {
          const value = Number(item[yKey]) || 0;
          const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
          const label = String(item[xKey] || '').substring(0, 15);
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center min-w-0">
              <div className="w-full relative group">
                {/* Tooltip */}
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  {formatChartValue(value, config.valueFormat)}
                </div>
                {/* Bar */}
                <div
                  className="w-full rounded-t-md transition-all duration-300 hover:opacity-80"
                  style={{ 
                    height: `${Math.max(height, 2)}%`,
                    backgroundColor: color,
                    minHeight: '4px'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {/* X Axis Labels */}
      <div className="flex gap-2 px-4 border-t border-gray-200 dark:border-gray-700">
        {data.slice(0, 10).map((item, index) => {
          const label = String(item[xKey] || '').substring(0, 10);
          return (
            <div key={index} className="flex-1 text-center py-2 min-w-0">
              <span className="text-xs text-gray-600 dark:text-gray-400 truncate block" title={String(item[xKey] || '')}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Line Chart simple
function SimpleLineChart({ data, config }: { data: ChartDataItem[]; config: KPIConfig }) {
  if (!data || data.length === 0) {
    return <div className="h-72 flex items-center justify-center text-gray-400">Aucune donnée</div>;
  }

  const xKey = config.columns.x || Object.keys(data[0] || {})[0] || 'name';
  const yKey = config.columns.y || Object.keys(data[0] || {}).find(k => typeof data[0][k] === 'number') || 'value';
  
  const values = data.map(d => Number(d[yKey]) || 0);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;
  const color = CHART_COLORS[4]; // Blue

  // Generate SVG path
  const points = values.map((value, index) => {
    const x = (index / (values.length - 1 || 1)) * 100;
    const y = 100 - ((value - minValue) / range) * 100;
    return { x, y, value };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="h-72 relative px-4">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(y => (
          <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
        ))}
        
        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        
        {/* Points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="3"
            fill={color}
            stroke="white"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      
      {/* Labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4">
        {data.slice(0, 8).map((item, index) => (
          <span key={index} className="text-xs text-gray-500 truncate" style={{ maxWidth: '60px' }}>
            {String(item[xKey] || '').substring(0, 8)}
          </span>
        ))}
      </div>
    </div>
  );
}

// Area Chart simple
function SimpleAreaChart({ data, config }: { data: ChartDataItem[]; config: KPIConfig }) {
  if (!data || data.length === 0) {
    return <div className="h-72 flex items-center justify-center text-gray-400">Aucune donnée</div>;
  }

  const xKey = config.columns.x || Object.keys(data[0] || {})[0] || 'name';
  const yKey = config.columns.y || Object.keys(data[0] || {}).find(k => typeof data[0][k] === 'number') || 'value';
  
  const values = data.map(d => Number(d[yKey]) || 0);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;
  const color = CHART_COLORS[1]; // Green

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1 || 1)) * 100;
    const y = 100 - ((value - minValue) / range) * 100;
    return { x, y, value };
  });

  const areaPath = `M 0 100 ${points.map(p => `L ${p.x} ${p.y}`).join(' ')} L 100 100 Z`;
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="h-72 relative px-4">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
        {/* Area fill */}
        <path
          d={areaPath}
          fill={color}
          fillOpacity="0.2"
        />
        
        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        
        {/* Points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="2"
            fill={color}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4">
        {data.slice(0, 8).map((item, index) => (
          <span key={index} className="text-xs text-gray-500 truncate" style={{ maxWidth: '60px' }}>
            {String(item[xKey] || '').substring(0, 8)}
          </span>
        ))}
      </div>
    </div>
  );
}

// Pie/Donut Chart simple
function SimplePieChart({ data, config }: { data: ChartDataItem[]; config: KPIConfig }) {
  if (!data || data.length === 0) {
    return <div className="h-72 flex items-center justify-center text-gray-400">Aucune donnée</div>;
  }

  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  if (total === 0) {
    return <div className="h-72 flex items-center justify-center text-gray-400">Aucune valeur</div>;
  }

  let angleAccumulator = -90;
  const segments = data.slice(0, 8).map((item, index) => {
    const value = Number(item.value) || 0;
    const percentage = (value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = angleAccumulator;
    const endAngle = angleAccumulator + angle;
    angleAccumulator = endAngle;
    
    return {
      ...item,
      value,
      percentage,
      startAngle,
      endAngle,
      color: CHART_COLORS[index % CHART_COLORS.length],
    };
  });

  const describeArc = (startAngle: number, endAngle: number) => {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(endRad);
    const y2 = 50 + 40 * Math.sin(endRad);
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="h-72 flex items-center gap-4">
      {/* Pie Chart */}
      <div className="w-1/2 flex justify-center">
        <svg viewBox="0 0 100 100" className="w-40 h-40">
          {segments.map((seg, index) => (
            <path
              key={index}
              d={describeArc(seg.startAngle, seg.endAngle)}
              fill={seg.color}
              stroke="white"
              strokeWidth="0.5"
              className="hover:opacity-80 transition-opacity cursor-pointer"
            />
          ))}
        </svg>
      </div>
      
      {/* Legend */}
      <div className="w-1/2 space-y-2">
        {segments.map((seg, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full shrink-0" 
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1" title={String(seg.name)}>
              {String(seg.name).substring(0, 20)}
            </span>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {seg.percentage.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Bar List simple
function SimpleBarList({ data, config }: { data: ChartDataItem[]; config: KPIConfig }) {
  if (!data || data.length === 0) {
    return <div className="h-72 flex items-center justify-center text-gray-400">Aucune donnée</div>;
  }

  const maxValue = Math.max(...data.map(d => Number(d.value) || 0));

  return (
    <div className="h-72 space-y-3 overflow-y-auto">
      {data.slice(0, 10).map((item, index) => {
        const value = Number(item.value) || 0;
        const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
        const color = CHART_COLORS[index % CHART_COLORS.length];
        
        return (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300 truncate" title={String(item.name)}>
                {String(item.name).substring(0, 25)}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatChartValue(value, config.valueFormat)}
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// OTHER CHART COMPONENTS
// =============================================================================

function GaugeChart({ value, config }: { value: number; config: KPIConfig }) {
  const percentage = Math.min(100, Math.max(0, value));
  
  let color = CHART_COLORS[4]; // Blue
  if (config.thresholds) {
    if (config.thresholds.critical && percentage >= config.thresholds.critical) {
      color = CHART_COLORS[3]; // Red
    } else if (config.thresholds.warning && percentage >= config.thresholds.warning) {
      color = CHART_COLORS[2]; // Amber
    } else if (config.thresholds.target && percentage >= config.thresholds.target) {
      color = CHART_COLORS[1]; // Green
    }
  }

  return (
    <div className="flex flex-col items-center py-4">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="80" cy="80" r="70" fill="none" stroke="#e5e7eb" strokeWidth="12" />
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${(percentage / 100) * 440} 440`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>
            {formatChartValue(percentage, config.valueFormat)}
          </span>
          {config.valueFormat?.suffix && (
            <span className="text-sm text-gray-500">{config.valueFormat.suffix}</span>
          )}
        </div>
      </div>
      
      {config.thresholds?.target && (
        <div className="mt-4 text-sm text-gray-600">
          Objectif: {config.thresholds.target}%
        </div>
      )}
    </div>
  );
}

function ProgressBarChart({ value, config }: { value: number; config: KPIConfig }) {
  const percentage = Math.min(100, Math.max(0, value));
  
  let barColor = CHART_COLORS[4];
  if (config.thresholds) {
    if (config.thresholds.critical && percentage >= config.thresholds.critical) {
      barColor = CHART_COLORS[3];
    } else if (config.thresholds.warning && percentage >= config.thresholds.warning) {
      barColor = CHART_COLORS[2];
    } else if (config.thresholds.target && percentage >= config.thresholds.target) {
      barColor = CHART_COLORS[1];
    }
  }

  return (
    <div className="space-y-3 py-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-500">{config.description}</span>
        <span className="font-bold text-lg" style={{ color: barColor }}>
          {formatChartValue(percentage, config.valueFormat)}
        </span>
      </div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: barColor }}
        />
      </div>
      {config.thresholds?.target && (
        <div className="flex justify-between text-xs text-gray-400">
          <span>0%</span>
          <span className="text-green-600 font-medium">Objectif: {config.thresholds.target}%</span>
          <span>100%</span>
        </div>
      )}
    </div>
  );
}

function TableChart({ data, config }: { data: ChartDataItem[]; config: KPIConfig }) {
  if (!data.length) return null;
  
  const columns = Object.keys(data[0]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50 dark:bg-gray-800">
            {columns.map((col) => (
              <th key={col} className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-200">
                {formatKPIName(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 10).map((row, i) => (
            <tr key={i} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
              {columns.map((col) => (
                <td key={col} className="py-2 px-3 text-gray-600 dark:text-gray-300">
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
// HELPER FUNCTIONS
// =============================================================================

function transformDataForChart(config: KPIConfig, rawData: Record<string, unknown>[]): ChartDataItem[] {
  if (!rawData || rawData.length === 0) return [];

  const { columns, aggregation, chartType } = config;
  const availableCols = Object.keys(rawData[0] || {});

  const numericPriority = ['value', 'valeur', 'amount', 'montant', 'total', 'count', 'nombre', 'number'];
  const categoryPriority = ['country', 'pays', 'region', 'région', 'category', 'catégorie', 'type', 'indicator', 'name', 'nom'];

  // Find Y column (numeric)
  let yCol = '';
  if (columns.y && availableCols.includes(columns.y)) {
    yCol = columns.y;
  } else if (columns.y) {
    const match = availableCols.find(c => c.toLowerCase() === columns.y!.toLowerCase());
    if (match) yCol = match;
  }
  if (!yCol) {
    for (const p of numericPriority) {
      const found = availableCols.find(c => c.toLowerCase() === p);
      if (found) { yCol = found; break; }
    }
  }
  if (!yCol) {
    for (const col of availableCols) {
      const sampleVal = rawData[0][col];
      if (typeof sampleVal === 'number') { yCol = col; break; }
    }
  }

  // Find X column (categorical)
  let xCol = '';
  if (columns.x && availableCols.includes(columns.x)) {
    xCol = columns.x;
  } else if (columns.x) {
    const match = availableCols.find(c => c.toLowerCase() === columns.x!.toLowerCase());
    if (match) xCol = match;
  }
  if (!xCol && chartType !== 'kpi' && chartType !== 'metric') {
    for (const p of categoryPriority) {
      const found = availableCols.find(c => c.toLowerCase().includes(p));
      if (found) { xCol = found; break; }
    }
  }
  if (!xCol && chartType !== 'kpi' && chartType !== 'metric') {
    xCol = availableCols.find(col => typeof rawData[0][col] === 'string') || availableCols[0] || '';
  }

  if (!yCol) return [];

  const extractNumber = (val: unknown): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (typeof val === 'string') {
      const cleaned = val.replace(/[^\d.-]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  // Group and aggregate
  const grouped = new Map<string, number[]>();
  
  rawData.forEach((row) => {
    const key = String(row[xCol] || 'Autre');
    const value = extractNumber(row[yCol]);
    
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(value);
  });

  return Array.from(grouped.entries())
    .map(([key, values]) => ({
      name: key,
      [yCol]: applyAggregation(values, aggregation),
      value: applyAggregation(values, aggregation),
    }))
    .sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))
    .slice(0, 20);
}

function calculateAggregation(data: Record<string, unknown>[], config: KPIConfig): number {
  if (!data || data.length === 0) return 0;

  const availableCols = Object.keys(data[0] || {});
  const numericPriority = ['value', 'valeur', 'amount', 'montant', 'total', 'count', 'nombre'];

  let yCol = '';
  if (config.columns.y && availableCols.includes(config.columns.y)) {
    yCol = config.columns.y;
  }
  if (!yCol) {
    for (const p of numericPriority) {
      const found = availableCols.find(c => c.toLowerCase() === p);
      if (found) { yCol = found; break; }
    }
  }
  if (!yCol) {
    for (const col of availableCols) {
      if (typeof data[0][col] === 'number') { yCol = col; break; }
    }
  }
  if (!yCol) return 0;

  const values = data
    .map(row => {
      const val = row[yCol];
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const num = parseFloat(val.replace(/[^\d.-]/g, ''));
        return isNaN(num) ? null : num;
      }
      return null;
    })
    .filter((v): v is number => v !== null);

  return applyAggregation(values, config.aggregation);
}

function applyAggregation(values: number[], aggregation?: string): number {
  if (!values.length) return 0;
  
  switch (aggregation) {
    case 'avg': return values.reduce((a, b) => a + b, 0) / values.length;
    case 'count': return values.length;
    case 'min': return Math.min(...values);
    case 'max': return Math.max(...values);
    case 'countDistinct': return new Set(values).size;
    default: return values.reduce((a, b) => a + b, 0);
  }
}

function formatChartValue(value: number, format?: { prefix?: string; suffix?: string; decimals?: number; compact?: boolean }): string {
  const { prefix = '', suffix = '', decimals = 0, compact = false } = format || {};
  
  let formattedNumber: string;
  
  if (compact && Math.abs(value) >= 1000000) {
    formattedNumber = (value / 1000000).toFixed(1) + 'M';
  } else if (compact && Math.abs(value) >= 1000) {
    formattedNumber = (value / 1000).toFixed(1) + 'k';
  } else {
    formattedNumber = value.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  return `${prefix}${formattedNumber}${suffix}`;
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') return value.toLocaleString('fr-FR');
  return String(value);
}

export default ChartRenderer;
