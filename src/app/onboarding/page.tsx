/**
 * InsightGov Africa - Onboarding Page
 * =====================================
 * Processus d'onboarding complet avec création de dashboard
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { OrganizationTypeSelector } from '@/components/onboarding/organization-type-selector';
import { SectorSelector } from '@/components/onboarding/sector-selector';
import { FileUpload } from '@/components/upload/file-upload';
import { DataPreview } from '@/components/upload/data-preview';
import { DashboardContainer } from '@/components/dashboard/dashboard-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Loader2,
  Sparkles,
  Database,
  BarChart3,
  FileSpreadsheet,
  AlertCircle,
  Play,
  X,
  Upload,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Étapes de l'onboarding
const ONBOARDING_STEPS = [
  {
    id: 1,
    title: 'Type d\'organisation',
    description: 'Sélectionnez votre type d\'organisation',
    icon: Building2,
  },
  {
    id: 2,
    title: 'Secteur d\'activité',
    description: 'Choisissez votre domaine',
    icon: BarChart3,
  },
  {
    id: 3,
    title: 'Import des données',
    description: 'Chargez votre fichier ou utilisez la démo',
    icon: Database,
  },
  {
    id: 4,
    title: 'Analyse IA',
    description: 'Génération automatique du dashboard',
    icon: Sparkles,
  },
];

export default function OnboardingPage() {
  const {
    currentStep,
    organizationType,
    sector,
    organizationName,
    country,
    dataset,
    isAnalyzing,
    analysisResult,
    analysisError,
    analysisProgress,
    nextStep,
    prevStep,
    setOrganizationName,
    setCountry,
    setAnalyzing,
    setAnalysisProgress,
    setAnalysisResult,
    setAnalysisError,
    setDataPreview,
    setColumnsMetadata,
  } = useOnboardingStore();

  const [localOrgName, setLocalOrgName] = useState(organizationName);
  const [localCountry, setLocalCountry] = useState(country);
  const [showDashboard, setShowDashboard] = useState(false);
  const [useDemoData, setUseDemoData] = useState(false);

  // Vérifier si on peut avancer
  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        return !!organizationType;
      case 2:
        return !!sector;
      case 3:
        return !!dataset || useDemoData;
      case 4:
        return !!analysisResult;
      default:
        return false;
    }
  }, [currentStep, organizationType, sector, dataset, useDemoData, analysisResult]);

  // Lancer l'analyse IA (réelle ou démo)
  const runAnalysis = useCallback(async () => {
    if (!organizationType || !sector) return;

    setAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisError(null);

    // Simuler la progression
    const progressInterval = setInterval(() => {
      setAnalysisProgress(Math.min(useOnboardingStore.getState().analysisProgress + 8, 85));
    }, 400);

    try {
      // Choisir l'API appropriée
      const apiEndpoint = useDemoData || !dataset 
        ? '/api/demo/generate' 
        : '/api/analyze';

      const requestBody = useDemoData || !dataset
        ? { organizationType, sector }
        : { datasetId: dataset.id, organizationType, sector };

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      clearInterval(progressInterval);
      setAnalysisProgress(95);

      const result = await response.json();

      if (result.success && result.config) {
        setAnalysisProgress(100);
        // Petit délai pour montrer 100%
        setTimeout(() => {
          setAnalysisResult(result.config);
          // IMPORTANT: Stocker les données de démo si disponibles
          if (result.sampleData) {
            setDataPreview(result.sampleData);
          }
          if (result.columnsMetadata) {
            setColumnsMetadata(result.columnsMetadata);
          }
        }, 300);
      } else {
        setAnalysisError(result.error || 'Erreur lors de l\'analyse');
      }
    } catch (error) {
      clearInterval(progressInterval);
      setAnalysisError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setAnalyzing(false);
    }
  }, [dataset, organizationType, sector, useDemoData, setAnalyzing, setAnalysisProgress, setAnalysisResult, setAnalysisError, setDataPreview, setColumnsMetadata]);

  // Auto-lancer l'analyse à l'étape 4
  useEffect(() => {
    if (currentStep === 4 && (dataset || useDemoData) && !analysisResult && !isAnalyzing) {
      runAnalysis();
    }
  }, [currentStep, dataset, useDemoData, analysisResult, isAnalyzing, runAnalysis]);

  // Passer à l'étape suivante
  const handleNext = () => {
    if (currentStep === 2) {
      setOrganizationName(localOrgName);
      setCountry(localCountry);
    }
    if (currentStep < 4) {
      nextStep();
    }
  };

  // Voir le dashboard
  const handleViewDashboard = () => {
    setShowDashboard(true);
  };

  // Retour à l'onboarding
  const handleBackToOnboarding = () => {
    setShowDashboard(false);
  };

  // Progress globale
  const overallProgress = ((currentStep - 1) / (ONBOARDING_STEPS.length - 1)) * 100;

  // Si le dashboard doit être affiché et qu'on a une config, montrer le dashboard
  if (showDashboard && analysisResult) {
    return (
      <DashboardContainer
        config={analysisResult}
        onBack={handleBackToOnboarding}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  InsightGov<span className="text-blue-600">Africa</span>
                </h1>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              {useDemoData && (
                <span className="px-3 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full font-medium">
                  Mode Démo
                </span>
              )}
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <X className="w-4 h-4 mr-1" />
                  Quitter
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Étape {currentStep} sur {ONBOARDING_STEPS.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(overallProgress)}% complété
            </span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Steps Indicator */}
        <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2">
          {ONBOARDING_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id || (currentStep === 4 && analysisResult);

            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    'flex flex-col items-center',
                    index < ONBOARDING_STEPS.length - 1 && 'min-w-[120px] sm:min-w-[160px]'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                      isActive && !isCompleted && 'bg-gradient-to-br from-blue-600 to-purple-600 text-white ring-4 ring-blue-200',
                      isCompleted && 'bg-green-500 text-white',
                      !isActive && !isCompleted && 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'mt-2 text-xs font-medium text-center hidden sm:block',
                      isActive && !isCompleted && 'text-blue-600',
                      isCompleted && 'text-green-600',
                      !isActive && !isCompleted && 'text-gray-500'
                    )}
                  >
                    {step.title}
                  </span>
                </div>
                {index < ONBOARDING_STEPS.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 flex-1 transition-all mx-2',
                      isCompleted ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <Card className="mb-6 shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-2xl">
              {ONBOARDING_STEPS[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {ONBOARDING_STEPS[currentStep - 1].description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Organization Type */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <OrganizationTypeSelector />
              </div>
            )}

            {/* Step 2: Sector */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                      Nom de l'organisation
                    </label>
                    <Input
                      placeholder="Ex: Ministère de la Santé"
                      value={localOrgName}
                      onChange={(e) => setLocalOrgName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                      Pays
                    </label>
                    <Input
                      placeholder="Ex: Sénégal"
                      value={localCountry}
                      onChange={(e) => setLocalCountry(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                    Secteur d'activité
                  </label>
                  <SectorSelector />
                </div>
              </div>
            )}

            {/* Step 3: File Upload or Demo */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Demo Option */}
                <div
                  className={cn(
                    'border-2 rounded-xl p-6 cursor-pointer transition-all',
                    useDemoData
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  )}
                  onClick={() => setUseDemoData(true)}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'p-3 rounded-lg',
                      useDemoData ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600'
                    )}>
                      <Zap className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Utiliser les données de démonstration
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Testez InsightGov avec des données fictives réalistes adaptées à votre secteur.
                        Aucun fichier requis.
                      </p>
                    </div>
                    {useDemoData && (
                      <Check className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                </div>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                      ou importez vos propres données
                    </span>
                  </div>
                </div>

                {/* Upload Option */}
                <div
                  className={cn(
                    'border-2 rounded-xl p-6 cursor-pointer transition-all',
                    dataset
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : useDemoData
                        ? 'border-gray-200 dark:border-gray-700 opacity-60'
                        : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                  )}
                  onClick={() => !useDemoData && setUseDemoData(false)}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'p-3 rounded-lg',
                      dataset ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600'
                    )}>
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Importer un fichier
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Formats supportés: Excel (.xlsx, .xls), CSV. Maximum 10 Mo.
                      </p>
                    </div>
                    {dataset && (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                </div>

                {/* File Upload Component */}
                {!useDemoData && (
                  <div className="space-y-4">
                    <FileUpload 
                      userId="demo-user" 
                      organizationId="demo-org"
                      onUploadComplete={(uploadedDataset) => {
                        // Dataset est maintenant géré par le store
                      }}
                    />
                    {dataset && <DataPreview />}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: AI Analysis */}
            {currentStep === 4 && (
              <div className="space-y-6">
                {isAnalyzing && (
                  <div className="flex flex-col items-center py-8">
                    <div className="relative">
                      <Sparkles className="w-16 h-16 text-blue-600 animate-pulse" />
                      <div className="absolute inset-0 animate-ping">
                        <Sparkles className="w-16 h-16 text-blue-600/30" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mt-6 mb-2">
                      Analyse en cours...
                    </h3>
                    <p className="text-gray-500 text-center max-w-md mb-4">
                      Notre IA analyse vos données et génère automatiquement les KPIs pertinents pour votre secteur.
                    </p>
                    <div className="w-64">
                      <Progress value={analysisProgress} className="h-2" />
                      <p className="text-sm text-gray-400 text-center mt-2">
                        {analysisProgress < 30 && 'Analyse des colonnes...'}
                        {analysisProgress >= 30 && analysisProgress < 60 && 'Détection des tendances...'}
                        {analysisProgress >= 60 && analysisProgress < 90 && 'Génération des KPIs...'}
                        {analysisProgress >= 90 && 'Finalisation...'}
                      </p>
                    </div>
                  </div>
                )}

                {analysisError && (
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                      <div>
                        <h3 className="font-medium text-red-800 dark:text-red-200">
                          Erreur lors de l'analyse
                        </h3>
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                          {analysisError}
                        </p>
                        <Button variant="outline" onClick={runAnalysis} className="mt-3" size="sm">
                          Réessayer
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {analysisResult && (
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-green-500 rounded-full">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-green-800 dark:text-green-200">
                          Dashboard généré avec succès!
                        </h3>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          {analysisResult.kpis?.length || 0} KPIs configurés
                        </p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                          {analysisResult.title}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {analysisResult.executiveSummary}
                        </p>
                      </div>
                      {analysisResult.kpis && analysisResult.kpis.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            KPIs générés:
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {analysisResult.kpis.slice(0, 6).map((kpi: any) => (
                              <span
                                key={kpi.id}
                                className="px-2 py-1 text-xs bg-white dark:bg-gray-800 rounded border"
                              >
                                {kpi.title}
                              </span>
                            ))}
                            {analysisResult.kpis.length > 6 && (
                              <span className="px-2 py-1 text-xs text-gray-500">
                                +{analysisResult.kpis.length - 6} autres
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Précédent
          </Button>

          {currentStep < 4 ? (
            <Button 
              onClick={handleNext} 
              disabled={!canProceed()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Suivant
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : analysisResult ? (
            <Button 
              onClick={handleViewDashboard}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Voir le Dashboard
            </Button>
          ) : isAnalyzing ? (
            <Button disabled>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyse en cours...
            </Button>
          ) : null}
        </div>
      </main>
    </div>
  );
}
