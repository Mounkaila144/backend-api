'use client';

import { useTranslation } from '@/shared/i18n';

/**
 * Example Component - Translation System
 *
 * This component demonstrates how to use the translation system:
 * 1. All text is written in English
 * 2. The t() function automatically translates based on current locale
 * 3. Falls back to English if translation not found
 */
export function TranslationExample() {
  const { t, locale, setLocale } = useTranslation();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">
        {t('Translation System Example')}
      </h1>

      <div className="mb-6">
        <p className="mb-2">
          {t('Current Language')}: <strong>{locale}</strong>
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setLocale('en')}
            className={`px-4 py-2 rounded ${
              locale === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLocale('fr')}
            className={`px-4 py-2 rounded ${
              locale === 'fr' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Français
          </button>
          <button
            onClick={() => setLocale('ar')}
            className={`px-4 py-2 rounded ${
              locale === 'ar' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            العربية
          </button>
        </div>
      </div>

      <div className="space-y-4 bg-gray-50 p-4 rounded">
        <h2 className="font-semibold">{t('Common Actions')}</h2>
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-green-600 text-white rounded">
            {t('Save')}
          </button>
          <button className="px-3 py-1 bg-gray-600 text-white rounded">
            {t('Cancel')}
          </button>
          <button className="px-3 py-1 bg-red-600 text-white rounded">
            {t('Delete')}
          </button>
          <button className="px-3 py-1 bg-blue-600 text-white rounded">
            {t('Edit')}
          </button>
        </div>

        <h2 className="font-semibold mt-6">{t('Messages')}</h2>
        <div className="space-y-2">
          <p className="text-green-700">{t('Operation successful')}</p>
          <p className="text-red-700">{t('An error occurred')}</p>
          <p className="text-blue-700">{t('Loading...')}</p>
        </div>

        <h2 className="font-semibold mt-6">{t('With Parameters')}</h2>
        <p>{t('Welcome, {name}!', { name: 'John' })}</p>

        <h2 className="font-semibold mt-6">{t('Untranslated Text')}</h2>
        <p className="text-gray-600">
          {t('This text has no translation, so it shows in English')}
        </p>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">{t('How it works')}</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>{t('All text in code is written in English')}</li>
          <li>{t('Translations are created only for other languages')}</li>
          <li>{t('No English translation files needed')}</li>
          <li>{t('Automatic fallback to English if translation not found')}</li>
        </ul>
      </div>
    </div>
  );
}
