# 🌐 Configuration du Middleware SetLocale

## 📋 Vue d'ensemble

Le middleware `SetLocale` détecte automatiquement la langue de l'utilisateur et configure l'application en conséquence.

---

## ⚙️ Installation

### 1. Le middleware est déjà créé

Le fichier `app/Http/Middleware/SetLocale.php` contient le middleware.

### 2. Enregistrer le middleware dans Laravel 11

**bootstrap/app.php**

```php
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Ajouter le middleware global pour toutes les requêtes
        $middleware->append(\App\Http\Middleware\SetLocale::class);

        // OU l'ajouter uniquement pour les routes API
        // $middleware->api(append: [
        //     \App\Http\Middleware\SetLocale::class,
        // ]);

        // OU créer un alias pour l'utiliser de manière sélective
        // $middleware->alias([
        //     'setlocale' => \App\Http\Middleware\SetLocale::class,
        // ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
```

---

## 🎯 Modes de détection de la langue

Le middleware détecte la langue dans cet ordre de priorité :

### 1. Paramètre de requête `?lang=fr`

```bash
# Français
curl https://api.example.com/products?lang=fr

# Anglais
curl https://api.example.com/products?lang=en
```

**Utilisation :** Tests, liens partagés, override temporaire

### 2. Header HTTP `Accept-Language`

```bash
# Français
curl -H "Accept-Language: fr" https://api.example.com/products

# Anglais
curl -H "Accept-Language: en" https://api.example.com/products
```

**Utilisation :** Applications frontend (React, Vue, Next.js), mobile apps

### 3. Préférence utilisateur (optionnel)

Si activé dans le middleware :

```php
// Dans SetLocale.php (décommenter)
if (auth()->check() && auth()->user()->preferred_locale) {
    $userLocale = auth()->user()->preferred_locale;
    if ($this->isSupported($userLocale)) {
        return $userLocale;
    }
}
```

**Utilisation :** Utilisateurs authentifiés avec préférence sauvegardée

### 4. Configuration .env

```env
APP_LOCALE=fr
```

**Utilisation :** Langue par défaut de l'application

---

## 🚀 Exemples d'utilisation

### Frontend React/Vue/Next.js

```javascript
// Configuration Axios
import axios from 'axios';

const api = axios.create({
    baseURL: 'https://api.example.com',
    headers: {
        'Accept-Language': localStorage.getItem('language') || 'en'
    }
});

// Changer la langue
function setLanguage(lang) {
    localStorage.setItem('language', lang);
    api.defaults.headers['Accept-Language'] = lang;
}

// Utilisation
setLanguage('fr');
const response = await api.get('/products');
// → { "message": "Produits récupérés avec succès", ... }
```

### Mobile App (React Native)

```javascript
import * as Localization from 'expo-localization';

const userLanguage = Localization.locale.split('-')[0]; // 'fr-FR' → 'fr'

fetch('https://api.example.com/products', {
    headers: {
        'Accept-Language': userLanguage
    }
})
```

### Postman / Insomnia

1. Aller dans les Headers
2. Ajouter : `Accept-Language: fr`
3. Envoyer la requête

### cURL

```bash
# Français
curl -H "Accept-Language: fr" \
     https://api.example.com/products

# Anglais (ou sans header, c'est le défaut)
curl -H "Accept-Language: en" \
     https://api.example.com/products
```

---

## 🔧 Configuration du middleware

### Ajouter de nouvelles langues

**app/Http/Middleware/SetLocale.php**

```php
protected array $supportedLocales = [
    'en', // Anglais
    'fr', // Français
    'es', // Espagnol (ajouter cette ligne)
    'de', // Allemand (ajouter cette ligne)
];
```

**N'oubliez pas de créer les fichiers JSON correspondants :**
- `lang/es.json`
- `lang/de.json`

### Changer la langue par défaut

```php
protected string $defaultLocale = 'fr'; // Français par défaut
```

---

## 🧪 Tests

### Test 1 : Paramètre de requête

```bash
curl https://api.example.com/products?lang=fr
# → Réponse en français

curl https://api.example.com/products?lang=en
# → Réponse en anglais
```

### Test 2 : Header Accept-Language

```bash
curl -H "Accept-Language: fr" https://api.example.com/products
# → Réponse en français

curl -H "Accept-Language: en" https://api.example.com/products
# → Réponse en anglais
```

### Test 3 : Langue par défaut

```bash
curl https://api.example.com/products
# → Réponse dans la langue définie dans APP_LOCALE (.env)
```

### Test 4 : Langue non supportée

```bash
curl -H "Accept-Language: zh" https://api.example.com/products
# → Réponse en anglais (langue par défaut)
```

---

## 🎨 Interface utilisateur (exemple)

### Sélecteur de langue

```html
<!-- Frontend HTML/JavaScript -->
<select id="language-selector" onchange="changeLanguage(this.value)">
    <option value="en">🇬🇧 English</option>
    <option value="fr">🇫🇷 Français</option>
    <option value="es">🇪🇸 Español</option>
</select>

<script>
function changeLanguage(lang) {
    // Sauvegarder la préférence
    localStorage.setItem('language', lang);

    // Mettre à jour le header pour les futures requêtes
    axios.defaults.headers['Accept-Language'] = lang;

    // Recharger la page
    location.reload();
}
</script>
```

---

## 🔒 Avec authentification (optionnel)

### 1. Ajouter une colonne dans la table users

```php
// Migration
Schema::table('users', function (Blueprint $table) {
    $table->string('preferred_locale', 2)->default('en')->after('email');
});
```

### 2. Décommenter dans SetLocale.php

```php
if (auth()->check() && auth()->user()->preferred_locale) {
    $userLocale = auth()->user()->preferred_locale;
    if ($this->isSupported($userLocale)) {
        return $userLocale;
    }
}
```

### 3. Endpoint pour sauvegarder la préférence

```php
// UserController.php
public function updateLanguage(Request $request)
{
    $request->validate([
        'language' => 'required|in:en,fr,es,de'
    ]);

    auth()->user()->update([
        'preferred_locale' => $request->language
    ]);

    return response()->json([
        'message' => __('Language preference updated successfully')
    ]);
}
```

---

## 📊 Monitoring (optionnel)

### Logger les langues utilisées

```php
// Dans SetLocale.php
public function handle(Request $request, Closure $next): Response
{
    $locale = $this->detectLocale($request);

    app()->setLocale($locale);

    // Logger pour analytics
    \Log::info('Locale set', [
        'locale' => $locale,
        'user_id' => auth()->id(),
        'ip' => $request->ip(),
        'path' => $request->path()
    ]);

    return $next($request);
}
```

---

## ✅ Checklist d'installation

- [ ] Middleware créé dans `app/Http/Middleware/SetLocale.php`
- [ ] Middleware enregistré dans `bootstrap/app.php`
- [ ] Langues supportées configurées dans le middleware
- [ ] Fichiers JSON de traduction créés (`lang/fr.json`, etc.)
- [ ] Tests effectués avec différentes langues
- [ ] Documentation partagée avec l'équipe frontend

---

## 🆘 Dépannage

### Le middleware ne s'applique pas

1. Vérifier que le middleware est bien enregistré dans `bootstrap/app.php`
2. Vider le cache : `php artisan config:clear`
3. Vérifier que la langue est dans `$supportedLocales`

### Les traductions ne changent pas

1. Vérifier le header `Accept-Language` dans la requête
2. Tester avec `?lang=fr` dans l'URL
3. Vérifier que le fichier `lang/fr.json` existe
4. Vider le cache : `php artisan cache:clear`

---

**Le middleware est maintenant configuré ! 🎉**

Votre API détectera automatiquement la langue et retournera les traductions appropriées.
