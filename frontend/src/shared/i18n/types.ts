/**
 * Translation System Types
 */

export type Locale = 'fr' | 'en' | 'ar';

export type TranslationKeys = Record<string, string | Record<string, string>>;

export interface TranslationContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export interface UseTranslationReturn {
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export interface TranslationProviderProps {
  children: React.ReactNode;
  defaultLocale?: Locale;
}
