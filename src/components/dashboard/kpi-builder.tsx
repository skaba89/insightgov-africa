/**
 * InsightGov Africa - KPI Builder Component
 * ==========================================
 * Composant pour créer et personnaliser des KPIs
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, BarChart3, LineChart, PieChart, Gauge, Table, Hash } from 'lucide-react';
import type { KPIConfig, ColumnMetadata } from '@/types';

interface KPIBuilderProps {
  columnsMetadata: ColumnMetadata[];
  data: Record<string, unknown>[];
  onAddKPI: (kpi: KPIConfig) => void;
  existingKPIs: KPIConfig[];
}

const CHART_TYPES = [
  { value: 'kpi', label: 'Carte KPI', icon: Hash, description: 'Affiche une valeur unique' },
  { value: 'bar', label: 'Barres', icon: BarChart3, description: 'Comparaisons entre catégories' },
  { value: 'line', label: 'Ligne', icon: LineChart, description: 'Évolution temporelle' },
  { value: 'donut', label: 'Donut', icon: PieChart, description: 'Répartition en pourcentage' },
  { value: 'gauge', label: 'Jauge', icon: Gauge, description: 'Progression vers un objectif' },
  { value: 'table', label: 'Tableau', icon: Table, description: 'Données détaillées' },
];

const AGGREGATION_TYPES = [
  { value: 'sum', label: 'Somme' },
  { value: 'avg', label: 'Moyenne' },
  { value: 'count', label: 'Comptage' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
];

export function KPIBuilder({ columnsMetadata, data, onAddKPI, existingKPIs }: KPIBuilderProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [chartType, setChartType] = useState<KPIConfig['chartType']>('bar');
  const [columnX, setColumnX] = useState('');
  const [columnY, setColumnY] = useState('');
  const [aggregation, setAggregation] = useState<KPIConfig['aggregation']>('sum');
  const [isKeyMetric, setIsKeyMetric] = useState(false);

  // Colonnes disponibles par type
  const numericColumns = columnsMetadata.filter(
    c => c.dataType === 'numeric' || c.dataType === 'currency' || c.dataType === 'percentage'
  );
  const categoryColumns = columnsMetadata.filter(c => c.dataType === 'category');
  const dateColumns = columnsMetadata.filter(c => c.dataType === 'date' || c.dataType === 'datetime');
  const allColumns = columnsMetadata;

  // Colonnes pour l'axe X (catégories, dates)
  const xColumns = [...categoryColumns, ...dateColumns];

  // Colonnes pour l'axe Y (valeurs numériques)
  const yColumns = numericColumns;

  const handleAddKPI = () => {
    if (!title) return;

    const newKPI: KPIConfig = {
      id: `kpi_custom_${Date.now()}`,
      title,
      description,
      chartType,
      columns: {
        x: columnX || undefined,
        y: columnY || (numericColumns.length > 0 ? numericColumns[0].cleanName : undefined),
      },
      aggregation,
      colors: ['violet', 'cyan', 'emerald', 'amber', 'rose'],
      order: existingKPIs.length + 1,
      size: { cols: chartType === 'kpi' ? 3 : 6, rows: chartType === 'kpi' ? 1 : 2 },
      isKeyMetric,
    };

    onAddKPI(newKPI);

    // Reset form
    setTitle('');
    setDescription('');
    setChartType('bar');
    setColumnX('');
    setColumnY('');
    setAggregation('sum');
    setIsKeyMetric(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un KPI
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer un nouveau KPI</DialogTitle>
          <DialogDescription>
            Configurez un nouvel indicateur pour votre dashboard
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Titre */}
          <div className="grid gap-2">
            <Label htmlFor="title">Titre du KPI</Label>
            <Input
              id="title"
              placeholder="Ex: Ventes mensuelles"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Input
              id="description"
              placeholder="Ex: Total des ventes par mois"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Type de graphique */}
          <div className="grid gap-2">
            <Label>Type de visualisation</Label>
            <div className="grid grid-cols-3 gap-2">
              {CHART_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setChartType(type.value as KPIConfig['chartType'])}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                      chartType === type.value
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/50'
                        : 'border-gray-200 dark:border-gray-700 hover:border-violet-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${chartType === type.value ? 'text-violet-600' : 'text-gray-500'}`} />
                    <span className={`text-xs ${chartType === type.value ? 'text-violet-600 font-medium' : 'text-gray-500'}`}>
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Colonnes */}
          {chartType !== 'kpi' && chartType !== 'gauge' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Axe X (Catégorie)</Label>
                <Select value={columnX} onValueChange={setColumnX}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {xColumns.length > 0 ? (
                      xColumns.map((col) => (
                        <SelectItem key={col.cleanName} value={col.cleanName}>
                          {col.originalName || col.cleanName}
                        </SelectItem>
                      ))
                    ) : (
                      allColumns.map((col) => (
                        <SelectItem key={col.cleanName} value={col.cleanName}>
                          {col.originalName || col.cleanName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Axe Y (Valeur)</Label>
                <Select value={columnY} onValueChange={setColumnY}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {yColumns.map((col) => (
                      <SelectItem key={col.cleanName} value={col.cleanName}>
                        {col.originalName || col.cleanName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Agrégation */}
          <div className="grid gap-2">
            <Label>Type d'agrégation</Label>
            <Select value={aggregation} onValueChange={(v) => setAggregation(v as KPIConfig['aggregation'])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGGREGATION_TYPES.map((agg) => (
                  <SelectItem key={agg.value} value={agg.value}>
                    {agg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* KPI clé */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="keyMetric"
              checked={isKeyMetric}
              onChange={(e) => setIsKeyMetric(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <Label htmlFor="keyMetric" className="font-normal">
              Afficher comme métrique clé (en haut)
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleAddKPI} 
            disabled={!title}
            className="bg-gradient-to-r from-violet-600 to-purple-600"
          >
            Ajouter le KPI
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default KPIBuilder;
