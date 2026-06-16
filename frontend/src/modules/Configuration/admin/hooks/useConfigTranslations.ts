import { useParams } from 'next/navigation'

import en from '../../translations/en.json'
import fr from '../../translations/fr.json'
import ar from '../../translations/ar.json'

const dictionaries = { en, fr, ar } as const

export type ConfigTranslations = typeof en

export function useConfigTranslations(): ConfigTranslations {
  const { lang } = useParams<{ lang: string }>()

  return dictionaries[lang as keyof typeof dictionaries] || en
}
