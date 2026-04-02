/**
 * InsightGov Africa - Data Preview Component
 * ===========================================
 * Prévisualisation des données uploadées avec métadonnées des colonnes.
 */

'use client';

import { useState } from 'react';
import { useOnboardingStore } from '@/stores/onboarding-store';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Database,
  Hash,
  Type,
  Calendar,
  MapPin,
  DollarSign,
  Percent,
  ToggleLeft,
  Tag,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ColumnMetadata, DataType } from '@/types';

// Icônes par type de données
const DATA_TYPE_ICONS: Record<DataType, React.ComponentType<{ className?: string }>> = {
  numeric: Hash,
  currency: DollarSign,
  percentage: Percent,
  date: Calendar,
  datetime: Calendar,
  text: Type,
  category: Tag,
  boolean: ToggleLeft,
  id: Hash,
  geo: MapPin,
  unknown: BarChart3,
};

// Couleurs par type
const DATA_TYPE_COLORS: Record<DataType, string> = {
  numeric: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  currency: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  percentage: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  date: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  datetime: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  text: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  category: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
  boolean: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
  id: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300',
  geo: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  unknown: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

// Labels par type
const DATA_TYPE_LABELS: Record<DataType, string> = {
  numeric: 'Numérique',
  currency: 'Devise',
  percentage: 'Pourcentage',
  date: 'Date',
  datetime: 'Date/Heure',
  text: 'Texte',
  category: 'Catégorie',
  boolean: 'Booléen',
  id: 'ID',
  geo: 'Géographique',
  unknown: 'Inconnu',
};

interface DataPreviewProps {
  maxRows?: number;
}

export function DataPreview({ maxRows = 10 }: DataPreviewProps) {
  const dataset = useOnboardingStore((state) => state.dataset);
  const columnsMetadata = useOnboardingStore((state) => state.columnsMetadata);
  const dataPreview = useOnboardingStore((state) => state.dataPreview);

  if (!dataset || !columnsMetadata.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Database className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          Aucune donnée à prévisualiser
        </p>
      </div>
    );
  }

  const displayData = dataPreview.slice(0, maxRows);

  return (
    <div className="space-y-4">
      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Lignes"
          value={dataset.rowCount.toLocaleString()}
          icon={Database}
        />
        <StatCard
          label="Colonnes"
          value={dataset.columnCount.toString()}
          icon={BarChart3}
        />
        <StatCard
          label="Taille"
          value={formatFileSize(dataset.fileSize)}
          icon={Database}
        />
        <StatCard
          label="Qualité"
          value={`${Math.round(calculateOverallQuality(columnsMetadata))}%`}
          icon={CheckCircle2}
          valueClassName={
            calculateOverallQuality(columnsMetadata) >= 80
              ? 'text-green-600'
              : 'text-amber-600'
          }
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="data" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="data">Données</TabsTrigger>
          <TabsTrigger value="columns">Colonnes ({columnsMetadata.length})</TabsTrigger>
        </TabsList>

        {/* Tab Données */}
        <TabsContent value="data" className="mt-4">
          <div className="rounded-lg border overflow-hidden">
            <ScrollArea className="w-full">
              <div className="min-w-max">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columnsMetadata.map((col) => (
                        <TableHead
                          key={col.cleanName}
                          className="font-semibold whitespace-nowrap"
                        >
                          <div className="flex items-center gap-2">
                            {col.originalName}
                            <DataTypeBadge type={col.dataType} />
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayData.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {columnsMetadata.map((col) => (
                          <TableCell
                            key={col.cleanName}
                            className="whitespace-nowrap max-w-[200px] truncate"
                          >
                            {formatCellValue(row[col.cleanName])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {dataPreview.length > maxRows && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              Affichage des {maxRows} premières lignes sur {dataPreview.length}
            </p>
          )}
        </TabsContent>

        {/* Tab Colonnes */}
        <TabsContent value="columns" className="mt-4">
          <div className="rounded-lg border divide-y">
            {columnsMetadata.map((col) => (
              <ColumnMetadataCard key={col.cleanName} column={col} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Composant carte stat
function StatCard({
  label,
  value,
  icon: Icon,
  valueClassName,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  valueClassName?: string;
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
      <div className="flex items-center gap-2 text-gray-500 mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-sm">{label}</span>
      </div>
      <p className={cn('text-2xl font-bold', valueClassName)}>{value}</p>
    </div>
  );
}

// Badge type de données
function DataTypeBadge({ type }: { type: DataType }) {
  const Icon = DATA_TYPE_ICONS[type];
  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-normal', DATA_TYPE_COLORS[type])}
    >
      <Icon className="w-3 h-3 mr-1" />
      {DATA_TYPE_LABELS[type]}
    </Badge>
  );
}

// Carte métadonnées colonne
function ColumnMetadataCard({ column }: { column: ColumnMetadata }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = DATA_TYPE_ICONS[column.dataType];

  return (
    <div className="p-4">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'p-2 rounded-lg',
              DATA_TYPE_COLORS[column.dataType]
            )}
          >
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {column.originalName}
            </p>
            <p className="text-sm text-gray-500">
              {DATA_TYPE_LABELS[column.dataType]}
              {column.unit && ` • ${column.unit}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Qualité */}
          <div className="flex items-center gap-2">
            {column.qualityScore >= 90 ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            ) : column.qualityScore >= 70 ? (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm text-gray-500">{column.qualityScore}%</span>
          </div>
          {/* Flèche */}
          <svg
            className={cn(
              'w-4 h-4 text-gray-400 transition-transform',
              expanded && 'rotate-180'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Détails */}
      {expanded && (
        <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Statistiques */}
          {column.statistics && (
            <>
              {column.statistics.min !== undefined && (
                <div>
                  <p className="text-xs text-gray-500">Min</p>
                  <p className="font-medium">{formatNumber(column.statistics.min)}</p>
                </div>
              )}
              {column.statistics.max !== undefined && (
                <div>
                  <p className="text-xs text-gray-500">Max</p>
                  <p className="font-medium">{formatNumber(column.statistics.max)}</p>
                </div>
              )}
              {column.statistics.mean !== undefined && (
                <div>
                  <p className="text-xs text-gray-500">Moyenne</p>
                  <p className="font-medium">{formatNumber(column.statistics.mean)}</p>
                </div>
              )}
              {column.statistics.sum !== undefined && (
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="font-medium">{formatNumber(column.statistics.sum)}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500">Valeurs</p>
                <p className="font-medium">{column.statistics.count.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Valeurs nulles</p>
                <p className="font-medium">{column.statistics.nullCount.toLocaleString()}</p>
              </div>
              {column.statistics.uniqueCount !== undefined && (
                <div>
                  <p className="text-xs text-gray-500">Valeurs uniques</p>
                  <p className="font-medium">{column.statistics.uniqueCount.toLocaleString()}</p>
                </div>
              )}
            </>
          )}

          {/* Exemples */}
          <div className="col-span-2 md:col-span-4">
            <p className="text-xs text-gray-500 mb-2">Exemples</p>
            <div className="flex flex-wrap gap-2">
              {column.sampleValues.slice(0, 5).map((val, i) => (
                <span
                  key={i}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded"
                >
                  {String(val)}
                </span>
              ))}
            </div>
          </div>

          {/* Valeurs uniques (catégories) */}
          {column.uniqueValues && column.uniqueValues.length > 0 && (
            <div className="col-span-2 md:col-span-4">
              <p className="text-xs text-gray-500 mb-2">Valeurs uniques</p>
              <div className="flex flex-wrap gap-2">
                {column.uniqueValues.slice(0, 10).map((val, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {val}
                  </Badge>
                ))}
                {column.uniqueValues.length > 10 && (
                  <span className="text-xs text-gray-400">
                    +{column.uniqueValues.length - 10} autres
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helpers
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatNumber(num: number): string {
  if (Math.abs(num) >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(num) >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toFixed(num % 1 === 0 ? 0 : 2);
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (typeof value === 'number') return value.toLocaleString('fr-FR');
  return String(value);
}

function calculateOverallQuality(columns: ColumnMetadata[]): number {
  if (columns.length === 0) return 0;
  const total = columns.reduce((sum, col) => sum + col.qualityScore, 0);
  return total / columns.length;
}

export default DataPreview;
