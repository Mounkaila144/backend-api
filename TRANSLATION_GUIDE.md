# 🌍 Guide Complet - Système de Traduction

## 📋 Vue d'ensemble

Ce projet utilise un **système de traduction basé sur JSON** avec **anglais par défaut**.

### Principe de fonctionnement

1. **Texte en anglais dans le code** (pas de fichier de traduction anglais nécessaire)
2. **Fichiers JSON pour les autres langues** (fr.json, es.json, etc.)
3. **Fallback automatique** : Module → Global → Anglais

---

## 🎯 Structure des fichiers

```
lang/
└── fr.json                          # Traductions globales (français)

Modules/{ModuleName}/Resources/lang/
└── fr.json                          # Traductions du module (français)
```

**Note importante** : Pas besoin de fichiers `en.json` car le texte par défaut est déjà en anglais dans le code !

---

## 📝 Utilisation

### 1. Écrire du code avec texte anglais

```php
<?php

namespace Modules\UsersGuard\Http\Controllers\Admin;

use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $user = User::create($request->validated());

        // Texte en anglais directement
        return response()->json([
            'message' => __('User created successfully'),
            'data' => $user
        ], 201);
    }

    public function destroy(User $user): JsonResponse
    {
        $user->delete();

        return response()->json([
            'message' => __('User deleted successfully')
        ]);
    }
}
```

### 2. Résultat selon la langue

```php
// Langue = anglais (par défaut)
app()->setLocale('en');
__('User created successfully')
// → "User created successfully"

// Langue = français (depuis fr.json)
app()->setLocale('fr');
__('User created successfully')
// → "Utilisateur créé avec succès"
```

### 3. Fallback automatique

```php
app()->setLocale('fr');

// Traduction globale (depuis lang/fr.json)
__('Cancel')
// → "Annuler"

// Traduction de module (depuis Modules/UsersGuard/Resources/lang/fr.json)
__('User created successfully')
// → "Utilisateur créé avec succès"

// Non traduit dans fr.json → retourne l'anglais
__('This is not translated')
// → "This is not translated"
```

### 4. Traductions avec paramètres

```php
__('Showing :from to :to of :total results', [
    'from' => 1,
    'to' => 10,
    'total' => 100
])

// Anglais: "Showing 1 to 10 of 100 results"
// Français: "Affichage de 1 à 10 sur 100 résultats"
```

---

## 🗂️ Créer des traductions

### 1. Traductions globales

**lang/fr.json** (traductions disponibles partout)
```json
{
    "Welcome": "Bienvenue",
    "Cancel": "Annuler",
    "Save": "Enregistrer",
    "Delete": "Supprimer",
    "Operation successful": "Opération réussie",
    "An error occurred": "Une erreur s'est produite"
}
```

### 2. Traductions de module

**Modules/UsersGuard/Resources/lang/fr.json** (spécifique au module)
```json
{
    "User created successfully": "Utilisateur créé avec succès",
    "User updated successfully": "Utilisateur mis à jour avec succès",
    "User deleted successfully": "Utilisateur supprimé avec succès",
    "Invalid credentials": "Identifiants invalides",
    "Account is disabled": "Le compte est désactivé"
}
```

### 3. Priorité de chargement

Pour la clé `"Cancel"` :

1. ✅ Cherche dans `Modules/UsersGuard/Resources/lang/fr.json`
2. ✅ Si non trouvée, cherche dans `lang/fr.json`
3. ✅ Si toujours non trouvée, retourne le texte anglais `"Cancel"`

---

## 🌍 Changer la langue

### Option 1 : Dans .env (langue par défaut de l'application)

```env
APP_LOCALE=fr          # Français par défaut
APP_FALLBACK_LOCALE=en # Anglais si traduction introuvable
```

### Option 2 : Dynamiquement dans le code

```php
// Français
app()->setLocale('fr');

// Anglais
app()->setLocale('en');

// Espagnol
app()->setLocale('es');
```

### Option 3 : Via middleware (recommandé pour API)

**app/Http/Middleware/SetLocale.php**
```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SetLocale
{
    public function handle(Request $request, Closure $next)
    {
        // Récupérer la langue depuis le header
        $locale = $request->header('Accept-Language', 'en');

        // Valider et appliquer
        $supportedLocales = ['en', 'fr', 'es'];

        if (in_array($locale, $supportedLocales)) {
            app()->setLocale($locale);
        }

        return $next($request);
    }
}
```

**Utilisation dans une requête API :**
```bash
curl -H "Accept-Language: fr" https://api.example.com/users
```

---

## ➕ Ajouter une nouvelle langue

### 1. Créer les fichiers JSON

**lang/es.json** (espagnol global)
```json
{
    "Welcome": "Bienvenido",
    "Cancel": "Cancelar",
    "Save": "Guardar"
}
```

**Modules/UsersGuard/Resources/lang/es.json** (espagnol module)
```json
{
    "User created successfully": "Usuario creado exitosamente",
    "Invalid credentials": "Credenciales inválidas"
}
```

### 2. C'est tout !

Le système chargera automatiquement les traductions espagnoles :

```php
app()->setLocale('es');
__('User created successfully')
// → "Usuario creado exitosamente"
```

---

## 🔄 Workflow de développement

### 1. Écrire le code en anglais

```php
return response()->json([
    'message' => __('Item deleted successfully')
]);
```

### 2. Tester en anglais

```bash
# Pas besoin de créer de fichier, ça fonctionne directement
curl -H "Accept-Language: en" https://api.example.com/items/1
# → "Item deleted successfully"
```

### 3. Ajouter les traductions

**lang/fr.json**
```json
{
    "Item deleted successfully": "Élément supprimé avec succès"
}
```

### 4. Tester en français

```bash
curl -H "Accept-Language: fr" https://api.example.com/items/1
# → "Élément supprimé avec succès"
```

---

## ✨ Exemples pratiques

### Exemple 1 : CRUD complet

```php
<?php

namespace Modules\Products\Http\Controllers\Admin;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::paginate(10);

        return response()->json([
            'message' => __('Products retrieved successfully'),
            'data' => $products
        ]);
    }

    public function store(Request $request)
    {
        $product = Product::create($request->validated());

        return response()->json([
            'message' => __('Product created successfully'),
            'data' => $product
        ], 201);
    }

    public function update(Request $request, Product $product)
    {
        $product->update($request->validated());

        return response()->json([
            'message' => __('Product updated successfully'),
            'data' => $product
        ]);
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return response()->json([
            'message' => __('Product deleted successfully')
        ]);
    }
}
```

**Traductions françaises (Modules/Products/Resources/lang/fr.json)**
```json
{
    "Products retrieved successfully": "Produits récupérés avec succès",
    "Product created successfully": "Produit créé avec succès",
    "Product updated successfully": "Produit mis à jour avec succès",
    "Product deleted successfully": "Produit supprimé avec succès"
}
```

### Exemple 2 : Gestion d'erreurs

```php
public function login(Request $request)
{
    $credentials = $request->only('email', 'password');

    if (!Auth::attempt($credentials)) {
        return response()->json([
            'error' => __('Invalid credentials')
        ], 401);
    }

    if (!Auth::user()->is_active) {
        return response()->json([
            'error' => __('Account is disabled')
        ], 403);
    }

    return response()->json([
        'message' => __('Login successful'),
        'token' => Auth::user()->createToken('auth_token')->plainTextToken
    ]);
}
```

### Exemple 3 : Validation personnalisée

```php
public function store(Request $request)
{
    $validator = Validator::make($request->all(), [
        'email' => 'required|email|unique:users',
        'password' => 'required|min:8',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'error' => __('Validation error'),
            'errors' => $validator->errors()
        ], 422);
    }

    // ...
}
```

---

## 📊 Avantages de ce système

### ✅ Simplicité

- Pas besoin de créer de fichiers pour l'anglais
- Texte anglais lisible directement dans le code
- Un seul fichier JSON par langue

### ✅ Performance

- Chargement rapide des JSON
- Pas de fichiers multiples à parcourir

### ✅ Maintenabilité

- Facile de voir quelles phrases sont traduites
- Un seul endroit par langue pour chercher
- Copier-coller facile du texte anglais comme clé

### ✅ Fallback automatique

- Module → Global → Anglais
- Aucune configuration supplémentaire

---

## 🔍 Debugging

### Voir les traductions chargées

```php
// Dans tinker
php artisan tinker

>>> app()->setLocale('fr');
>>> __('User created successfully');
=> "Utilisateur créé avec succès"

>>> __('This is not translated');
=> "This is not translated"
```

### Vider le cache

```bash
php artisan config:clear
php artisan cache:clear
```

---

## 🚀 Checklist pour nouveau module

- [ ] Créer `Modules/{Module}/Resources/lang/fr.json`
- [ ] Ajouter les traductions françaises
- [ ] Utiliser `__('English text')` dans le code
- [ ] Tester en français et anglais
- [ ] (Optionnel) Ajouter d'autres langues (es.json, de.json, etc.)

---

## 📚 Langues supportées

Par défaut :
- 🇬🇧 **Anglais (en)** - Par défaut, pas de fichier nécessaire
- 🇫🇷 **Français (fr)** - lang/fr.json

Facilement extensible :
- 🇪🇸 Espagnol (es)
- 🇩🇪 Allemand (de)
- 🇮🇹 Italien (it)
- etc.

---

## ✅ Tests réussis

```
✓ Texte anglais par défaut (sans fichier de traduction)
✓ Traductions françaises (lang/fr.json)
✓ Traductions de module (Modules/*/Resources/lang/fr.json)
✓ Fallback Module → Global → Anglais
✓ Traductions avec paramètres (:from, :to, :total)
✓ Texte non traduit retourne l'anglais
```

---

**Le système est prêt ! 🎉**

Écrivez simplement votre code en anglais avec `__('Your text')` et ajoutez les traductions JSON au fur et à mesure.
