# 🚀 Référence Rapide - Traductions

## 📌 Principe

1. **Écrivez en anglais** dans votre code
2. **Ajoutez les traductions** dans les fichiers JSON
3. **Le système gère** automatiquement le fallback

---

## 💻 Dans le code

```php
// Simple
__('User created successfully')

// Avec paramètres
__('Showing :from to :to of :total results', [
    'from' => 1,
    'to' => 10,
    'total' => 100
])

// Dans une réponse API
return response()->json([
    'message' => __('Operation successful'),
    'data' => $data
]);
```

---

## 📁 Fichiers de traduction

### Traductions globales
**lang/fr.json**
```json
{
    "Welcome": "Bienvenue",
    "Cancel": "Annuler",
    "Save": "Enregistrer",
    "Delete": "Supprimer"
}
```

### Traductions de module
**Modules/UsersGuard/Resources/lang/fr.json**
```json
{
    "User created successfully": "Utilisateur créé avec succès",
    "User deleted successfully": "Utilisateur supprimé avec succès"
}
```

---

## 🔄 Changer la langue

### Dans l'application
```php
app()->setLocale('fr');  // Français
app()->setLocale('en');  // Anglais
```

### Via API (header)
```bash
curl -H "Accept-Language: fr" https://api.example.com/endpoint
```

### Dans .env (par défaut)
```env
APP_LOCALE=fr
```

---

## 🎯 Priorité et fallback

### Ordre de priorité

1. **🥇 MODULE** (priorité absolue) → `Modules/{Module}/Resources/lang/fr.json`
2. **🥈 GLOBAL** (fallback) → `lang/fr.json`
3. **🥉 ANGLAIS** (par défaut) → Texte du code

**Important** : Si une clé existe dans MODULE et GLOBAL, **MODULE gagne toujours** !

### Exemple

```php
// Si "Welcome" existe dans les deux :
// - Global : "Bienvenue"
// - Module : "Bienvenue sur UsersGuard"
__('Welcome') → "Bienvenue sur UsersGuard" ✅ MODULE prioritaire
```

---

## ✨ Exemples rapides

### CRUD Messages
```php
__('Resource created successfully')
__('Resource updated successfully')
__('Resource deleted successfully')
__('Resource not found')
```

**lang/fr.json**
```json
{
    "Resource created successfully": "Ressource créée avec succès",
    "Resource updated successfully": "Ressource mise à jour avec succès",
    "Resource deleted successfully": "Ressource supprimée avec succès",
    "Resource not found": "Ressource non trouvée"
}
```

### Erreurs communes
```php
__('Validation error')
__('Unauthorized access')
__('Access forbidden')
__('An error occurred')
```

### Authentification
```php
__('Login successful')
__('Logout successful')
__('Invalid credentials')
__('Account is disabled')
```

---

## ⚡ Commandes utiles

```bash
# Vider le cache
php artisan config:clear
php artisan cache:clear

# Tester dans tinker
php artisan tinker
>>> app()->setLocale('fr');
>>> __('User created successfully');
```

---

## ➕ Ajouter une nouvelle langue

1. **Créer le fichier** : `lang/es.json`
2. **Ajouter les traductions** :
```json
{
    "Welcome": "Bienvenido",
    "User created successfully": "Usuario creado exitosamente"
}
```
3. **Utiliser** : `app()->setLocale('es')`

---

## 📋 Template pour nouveau module

**Modules/MonModule/Resources/lang/fr.json**
```json
{
    "Item created successfully": "Élément créé avec succès",
    "Item updated successfully": "Élément mis à jour avec succès",
    "Item deleted successfully": "Élément supprimé avec succès",
    "Item not found": "Élément non trouvé"
}
```

**Modules/MonModule/Http/Controllers/Admin/ItemController.php**
```php
<?php

namespace Modules\MonModule\Http\Controllers\Admin;

class ItemController extends Controller
{
    public function store(Request $request)
    {
        $item = Item::create($request->validated());

        return response()->json([
            'message' => __('Item created successfully'),
            'data' => $item
        ], 201);
    }
}
```

---

## ✅ À retenir

- ✅ **Pas de fichier en.json** - L'anglais est le texte par défaut
- ✅ **Un fichier par langue** - Pas de sous-dossiers en/fr/de
- ✅ **Texte anglais = clé** - Copiez-collez le texte du code
- ✅ **Fallback automatique** - Module → Global → Anglais
- ✅ **Simple et rapide** - Ajoutez les traductions au fur et à mesure

---

**C'est tout ! Écrivez en anglais, traduisez en JSON. 🎉**
