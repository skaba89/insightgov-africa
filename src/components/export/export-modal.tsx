/**
 * InsightGov Africa - Export Modal Component
 * ===========================================
 * Modal pour exporter le dashboard en différents formats.
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import {
  FileText,
  FileSpreadsheet,
  Presentation,
  Download,
  Loader2,
  Check,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardConfig } from '@/types';

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: DashboardConfig;
  organizationName?: string;
  subscriptionTier?: string;
}

type ExportFormat = 'pdf' | 'excel' | 'pptx';

interface ExportOption {
  id: ExportFormat;
  name: string;
  description: string;
  icon: React.ElementType;
  premium: boolean;
  available: boolean;
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    id: 'pdf',
    name: 'PDF Report',
    description: 'Rapport professionnel avec résumé exécutif et graphiques',
    icon: FileText,
    premium: false,
    available: true,
  },
  {
    id: 'excel',
    name: 'Excel / CSV',
    description: 'Données brutes avec calculs et tableaux croisés dynamiques',
    icon: FileSpreadsheet,
    premium: true,
    available: true,
  },
  {
    id: 'pptx',
    name: 'PowerPoint',
    description: 'Présentation avec slides pour réunions et comités',
    icon: Presentation,
    premium: true,
    available: false,
  },
];

export function ExportModal({
  open,
  onOpenChange,
  config,
  organizationName = 'Organisation',
  subscriptionTier = 'free',
}: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [options, setOptions] = useState({
    includeExecutiveSummary: true,
    includeCharts: true,
    includeRawData: false,
    includeRecommendations: true,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Vérifier si le format est premium et si l'utilisateur a le bon plan
  const isPremiumPlan = subscriptionTier === 'professional' || subscriptionTier === 'enterprise';
  const canExport = (format: ExportFormat) => {
    const option = EXPORT_OPTIONS.find((o) => o.id === format);
    return option?.available && (!option.premium || isPremiumPlan);
  };

  // Handler pour l'export
  const handleExport = async () => {
    if (!canExport(selectedFormat)) {
      alert('Ce format nécessite un abonnement Professional ou Enterprise.');
      return;
    }

    setIsExporting(true);
    setExportSuccess(false);

    try {
      if (selectedFormat === 'pdf') {
        await exportPDF();
      } else if (selectedFormat === 'excel') {
        await exportExcel();
      } else if (selectedFormat === 'pptx') {
        await exportPPTX();
      }

      setExportSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        setExportSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Erreur export:', error);
      alert('Erreur lors de l\'export. Veuillez réessayer.');
    } finally {
      setIsExporting(false);
    }
  };

  // Export PDF
  const exportPDF = async () => {
    const response = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config,
        organizationName,
        options: {
          includeExecutiveSummary: options.includeExecutiveSummary,
          includeCharts: options.includeCharts,
          includeRecommendations: options.includeRecommendations,
        },
      }),
    });

    if (!response.ok) throw new Error('Erreur génération PDF');

    const blob = await response.blob();
    downloadBlob(blob, `rapport-${Date.now()}.pdf`);
  };

  // Export Excel
  const exportExcel = async () => {
    const response = await fetch('/api/export/excel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        config,
        organizationName,
        options: {
          includeRawData: options.includeRawData,
          includeCharts: options.includeCharts,
        },
      }),
    });

    if (!response.ok) throw new Error('Erreur génération Excel');

    const blob = await response.blob();
    downloadBlob(blob, `donnees-${Date.now()}.xlsx`);
  };

  // Export PowerPoint (placeholder)
  const exportPPTX = async () => {
    alert('Export PowerPoint en cours de développement');
  };

  // Télécharger un blob
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Aperçu du rapport
  const previewStats = {
    kpisCount: config.kpis.length,
    keyMetricsCount: config.kpis.filter((k) => k.isKeyMetric).length,
    insightsCount: config.keyInsights?.length || 0,
    recommendationsCount: config.recommendations?.length || 0,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Exporter le Dashboard
          </DialogTitle>
          <DialogDescription>
            Choisissez le format d'export et les options de votre rapport.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Format d'export</Label>
            <RadioGroup
              value={selectedFormat}
              onValueChange={(value) => setSelectedFormat(value as ExportFormat)}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              {EXPORT_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isAvailable = canExport(option.id);
                const isSelected = selectedFormat === option.id;

                return (
                  <div
                    key={option.id}
                    className={cn(
                      'relative cursor-pointer',
                      !isAvailable && 'opacity-60'
                    )}
                  >
                    <RadioGroupItem
                      value={option.id}
                      id={option.id}
                      className="sr-only"
                      disabled={!isAvailable}
                    />
                    <Label
                      htmlFor={option.id}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300',
                        !isAvailable && 'cursor-not-allowed'
                      )}
                    >
                      <div
                        className={cn(
                          'p-2 rounded-full',
                          isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-sm">{option.name}</p>
                        <p className="text-xs text-gray-500 mt-1 hidden sm:block">
                          {option.description}
                        </p>
                      </div>
                      {option.premium && !isPremiumPlan && (
                        <div className="absolute top-2 right-2">
                          <Lock className="w-4 h-4 text-amber-500" />
                        </div>
                      )}
                      {!option.available && (
                        <span className="text-xs text-gray-400">(Bientôt)</span>
                      )}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Options */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Options d'inclusion</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="execSummary"
                  checked={options.includeExecutiveSummary}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeExecutiveSummary: !!checked })
                  }
                />
                <Label htmlFor="execSummary" className="text-sm cursor-pointer">
                  Résumé exécutif
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="charts"
                  checked={options.includeCharts}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeCharts: !!checked })
                  }
                />
                <Label htmlFor="charts" className="text-sm cursor-pointer">
                  Graphiques et visualisations
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recommendations"
                  checked={options.includeRecommendations}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeRecommendations: !!checked })
                  }
                />
                <Label htmlFor="recommendations" className="text-sm cursor-pointer">
                  Recommandations
                </Label>
              </div>
              {selectedFormat === 'excel' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rawData"
                    checked={options.includeRawData}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, includeRawData: !!checked })
                    }
                  />
                  <Label htmlFor="rawData" className="text-sm cursor-pointer">
                    Données brutes (feuille séparée)
                  </Label>
                </div>
              )}
            </div>
          </div>

          {/* Preview Stats */}
          <Card className="bg-gray-50 dark:bg-gray-800/50">
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-3">Aperçu du contenu</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-primary">{previewStats.kpisCount}</p>
                  <p className="text-xs text-gray-500">KPIs</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{previewStats.keyMetricsCount}</p>
                  <p className="text-xs text-gray-500">Indicateurs clés</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{previewStats.insightsCount}</p>
                  <p className="text-xs text-gray-500">Insights</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{previewStats.recommendationsCount}</p>
                  <p className="text-xs text-gray-500">Recommandations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Export en cours...
              </>
            ) : exportSuccess ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Export réussi!
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ExportModal;
