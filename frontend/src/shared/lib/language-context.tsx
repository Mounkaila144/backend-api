'use client';

import type { ReactNode} from 'react';
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

import { useParams } from 'next/navigation';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const urlLocale = params?.lang as string | undefined;

  const [language, setLanguageState] = useState<string>(urlLocale || 'fr');

  // Sync with URL locale — URL is the source of truth
  useEffect(() => {
    if (urlLocale && urlLocale !== language) {
      setLanguageState(urlLocale);
      localStorage.setItem('app_language', urlLocale);
    }
  }, [urlLocale]);

  const setLanguage = useCallback((lang: string) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    language,
    setLanguage
  }), [language, setLanguage]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  
return context;
}
