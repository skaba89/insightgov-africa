/**
 * InsightGov Africa - KPI Card Component
 * =======================================
 * Composant pour afficher une métrique clé avec tendance.
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: number | string;
  description?: string;
  trend?: {
    value: number;
    label?: string;
  };
  format?: {
    prefix?: string;
    suffix?: string;
    decimals?: number;
    compact?: boolean;
  };
  status?: 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  isKeyMetric?: boolean;
}

export function KPICard({
  title,
  value,
  description,
  trend,
  format,
  status = 'neutral',
  size = 'md',
  isKeyMetric = false,
}: KPICardProps) {
  // Formater la valeur
  const formattedValue = formatValue(value, format);

  // Déterminer la tendance
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="w-4 h-4" />;
    if (trend.value < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (!trend) return 'text-gray-500';
    // Pour certains KPIs, une baisse est positive (ex: mortalité)
    if (trend.value > 0) return 'text-green-500';
    if (trend.value < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  // Couleur selon le statut - Modern palette
  const statusColors = {
    success: 'border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50',
    warning: 'border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50',
    danger: 'border-rose-200 dark:border-rose-800 bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-950/50 dark:to-red-950/50',
    neutral: 'border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800',
  };

  // Taille du composant
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const valueSizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  };

  // Modern accent bar colors
  const accentColors = {
    success: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    warning: 'bg-gradient-to-r from-amber-500 to-orange-500',
    danger: 'bg-gradient-to-r from-rose-500 to-red-500',
    neutral: 'bg-gradient-to-r from-violet-500 to-purple-500',
  };

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-200',
        statusColors[status],
        isKeyMetric && 'ring-2 ring-primary/20'
      )}
    >
      {isKeyMetric && (
        <div className="absolute top-2 right-2">
          <Badge variant="default" className="text-xs">
            Key
          </Badge>
        </div>
      )}

      <CardHeader className={cn('pb-2', sizeClasses[size])}>
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className={sizeClasses[size]}>
        {/* Valeur principale */}
        <div className={cn('font-bold text-gray-900 dark:text-white', valueSizeClasses[size])}>
          {formattedValue}
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}

        {/* Tendance */}
        {trend && (
          <div className={cn('flex items-center gap-1 mt-2', getTrendColor())}>
            {getTrendIcon()}
            <span className="text-sm font-medium">
              {Math.abs(trend.value)}%
            </span>
            {trend.label && (
              <span className="text-sm text-gray-500 ml-1">
                {trend.label}
              </span>
            )}
          </div>
        )}

        {/* Barre de progression si seuil */}
        {status !== 'neutral' && typeof value === 'number' && (
          <div className="mt-4">
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  accentColors[status]
                )}
                style={{ width: `${Math.min(100, Number(value))}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Composant métrique simple (sans card)
export function MetricDisplay({
  value,
  format,
  trend,
  className,
}: {
  value: number | string;
  format?: KPICardProps['format'];
  trend?: number;
  className?: string;
}) {
  const formattedValue = formatValue(value, format);

  return (
    <div className={cn('flex items-baseline gap-2', className)}>
      <span className="text-2xl font-bold text-gray-900 dark:text-white">
        {formattedValue}
      </span>
      {trend !== undefined && (
        <span
          className={cn(
            'flex items-center text-sm font-medium',
            trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-gray-500'
          )}
        >
          {trend > 0 ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : trend < 0 ? (
            <ArrowDownRight className="w-4 h-4" />
          ) : null}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
  );
}

// Helper pour formater la valeur
function formatValue(
  value: number | string,
  format?: KPICardProps['format']
): string {
  if (typeof value === 'string') return value;

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

export default KPICard;
