# 🥇 Système de Priorité des Traductions

## 📋 Vue d'ensemble

Le système de traduction utilise un **système de priorité absolue** où les traductions des modules **écrasent toujours** les traductions globales.

---

## 🎯 Ordre de priorité

### 1. 🥇 MODULE (Priorité absolue)

**Chemin** : `Modules/{ModuleName}/Resources/lang/{locale}.json`

**Comportement** : Si une clé existe dans le module, elle sera **toujours** utilisée, même si elle existe aussi dans le global.

**Exemple** :
```json
// Modules/UsersGuard/Resources/lang/fr.json
{
    "User login successfully": "l'utilisateur c'est bien connecter"
}
```

### 2. 🥈 GLOBAL (Fallback)

**Chemin** : `lang/{locale}.json`

**Comportement** : Utilisé **seulement** si la clé n'existe pas dans le module.

**Exemple** :
```json
// lang/fr.json
{
    "Cancel": "Annuler",
    "Save": "Enregistrer"
}
```

### 3. 🥉 ANGLAIS (Par défaut)

**Chemin** : Texte dans le code

**Comportement** : Utilisé si aucune traduction n'existe.

**Exemple** :
```php
__('This text has no translation') → "This text has no translation"
```

---

## 📊 Cas d'usage

### Cas 1 : Clé UNIQUEMENT dans GLOBAL

```json
// lang/fr.json
{
    "Cancel": "Annuler"
}

// Modules/UsersGuard/Resources/lang/fr.json
{
    // "Cancel" n'existe pas ici
}
```

**Résultat :**
```php
__('Cancel') → "Annuler" ✅ (depuis global)
```

---

### Cas 2 : Clé UNIQUEMENT dans MODULE

```json
// lang/fr.json
{
    // "User created successfully" n'existe pas ici
}

// Modules/UsersGuard/Resources/lang/fr.json
{
    "User created successfully": "Utilisateur créé avec succès"
}
```

**Résultat :**
```php
__('User created successfully') → "Utilisateur créé avec succès" ✅ (depuis module)
```

---

### Cas 3 : Clé dans MODULE **ET** GLOBAL → **MODULE GAGNE**

```json
// lang/fr.json
{
    "User login successfully": "Connexion utilisateur (GLOBAL)"
}

// Modules/UsersGuard/Resources/lang/fr.json
{
    "User login successfully": "l'utilisateur c'est bien connecter (MODULE)"
}
```

**Résultat :**
```php
__('User login successfully')
→ "l'utilisateur c'est bien connecter (MODULE)" ✅

// Le global est COMPLÈTEMENT IGNORÉ ❌
```

**C'est LE COMPORTEMENT CLÉ : Le module a TOUJOURS priorité !**

---

### Cas 4 : Clé n'existe NULLE PART

```json
// lang/fr.json
{
    // Rien
}

// Modules/UsersGuard/Resources/lang/fr.json
{
    // Rien
}
```

**Résultat :**
```php
__('This text is not translated')
→ "This text is not translated" ✅ (anglais par défaut)
```

---

## 🛠️ Implémentation technique

### Méthode `loadJsonPaths()` (ModularFileLoader)

```php
protected function loadJsonPaths($locale)
{
    $translations = [];

    // 1. Charger GLOBAL en premier (base)
    $globalFile = base_path('lang') . "/{$locale}.json";
    if (file_exists($globalFile)) {
        $translations = json_decode(file_get_contents($globalFile), true);
    }

    // 2. Charger TOUS les MODULES et merger (modules écrasent global)
    $modules = glob(base_path('Modules/*'), GLOB_ONLYDIR);
    foreach ($modules as $modulePath) {
        $moduleFile = $modulePath . "/Resources/lang/{$locale}.json";
        if (file_exists($moduleFile)) {
            $moduleTranslations = json_decode(file_get_contents($moduleFile), true);

            // array_merge : le dernier écrase le premier
            $translations = array_merge($translations, $moduleTranslations);
        }
    }

    return $translations;
}
```

### Pourquoi `array_merge` ?

Avec `array_merge($array1, $array2)`, les clés de `$array2` **écrasent** celles de `$array1`.

**Exemple :**
```php
$global = ['Welcome' => 'Bonjour global'];
$module = ['Welcome' => 'Bonjour module'];

$result = array_merge($global, $module);
// → ['Welcome' => 'Bonjour module'] ✅
```

---

## ✨ Avantages du système

### 1. **Personnalisation par module**

Chaque module peut avoir sa propre version d'une traduction sans affecter les autres modules.

**Exemple :**
```json
// Global
{
    "Welcome": "Bienvenue"
}

// Module Shop
{
    "Welcome": "Bienvenue dans notre boutique"
}

// Module Admin
{
    "Welcome": "Bienvenue dans l'administration"
}
```

### 2. **Fallback automatique**

Si un module n'a pas de traduction, le global est utilisé automatiquement.

**Pas besoin de dupliquer les traductions communes !**

### 3. **Maintenance simple**

- **Traductions communes** → `lang/fr.json`
- **Traductions spécifiques** → `Modules/{Module}/Resources/lang/fr.json`

---

## 📝 Bonnes pratiques

### ✅ À faire

1. **Mettre les traductions communes dans le global**
   ```json
   // lang/fr.json
   {
       "Cancel": "Annuler",
       "Save": "Enregistrer",
       "Delete": "Supprimer"
   }
   ```

2. **Mettre les traductions spécifiques dans le module**
   ```json
   // Modules/UsersGuard/Resources/lang/fr.json
   {
       "User created successfully": "Utilisateur créé",
       "Invalid credentials": "Identifiants invalides"
   }
   ```

3. **Surcharger le global si nécessaire**
   ```json
   // Modules/Shop/Resources/lang/fr.json
   {
       "Welcome": "Bienvenue dans notre boutique" // Override global
   }
   ```

### ❌ À éviter

1. **Ne pas dupliquer inutilement**
   ```json
   // ❌ Mauvais
   // Modules/UsersGuard/Resources/lang/fr.json
   {
       "Cancel": "Annuler",  // Déjà dans global !
       "Save": "Enregistrer" // Déjà dans global !
   }
   ```

2. **Ne pas mettre tout dans le module**
   ```json
   // ❌ Mauvais - Mettre les traductions communes dans global
   ```

---

## 🧪 Tests

### Test de priorité

```php
// Ajouter la même clé dans les deux fichiers

// lang/fr.json
{
    "Test key": "Valeur GLOBAL"
}

// Modules/UsersGuard/Resources/lang/fr.json
{
    "Test key": "Valeur MODULE"
}

// Test
app()->setLocale('fr');
echo __('Test key');
// → "Valeur MODULE" ✅

// Le module gagne TOUJOURS
```

### Vérifier l'ordre de chargement

```bash
php artisan tinker

>>> app()->setLocale('fr');
>>> __('Your key here');
```

---

## 🔧 Configuration

Le système est configuré dans :

- **Service Provider** : `app/Providers/TranslationServiceProvider.php`
  - Méthode `loadJsonPaths()` : Gère l'ordre de chargement
  - Ordre : Global → Modules (avec array_merge)

- **Middleware** : `app/Http/Middleware/SetLocale.php`
  - Détecte la langue automatiquement

---

## 📚 Documentation liée

- **[TRANSLATION_README.md](TRANSLATION_README.md)** - Vue d'ensemble
- **[TRANSLATION_GUIDE.md](TRANSLATION_GUIDE.md)** - Guide complet
- **[TRANSLATION_QUICK_REFERENCE.md](TRANSLATION_QUICK_REFERENCE.md)** - Référence rapide
- **[TRANSLATION_SUMMARY.md](TRANSLATION_SUMMARY.md)** - Résumé technique

---

## ✅ Résumé

| Priorité | Chemin | Comportement |
|----------|--------|--------------|
| 🥇 **1** | `Modules/{Module}/Resources/lang/{locale}.json` | **PRIORITÉ ABSOLUE** - Écrase tout |
| 🥈 **2** | `lang/{locale}.json` | Fallback si pas dans module |
| 🥉 **3** | Code (anglais) | Si aucune traduction |

**Règle d'or** : **MODULE > GLOBAL > ANGLAIS**

---

**Le système est maintenant configuré avec priorité MODULE ! 🎉**
