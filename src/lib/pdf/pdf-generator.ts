/**
 * InsightGov Africa - PDF Export Service
 * ========================================
 * Service de génération de rapports PDF avec @react-pdf/renderer.
 */

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
  pdf,
} from '@react-pdf/renderer';
import type { DashboardConfig, KPIConfig } from '@/types';
import React from 'react';

// =============================================================================
// ENREGISTREMENT DES POLICES
// =============================================================================

// Polices par défaut (integrées dans @react-pdf/renderer)
// Pour des polices personnalisées, utiliser Font.register()

// =============================================================================
// STYLES PDF
// =============================================================================

const styles = StyleSheet.create({
  // Page
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  logo: {
    width: 40,
    height: 40,
  },
  headerText: {
    flexDirection: 'column',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 4,
  },
  dateText: {
    fontSize: 10,
    color: '#9ca3af',
    textAlign: 'right',
  },
  
  // Executive Summary
  summarySection: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 11,
    color: '#374151',
    lineHeight: 1.6,
  },
  
  // KPIs Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 25,
  },
  kpiCard: {
    width: '48%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  kpiTitle: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  kpiDescription: {
    fontSize: 9,
    color: '#9ca3af',
    marginTop: 4,
  },
  
  // Insights
  insightsSection: {
    marginBottom: 25,
  },
  insightItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  insightNumber: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  insightNumberText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  insightText: {
    flex: 1,
    fontSize: 11,
    color: '#374151',
    lineHeight: 1.4,
  },
  
  // Recommendations
  recommendationsSection: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: '#fffbeb',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  
  // Chart placeholder
  chartPlaceholder: {
    height: 150,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  chartPlaceholderText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 9,
    color: '#9ca3af',
  },
  pageNumber: {
    fontSize: 9,
    color: '#9ca3af',
  },
});

// =============================================================================
// COMPOSANTS PDF
// =============================================================================

interface PDFReportProps {
  config: DashboardConfig;
  organizationName: string;
  generatedAt: string;
}

// Document PDF principal
const DashboardPDFDocument: React.FC<PDFReportProps> = ({
  config,
  organizationName,
  generatedAt,
}) => {
  // Séparer les KPIs clés
  const keyKPIs = config.kpis.filter((kpi) => kpi.isKeyMetric);
  const otherKPIs = config.kpis.filter((kpi) => !kpi.isKeyMetric);
  
  // Calculer les valeurs agrégées pour les KPIs clés
  const getKPIValue = (kpi: KPIConfig): string => {
    // Pour la démo, on génère une valeur aléatoire
    const value = Math.floor(Math.random() * 100000);
    const format = kpi.valueFormat || {};
    const prefix = format.prefix || '';
    const suffix = format.suffix || '';
    
    let formattedValue: string;
    if (format.compact && value >= 1000000) {
      formattedValue = (value / 1000000).toFixed(1) + 'M';
    } else if (format.compact && value >= 1000) {
      formattedValue = (value / 1000).toFixed(1) + 'K';
    } else {
      formattedValue = value.toLocaleString('fr-FR');
    }
    
    return `${prefix}${formattedValue}${suffix}`;
  };

  return (
    <Document>
      {/* Page 1: Résumé Exécutif */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.subtitle}>{organizationName}</Text>
          </View>
          <View>
            <Text style={styles.dateText}>
              Généré le {new Date(generatedAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>
        </View>

        {/* Résumé Exécutif */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Résumé Exécutif</Text>
          <Text style={styles.summaryText}>{config.executiveSummary}</Text>
        </View>

        {/* KPIs Clés */}
        {keyKPIs.length > 0 && (
          <View style={styles.kpiGrid}>
            {keyKPIs.map((kpi) => (
              <View key={kpi.id} style={styles.kpiCard}>
                <Text style={styles.kpiTitle}>{kpi.title}</Text>
                <Text style={styles.kpiValue}>{getKPIValue(kpi)}</Text>
                {kpi.description && (
                  <Text style={styles.kpiDescription}>{kpi.description}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Points Clés */}
        {config.keyInsights && config.keyInsights.length > 0 && (
          <View style={styles.insightsSection}>
            <Text style={styles.sectionTitle}>Points Clés</Text>
            {config.keyInsights.map((insight, index) => (
              <View key={index} style={styles.insightItem}>
                <View style={styles.insightNumber}>
                  <Text style={styles.insightNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Recommandations */}
        {config.recommendations && config.recommendations.length > 0 && (
          <View style={styles.recommendationsSection}>
            <Text style={styles.sectionTitle}>Recommandations</Text>
            {config.recommendations.map((rec, index) => (
              <View key={index} style={styles.insightItem}>
                <View style={[styles.insightNumber, { backgroundColor: '#f59e0b' }]}>
                  <Text style={styles.insightNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.insightText}>{rec}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            InsightGov Africa - Rapport généré automatiquement
          </Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
            `Page ${pageNumber} sur ${totalPages}`
          )} />
        </View>
      </Page>

      {/* Page 2: Détails des KPIs */}
      {otherKPIs.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Détails des Indicateurs</Text>
              <Text style={styles.subtitle}>{config.title}</Text>
            </View>
          </View>

          {/* Graphiques placeholder */}
          {otherKPIs.slice(0, 6).map((kpi) => (
            <View key={kpi.id} style={{ marginBottom: 15 }}>
              <Text style={styles.sectionTitle}>{kpi.title}</Text>
              <View style={styles.chartPlaceholder}>
                <Text style={styles.chartPlaceholderText}>
                  [{kpi.chartType.toUpperCase()} - Visualisation]
                </Text>
              </View>
              {kpi.description && (
                <Text style={styles.kpiDescription}>{kpi.description}</Text>
              )}
            </View>
          ))}

          <View style={styles.footer} fixed>
            <Text style={styles.footerText}>
              InsightGov Africa - Rapport généré automatiquement
            </Text>
            <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
              `Page ${pageNumber} sur ${totalPages}`
            )} />
          </View>
        </Page>
      )}
    </Document>
  );
};

// =============================================================================
// FONCTIONS D'EXPORT
// =============================================================================

/**
 * Génère un PDF à partir de la configuration du dashboard
 * @returns Buffer du PDF généré
 */
export async function generateDashboardPDF(
  config: DashboardConfig,
  organizationName: string = 'Organisation'
): Promise<Buffer> {
  const generatedAt = config.metadata?.generatedAt || new Date().toISOString();
  
  const doc = React.createElement(DashboardPDFDocument, {
    config,
    organizationName,
    generatedAt,
  });

  const pdfStream = await pdf(doc).toBuffer();
  return pdfStream;
}

/**
 * Génère un PDF et retourne les bytes
 */
export async function generatePDFBytes(
  config: DashboardConfig,
  organizationName: string = 'Organisation'
): Promise<Uint8Array> {
  const buffer = await generateDashboardPDF(config, organizationName);
  return new Uint8Array(buffer);
}

/**
 * Génère un PDF en base64
 */
export async function generatePDFBase64(
  config: DashboardConfig,
  organizationName: string = 'Organisation'
): Promise<string> {
  const buffer = await generateDashboardPDF(config, organizationName);
  return buffer.toString('base64');
}

export default DashboardPDFDocument;
