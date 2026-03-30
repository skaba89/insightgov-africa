/**
 * InsightGov Africa - Dashboard Container
 * ========================================
 * Container principal pour le dashboard avec filtres et export.
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { DashboardGrid } from './dashboard-grid';
import { DashboardFilters } from './dashboard-filters';
import { ExportModal } from '@/components/export/export-modal';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Download,
  Share2,
  Settings,
  FileText,
  Presentation,
  Crown,
  TrendingUp,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { DashboardConfig, ComparisonOptions } from '@/types';

interface DashboardContainerProps {
  config: DashboardConfig;
  onBack?: () => void;
  organizationName?: string;
  subscriptionTier?: string;
}

export function DashboardContainer({
  config,
  onBack,
  organizationName = 'Organisation',
  subscriptionTier = 'free',
}: DashboardContainerProps) {
  const [filteredData, setFilteredData] = useState<Record<string, unknown>[] | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [comparisonOptions, setComparisonOptions] = useState<ComparisonOptions>({
    enabled: false,
    type: 'yoy',
  });
  
  const columnsMetadata = useOnboardingStore((state) => state.columnsMetadata);
  const dataPreview = useOnboardingStore((state) => state.dataPreview);
  const analysisResult = useOnboardingStore((state) => state.analysisResult);

  // Debug: logger les données pour vérifier
  console.log('DashboardContainer - dataPreview length:', dataPreview?.length);
  console.log('DashboardContainer - columnsMetadata:', columnsMetadata?.map(c => ({ name: c.name, cleanName: c.cleanName, originalName: c.originalName })));
  console.log('DashboardContainer - config.kpis sample:', config.kpis.slice(0, 2).map(k => ({ title: k.title, chartType: k.chartType, columns: k.columns })));

  // Données à utiliser (filtrées ou originales)
  const displayData = useMemo(() => {
    console.log('DashboardContainer.displayData - dataPreview:', dataPreview?.length, 'rows');
    
    // Si on a des données du store, les utiliser
    if (dataPreview && dataPreview.length > 0) {
      console.log('DashboardContainer.displayData - Using store dataPreview, first row:', dataPreview[0]);
      return dataPreview;
    }
    
    // Sinon, générer des données de démo basées sur la config
    console.log('DashboardContainer.displayData - No dataPreview, generating demo data');
    const demoData = generateDemoDataFromConfig(config);
    console.log('DashboardContainer.displayData - Generated demo data, first row:', demoData[0]);
    return demoData;
  }, [dataPreview, config]);

  // Gestion du changement de filtres
  const handleFilterChange = useCallback((data: Record<string, unknown>[]) => {
    setFilteredData(data);
  }, []);

  // Gestion des années sélectionnées
  const handleYearChange = useCallback((years: number[]) => {
    setSelectedYears(years);
  }, []);

  // Gestion des options de comparaison
  const handleComparisonChange = useCallback((options: ComparisonOptions) => {
    setComparisonOptions(options);
  }, []);

  // Calculer les données de comparaison si activé
  const comparisonData = useMemo(() => {
    if (!comparisonOptions.enabled || selectedYears.length < 2) return null;
    
    const baselineYear = comparisonOptions.baselineYear || Math.min(...selectedYears);
    const comparisonYears = selectedYears.filter(y => y !== baselineYear);
    
    return {
      baselineYear,
      comparisonYears,
      type: comparisonOptions.type,
    };
  }, [comparisonOptions, selectedYears]);

  // Export rapide PDF
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleQuickExportPDF = useCallback(async () => {
    setIsExportingPDF(true);
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          organizationName,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération du PDF');
      }

      // Télécharger le PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur export PDF:', error);
      alert('Erreur lors de l\'export PDF');
    } finally {
      setIsExportingPDF(false);
    }
  }, [config, organizationName]);

  // Export Excel
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const handleExportExcel = useCallback(async () => {
    // Vérifier si le plan le permet
    const isPremiumPlan = subscriptionTier === 'professional' || subscriptionTier === 'enterprise';
    if (!isPremiumPlan) {
      alert('L\'export Excel nécessite un abonnement Professional ou Enterprise.');
      return;
    }

    setIsExportingExcel(true);
    try {
      const response = await fetch('/api/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          organizationName,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération du fichier Excel');
      }

      // Télécharger le fichier
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur export Excel:', error);
      alert('Erreur lors de l\'export Excel');
    } finally {
      setIsExportingExcel(false);
    }
  }, [config, organizationName, subscriptionTier]);

  // Partager
  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: config.title,
        text: config.executiveSummary,
        url: window.location.href,
      });
    } else {
      // Copier le lien dans le presse-papier
      navigator.clipboard.writeText(window.location.href);
      alert('Lien copié dans le presse-papier');
    }
  }, [config.title, config.executiveSummary]);

  // Badge du plan
  const getPlanBadge = () => {
    switch (subscriptionTier) {
      case 'enterprise':
        return (
          <Badge className="bg-amber-500 text-white">
            <Crown className="w-3 h-3 mr-1" />
            Enterprise
          </Badge>
        );
      case 'professional':
        return (
          <Badge className="bg-purple-500 text-white">
            <Crown className="w-3 h-3 mr-1" />
            Professional
          </Badge>
        );
      case 'starter':
        return (
          <Badge className="bg-blue-500 text-white">
            Starter
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-500">
            Free
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <Button variant="ghost" size="sm" onClick={onBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {config.title}
                  </h1>
                  {getPlanBadge()}
                </div>
                <p className="text-sm text-gray-500">
                  Généré par IA • {config.kpis.length} indicateurs
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Bouton Partager */}
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Partager
              </Button>

              {/* Menu Export */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Exporter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleQuickExportPDF} disabled={isExportingPDF}>
                    <FileText className="w-4 h-4 mr-2" />
                    {isExportingPDF ? 'Export en cours...' : 'Exporter en PDF'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportExcel} disabled={isExportingExcel}>
                    <Presentation className="w-4 h-4 mr-2" />
                    {isExportingExcel ? 'Export en cours...' : 'Exporter en Excel'}
                    {subscriptionTier === 'free' && (
                      <Badge className="ml-2 bg-amber-500 text-white text-xs">PRO</Badge>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowExportModal(true)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Options d'export avancées
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Générer lien de partage
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtres */}
        <DashboardFilters
          config={config}
          columnsMetadata={columnsMetadata}
          data={dataPreview}
          onFilterChange={handleFilterChange}
          onYearChange={handleYearChange}
          onComparisonChange={handleComparisonChange}
        />

        {/* Info sur les données filtrées et comparaison */}
        {(filteredData || comparisonData) && (
          <div className="mb-4 space-y-2">
            {filteredData && filteredData.length !== dataPreview.length && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Affichage de {filteredData.length} enregistrements sur {dataPreview.length}
                </p>
              </div>
            )}
            
            {comparisonData && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                  <TrendingUp className="w-4 h-4" />
                  <span>
                    Comparaison {comparisonData.type === 'yoy' ? 'Année sur Année' : 'période'} : 
                    Base {comparisonData.baselineYear} vs {comparisonData.comparisonYears.join(', ')}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dashboard Grid */}
        <DashboardGrid
          config={config}
          data={displayData}
          onExport={handleQuickExportPDF}
        />
      </main>

      {/* Footer */}
      <footer className="mt-16 py-6 border-t bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © 2024 InsightGov Africa. Dashboard généré automatiquement par IA.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              {config.metadata && (
                <span>
                  Généré le{' '}
                  {new Date(config.metadata.generatedAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* Export Modal */}
      <ExportModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        config={config}
        organizationName={organizationName}
        subscriptionTier={subscriptionTier}
      />
    </div>
  );
}

export default DashboardContainer;

// Fonction helper pour générer des données de démo basées sur la config
function generateDemoDataFromConfig(config: DashboardConfig): Record<string, unknown>[] {
  const data: Record<string, unknown>[] = [];
  const rowCount = 50;

  // Extraire les colonnes utilisées dans les KPIs
  const columns = new Set<string>();
  config.kpis.forEach((kpi) => {
    if (kpi.columns.x) columns.add(kpi.columns.x);
    if (kpi.columns.y) columns.add(kpi.columns.y);
  });

  // Générer des données aléatoires pour chaque colonne
  for (let i = 0; i < rowCount; i++) {
    const row: Record<string, unknown> = {};

    columns.forEach((col) => {
      const colLower = col.toLowerCase();

      if (colLower.includes('date') || colLower.includes('mois') || colLower.includes('annee')) {
        const date = new Date(2024, i % 12, 1);
        row[col] = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      } else if (colLower.includes('region') || colLower.includes('zone') || colLower.includes('localite')) {
        const regions = ['Conakry', 'Kankan', 'Nzérékoré', 'Labé', 'Kindia', 'Boké'];
        row[col] = regions[i % regions.length];
      } else if (colLower.includes('type') || colLower.includes('categorie') || colLower.includes('categorie')) {
        const categories = ['Catégorie A', 'Catégorie B', 'Catégorie C', 'Catégorie D'];
        row[col] = categories[i % categories.length];
      } else if (colLower.includes('taux') || colLower.includes('pourcentage') || colLower.includes('coverage')) {
        // Pourcentages entre 60 et 95
        row[col] = Math.floor(60 + Math.random() * 35);
      } else if (colLower.includes('patient') || colLower.includes('consultation') || colLower.includes('hospitalisation')) {
        // Nombres plus grands pour les patients
        row[col] = Math.floor(Math.random() * 500) + 100;
      } else if (colLower.includes('vaccin')) {
        row[col] = Math.floor(Math.random() * 200) + 50;
      } else if (colLower.includes('deces') || colLower.includes('mortalite')) {
        row[col] = Math.floor(Math.random() * 10);
      } else if (colLower.includes('accouchement')) {
        row[col] = Math.floor(Math.random() * 50) + 10;
      } else if (colLower.includes('budget') || colLower.includes('montant') || colLower.includes('cout')) {
        row[col] = Math.floor(Math.random() * 100000000);
      } else if (colLower.includes('effectif') || colLower.includes('nombre') || colLower.includes('total')) {
        row[col] = Math.floor(Math.random() * 10000) + 500;
      } else {
        // Valeurs numériques par défaut
        row[col] = Math.floor(Math.random() * 1000) + 100;
      }
    });

    data.push(row);
  }

  return data;
}
