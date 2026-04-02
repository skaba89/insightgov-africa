/**
 * InsightGov Africa - Onboarding Store
 * =====================================
 * Store Zustand pour gérer l'état de l'onboarding et du dashboard.
 * Persiste l'état dans le localStorage pour la reprise de session.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  OrganizationType,
  Sector,
  Dataset,
  DashboardConfig,
  ColumnMetadata,
} from '@/types';

// =============================================================================
// TYPES
// =============================================================================

interface OnboardingState {
  // État courant
  currentStep: number;
  
  // Utilisateur temporaire (pour la démo)
  userId: string | null;
  
  // Informations organisation
  organizationId: string | null;
  organizationName: string;
  organizationType: OrganizationType | null;
  sector: Sector | null;
  country: string;
  
  // Dataset
  dataset: Dataset | null;
  columnsMetadata: ColumnMetadata[];
  dataPreview: Record<string, unknown>[];
  
  // Analyse
  isAnalyzing: boolean;
  analysisProgress: number;
  analysisResult: DashboardConfig | null;
  analysisError: string | null;
  
  // État UI
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
}

interface OnboardingActions {
  // Navigation
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
  
  // User
  setUserId: (id: string | null) => void;
  
  // Organisation
  setOrganizationId: (id: string | null) => void;
  setOrganizationName: (name: string) => void;
  setOrganizationType: (type: OrganizationType | null) => void;
  setSector: (sector: Sector | null) => void;
  setCountry: (country: string) => void;
  
  // Dataset
  setDataset: (dataset: Dataset | null) => void;
  setColumnsMetadata: (columns: ColumnMetadata[]) => void;
  setDataPreview: (data: Record<string, unknown>[]) => void;
  
  // Upload
  setUploading: (isUploading: boolean) => void;
  setUploadProgress: (progress: number) => void;
  setUploadError: (error: string | null) => void;
  
  // Analyse
  setAnalyzing: (isAnalyzing: boolean) => void;
  setAnalysisProgress: (progress: number) => void;
  setAnalysisResult: (result: DashboardConfig | null) => void;
  setAnalysisError: (error: string | null) => void;
  
  // Helpers
  getOrganizationContext: () => {
    type: OrganizationType;
    sector: Sector;
    name: string;
  } | null;
}

type OnboardingStore = OnboardingState & OnboardingActions;

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialState: OnboardingState = {
  currentStep: 1,
  userId: null,
  organizationId: null,
  organizationName: '',
  organizationType: null,
  sector: null,
  country: '',
  dataset: null,
  columnsMetadata: [],
  dataPreview: [],
  isAnalyzing: false,
  analysisProgress: 0,
  analysisResult: null,
  analysisError: null,
  isUploading: false,
  uploadProgress: 0,
  uploadError: null,
};

// =============================================================================
// STORE
// =============================================================================

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Navigation
      setStep: (step) => set({ currentStep: step }),
      nextStep: () => set((state) => ({ currentStep: state.currentStep + 1 })),
      prevStep: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) })),
      reset: () => set(initialState),

      // User
      setUserId: (id) => set({ userId: id }),

      // Organisation
      setOrganizationId: (id) => set({ organizationId: id }),
      setOrganizationName: (name) => set({ organizationName: name }),
      setOrganizationType: (type) => set({ organizationType: type }),
      setSector: (sector) => set({ sector: sector }),
      setCountry: (country) => set({ country: country }),

      // Dataset
      setDataset: (dataset) => set({ dataset: dataset }),
      setColumnsMetadata: (columns) => set({ columnsMetadata: columns }),
      setDataPreview: (data) => set({ dataPreview: data }),

      // Upload
      setUploading: (isUploading) => set({ isUploading, uploadError: null }),
      setUploadProgress: (progress) => set({ uploadProgress: progress }),
      setUploadError: (error) => set({ uploadError: error, isUploading: false }),

      // Analyse
      setAnalyzing: (isAnalyzing) => set({ isAnalyzing, analysisError: null }),
      setAnalysisProgress: (progress) => set({ analysisProgress: progress }),
      setAnalysisResult: (result) => set({ analysisResult: result, isAnalyzing: false }),
      setAnalysisError: (error) => set({ analysisError: error, isAnalyzing: false }),

      // Helpers
      getOrganizationContext: () => {
        const state = get();
        if (!state.organizationType || !state.sector) return null;
        return {
          type: state.organizationType,
          sector: state.sector,
          name: state.organizationName,
        };
      },
    }),
    {
      name: 'insightgov-onboarding',
      partialize: (state) => ({
        // Seules ces valeurs sont persistées
        userId: state.userId,
        organizationId: state.organizationId,
        organizationName: state.organizationName,
        organizationType: state.organizationType,
        sector: state.sector,
        country: state.country,
        currentStep: state.currentStep,
        dataset: state.dataset,
        analysisResult: state.analysisResult,
        // Ajouter les données de preview pour la persistance
        dataPreview: state.dataPreview,
        columnsMetadata: state.columnsMetadata,
      }),
    }
  )
);

// =============================================================================
// SELECTORS
// =============================================================================

export const selectCurrentStep = (state: OnboardingStore) => state.currentStep;
export const selectOrganization = (state: OnboardingStore) => ({
  id: state.organizationId,
  name: state.organizationName,
  type: state.organizationType,
  sector: state.sector,
  country: state.country,
});
export const selectDataset = (state: OnboardingStore) => state.dataset;
export const selectAnalysisResult = (state: OnboardingStore) => state.analysisResult;
export const selectIsLoading = (state: OnboardingStore) =>
  state.isUploading || state.isAnalyzing;

// =============================================================================
// HOOKS UTILITAIRES
// =============================================================================

/**
 * Hook pour vérifier si l'onboarding est complet
 */
export function useIsOnboardingComplete() {
  const analysisResult = useOnboardingStore((state) => state.analysisResult);
  const dataset = useOnboardingStore((state) => state.dataset);
  return !!(analysisResult && dataset);
}

/**
 * Hook pour obtenir le contexte d'analyse
 */
export function useAnalysisContext() {
  const organizationType = useOnboardingStore((state) => state.organizationType);
  const sector = useOnboardingStore((state) => state.sector);
  const dataset = useOnboardingStore((state) => state.dataset);
  
  if (!organizationType || !sector || !dataset) return null;
  
  return {
    organizationType,
    sector,
    datasetId: dataset.id,
  };
}
