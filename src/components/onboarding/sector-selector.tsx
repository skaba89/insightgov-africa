/**
 * InsightGov Africa - Sector Selector
 * =====================================
 * Composant de sélection du secteur d'activité.
 */

'use client';

import { useOnboardingStore } from '@/stores/onboarding-store';
import { SECTORS } from '@/types';
import {
  Heart,
  GraduationCap,
  Wheat,
  Banknote,
  Building2,
  Zap,
  Users,
  Leaf,
  ShoppingCart,
  Mountain,
  Truck,
  Signal,
  Folder,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mapping des icônes
const SECTOR_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  health: Heart,
  education: GraduationCap,
  agriculture: Wheat,
  finance: Banknote,
  infrastructure: Building2,
  energy: Zap,
  social: Users,
  environment: Leaf,
  trade: ShoppingCart,
  mining: Mountain,
  transport: Truck,
  telecom: Signal,
  other: Folder,
};

// Couleurs par secteur
const SECTOR_COLORS: Record<string, string> = {
  health: 'text-rose-500 bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800',
  education: 'text-blue-500 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
  agriculture: 'text-green-500 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800',
  finance: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800',
  infrastructure: 'text-orange-500 bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800',
  energy: 'text-purple-500 bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800',
  social: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950 border-cyan-200 dark:border-cyan-800',
  environment: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800',
  trade: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800',
  mining: 'text-amber-500 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800',
  transport: 'text-sky-500 bg-sky-50 dark:bg-sky-950 border-sky-200 dark:border-sky-800',
  telecom: 'text-violet-500 bg-violet-50 dark:bg-violet-950 border-violet-200 dark:border-violet-800',
  other: 'text-gray-500 bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800',
};

const SECTOR_SELECTED: Record<string, string> = {
  health: 'ring-2 ring-rose-500 border-rose-500 bg-rose-100 dark:bg-rose-900',
  education: 'ring-2 ring-blue-500 border-blue-500 bg-blue-100 dark:bg-blue-900',
  agriculture: 'ring-2 ring-green-500 border-green-500 bg-green-100 dark:bg-green-900',
  finance: 'ring-2 ring-yellow-500 border-yellow-500 bg-yellow-100 dark:bg-yellow-900',
  infrastructure: 'ring-2 ring-orange-500 border-orange-500 bg-orange-100 dark:bg-orange-900',
  energy: 'ring-2 ring-purple-500 border-purple-500 bg-purple-100 dark:bg-purple-900',
  social: 'ring-2 ring-cyan-500 border-cyan-500 bg-cyan-100 dark:bg-cyan-900',
  environment: 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-100 dark:bg-emerald-900',
  trade: 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-100 dark:bg-indigo-900',
  mining: 'ring-2 ring-amber-500 border-amber-500 bg-amber-100 dark:bg-amber-900',
  transport: 'ring-2 ring-sky-500 border-sky-500 bg-sky-100 dark:bg-sky-900',
  telecom: 'ring-2 ring-violet-500 border-violet-500 bg-violet-100 dark:bg-violet-900',
  other: 'ring-2 ring-gray-500 border-gray-500 bg-gray-100 dark:bg-gray-900',
};

interface SectorSelectorProps {
  value?: string;
  onChange?: (sector: string) => void;
}

export function SectorSelector({ value, onChange }: SectorSelectorProps) {
  const storeSector = useOnboardingStore((state) => state.sector);
  const setSector = useOnboardingStore((state) => state.setSector);

  const selectedSector = value || storeSector;
  const handleSelect = (sectorValue: string) => {
    if (onChange) {
      onChange(sectorValue);
    } else {
      setSector(sectorValue as typeof storeSector);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {SECTORS.map((sector) => {
        const Icon = SECTOR_ICONS[sector.value] || Folder;
        const isSelected = selectedSector === sector.value;

        return (
          <button
            key={sector.value}
            type="button"
            onClick={() => handleSelect(sector.value)}
            className={cn(
              'relative flex flex-col items-center p-4 rounded-xl border transition-all duration-200',
              'hover:shadow-md hover:scale-[1.02] cursor-pointer',
              isSelected
                ? SECTOR_SELECTED[sector.value]
                : SECTOR_COLORS[sector.value]
            )}
          >
            {/* Icône */}
            <div className="p-2 rounded-lg mb-2 bg-white/50 dark:bg-black/20">
              <Icon className="w-6 h-6" />
            </div>

            {/* Label */}
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100 text-center">
              {sector.label}
            </span>

            {/* Indicateur sélection */}
            {isSelected && (
              <div className="absolute top-1 right-1">
                <div className="w-5 h-5 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                  <svg
                    className="w-3 h-3 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Composant compact pour l'affichage du secteur sélectionné
export function SectorBadge({ sector }: { sector: string }) {
  const sectorInfo = SECTORS.find((s) => s.value === sector);
  const Icon = SECTOR_ICONS[sector] || Folder;

  if (!sectorInfo) return null;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border',
        SECTOR_COLORS[sector]
      )}
    >
      <Icon className="w-4 h-4" />
      {sectorInfo.label}
    </div>
  );
}

export default SectorSelector;
