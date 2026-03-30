// ============================================
// InsightGov Africa - Application Principale
// Orchestration de tous les composants
// ============================================

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Upload,
  Settings,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  FileSpreadsheet,
  Download,
  RefreshCw,
  Bell,
  Search,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Play,
  Database,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';
import { FileUpload } from '@/components/upload/file-upload';
import { DashboardRenderer } from '@/components/dashboard/dashboard-renderer';
import { useAppStore, getOrganizationTypeLabel } from '@/lib/store';
import { cn, formatNumber } from '@/lib/utils';
import { Kpi, Dataset, ProcessingStatus } from '@/types';

// ============================================
// SIDEBAR
// ============================================

function Sidebar({ onNavigate }: { onNavigate: (view: string) => void }) {
  const { sidebarOpen, toggleSidebar, currentOrganization, currentDataset } = useAppStore();
  const [activeItem, setActiveItem] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Importer', icon: Upload },
    { id: 'datasets', label: 'Datasets', icon: FileSpreadsheet },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  const handleNavigation = (id: string) => {
    setActiveItem(id);
    onNavigate(id);
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 280 : 80 }}
      className="h-screen bg-gray-900 text-white flex flex-col border-r border-gray-800"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-800">
        <AnimatePresence mode="wait">
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">IG</span>
              </div>
              <div>
                <h1 className="font-bold text-lg">InsightGov</h1>
                <p className="text-xs text-gray-400">Africa</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="text-gray-400 hover:text-white hover:bg-gray-800"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>

      {/* Organisation */}
      {sidebarOpen && currentOrganization && (
        <div className="p-4 border-b border-gray-800">
          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-1">Organisation</p>
            <p className="font-medium text-sm truncate">{currentOrganization.name}</p>
            <div className="flex gap-1 mt-2">
              <Badge variant="outline" className="text-xs border-emerald-500 text-emerald-400">
                {getOrganizationTypeLabel(currentOrganization.type)}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                activeItem === item.id
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
              whileHover={{ x: sidebarOpen ? 4 : 0 }}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <AnimatePresence mode="wait">
                {sidebarOpen && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="font-medium text-sm"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </nav>

      {/* Footer */}
      {sidebarOpen && (
        <div className="p-4 border-t border-gray-800">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg p-4">
            <Sparkles className="w-5 h-5 text-white mb-2" />
            <p className="text-sm font-medium text-white">IA Activée</p>
            <p className="text-xs text-emerald-100">Analyse automatique des données</p>
          </div>
        </div>
      )}
    </motion.aside>
  );
}

// ============================================
// HEADER
// ============================================

function Header() {
  const { currentDataset, processingStatus } = useAppStore();

  return (
    <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {currentDataset ? currentDataset.name : 'Dashboard'}
        </h2>
        {currentDataset && (
          <Badge
            variant="outline"
            className={cn(
              processingStatus === ProcessingStatus.COMPLETED
                ? 'border-emerald-500 text-emerald-600'
                : processingStatus === ProcessingStatus.FAILED
                ? 'border-red-500 text-red-600'
                : 'border-blue-500 text-blue-600'
            )}
          >
            {processingStatus === ProcessingStatus.COMPLETED && <CheckCircle2 className="w-3 h-3 mr-1" />}
            {processingStatus === ProcessingStatus.FAILED && <AlertCircle className="w-3 h-3 mr-1" />}
            {(processingStatus === ProcessingStatus.ANALYZING || 
              processingStatus === ProcessingStatus.PARSING) && (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            )}
            {processingStatus}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input placeholder="Rechercher..." className="pl-9 w-64" />
        </div>
        <Button variant="outline" size="icon"><Bell className="w-4 h-4" /></Button>
        <Button variant="outline" size="icon"><Settings className="w-4 h-4" /></Button>
        <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center text-white font-medium">AD</div>
      </div>
    </header>
  );
}

// ============================================
// VUE UPLOAD
// ============================================

function UploadView({ 
  onUploadComplete, 
  onDemoGenerate 
}: { 
  onUploadComplete: (datasetId: string) => void;
  onDemoGenerate: () => void;
}) {
  const { currentOrganization, onboardingData } = useAppStore();
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);

  const handleDemoClick = async () => {
    setIsGeneratingDemo(true);
    try {
      await onDemoGenerate();
    } finally {
      setIsGeneratingDemo(false);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Importer vos données</h1>
          <p className="text-gray-600 mt-2">
            Uploadez un fichier CSV ou Excel pour générer automatiquement votre dashboard
          </p>
        </div>

        {/* Upload Zone */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8">
            <FileUpload
              organizationId={currentOrganization?.id}
              organizationType={onboardingData.organizationType}
              sector={onboardingData.sector}
              subSector={onboardingData.subSector}
              onUploadComplete={onUploadComplete}
            />
          </CardContent>
        </Card>

        {/* Demo Section */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gray-50 px-4 text-gray-500">ou</span>
          </div>
        </div>

        {/* Demo Button */}
        <Card className="border-2 border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 transition-colors cursor-pointer"
          onClick={!isGeneratingDemo ? handleDemoClick : undefined}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                {isGeneratingDemo ? (
                  <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
                ) : (
                  <Play className="w-7 h-7 text-emerald-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Essayer avec des données de démonstration
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Générez automatiquement un dataset {onboardingData.sector || 'santé'} avec {onboardingData.sector === 'finance' ? 'transactions financières' : onboardingData.sector === 'education' ? 'données scolaires' : onboardingData.sector === 'agriculture' ? 'données agricoles' : 'données hospitalières'} réalistes
                </p>
              </div>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={isGeneratingDemo}
                onClick={(e) => { e.stopPropagation(); handleDemoClick(); }}
              >
                {isGeneratingDemo ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Générer Démo
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-medium text-gray-900">CSV ou Excel</h3>
              <p className="text-sm text-gray-500 mt-1">Formats .csv, .xlsx, .xls acceptés</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900">Analyse IA</h3>
              <p className="text-sm text-gray-500 mt-1">Détection automatique des KPIs</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-medium text-gray-900">Dashboard instantané</h3>
              <p className="text-sm text-gray-500 mt-1">Visualisations générées automatiquement</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ============================================
// VUE DASHBOARD
// ============================================

function DashboardView() {
  const { currentDataset, currentKpis, rawData, processingStatus } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (currentDataset) {
      const timer = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [currentDataset]);

  if (!currentDataset) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-24 h-24 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
          <BarChart3 className="w-12 h-12 text-gray-300" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Aucun dataset</h2>
        <p className="text-gray-500 text-center max-w-md mb-6">
          Importez vos données pour visualiser votre dashboard personnalisé
        </p>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Upload className="w-4 h-4 mr-2" />
          Importer des données
        </Button>
      </div>
    );
  }

  if (isLoading || processingStatus === ProcessingStatus.ANALYZING) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Analyse en cours...</h2>
        <p className="text-gray-500 mt-2">L'IA analyse vos données et génère les KPIs</p>
      </div>
    );
  }

  const columns = typeof currentDataset.columnsMetadata === 'string'
    ? JSON.parse(currentDataset.columnsMetadata)
    : currentDataset.columnsMetadata;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{currentDataset.name}</h1>
          <p className="text-gray-500 mt-1">
            {formatNumber(currentDataset.rowCount)} lignes • {currentDataset.columnCount} colonnes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Download className="w-4 h-4 mr-2" />
            Exporter PDF
          </Button>
        </div>
      </div>
      <DashboardRenderer kpis={currentKpis} rawData={rawData} columns={columns} />
    </div>
  );
}

// ============================================
// APPLICATION PRINCIPALE
// ============================================

export function InsightGovApp() {
  const {
    currentOrganization,
    onboardingData,
    currentDataset,
    setCurrentDataset,
    setCurrentKpis,
    setRawData,
    setProcessingStatus,
  } = useAppStore();
  
  const [showOnboarding, setShowOnboarding] = useState(!currentOrganization);
  const [activeView, setActiveView] = useState<'dashboard' | 'upload'>('dashboard');

  // Charger les données du dataset
  const loadDatasetData = useCallback(async (datasetId: string) => {
    try {
      const response = await fetch(`/api/datasets/${datasetId}`);
      if (!response.ok) throw new Error('Erreur chargement dataset');
      
      const { data } = await response.json();
      
      setCurrentDataset(data);
      setCurrentKpis(data.kpis || []);
      setProcessingStatus(data.processingStatus);
      
      // Charger les données brutes
      try {
        const dataResponse = await fetch(`/api/datasets/${datasetId}/data?limit=500`);
        if (dataResponse.ok) {
          const { data: rawData } = await dataResponse.json();
          setRawData(rawData || []);
        }
      } catch {
        setRawData([]);
      }
      
      setActiveView('dashboard');
    } catch (error) {
      console.error('Erreur chargement:', error);
    }
  }, [setCurrentDataset, setCurrentKpis, setRawData, setProcessingStatus]);

  // Callback après upload
  const handleUploadComplete = useCallback((datasetId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/datasets/${datasetId}`);
        if (!response.ok) return;
        
        const { data } = await response.json();
        
        if (data.processingStatus === ProcessingStatus.COMPLETED) {
          clearInterval(pollInterval);
          loadDatasetData(datasetId);
        }
        
        if (data.processingStatus === ProcessingStatus.FAILED) {
          clearInterval(pollInterval);
          setProcessingStatus(ProcessingStatus.FAILED);
        }
      } catch (error) {
        console.error('Erreur polling:', error);
      }
    }, 3000);

    setTimeout(() => clearInterval(pollInterval), 300000);
  }, [loadDatasetData, setProcessingStatus]);

  // Callback pour générer les données de démo
  const handleDemoGenerate = useCallback(async () => {
    if (!currentOrganization?.id) return;

    setProcessingStatus(ProcessingStatus.ANALYZING);
    
    try {
      const response = await fetch('/api/demo/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrganization.id,
          organizationType: onboardingData.organizationType,
          sector: onboardingData.sector || 'health',
          subSector: onboardingData.subSector,
          rowCount: 200,
          language: 'fr',
        }),
      });

      if (!response.ok) throw new Error('Erreur génération démo');

      const { data } = await response.json();
      
      // Charger le dataset généré
      await loadDatasetData(data.datasetId);
    } catch (error) {
      console.error('Erreur génération démo:', error);
      setProcessingStatus(ProcessingStatus.FAILED);
    }
  }, [currentOrganization, onboardingData, loadDatasetData, setProcessingStatus]);

  // Callback après onboarding
  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
    setActiveView('upload');
  }, []);

  // Navigation
  const handleNavigation = useCallback((view: string) => {
    if (view === 'upload') setActiveView('upload');
    else if (view === 'dashboard') setActiveView('dashboard');
  }, []);

  if (showOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar onNavigate={handleNavigation} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto bg-gray-50">
          <AnimatePresence mode="wait">
            {activeView === 'upload' ? (
              <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <UploadView onUploadComplete={handleUploadComplete} onDemoGenerate={handleDemoGenerate} />
              </motion.div>
            ) : (
              <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <DashboardView />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default InsightGovApp;
