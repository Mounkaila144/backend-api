# 🌍 Système de Traduction Multi-Modules

## ✅ Installation terminée et testée

Le système de traduction avec **anglais par défaut** et **fichiers JSON** est maintenant opérationnel !

---

## 🎯 Comment ça marche

### Principe simple

1. **Vous écrivez en anglais** dans votre code PHP
2. **Vous ajoutez les traductions** dans des fichiers JSON (fr.json, es.json, etc.)
3. **Le système gère** automatiquement le fallback

### Exemple concret

**Dans votre contrôleur :**
```php
return response()->json([
    'message' => __('User created successfully')
]);
```

**Résultat :**
- En anglais : `"User created successfully"` (texte par défaut)
- En français : `"Utilisateur créé avec succès"` (depuis fr.json)

---

## 📁 Structure des fichiers

```
backend-api/
├── lang/
│   └── fr.json                              # Traductions globales (français)
│
└── Modules/
    └── {ModuleName}/
        └── Resources/
            └── lang/
                └── fr.json                  # Traductions du module (français)
```

**Important :** Pas de fichier `en.json` nécessaire ! L'anglais est le texte par défaut dans le code.

---

## 🚀 Utilisation rapide

### Écrire du code avec traductions

```php
<?php

namespace Modules\UsersGuard\Http\Controllers\Admin;

class UserController extends Controller
{
    public function store(Request $request)
    {
        $user = User::create($request->validated());

        return response()->json([
            'message' => __('User created successfully'),
            'data' => $user
        ], 201);
    }

    public function destroy(User $user)
    {
        $user->delete();

        return response()->json([
            'message' => __('User deleted successfully')
        ]);
    }
}
```

### Ajouter les traductions françaises

**Modules/UsersGuard/Resources/lang/fr.json**
```json
{
    "User created successfully": "Utilisateur créé avec succès",
    "User deleted successfully": "Utilisateur supprimé avec succès"
}
```

### Tester

```php
// Anglais
app()->setLocale('en');
__('User created successfully')
// → "User created successfully"

// Français
app()->setLocale('fr');
__('User created successfully')
// → "Utilisateur créé avec succès"
```

---

## 🔄 Système de priorité et fallback

Le système fonctionne avec **priorité MODULE** et **fallback automatique** :

### Priorité (pour les clés qui existent dans plusieurs endroits)

1. **🥇 MODULE** : `Modules/{Module}/Resources/lang/fr.json` - **PRIORITÉ ABSOLUE**
2. **🥈 GLOBAL** : `lang/fr.json` - Écrasé par le module si la clé existe
3. **🥉 ANGLAIS** : Texte par défaut du code - Si aucune traduction

**Important** : Si une traduction existe à la fois dans le module ET dans le global, **le module gagne toujours**.

**Exemple :**

```php
app()->setLocale('fr');

// Cas 1: Traduction UNIQUEMENT dans GLOBAL
__('Cancel')  → "Annuler" (depuis lang/fr.json)

// Cas 2: Traduction UNIQUEMENT dans MODULE
__('User created successfully')  → "Utilisateur créé avec succès" (depuis module)

// Cas 3: Traduction dans MODULE ET GLOBAL → MODULE GAGNE
// Si "Welcome" existe dans les deux fichiers :
// - lang/fr.json → "Welcome": "Bienvenue"
// - Modules/UsersGuard/Resources/lang/fr.json → "Welcome": "Bienvenue sur UsersGuard"
__('Welcome')  → "Bienvenue sur UsersGuard" (MODULE en priorité)

// Cas 4: Aucune traduction → retourne l'anglais
__('This is not translated')  → "This is not translated"
```

---

## 📚 Documentation

| Fichier | Description |
|---------|-------------|
| **[TRANSLATION_GUIDE.md](TRANSLATION_GUIDE.md)** | 📖 Documentation complète avec exemples |
| **[TRANSLATION_QUICK_REFERENCE.md](TRANSLATION_QUICK_REFERENCE.md)** | ⚡ Référence rapide pour développeurs |
| **Ce fichier** | 📋 Vue d'ensemble et démarrage rapide |

---

## ⚙️ Configuration

### Langue par défaut (.env)

```env
APP_LOCALE=fr          # Langue par défaut de l'application
APP_FALLBACK_LOCALE=en # Langue de secours
```

### Changer la langue dynamiquement

```php
// Dans le code
app()->setLocale('fr');
```

### Via middleware (recommandé pour API)

```php
// app/Http/Middleware/SetLocale.php
public function handle(Request $request, Closure $next)
{
    $locale = $request->header('Accept-Language', 'en');

    if (in_array($locale, ['en', 'fr', 'es'])) {
        app()->setLocale($locale);
    }

    return $next($request);
}
```

**Utilisation :**
```bash
curl -H "Accept-Language: fr" https://api.example.com/users
```

---

## ➕ Ajouter une langue

### 1. Créer les fichiers JSON

**lang/es.json** (espagnol global)
```json
{
    "Welcome": "Bienvenido",
    "Cancel": "Cancelar"
}
```

**Modules/UsersGuard/Resources/lang/es.json** (espagnol module)
```json
{
    "User created successfully": "Usuario creado exitosamente"
}
```

### 2. C'est tout !

```php
app()->setLocale('es');
__('User created successfully')
// → "Usuario creado exitosamente"
```

---

## ✨ Fichiers de traduction existants

### Global (lang/fr.json)

- Welcome → Bienvenue
- Cancel → Annuler
- Save → Enregistrer
- Delete → Supprimer
- Operation successful → Opération réussie
- ... et plus encore

### Module UsersGuard (Modules/UsersGuard/Resources/lang/fr.json)

- User created successfully → Utilisateur créé avec succès
- User updated successfully → Utilisateur mis à jour avec succès
- User deleted successfully → Utilisateur supprimé avec succès
- Invalid credentials → Identifiants invalides
- Login successful → Connexion réussie
- ... et plus encore

---

## 🧪 Tests réussis

```bash
✅ Anglais par défaut (sans fichier de traduction)
✅ Traductions françaises (JSON)
✅ Fallback Module → Global → Anglais
✅ Traductions avec paramètres (:from, :to, :total)
✅ Texte non traduit retourne l'anglais
✅ Multi-tenancy compatible
```

---

## 🎓 Workflow de développement

1. **Écrire le code en anglais**
   ```php
   __('Product created successfully')
   ```

2. **Tester en anglais** (fonctionne directement)
   ```
   → "Product created successfully"
   ```

3. **Ajouter la traduction française**
   ```json
   {
       "Product created successfully": "Produit créé avec succès"
   }
   ```

4. **Tester en français**
   ```
   → "Produit créé avec succès"
   ```

---

## 🔧 Commandes utiles

```bash
# Vider le cache
php artisan config:clear
php artisan cache:clear

# Tester dans tinker
php artisan tinker
>>> app()->setLocale('fr');
>>> __('User created successfully');
=> "Utilisateur créé avec succès"
```

---

## 💡 Bonnes pratiques

### ✅ À faire

- Écrire en anglais clair et simple
- Utiliser des phrases complètes (pas de code)
- Ajouter les traductions au fur et à mesure
- Tester avec différentes langues

### ❌ À éviter

- ❌ Créer des fichiers `en.json` (inutile)
- ❌ Mélanger code et traductions
- ❌ Utiliser des clés cryptiques (`usr.crt.scs`)
- ❌ Oublier les paramètres (`:from`, `:to`, etc.)

---

## 🆘 Support

### Problème de traduction non chargée ?

1. Vérifier que le fichier JSON est valide
2. Vider le cache : `php artisan config:clear`
3. Vérifier la clé exacte (sensible à la casse)
4. Vérifier l'emplacement du fichier

### Tester une traduction

```bash
php artisan tinker
>>> app()->setLocale('fr');
>>> __('Votre texte ici');
```

---

## 🎉 Prêt à l'emploi !

Le système est configuré, testé et documenté. Vous pouvez maintenant :

1. ✅ Écrire du code en anglais avec `__('Your text')`
2. ✅ Ajouter les traductions dans les fichiers JSON
3. ✅ Changer la langue avec `app()->setLocale()`
4. ✅ Profiter du fallback automatique

**Bonne traduction ! 🌍**

---

## 📌 Langues supportées

- 🇬🇧 Anglais (en) - Par défaut, pas de fichier nécessaire
- 🇫🇷 Français (fr) - Fichiers JSON créés
- ➕ Autres langues - Ajouter simplement un fichier JSON

---

**Version :** 1.0
**Dernière mise à jour :** $(date)
**Status :** ✅ Opérationnel et testé
