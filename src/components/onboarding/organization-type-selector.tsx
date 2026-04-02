/**
 * InsightGov Africa - Organization Type Selector
 * ===============================================
 * Composant de sélection du type d'organisation (Ministère, ONG, Entreprise).
 */

'use client';

import { useOnboardingStore } from '@/stores/onboarding-store';
import { ORGANIZATION_TYPES } from '@/types';
import { Building2, Globe, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

// Icônes correspondant aux types
const TYPE_ICONS = {
  ministry: Building2,
  ngo: Globe,
  enterprise: Briefcase,
};

// Couleurs par type
const TYPE_COLORS = {
  ministry: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950',
  ngo: 'border-blue-500 bg-blue-50 dark:bg-blue-950',
  enterprise: 'border-amber-500 bg-amber-50 dark:bg-amber-950',
};

const TYPE_SELECTED_COLORS = {
  ministry: 'border-emerald-600 bg-emerald-100 dark:bg-emerald-900 ring-2 ring-emerald-500',
  ngo: 'border-blue-600 bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500',
  enterprise: 'border-amber-600 bg-amber-100 dark:bg-amber-900 ring-2 ring-amber-500',
};

interface OrganizationTypeSelectorProps {
  value?: string;
  onChange?: (type: 'ministry' | 'ngo' | 'enterprise') => void;
}

export function OrganizationTypeSelector({
  value,
  onChange,
}: OrganizationTypeSelectorProps) {
  // Utiliser le store si pas de valeur externe
  const storeType = useOnboardingStore((state) => state.organizationType);
  const setOrganizationType = useOnboardingStore((state) => state.setOrganizationType);

  const selectedType = value || storeType;
  const handleSelect = (type: 'ministry' | 'ngo' | 'enterprise') => {
    if (onChange) {
      onChange(type);
    } else {
      setOrganizationType(type);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {ORGANIZATION_TYPES.map((option) => {
        const Icon = TYPE_ICONS[option.value];
        const isSelected = selectedType === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleSelect(option.value)}
            className={cn(
              'relative flex flex-col items-center p-6 rounded-xl border-2 transition-all duration-200',
              'hover:shadow-lg hover:scale-[1.02] cursor-pointer text-left',
              isSelected
                ? TYPE_SELECTED_COLORS[option.value]
                : TYPE_COLORS[option.value]
            )}
          >
            {/* Icône */}
            <div
              className={cn(
                'p-3 rounded-full mb-4',
                isSelected
                  ? 'bg-white dark:bg-gray-800 shadow-md'
                  : 'bg-white/50 dark:bg-gray-800/50'
              )}
            >
              <Icon
                className={cn(
                  'w-8 h-8',
                  option.value === 'ministry' && 'text-emerald-600',
                  option.value === 'ngo' && 'text-blue-600',
                  option.value === 'enterprise' && 'text-amber-600'
                )}
              />
            </div>

            {/* Titre */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 text-center">
              {option.label}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
              {option.description}
            </p>

            {/* Indicateur sélection */}
            {isSelected && (
              <div className="absolute top-2 right-2">
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center',
                    option.value === 'ministry' && 'bg-emerald-500',
                    option.value === 'ngo' && 'bg-blue-500',
                    option.value === 'enterprise' && 'bg-amber-500'
                  )}
                >
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
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

export default OrganizationTypeSelector;
