// ============================================
// InsightGov Africa - Hook i18n
// Hook React pour la traduction
// ============================================

'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { translations, locales, defaultLocale, Locale, t as translate } from '@/lib/i18n';

// ============================================
// CONTEXT
// ============================================

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  locales: readonly Locale[];
  defaultLocale: Locale;
}

const I18nContext = createContext<I18nContextType | null>(null);

// ============================================
// PROVIDER
// ============================================

interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale = defaultLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    // Persist in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
  }, []);

  const t = useCallback((key: string): string => {
    return translate(key, locale);
  }, [locale]);

  const value: I18nContextType = {
    locale,
    setLocale,
    t,
    locales,
    defaultLocale,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// ============================================
// SHORTCUT HOOK
// ============================================

export function useTranslation() {
  const { t, locale, setLocale } = useI18n();
  return { t, locale, setLocale };
}

// ============================================
// COMPONENT: Language Selector
// ============================================

export function LanguageSelector() {
  const { locale, setLocale, locales } = useI18n();

  const languageNames: Record<Locale, string> = {
    fr: 'Français',
    en: 'English',
    pt: 'Português',
  };

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
    >
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {languageNames[loc]}
        </option>
      ))}
    </select>
  );
}

export default useI18n;
