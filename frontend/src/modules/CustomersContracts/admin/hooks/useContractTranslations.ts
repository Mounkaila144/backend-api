import { useParams } from 'next/navigation';

import en from '../../translations/en.json';
import fr from '../../translations/fr.json';
import ar from '../../translations/ar.json';

const dictionaries = { en, fr, ar } as const;

export type ContractTranslations = typeof en;

export function useContractTranslations(): ContractTranslations {
  const { lang } = useParams<{ lang: string }>();

  return dictionaries[lang as keyof typeof dictionaries] || en;
}
