# Site Module

## Description

Module de gestion des sites/tenants pour l'architecture multi-tenant. Ce module permet de gérer les sites (tenants) depuis l'interface Superadmin. Chaque site représente un tenant avec sa propre base de données.

## Architecture

Le module Site opère sur la **base de données centrale** (`site_dev1`) et utilise la table `t_sites` pour stocker les informations de configuration de chaque tenant.

### Table principale : t_sites

| Colonne | Type | Description |
|---------|------|-------------|
| `site_id` | int | Clé primaire |
| `site_host` | varchar | Domaine du site (unique) |
| `site_db_name` | varchar | Nom de la base de données tenant |
| `site_db_host` | varchar | Hôte de la base de données |
| `site_db_login` | varchar | Utilisateur de la base de données |
| `site_db_password` | varchar | Mot de passe de la base de données |
| `site_available` | enum(YES/NO) | Site globalement disponible |
| `site_admin_available` | enum(YES/NO) | Admin disponible |
| `site_frontend_available` | enum(YES/NO) | Frontend disponible |
| `site_type` | enum(CUST/ECOM/CMS) | Type de site |
| `is_customer` | enum(YES/NO) | Est un client |
| `site_company` | varchar | Nom de l'entreprise |
| `price` | decimal | Prix/Tarif |
| `site_db_size` | int | Taille de la base de données (bytes) |

## Structure du Module

```
Modules/Site/
├── Entities/                      # Modèles (utilise App\Models\Tenant)
├── Http/
│   ├── Controllers/
│   │   └── Superadmin/
│   │       └── SiteController.php # Contrôleur principal
│   └── Resources/
│       ├── SiteResource.php       # Détails complet d'un site
│       └── SiteListResource.php   # Liste simplifiée
├── Repositories/
│   └── SiteRepository.php         # Logique métier
├── Routes/
│   └── superadmin.php             # Routes superadmin (central DB)
└── README.md                      # Ce fichier
```

## API Endpoints

Tous les endpoints nécessitent l'authentification Superadmin.

**Headers requis pour tous les endpoints:**
```
Authorization: Bearer {superadmin_token}
Content-Type: application/json
```

---

### 1. Créer un nouveau site

```http
POST /api/superadmin/sites
```

**Body de la requête:**
```json
{
  "site_host": "nouveau-site.local",
  "site_db_name": "nouveau_site_db",
  "site_db_host": "localhost",
  "site_db_login": "root",
  "site_db_password": "",
  "site_company": "Ma Société",
  "site_type": "CUST",
  "site_admin_available": "YES",
  "site_frontend_available": "YES",
  "site_available": "YES",
  "is_customer": "YES",
  "price": 99.99,
  "create_database": true,
  "setup_tables": false
}
```

**Paramètres obligatoires:**
- `site_host` : Domaine du site (doit être unique)
- `site_db_name` : Nom de la base de données (plusieurs sites peuvent partager la même DB)
- `site_db_host` : Hôte de la base de données
- `site_db_login` : Utilisateur MySQL

**Paramètres optionnels:**
- `site_db_password` : Mot de passe MySQL (nullable)
- `site_company` : Nom de l'entreprise
- `site_type` : Type de site (CUST, ECOM, CMS) - défaut: CUST
- `site_admin_available` : YES/NO - défaut: NO
- `site_frontend_available` : YES/NO - défaut: NO
- `site_available` : YES/NO - défaut: YES
- `is_customer` : YES/NO - défaut: YES
- `site_access_restricted` : YES/NO - défaut: NO
- `price` : Tarif (decimal)
- `create_database` : Créer automatiquement la base de données (boolean)
- `setup_tables` : Initialiser les tables (boolean)

**Réponse (201 Created):**
```json
{
  "success": true,
  "message": "Site created successfully",
  "data": {
    "site_id": 123,
    "site_host": "nouveau-site.local",
    "site_db_name": "nouveau_site_db",
    "site_db_host": "localhost",
    "site_db_login": "root",
    "site_available": "YES",
    "site_admin_available": "YES",
    "site_frontend_available": "YES",
    "site_type": "CUST",
    "site_company": "Ma Société",
    "is_customer": "YES",
    "price": "99.99",
    "site_db_size": 0,
    "last_connection": null
  }
}
```

**Erreur de validation (422):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "site_host": [
      "The site host has already been taken."
    ]
  }
}
```

---

### 2. Lister tous les sites

```http
GET /api/superadmin/sites
```

**Paramètres de requête:**
```
?page=1
&per_page=50
&search=site-name
&available=true
&admin_available=true
&frontend_available=true
&is_customer=true
&type=CUST
&sort_by=site_host
&sort_order=asc
```

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "site_id": 1,
      "site_host": "api.local",
      "site_db_name": "site_dev1",
      "site_company": "Central",
      "site_available": "YES",
      "is_customer": "NO",
      "site_type": "CUST"
    },
    {
      "site_id": 75,
      "site_host": "tenant1.local",
      "site_db_name": "site_theme32",
      "site_company": "Client Test",
      "site_available": "YES",
      "is_customer": "YES",
      "site_type": "ECOM"
    }
  ],
  "meta": {
    "current_page": 1,
    "total": 45,
    "per_page": 50,
    "last_page": 1,
    "from": 1,
    "to": 45
  }
}
```

---

### 3. Afficher un site spécifique

```http
GET /api/superadmin/sites/{id}
```

**Exemple:**
```bash
GET /api/superadmin/sites/75
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "site_id": 75,
    "site_host": "tenant1.local",
    "site_db_name": "site_theme32",
    "site_db_host": "localhost",
    "site_db_login": "root",
    "site_available": "YES",
    "site_admin_available": "YES",
    "site_frontend_available": "YES",
    "site_type": "ECOM",
    "site_company": "Client Test",
    "is_customer": "YES",
    "price": "149.99",
    "site_db_size": 52428800,
    "logo": "/logos/tenant1.png",
    "picture": "/images/tenant1.jpg",
    "banner": "/banners/tenant1.jpg",
    "favicon": "/favicons/tenant1.ico",
    "last_connection": "2024-01-15T10:30:00.000000Z"
  }
}
```

**Erreur si site non trouvé (404):**
```json
{
  "message": "No query results for model [App\\Models\\Tenant] 123",
  "exception": "Symfony\\Component\\HttpKernel\\Exception\\NotFoundHttpException"
}
```

---

### 4. Mettre à jour un site

```http
PUT /api/superadmin/sites/{id}
```

**Body (tous les champs sont optionnels):**
```json
{
  "site_company": "Nouvelle Société",
  "site_available": "NO",
  "price": 199.99,
  "logo": "/logos/new-logo.png"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Site updated successfully",
  "data": {
    "site_id": 75,
    "site_host": "tenant1.local",
    "site_company": "Nouvelle Société",
    "site_available": "NO",
    "price": "199.99",
    "logo": "/logos/new-logo.png"
  }
}
```

---

### 5. Supprimer un site

```http
DELETE /api/superadmin/sites/{id}?delete_database=false
```

**Paramètres de requête:**
- `delete_database` : true pour supprimer aussi la base de données (défaut: false)

**Réponse:**
```json
{
  "success": true,
  "message": "Site deleted successfully"
}
```

---

### 6. Tester la connexion à la base de données

```http
POST /api/superadmin/sites/{id}/test-connection
```

**Réponse en cas de succès:**
```json
{
  "success": true,
  "message": "Connection successful",
  "data": {
    "success": true,
    "database": "site_theme32",
    "host": "localhost",
    "tables_count": 156,
    "users_count": 42,
    "tables": ["t_users", "t_groups", "t_permissions", "..."]
  }
}
```

**Réponse en cas d'échec:**
```json
{
  "success": false,
  "message": "Connection failed: Access denied for user 'root'@'localhost'"
}
```

---

### 7. Mettre à jour la taille de la base de données

```http
POST /api/superadmin/sites/{id}/update-size
```

**Réponse:**
```json
{
  "success": true,
  "message": "Database size updated successfully",
  "data": {
    "site_id": 75,
    "site_db_size": 52428800,
    "site_db_size_human": "50 MB"
  }
}
```

---

### 8. Obtenir les statistiques globales

```http
GET /api/superadmin/sites/statistics
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "total": 45,
    "available": 40,
    "unavailable": 5,
    "customers": 35,
    "admin_available": 38,
    "frontend_available": 42
  }
}
```

---

### 9. Activer/Désactiver plusieurs sites

```http
POST /api/superadmin/sites/toggle-availability
```

**Body:**
```json
{
  "site_ids": [1, 2, 3],
  "available": "NO",
  "scope": "admin"
}
```

**Paramètres:**
- `site_ids` : Tableau des IDs de sites
- `available` : YES ou NO
- `scope` : site (global), admin, ou frontend

**Réponse:**
```json
{
  "success": true,
  "message": "Sites availability updated successfully"
}
```

---

## Exemples d'utilisation avec cURL

### 1. S'authentifier en tant que Superadmin

```bash
curl -X POST http://api.local/api/superadmin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "password": "password"
  }'
```

**Réponse:**
```json
{
  "success": true,
  "token": "1|abc123def456...",
  "user": {
    "id": 1,
    "username": "superadmin",
    "application": "superadmin"
  }
}
```

### 2. Créer un nouveau site

```bash
curl -X POST http://api.local/api/superadmin/sites \
  -H "Authorization: Bearer 1|abc123def456..." \
  -H "Content-Type: application/json" \
  -d '{
    "site_host": "client-xyz.local",
    "site_db_name": "client_xyz_db",
    "site_db_host": "localhost",
    "site_db_login": "root",
    "site_db_password": "",
    "site_company": "Client XYZ",
    "site_type": "ECOM",
    "site_available": "YES",
    "site_admin_available": "YES",
    "site_frontend_available": "YES",
    "is_customer": "YES",
    "price": 299.99,
    "create_database": true,
    "setup_tables": false
  }'
```

### 3. Lister les sites clients

```bash
curl -X GET "http://api.local/api/superadmin/sites?is_customer=true&per_page=20" \
  -H "Authorization: Bearer 1|abc123def456..."
```

### 4. Tester la connexion d'un site

```bash
curl -X POST http://api.local/api/superadmin/sites/75/test-connection \
  -H "Authorization: Bearer 1|abc123def456..."
```

### 5. Mettre à jour un site

```bash
curl -X PUT http://api.local/api/superadmin/sites/75 \
  -H "Authorization: Bearer 1|abc123def456..." \
  -H "Content-Type: application/json" \
  -d '{
    "site_company": "Client XYZ Renommé",
    "price": 349.99
  }'
```

---

## Notes importantes

### Multi-base de données

⚠️ **Plusieurs sites peuvent partager la même base de données** : La contrainte `unique` sur `site_db_name` a été retirée pour permettre cette fonctionnalité.

### Clé primaire personnalisée

Le modèle `Tenant` utilise `site_id` comme clé primaire au lieu de `id`. La méthode `getRouteKeyName()` a été implémentée pour le route model binding.

### Options de création de base de données

- **`create_database: true`** : Crée automatiquement la base de données MySQL et l'utilisateur (si nécessaire)
- **`setup_tables: true`** : Initialise les tables de base (nécessite un template SQL)

### Sécurité

- Tous les endpoints nécessitent l'authentification Superadmin (`auth:sanctum`)
- Pas de middleware `tenant` car on opère sur la base centrale
- Les mots de passe de base de données sont stockés en clair (attention en production)

---

## TODO

- [ ] Ajouter l'upload de logos/images
- [ ] Implémenter le template SQL pour `setup_tables`
- [ ] Ajouter la gestion des thèmes (admin/frontend)
- [ ] Ajouter les logs d'activité sur les sites
- [ ] Implémenter la duplication de site
- [ ] Ajouter les tests unitaires et d'intégration
- [ ] Documenter la migration de sites existants

---

## Dépannage

### Erreur: "No query results for model [App\Models\Tenant] X"

Le site avec l'ID X n'existe pas. Vérifiez les IDs disponibles avec `GET /api/superadmin/sites`.

### Erreur: "The site host has already been taken"

Un site avec ce domaine existe déjà. Les `site_host` doivent être uniques.

### Erreur: "The site db name has already been taken"

Cette erreur ne devrait plus apparaître. Si c'est le cas, vérifiez que le contrôleur ne valide pas `site_db_name` avec `unique`.

### Erreur: "Connection failed" lors du test de connexion

Vérifiez les credentials de la base de données (host, login, password, db_name).