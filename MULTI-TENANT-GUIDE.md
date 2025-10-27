# Guide Multi-Tenant - Laravel API

## 🏢 Comment fonctionne le Multi-Tenant

Ce système utilise une architecture **database-per-tenant** : chaque tenant (client) a sa propre base de données.

### Architecture

```
Base de données CENTRALE (site_dev1)
├── t_sites (table des tenants)
│   ├── site_id
│   ├── site_host (domaine du tenant)
│   ├── site_db_name (nom de la base tenant)
│   ├── site_db_host
│   ├── site_db_login
│   ├── site_db_password
│   └── site_available (YES/NO)

Base de données TENANT (une par client)
├── t_users (utilisateurs du tenant)
├── t_groups (groupes du tenant)
├── t_user_group (pivot)
└── ... (autres tables du tenant)
```

---

## 🔍 Identification du Tenant par Domaine

Le système identifie automatiquement le tenant à partir du **domaine** utilisé dans la requête HTTP.

### Processus d'identification

1. **Requête HTTP arrive**
   ```
   GET http://tenant1.local/api/admin/users
   Host: tenant1.local
   ```

2. **Middleware `InitializeTenancy` s'exécute**
   - Lit le header `Host` → `tenant1.local`
   - Cherche dans la base centrale :
     ```sql
     SELECT * FROM t_sites
     WHERE site_host = 'tenant1.local'
     AND site_available = 'YES'
     ```

3. **Tenant trouvé** (ID: 75, DB: site_theme32)
   - Configure la connexion MySQL dynamiquement
   - Toutes les requêtes Eloquent utilisent maintenant `site_theme32`

4. **Requête exécutée dans la bonne base**
   ```sql
   SELECT * FROM site_theme32.t_users WHERE application = 'admin'
   ```

---

## 📝 Configuration dans Postman

### Option 1 : Par Domaine (Recommandé)

**URL :** `http://tenant1.local/api/admin/users`

**Headers :**
```
Authorization: Bearer 9|kPSor68pxYjPL6HQ0Iavfn5IW818F4IwsPjMx3cKdf8b2a14
Accept: application/json
```

Le système détecte automatiquement que `tenant1.local` → Base `site_theme32`.

### Option 2 : Par Header X-Tenant-ID

**URL :** `http://localhost/api/admin/users`

**Headers :**
```
Authorization: Bearer 9|kPSor68pxYjPL6HQ0Iavfn5IW818F4IwsPjMx3cKdf8b2a14
Accept: application/json
X-Tenant-ID: 75
```

Utile si vous ne pouvez pas configurer de DNS local.

---

## 🔑 Authentification Multi-Tenant

### Ordre des Middlewares (IMPORTANT!)

```php
Route::middleware(['tenant', 'auth:sanctum'])->group(function () {
    // Routes protégées
});
```

**L'ordre est CRUCIAL :**
1. ✅ `tenant` d'abord → initialise la connexion à la bonne base
2. ✅ `auth:sanctum` ensuite → cherche le token dans la bonne base

❌ **Mauvais ordre :** `['auth:sanctum', 'tenant']`
- Sanctum cherche le token dans la base centrale
- Erreur : "Unauthenticated"

---

## 🛠️ Scripts Utiles

### Générer un token pour un tenant

```bash
php generate-token.php
```

Modifier dans le script :
```php
$tenantId = 75; // ID du tenant (tenant1.local)
$username = 'admin'; // Username de l'utilisateur
```

### Vérifier la configuration des tenants

```bash
php check-tenants.php
```

Affiche tous les tenants enregistrés dans la base centrale.

### Tester l'API

```bash
php test-tenant-api.php
```

Simule une requête HTTP vers l'API avec un domaine tenant.

### Tester l'identification par domaine

```bash
php test-domain-tenant.php
```

Montre comment chaque domaine est mappé à sa base de données.

---

## 📊 Tenants Actuels

| ID  | Domaine         | Base de données | Utilisateurs |
|-----|----------------|-----------------|--------------|
| 1   | api.local      | site_dev1       | 205          |
| 75  | tenant1.local  | site_theme32    | 66           |

---

## 🚀 Ajouter un Nouveau Tenant

### Dans la base CENTRALE (site_dev1)

```sql
INSERT INTO t_sites (
    site_host,
    site_db_name,
    site_db_host,
    site_db_login,
    site_db_password,
    site_available
) VALUES (
    'nouveau-client.local',    -- Domaine
    'nouveau_client_db',        -- Nom de la base
    'localhost',                -- Hôte MySQL
    'root',                     -- User MySQL
    '',                         -- Password MySQL
    'YES'                       -- Disponible
);
```

### Créer la base tenant

```sql
CREATE DATABASE nouveau_client_db;
USE nouveau_client_db;

-- Importer le schéma des tables
SOURCE schema_tenant.sql;
```

### Tester

```bash
# Dans /etc/hosts (Linux/Mac) ou C:\Windows\System32\drivers\etc\hosts (Windows)
127.0.0.1  nouveau-client.local

# Test avec cURL
curl -X GET "http://nouveau-client.local/api/admin/users" \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Accept: application/json"
```

---

## 🔒 Sécurité

### Tokens d'authentification

- Les tokens sont stockés dans **chaque base tenant** (`personal_access_tokens`)
- Un token du tenant A **ne fonctionne PAS** pour le tenant B
- Chaque utilisateur doit avoir son propre token dans sa base

### Isolation des données

- Chaque tenant a sa **propre base de données**
- Aucun risque de fuite de données entre tenants
- Les requêtes SQL sont isolées par tenant

---

## 🐛 Dépannage

### Erreur : "Unauthenticated"

**Causes possibles :**

1. **Token invalide ou expiré**
   ```bash
   php check-token.php
   ```

2. **Mauvais ordre des middlewares**
   ```php
   // ❌ FAUX
   Route::middleware(['auth:sanctum', 'tenant'])

   // ✅ CORRECT
   Route::middleware(['tenant', 'auth:sanctum'])
   ```

3. **Token dans la mauvaise base**
   ```bash
   php check-tokens-location.php
   ```

4. **Domaine non enregistré**
   ```bash
   php check-tenants.php
   ```

### Erreur : "Tenant not found"

Le domaine n'est pas enregistré dans `t_sites`.

**Solution :**
```bash
php check-tenants.php  # Vérifier les domaines disponibles
```

### Erreur : "Table doesn't exist"

La table n'existe pas dans la base tenant.

**Solutions possibles :**

1. Vérifier le nom de la table (ex: `t_user_group` vs `t_users_group`)
2. Exécuter les migrations tenant
3. Importer le schéma de la base

---

## 📚 Fichiers Importants

### Middleware

- **`app/Http/Middleware/InitializeTenancy.php`**
  - Identifie et initialise le tenant

### Modèles

- **`app/Models/Tenant.php`**
  - Modèle Eloquent pour les tenants

### Configuration

- **`config/tenancy.php`**
  - Configuration du multi-tenant

### Routes

- **`Modules/*/Routes/admin.php`**
  - Routes avec middleware `['tenant', 'auth:sanctum']`

---

## ✅ Checklist de Test

Avant de tester une nouvelle fonctionnalité :

- [ ] Le tenant est enregistré dans `t_sites`
- [ ] Le domaine pointe vers localhost (fichier hosts)
- [ ] Le token a été généré pour CE tenant
- [ ] L'ordre des middlewares est correct : `['tenant', 'auth:sanctum']`
- [ ] Le header `Authorization: Bearer [TOKEN]` est présent
- [ ] L'URL utilise le bon domaine : `http://tenant1.local/...`

---

## 📞 Support

### Logs

```bash
# Voir les logs Laravel
php artisan pail --timeout=0

# Logs Apache/PHP
tail -f C:\laragon\logs\apache_error.log
```

### Debug

Ajouter dans le controller :
```php
logger('Tenant actuel:', [
    'tenant_id' => tenancy()->tenant?->site_id,
    'database' => DB::connection('tenant')->getDatabaseName()
]);
```

---

## 🎯 Résumé

1. **Un domaine = Un tenant = Une base de données**
2. **Le domaine dans l'URL détermine automatiquement le tenant**
3. **Chaque tenant a ses propres utilisateurs et tokens**
4. **L'ordre des middlewares est crucial : `tenant` AVANT `auth:sanctum`**
5. **Les données sont complètement isolées entre tenants**

---

**Date de création :** 2025-10-24
**Version Laravel :** 11.x
**Package Multi-tenant :** stancl/tenancy
