# Guide de Test Postman - Module Superadmin (Stories 2-1 à 2-9)

## 📋 Table des Matières
1. [Prérequis et Configuration](#prérequis)
2. [Authentification](#authentification)
3. [Tests des Endpoints](#tests-des-endpoints)
4. [Scénarios de Test](#scénarios-de-test)
5. [Vérification du Cache Redis](#vérification-du-cache)

---

## 🔧 Prérequis et Configuration {#prérequis}

### Configuration de Base Postman

**Base URL:** `http://localhost:8000` (ou votre URL Laravel)

**Headers communs pour toutes les requêtes:**
```
Content-Type: application/json
Accept: application/json
Authorization: Bearer {votre_token}
```

### Variables d'environnement Postman recommandées
Créez ces variables dans votre environnement Postman:
- `base_url` = `http://localhost:8000`
- `token` = (sera rempli après login)
- `site_id` = `1` (ou l'ID de votre tenant de test)

---

## 🔐 Authentification {#authentification}

### 1. Login SuperAdmin

**Endpoint:** `POST /api/superadmin/auth/login`

**Body (JSON):**
```json
{
    "username": "superadmin",
    "password": "password",
    "application": "superadmin"
}
```

**Note:** Un utilisateur SuperAdmin a été créé automatiquement par la migration:
- Username: `superadmin`
- Password: `password` (changez-le en production!)
- Application: `superadmin`

**Réponse attendue:**
```json
{
    "success": true,
    "message": "Login successful",
    "data": {
        "user": {
            "id": 1,
            "username": "superadmin",
            "email": "superadmin@example.com",
            "firstname": "Super",
            "lastname": "Admin",
            "application": "superadmin"
        },
        "token": "1|xxxxxxxxxxxxxxxxxxxx",
        "token_type": "Bearer"
    }
}
```

**Action:** Copiez le `data.token` et utilisez-le dans le header `Authorization: Bearer {token}` pour toutes les requêtes suivantes.

---

## 🧪 Tests des Endpoints {#tests-des-endpoints}

### Story 2-1 & 2-2: Liste des Modules Disponibles

#### Test 1: Obtenir tous les modules disponibles

**Endpoint:** `GET /api/superadmin/modules`

**Headers:**
```
Authorization: Bearer {token}
Accept: application/json
```

**Réponse attendue:**
```json
{
    "data": [
        {
            "name": "Customer",
            "alias": "customer",
            "description": "Module de gestion des clients",
            "version": "1.0.0",
            "dependencies": [],
            "priority": 0,
            "is_system": false,
            "path": "C:\\laragon\\www\\backend-api\\Modules\\Customer",
            "enabled": true
        },
        {
            "name": "CustomersContracts",
            "alias": "customerscontracts",
            "description": "Module des contrats clients",
            "version": "1.0.0",
            "dependencies": ["Customer"],
            "priority": 0,
            "is_system": false,
            "path": "C:\\laragon\\www\\backend-api\\Modules\\CustomersContracts",
            "enabled": true
        },
        {
            "name": "Superadmin",
            "alias": "superadmin",
            "description": "Module Superadmin",
            "version": "1.0.0",
            "dependencies": [],
            "priority": 0,
            "is_system": true,
            "path": "C:\\laragon\\www\\backend-api\\Modules\\Superadmin",
            "enabled": true
        }
    ]
}
```

**Points à vérifier:**
- ✅ Status: 200 OK
- ✅ Liste contient tous les modules du dossier `Modules/`
- ✅ Chaque module a les propriétés: name, alias, description, version, dependencies, is_system
- ✅ Les modules système (Superadmin, UsersGuard, Site) ont `is_system: true`

---

### Story 2-5: Filtrage et Recherche de Modules

#### Test 2: Filtrer par recherche textuelle

**Endpoint:** `GET /api/superadmin/modules?search=customer`

**Headers:**
```
Authorization: Bearer {token}
Accept: application/json
```

**Réponse attendue:**
```json
{
    "data": [
        {
            "name": "Customer",
            "alias": "customer",
            ...
        },
        {
            "name": "CustomersContracts",
            "alias": "customerscontracts",
            ...
        }
    ]
}
```

**Points à vérifier:**
- ✅ Seuls les modules contenant "customer" dans name/description/alias sont retournés
- ✅ Recherche insensible à la casse

#### Test 3: Filtrer par catégorie (si configurée)

**Endpoint:** `GET /api/superadmin/modules?category=business`

**Points à vérifier:**
- ✅ Filtre fonctionne si catégorie définie dans module.json

---

### Story 2-3 & 2-4: Modules par Tenant

#### Test 4: Obtenir les modules d'un tenant spécifique

**Endpoint:** `GET /api/superadmin/sites/{site_id}/modules`

**Exemple:** `GET /api/superadmin/sites/1/modules`

**Headers:**
```
Authorization: Bearer {token}
Accept: application/json
```

**Réponse attendue:**
```json
{
    "data": [
        {
            "name": "Customer",
            "alias": "customer",
            "description": "Module de gestion des clients",
            "version": "1.0.0",
            "dependencies": [],
            "is_system": false,
            "tenant_status": {
                "is_active": true,
                "installed_at": "2026-01-28T10:00:00+00:00",
                "uninstalled_at": null,
                "config": {}
            }
        },
        {
            "name": "CustomersContracts",
            "alias": "customerscontracts",
            "description": "Module des contrats clients",
            "version": "1.0.0",
            "dependencies": ["Customer"],
            "is_system": false,
            "tenant_status": {
                "is_active": false,
                "installed_at": "2026-01-28T10:00:00+00:00",
                "uninstalled_at": "2026-01-28T11:00:00+00:00",
                "config": {}
            }
        }
    ]
}
```

**Points à vérifier:**
- ✅ Chaque module a une propriété `tenant_status`
- ✅ `tenant_status.is_active` indique si le module est actif pour ce tenant
- ✅ `installed_at` et `uninstalled_at` sont présents
- ✅ Si le module n'est pas installé pour ce tenant, `tenant_status` est `null`

#### Test 5: Filtrer les modules par statut tenant

**Endpoint:** `GET /api/superadmin/sites/1/modules?status=active`

**Valeurs possibles pour `status`:**
- `active` - modules actifs pour ce tenant
- `inactive` - modules installés mais désactivés
- `not_installed` - modules disponibles mais pas installés

**Réponse attendue:**
```json
{
    "data": [
        {
            "name": "Customer",
            "tenant_status": {
                "is_active": true,
                ...
            }
        }
    ]
}
```

**Points à vérifier:**
- ✅ Filtre `status=active` retourne uniquement les modules actifs
- ✅ Filtre `status=inactive` retourne les modules désactivés
- ✅ Filtre `status=not_installed` retourne les modules non installés

#### Test 6: Combiner recherche et statut

**Endpoint:** `GET /api/superadmin/sites/1/modules?search=customer&status=active`

**Points à vérifier:**
- ✅ Les deux filtres s'appliquent simultanément

---

### Story 2-7: API Graph Dépendances

#### Test 7: Obtenir le graphe complet des dépendances

**Endpoint:** `GET /api/superadmin/modules/dependencies`

**Headers:**
```
Authorization: Bearer {token}
Accept: application/json
```

**Réponse attendue:**
```json
{
    "data": [
        {
            "name": "Customer",
            "dependencies": [],
            "dependents": ["CustomersContracts"]
        },
        {
            "name": "CustomersContracts",
            "dependencies": ["Customer"],
            "dependents": []
        },
        {
            "name": "Dashboard",
            "dependencies": [],
            "dependents": []
        },
        {
            "name": "Superadmin",
            "dependencies": [],
            "dependents": []
        }
    ]
}
```

**Points à vérifier:**
- ✅ Chaque module liste ses dépendances directes (`dependencies`)
- ✅ Chaque module liste les modules qui dépendent de lui (`dependents`)
- ✅ Si module A dépend de B, alors B apparaît dans dependents de A
- ✅ Structure permet de visualiser le graphe complet

**Exemple d'analyse:**
- `Customer` n'a pas de dépendances, mais `CustomersContracts` dépend de lui
- `CustomersContracts` dépend de `Customer`, mais aucun module ne dépend de lui

---

### Story 2-8: API Modules Dépendants

#### Test 8: Obtenir les modules dépendants d'un module spécifique

**Endpoint:** `GET /api/superadmin/modules/{module}/dependents`

**Exemple:** `GET /api/superadmin/modules/Customer/dependents`

**Headers:**
```
Authorization: Bearer {token}
Accept: application/json
```

**Réponse attendue:**
```json
{
    "data": {
        "module": "Customer",
        "dependents": [
            {
                "name": "CustomersContracts"
            }
        ],
        "count": 1
    }
}
```

**Points à vérifier:**
- ✅ Liste tous les modules qui dépendent du module spécifié
- ✅ `count` indique le nombre de dépendants
- ✅ Si aucun dépendant, tableau vide et count = 0

#### Test 9: Modules dépendants avec statut tenant

**Endpoint:** `GET /api/superadmin/modules/Customer/dependents?site_id=1`

**Réponse attendue:**
```json
{
    "data": {
        "module": "Customer",
        "dependents": [
            {
                "name": "CustomersContracts",
                "isActiveForTenant": true
            }
        ],
        "count": 1
    }
}
```

**Points à vérifier:**
- ✅ Avec `?site_id=X`, chaque dépendant a une propriété `isActiveForTenant`
- ✅ `isActiveForTenant: true` signifie que le module dépendant est actif pour ce tenant
- ✅ Utile pour analyser l'impact de la désactivation d'un module

**Cas d'usage:** Avant de désactiver "Customer" pour le tenant 1, on vérifie:
- Si `isActiveForTenant: true` pour un dépendant → ⚠️ Attention: désactiver Customer cassera CustomersContracts
- Si `isActiveForTenant: false` → ✅ OK: pas d'impact

#### Test 10: Module sans dépendants

**Endpoint:** `GET /api/superadmin/modules/CustomersContracts/dependents`

**Réponse attendue:**
```json
{
    "data": {
        "module": "CustomersContracts",
        "dependents": [],
        "count": 0
    }
}
```

**Points à vérifier:**
- ✅ Tableau vide si aucun module ne dépend de lui
- ✅ `count: 0`

---

### Story 2-9: Vérification du Cache Redis

#### Test 11: Vérifier que le cache fonctionne

**Scénario de test:**

1. **Premier appel** (cache vide):
```
GET /api/superadmin/modules
```
→ Devrait interroger la base de données

2. **Deuxième appel** (dans les 10 minutes):
```
GET /api/superadmin/modules
```
→ Devrait utiliser le cache (réponse plus rapide)

**Comment vérifier:**
- Activez les logs Laravel: `php artisan pail --timeout=0`
- Premier appel: vous verrez des requêtes SQL dans les logs
- Deuxième appel: pas de requêtes SQL (données viennent du cache)

**TTL configurés:**
- Modules disponibles (global): **10 minutes**
- Modules par tenant: **5 minutes**
- Graphe de dépendances: **30 minutes**

#### Test 12: Vérifier l'invalidation du cache

**Note:** L'invalidation automatique se déclenche lors de l'activation/désactivation d'un module. Pour tester:

1. Appeler `GET /api/superadmin/sites/1/modules` → cache créé
2. Activer/désactiver un module pour ce tenant (via API future Epic 3)
3. Appeler à nouveau `GET /api/superadmin/sites/1/modules` → cache invalidé, nouvelles données

**Clés Redis utilisées:**
```
modules:available              → Liste globale
modules:tenant:{site_id}       → Modules du tenant
modules:dependencies           → Graphe de dépendances
```

**Vérifier dans Redis CLI:**
```bash
redis-cli
> KEYS modules:*
> TTL modules:available
> GET modules:available
```

---

## 🎯 Scénarios de Test Complets {#scénarios-de-test}

### Scénario 1: Découverte des modules disponibles

```
1. GET /api/superadmin/modules
   → Voir tous les modules disponibles

2. GET /api/superadmin/modules?search=customer
   → Filtrer par recherche

3. GET /api/superadmin/modules/dependencies
   → Visualiser le graphe de dépendances
```

### Scénario 2: Analyse d'un tenant spécifique

```
1. GET /api/superadmin/sites/1/modules
   → Voir tous les modules disponibles avec leur statut pour le tenant 1

2. GET /api/superadmin/sites/1/modules?status=active
   → Voir uniquement les modules actifs du tenant

3. GET /api/superadmin/sites/1/modules?status=not_installed
   → Voir les modules disponibles mais non installés
```

### Scénario 3: Analyse d'impact avant désactivation

**Objectif:** Je veux désactiver le module "Customer" pour le tenant 1, quels sont les impacts?

```
1. GET /api/superadmin/modules/Customer/dependents?site_id=1
   → Voir quels modules dépendent de Customer et s'ils sont actifs pour ce tenant

2. Si dependents[] contient des modules avec isActiveForTenant: true
   → ⚠️ Attention: désactiver Customer affectera ces modules

3. Si dependents[] est vide ou tous isActiveForTenant: false
   → ✅ OK: pas d'impact, on peut désactiver en toute sécurité
```

### Scénario 4: Analyse des dépendances globales

```
1. GET /api/superadmin/modules/dependencies
   → Obtenir le graphe complet

2. Analyser la structure:
   - Identifier les modules "racines" (sans dépendances)
   - Identifier les modules "feuilles" (sans dépendants)
   - Identifier les chaînes de dépendances

3. GET /api/superadmin/modules/{module}/dependents
   → Détail d'un module spécifique
```

---

## 🐛 Cas d'Erreurs à Tester {#cas-erreurs}

### Erreur 401: Non authentifié
```
GET /api/superadmin/modules
(sans header Authorization)
```
**Réponse attendue:**
```json
{
    "message": "Unauthenticated."
}
```

### Erreur 404: Tenant non trouvé
```
GET /api/superadmin/sites/99999/modules
```
**Réponse attendue:**
```json
{
    "message": "No query results for model [App\\Models\\Tenant] 99999"
}
```

### Erreur 429: Rate limiting
```
Faire plus de X requêtes en 1 minute
```
**Réponse attendue:**
```json
{
    "message": "Too Many Requests"
}
```

---

## ✅ Checklist Complète de Test {#checklist}

### Authentification
- [ ] Login SuperAdmin réussit
- [ ] Token reçu et valide
- [ ] Requêtes avec token fonctionnent
- [ ] Requêtes sans token retournent 401

### Story 2-1 & 2-2: Liste modules disponibles
- [ ] GET /api/superadmin/modules retourne tous les modules
- [ ] Tous les champs requis sont présents
- [ ] Modules système identifiés (`is_system: true`)

### Story 2-5: Filtrage
- [ ] Recherche textuelle fonctionne
- [ ] Recherche insensible à la casse
- [ ] Filtrage par catégorie fonctionne (si applicable)

### Story 2-3 & 2-4: Modules par tenant
- [ ] GET /api/superadmin/sites/{id}/modules retourne les modules
- [ ] Propriété `tenant_status` présente pour chaque module
- [ ] `is_active` indique le bon statut
- [ ] Filtre `status=active` fonctionne
- [ ] Filtre `status=inactive` fonctionne
- [ ] Filtre `status=not_installed` fonctionne
- [ ] Combinaison search + status fonctionne

### Story 2-7: Graph dépendances
- [ ] GET /api/superadmin/modules/dependencies retourne le graphe complet
- [ ] Chaque module a `dependencies` et `dependents`
- [ ] Relations cohérentes (si A dépend de B, B liste A dans dependents)

### Story 2-8: Modules dépendants
- [ ] GET /api/superadmin/modules/{module}/dependents fonctionne
- [ ] Liste correcte des modules dépendants
- [ ] `count` exact
- [ ] Query param `?site_id=X` ajoute `isActiveForTenant`
- [ ] Module sans dépendants retourne tableau vide

### Story 2-9: Cache Redis
- [ ] Premier appel interroge la DB (visible dans logs)
- [ ] Deuxième appel utilise le cache (pas de SQL)
- [ ] Clés Redis créées correctement
- [ ] TTL respectés

---

## 🔍 Vérification du Cache Redis {#vérification-du-cache}

### Commandes Redis CLI utiles

```bash
# Se connecter à Redis
redis-cli

# Lister toutes les clés modules
KEYS modules:*

# Vérifier le TTL d'une clé
TTL modules:available

# Voir le contenu d'une clé
GET modules:available

# Supprimer le cache (pour tester)
DEL modules:available
DEL modules:tenant:1

# Vider tout le cache Redis (ATTENTION: destructif)
FLUSHDB
```

### Vérifier les logs Laravel

```bash
# Terminal 1: Lancer le serveur
php artisan serve

# Terminal 2: Observer les logs en temps réel
php artisan pail --timeout=0
```

**Dans les logs, chercher:**
- `SELECT * FROM ...` → Requêtes SQL (cache manqué)
- Pas de requêtes SQL → Cache utilisé ✅

---

## 📊 Résumé des Endpoints {#résumé}

| Endpoint | Méthode | Description | Stories |
|----------|---------|-------------|---------|
| `/api/superadmin/modules` | GET | Liste tous les modules disponibles avec filtres | 2-1, 2-2, 2-5 |
| `/api/superadmin/sites/{id}/modules` | GET | Modules d'un tenant avec statut et filtres | 2-3, 2-4, 2-5 |
| `/api/superadmin/modules/dependencies` | GET | Graphe complet des dépendances | 2-7 |
| `/api/superadmin/modules/{module}/dependents` | GET | Modules dépendants d'un module | 2-8 |

**Query Parameters:**
- `search` - Recherche textuelle (name, description, alias)
- `category` - Filtrage par catégorie
- `status` - Filtrage par statut tenant (active, inactive, not_installed)
- `site_id` - Pour endpoint dependents, ajoute le statut tenant

---

## 💡 Conseils Postman

### 1. Créer une Collection
Organisez vos requêtes par story:
```
📁 Superadmin Module Tests
  📁 Authentication
    → Login SuperAdmin
  📁 Story 2-1 & 2-2: Liste Modules
    → Get All Modules
  📁 Story 2-5: Filtrage
    → Filter by Search
    → Filter by Category
  📁 Story 2-3 & 2-4: Modules Tenant
    → Get Tenant Modules
    → Filter by Status
  📁 Story 2-7: Graph Dépendances
    → Get Dependencies Graph
  📁 Story 2-8: Modules Dépendants
    → Get Module Dependents
    → Get Dependents with Tenant Status
```

### 2. Variables d'environnement
```json
{
  "base_url": "http://localhost:8000",
  "token": "",
  "site_id": "1"
}
```

### 3. Scripts Postman utiles

**Pre-request Script (pour auto-insérer le token):**
```javascript
pm.request.headers.add({
    key: 'Authorization',
    value: 'Bearer ' + pm.environment.get('token')
});
```

**Test Script (pour sauvegarder le token après login):**
```javascript
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set('token', jsonData.access_token);
}
```

---

## ✨ Prêt à tester!

Vous avez maintenant tout ce qu'il faut pour tester les 4 stories (2-6 à 2-9) ainsi que les stories précédentes (2-1 à 2-5).

**Ordre de test recommandé:**
1. ✅ Authentification
2. ✅ Liste modules disponibles (2-1, 2-2)
3. ✅ Filtrage (2-5)
4. ✅ Modules par tenant (2-3, 2-4)
5. ✅ Graph dépendances (2-7)
6. ✅ Modules dépendants (2-8)
7. ✅ Vérification cache (2-9)

Bon test! 🚀
