// ============================================
// InsightGov Africa - Store Zustand
// Gestion d'état globale de l'application
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Organization,
  OrganizationType,
  Dataset,
  Kpi,
  OnboardingData,
  SECTORS,
} from '@/types';

// ============================================
// INTERFACE DU STORE
// ============================================

interface AppState {
  // Organisation courante
  currentOrganization: Organization | null;
  setCurrentOrganization: (org: Organization | null) => void;

  // Dataset courant
  currentDataset: Dataset | null;
  setCurrentDataset: (dataset: Dataset | null) => void;

  // KPIs du dataset courant
  currentKpis: Kpi[];
  setCurrentKpis: (kpis: Kpi[]) => void;

  // Données brutes du dataset (pour les graphiques)
  rawData: Record<string, unknown>[];
  setRawData: (data: Record<string, unknown>[]) => void;

  // Onboarding
  onboardingData: OnboardingData;
  setOnboardingData: (data: Partial<OnboardingData>) => void;
  resetOnboarding: () => void;

  // UI State
  isUploading: boolean;
  setIsUploading: (value: boolean) => void;
  
  uploadProgress: number;
  setUploadProgress: (value: number) => void;

  processingStatus: 'idle' | 'uploading' | 'parsing' | 'analyzing' | 'completed' | 'error';
  setProcessingStatus: (status: 'idle' | 'uploading' | 'parsing' | 'analyzing' | 'completed' | 'error') => void;

  errorMessage: string | null;
  setErrorMessage: (message: string | null) => void;

  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// ============================================
// VALEURS PAR DÉFAUT
// ============================================

const defaultOnboardingData: OnboardingData = {
  step: 1,
};

// ============================================
// STORE PRINCIPAL
// ============================================

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Organisation
      currentOrganization: null,
      setCurrentOrganization: (org) => set({ currentOrganization: org }),

      // Dataset
      currentDataset: null,
      setCurrentDataset: (dataset) => set({ currentDataset: dataset }),

      // KPIs
      currentKpis: [],
      setCurrentKpis: (kpis) => set({ currentKpis: kpis }),

      // Raw Data
      rawData: [],
      setRawData: (data) => set({ rawData: data }),

      // Onboarding
      onboardingData: defaultOnboardingData,
      setOnboardingData: (data) =>
        set((state) => ({
          onboardingData: { ...state.onboardingData, ...data },
        })),
      resetOnboarding: () => set({ onboardingData: defaultOnboardingData }),

      // UI State
      isUploading: false,
      setIsUploading: (value) => set({ isUploading: value }),

      uploadProgress: 0,
      setUploadProgress: (value) => set({ uploadProgress: value }),

      processingStatus: 'idle',
      setProcessingStatus: (status) => set({ processingStatus: status }),

      errorMessage: null,
      setErrorMessage: (message) => set({ errorMessage: message }),

      // Sidebar
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // Theme
      theme: 'light',
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
    }),
    {
      name: 'insightgov-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentOrganization: state.currentOrganization,
        onboardingData: state.onboardingData,
        theme: state.theme,
      }),
    }
  )
);

// ============================================
// SELECTEURS DÉRIVÉS
// ============================================

export const useOrganizationType = () =>
  useAppStore((state) => state.onboardingData.organizationType);

export const useSector = () =>
  useAppStore((state) => state.onboardingData.sector);

export const useSubSector = () =>
  useAppStore((state) => state.onboardingData.subSector);

export const useIsProcessing = () =>
  useAppStore((state) =>
    ['uploading', 'parsing', 'analyzing'].includes(state.processingStatus)
  );

// ============================================
// HELPERS
// ============================================

export function getOrganizationTypeLabel(type: OrganizationType): string {
  const labels: Record<OrganizationType, string> = {
    [OrganizationType.MINISTRY]: 'Ministère / Gouvernement',
    [OrganizationType.NGO]: 'ONG / Organisation Internationale',
    [OrganizationType.ENTERPRISE]: 'Entreprise Privée',
    [OrganizationType.ACADEMIC]: 'Institution Académique',
    [OrganizationType.OTHER]: 'Autre Organisation',
  };
  return labels[type] || type;
}

export function getSectorLabel(sectorValue: string): string {
  const sector = SECTORS.find((s) => s.value === sectorValue);
  return sector?.label || sectorValue;
}

export function getSubSectorLabel(sectorValue: string, subSectorValue: string): string {
  const sector = SECTORS.find((s) => s.value === sectorValue);
  const subSector = sector?.subSectors?.find((s) => s.value === subSectorValue);
  return subSector?.label || subSectorValue;
}
