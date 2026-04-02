// ============================================
// InsightGov Africa - Export PDF Amélioré
// Génération de rapports professionnels
// ============================================

'use client';

import React, { useState, useCallback } from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import {
  Download,
  FileText,
  Loader2,
  CheckCircle2,
  FileDown,
  Image,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Kpi, Dataset } from '@/types';
import { formatNumber, formatCurrency, formatDate } from '@/lib/utils';

// ============================================
// ENREGISTREMENT DES POLICES
// ============================================

// Note: En production, on utiliserait des polices locales
// Pour l'instant, on utilise les polices par défaut de react-pdf

// ============================================
// STYLES PDF
// ============================================

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 3,
    borderBottomColor: '#059669',
    paddingBottom: 15,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
  },
  date: {
    fontSize: 10,
    color: '#9ca3af',
  },
  summarySection: {
    backgroundColor: '#f0fdf4',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 15,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 5,
  },
  kpiSection: {
    marginTop: 20,
  },
  kpiTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 15,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
    marginBottom: 10,
  },
  kpiName: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 5,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  kpiUnit: {
    fontSize: 10,
    color: '#6b7280',
  },
  kpiDescription: {
    fontSize: 9,
    color: '#9ca3af',
    marginTop: 5,
  },
  insightSection: {
    backgroundColor: '#fef3c7',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  insightTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 10,
  },
  insightItem: {
    fontSize: 10,
    color: '#78350f',
    marginBottom: 5,
    paddingLeft: 10,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 9,
    color: '#9ca3af',
  },
  footerBrand: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#059669',
    marginTop: 5,
  },
});

// ============================================
// COMPOSANT DOCUMENT PDF
// ============================================

interface ReportDocumentProps {
  dataset: Dataset;
  kpis: Kpi[];
  organization?: {
    name: string;
    type: string;
    sector: string;
  };
  generatedAt: Date;
  includeInsights: boolean;
  includeCharts: boolean;
}

function ReportDocument({
  dataset,
  kpis,
  organization,
  generatedAt,
  includeInsights,
  includeCharts,
}: ReportDocumentProps) {
  const columnsMetadata = typeof dataset.columnsMetadata === 'string'
    ? JSON.parse(dataset.columnsMetadata)
    : dataset.columnsMetadata;

  // Filtrer les KPIs par importance pour le rapport
  const reportKpis = kpis.slice(0, 8);

  // Générer les insights
  const insights = kpis
    .filter((kpi) => kpi.insightText)
    .slice(0, 5)
    .map((kpi) => kpi.insightText);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>InsightGov Africa</Text>
          <Text style={styles.subtitle}>Plateforme de Dashboards Automatisés</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{dataset.name}</Text>
        <Text style={styles.date}>
          Rapport généré le {formatDate(generatedAt)}
        </Text>

        {/* Organization Info */}
        {organization && (
          <View style={{ marginTop: 10, marginBottom: 15 }}>
            <Text style={{ fontSize: 11, color: '#6b7280' }}>
              Organisation: {organization.name} | Secteur: {organization.sector}
            </Text>
          </View>
        )}

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Vue d'ensemble</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{formatNumber(dataset.rowCount)}</Text>
              <Text style={styles.summaryLabel}>Lignes de données</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{dataset.columnCount}</Text>
              <Text style={styles.summaryLabel}>Colonnes</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{kpis.length}</Text>
              <Text style={styles.summaryLabel}>KPIs générés</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>
                {columnsMetadata?.[0]?.quality?.overallScore?.toFixed(0) || 'N/A'}%
              </Text>
              <Text style={styles.summaryLabel}>Qualité données</Text>
            </View>
          </View>
        </View>

        {/* KPIs Section */}
        <View style={styles.kpiSection}>
          <Text style={styles.kpiTitle}>Indicateurs Clés de Performance</Text>
          <View style={styles.kpiGrid}>
            {reportKpis.map((kpi, index) => (
              <View key={index} style={styles.kpiCard}>
                <Text style={styles.kpiName}>{kpi.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text style={styles.kpiValue}>
                    {kpi.value !== undefined
                      ? kpi.unit === 'FCFA' || kpi.unit === 'XOF'
                        ? formatCurrency(kpi.value)
                        : kpi.unit === '%'
                        ? `${kpi.value.toFixed(1)}%`
                        : formatNumber(kpi.value)
                      : 'N/A'}
                  </Text>
                  {kpi.unit && kpi.unit !== 'FCFA' && kpi.unit !== 'XOF' && kpi.unit !== '%' && (
                    <Text style={styles.kpiUnit}> {kpi.unit}</Text>
                  )}
                </View>
                {kpi.description && (
                  <Text style={styles.kpiDescription}>{kpi.description}</Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Insights Section */}
        {includeInsights && insights.length > 0 && (
          <View style={styles.insightSection}>
            <Text style={styles.insightTitle}>💡 Insights Principaux</Text>
            {insights.map((insight, index) => (
              <Text key={index} style={styles.insightItem}>
                • {insight}
              </Text>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Ce rapport a été généré automatiquement par intelligence artificielle.
          </Text>
          <Text style={styles.footerBrand}>
            © {generatedAt.getFullYear()} InsightGov Africa
          </Text>
        </View>
      </Page>
    </Document>
  );
}

// ============================================
// COMPOSANT D'EXPORT
// ============================================

interface PdfExportButtonProps {
  dataset: Dataset;
  kpis: Kpi[];
  organization?: {
    name: string;
    type: string;
    sector: string;
  };
  className?: string;
}

export function PdfExportButton({
  dataset,
  kpis,
  organization,
  className,
}: PdfExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [options, setOptions] = useState({
    includeInsights: true,
    includeCharts: false,
  });

  const generatePdf = useCallback(async () => {
    setIsGenerating(true);
    setIsSuccess(false);

    try {
      const doc = (
        <ReportDocument
          dataset={dataset}
          kpis={kpis}
          organization={organization}
          generatedAt={new Date()}
          includeInsights={options.includeInsights}
          includeCharts={options.includeCharts}
        />
      );

      const blob = await pdf(doc).toBlob();
      
      const fileName = `InsightGov_Rapport_${dataset.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
      saveAs(blob, fileName);

      setIsSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Erreur génération PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [dataset, kpis, organization, options]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className={cn('bg-emerald-600 hover:bg-emerald-700', className)}>
          <Download className="w-4 h-4 mr-2" />
          Exporter PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exporter le rapport</DialogTitle>
          <DialogDescription>
            Générez un rapport PDF professionnel de votre dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="insights"
                checked={options.includeInsights}
                onCheckedChange={(checked) =>
                  setOptions((prev) => ({ ...prev, includeInsights: !!checked }))
                }
              />
              <Label htmlFor="insights" className="text-sm">
                Inclure les insights IA
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="charts"
                checked={options.includeCharts}
                onCheckedChange={(checked) =>
                  setOptions((prev) => ({ ...prev, includeCharts: !!checked }))
                }
              />
              <Label htmlFor="charts" className="text-sm">
                Inclure les graphiques (en développement)
              </Label>
            </div>
          </div>

          {/* Preview */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileText className="w-10 h-10 text-emerald-500" />
                <div>
                  <p className="font-medium text-sm">{dataset.name}</p>
                  <p className="text-xs text-gray-500">
                    {kpis.length} KPIs • {formatNumber(dataset.rowCount)} lignes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={generatePdf}
            disabled={isGenerating || isSuccess}
            className="bg-emerald-600 hover:bg-emerald-700 min-w-[120px]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Téléchargé!
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 mr-2" />
                Générer PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PdfExportButton;
