'use client';

import React, { createContext, useContext } from 'react';

import { useLanguage } from '@/shared/lib/language-context';
import type { Locale, TranslationContextValue } from './types';

const TranslationContext = createContext<TranslationContextValue | undefined>(undefined);

/**
 * Translation Provider
 * Integrates with the existing LanguageProvider to avoid duplication
 *
 * Note: This component must be used within a LanguageProvider
 */
export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const { language, setLanguage } = useLanguage();

  // Ensure locale is a valid Locale type
  const locale = (language === 'fr' || language === 'en' || language === 'ar')
    ? language as Locale
    : 'fr';

  React.useEffect(() => {
    console.log('🌍 [TranslationProvider] Locale:', locale);
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    console.log('🌍 [TranslationProvider] setLocale called:', newLocale);
    setLanguage(newLocale);
  };

  // Placeholder t function (will be overridden by useTranslation hook)
  const t = (key: string) => key;

  return (
    <TranslationContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

/**
 * Hook to access translation context
 */
export function useTranslationContext() {
  const context = useContext(TranslationContext);

  if (context === undefined) {
    throw new Error('useTranslationContext must be used within a TranslationProvider');
  }

  
return context;
}
