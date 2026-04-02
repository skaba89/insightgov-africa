'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, Info, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

// Dictionnaire étendu pour la traduction des noms de KPI
const KPI_TRANSLATIONS: Record<string, string> = {
  // Santé
  'patients': 'Patients',
  'consultations': 'Consultations',
  'hospitalisations': 'Hospitalisations',
  'vaccinations': 'Vaccinations',
  'deces': 'Décès',
  'mortalite': 'Mortalité',
  'mortality': 'Mortalité',
  'mortality_rate': 'Taux de mortalité',
  'accouchements': 'Accouchements',
  'naissances': 'Naissances',
  'couverture': 'Couverture',
  'coverage': 'Couverture',
  'vaccination_coverage': 'Couverture vaccinale',
  'consultation_count': 'Nombre de consultations',
  'patient_count': 'Nombre de patients',
  'hospital_beds': 'Lits d\'hôpital',
  'doctors': 'Médecins',
  'nurses': 'Infirmiers',
  'health_centers': 'Centres de santé',
  
  // Finance
  'budget': 'Budget',
  'montant': 'Montant',
  'cout': 'Coût',
  'cost': 'Coût',
  'revenus': 'Revenus',
  'revenue': 'Revenus',
  'depenses': 'Dépenses',
  'expenses': 'Dépenses',
  'profit': 'Profit',
  'loss': 'Perte',
  'investment': 'Investissement',
  'funding': 'Financement',
  'grants': 'Subventions',
  
  // Général
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
  'difference': 'Différence',
  'growth': 'Croissance',
  'progress': 'Progression',
  
  // Éducation
  'eleves': 'Élèves',
  'students': 'Élèves',
  'enseignants': 'Enseignants',
  'teachers': 'Enseignants',
  'ecoles': 'Écoles',
  'schools': 'Écoles',
  'classrooms': 'Salles de classe',
  'enrollment': 'Inscriptions',
  'graduation': 'Diplômés',
  'literacy': 'Alphabétisation',
  
  // Agriculture
  'production': 'Production',
  'recolte': 'Récolte',
  'harvest': 'Récolte',
  'superficie': 'Superficie',
  'area': 'Superficie',
  'yield': 'Rendement',
  'crops': 'Cultures',
  'livestock': 'Élevage',
  
  // Géographie
  'region': 'Région',
  'district': 'District',
  'country': 'Pays',
  'city': 'Ville',
  'village': 'Village',
  
  // Temps
  'year': 'Année',
  'month': 'Mois',
  'quarter': 'Trimestre',
  'week': 'Semaine',
  'day': 'Jour',
};

// Formater un nom de KPI en français
function formatKPIName(name: string): string {
  // Nettoyer le nom
  let cleanName = name
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .toLowerCase();
  
  // Chercher dans le dictionnaire (correspondance exacte ou partielle)
  if (KPI_TRANSLATIONS[cleanName]) {
    return KPI_TRANSLATIONS[cleanName];
  }
  
  // Chercher une correspondance partielle
  for (const [key, value] of Object.entries(KPI_TRANSLATIONS)) {
    if (cleanName.includes(key) || key.includes(cleanName)) {
      return value;
    }
  }
  
  // Capitaliser chaque mot si pas trouvé
  return cleanName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Statuts avec descriptions en français
const STATUS_INFO = {
  success: { label: 'Bon', color: 'Vert', description: 'Objectif atteint ou dépassé' },
  warning: { label: 'Attention', color: 'Orange', description: 'Proche du seuil d\'alerte' },
  danger: { label: 'Critique', color: 'Rouge', description: 'Seuil critique dépassé' },
  neutral: { label: 'Neutre', color: 'Bleu', description: 'En cours de suivi' },
};

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
  const [showInfo, setShowInfo] = useState(false);
  
  const formattedValue = formatValue(value, format);
  const displayTitle = formatKPIName(title);
  const statusInfo = STATUS_INFO[status];

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.value > 0) return <TrendingUp className="w-4 h-4" />;
    if (trend.value < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (!trend) return 'text-gray-600';
    if (trend.value > 0) return 'text-emerald-700';
    if (trend.value < 0) return 'text-red-700';
    return 'text-gray-600';
  };

  // Couleurs de fond plus visibles
  const statusStyles = {
    success: {
      card: 'bg-gradient-to-br from-emerald-100 via-emerald-50 to-white dark:from-emerald-900/40 dark:to-gray-900 border-l-4 border-l-emerald-600',
      badge: 'bg-emerald-600 text-white',
      progress: 'bg-gradient-to-r from-emerald-600 to-teal-500',
      icon: 'text-emerald-600',
    },
    warning: {
      card: 'bg-gradient-to-br from-amber-100 via-amber-50 to-white dark:from-amber-900/40 dark:to-gray-900 border-l-4 border-l-amber-600',
      badge: 'bg-amber-600 text-white',
      progress: 'bg-gradient-to-r from-amber-600 to-orange-500',
      icon: 'text-amber-600',
    },
    danger: {
      card: 'bg-gradient-to-br from-red-100 via-red-50 to-white dark:from-red-900/40 dark:to-gray-900 border-l-4 border-l-red-600',
      badge: 'bg-red-600 text-white',
      progress: 'bg-gradient-to-r from-red-600 to-pink-500',
      icon: 'text-red-600',
    },
    neutral: {
      card: 'bg-gradient-to-br from-blue-100 via-blue-50 to-white dark:from-blue-900/40 dark:to-gray-900 border-l-4 border-l-blue-600',
      badge: 'bg-blue-600 text-white',
      progress: 'bg-gradient-to-r from-blue-600 to-indigo-500',
      icon: 'text-blue-600',
    },
  };

  const styles = statusStyles[status];
  const sizeClasses = { sm: 'p-3', md: 'p-4', lg: 'p-5' };
  const valueSizeClasses = { sm: 'text-xl', md: 'text-2xl', lg: 'text-3xl' };

  return (
    <Card 
      className={cn(
        'relative overflow-hidden transition-all duration-300 shadow-md hover:shadow-xl',
        styles.card,
        isKeyMetric && 'ring-2 ring-amber-400 ring-offset-2'
      )}
    >
      {/* Badge indicateur de statut */}
      <div className="absolute top-2 left-2">
        <Badge className={cn('text-xs px-2 py-0.5 font-medium', styles.badge)}>
          {statusInfo.label}
        </Badge>
      </div>

      {/* Badge clé si métrique importante */}
      {isKeyMetric && (
        <div className="absolute top-2 right-2">
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-2 py-0.5 font-bold shadow">
            ⭐ CLÉ
          </Badge>
        </div>
      )}

      {/* Bouton info toujours visible */}
      {(description || statusInfo) && (
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-md hover:scale-110 transition-transform z-10"
          title="Afficher les informations"
        >
          <HelpCircle className={cn('w-4 h-4', styles.icon)} />
        </button>
      )}

      <CardHeader className={cn('pb-1 pt-10', sizeClasses[size])}>
        <CardTitle className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-wide uppercase">
          {displayTitle}
        </CardTitle>
      </CardHeader>

      <CardContent className={cn('pt-0', sizeClasses[size])}>
        {/* Valeur principale */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className={cn(
            'font-black tracking-tight text-gray-900 dark:text-white',
            valueSizeClasses[size]
          )}>
            {formattedValue}
          </span>
          {format?.suffix && (
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {format.suffix}
            </span>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
            {description}
          </p>
        )}

        {/* Tendance */}
        {trend && (
          <div className="flex items-center gap-2 mt-2">
            <div className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-semibold',
              trend.value > 0 ? 'bg-emerald-200/70 text-emerald-800' : 
              trend.value < 0 ? 'bg-red-200/70 text-red-800' : 
              'bg-gray-200/70 text-gray-700'
            )}>
              {getTrendIcon()}
              <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
            </div>
            {trend.label && (
              <span className="text-xs text-gray-500">{trend.label}</span>
            )}
          </div>
        )}

        {/* Barre de progression pour les pourcentages */}
        {typeof value === 'number' && value > 0 && value <= 100 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>0%</span>
              <span className="font-medium">{Number(value).toFixed(0)}%</span>
              <span>100%</span>
            </div>
            <div className="h-2.5 bg-gray-300/50 dark:bg-gray-600/50 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-700', styles.progress)}
                style={{ width: `${Math.min(100, Number(value))}%` }}
              />
            </div>
          </div>
        )}

        {/* Panneau d'information */}
        {showInfo && (
          <div className="absolute inset-x-3 bottom-3 p-3 bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20 backdrop-blur-sm">
            <div className="flex items-start gap-2">
              <Info className={cn('w-4 h-4 mt-0.5 shrink-0', styles.icon)} />
              <div className="text-xs text-gray-700 dark:text-gray-200">
                <p className="font-semibold mb-1">{displayTitle}</p>
                {description && <p className="mb-1">{description}</p>}
                <p className="text-gray-500">
                  Statut: <span className="font-medium">{statusInfo.label}</span> ({statusInfo.description})
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MetricDisplay({ 
  value, 
  format, 
  trend, 
  className 
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
        <span className={cn(
          'flex items-center text-sm font-semibold gap-1',
          trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
        )}>
          {trend > 0 ? <ArrowUpRight className="w-4 h-4" /> : trend < 0 ? <ArrowDownRight className="w-4 h-4" /> : null}
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
  );
}

function formatValue(value: number | string, format?: KPICardProps['format']): string {
  if (typeof value === 'string') return value;

  const { prefix = '', suffix = '', decimals = 0, compact = false } = format || {};
  let formattedNumber: string;

  if (compact && Math.abs(value) >= 1000000) {
    formattedNumber = (value / 1000000).toFixed(1) + 'M';
  } else if (compact && Math.abs(value) >= 1000) {
    formattedNumber = (value / 1000).toFixed(1) + 'k';
  } else {
    formattedNumber = value.toLocaleString('fr-FR', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  }

  return `${prefix}${formattedNumber}${suffix}`;
}

export default KPICard;
