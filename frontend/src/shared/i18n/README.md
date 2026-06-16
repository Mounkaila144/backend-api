# Translation System (i18n)

## Philosophy: English as Default

- **All code text is in English**
- **Translations only for other languages** (French, Arabic)
- **No English translation files needed**
- **Automatic fallback to English text**

## Quick Start

### 1. Write Code in English

```typescript
'use client';
import { useTranslation } from '@/shared/i18n';

export function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('Welcome')}</h1>
      <button>{t('Save')}</button>
      <button>{t('Cancel')}</button>
    </div>
  );
}
```

### 2. Create Translations (Non-English Only)

**Global translations** - `src/shared/i18n/translations/fr.json`:
```json
{
  "Save": "Enregistrer",
  "Cancel": "Annuler",
  "Delete": "Supprimer"
}
```

**Module translations** - `src/modules/YourModule/translations/fr.json`:
```json
{
  "Welcome": "Bienvenue",
  "Custom text for this module": "Texte personnalisé pour ce module"
}
```

### 3. How It Works

```typescript
const { t } = useTranslation('YourModule');

// When locale is 'en':
t('Save')  // → "Save" (no file lookup)

// When locale is 'fr':
t('Save')  // → "Enregistrer" (from global or module translations)

// When translation not found:
t('Untranslated text')  // → "Untranslated text" (English fallback)
```

## Directory Structure

```
src/shared/i18n/
├── translations/      # Global translations (non-English only!)
│   ├── fr.json       # French
│   └── ar.json       # Arabic
│   (NO en.json!)
└── ...

src/modules/YourModule/
├── translations/      # Module translations (non-English only!)
│   ├── fr.json
│   └── ar.json
│   (NO en.json!)
└── ...
```

## Translation Fallback

```
t('Some text')
   ↓
1. Is locale 'en'? → Return "Some text" immediately
   ↓
2. Check: modules/YourModule/translations/fr.json
   ↓ (not found)
3. Check: shared/i18n/translations/fr.json
   ↓ (not found)
4. Return: "Some text" (English fallback)
```

## API

### `useTranslation(moduleName?: string)`

```typescript
const { t, locale, setLocale } = useTranslation('ModuleName');

// t(defaultText: string, params?: Record<string, string | number>): string
t('Save')                              // → Translation or English
t('Welcome, {name}!', { name: 'John' }) // → With parameters

// locale: 'fr' | 'en' | 'ar'
console.log(locale);

// setLocale(locale: 'fr' | 'en' | 'ar'): void
setLocale('fr');
```

## Creating Module Translations

### Step 1: Write Component in English

```typescript
const { t } = useTranslation('Products');

return (
  <div>
    <h1>{t('Create Product')}</h1>
    <button>{t('Save')}</button>
  </div>
);
```

### Step 2: Create Translation Files

```bash
mkdir src/modules/Products/translations
```

Create `fr.json` (NO `en.json`!):
```json
{
  "Create Product": "Créer un produit"
}
```

**Note:** `Save` will automatically use the global translation!

## Best Practices

✅ **DO:**
- Write all code text in English
- Use natural English sentences: `'Delete item'`, not `'delete_item'`
- Use exact same English text throughout app for consistency
- Create only `fr.json` and `ar.json` files

❌ **DON'T:**
- Create `en.json` files (not needed!)
- Use keys like `'common.save'` (use `'Save'` instead)
- Use different English variations (`'Save'` vs `'Save changes'`)

## Supported Languages

- **en** - English (default, no files needed)
- **fr** - Français (create `fr.json`)
- **ar** - العربية (create `ar.json`)

## Examples

See `TRANSLATION_EXAMPLE.md` for comprehensive examples.
