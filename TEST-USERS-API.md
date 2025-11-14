# Guide de Test de l'API Users

## Préparation

### 1. Vérifier que le serveur Laravel est lancé

```bash
php artisan serve
```

ou si vous utilisez Laragon, assurez-vous qu'Apache est démarré.

### 2. Obtenir un token d'authentification valide

Si vous n'avez pas de token, vous devez d'abord vous connecter :

```bash
curl -X POST "http://tenant1.local/api/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: 1" \
  -d '{
    "username": "votre_username",
    "password": "votre_password"
  }'
```

Vous recevrez une réponse avec un token :
```json
{
  "success": true,
  "data": {
    "token": "80|wf6jcuXelRM6tLgROlzoorgS4IZObHb13jOQtJUCe869d31b",
    "user": { ... }
  }
}
```

## Tests de l'API

### Test 1: Liste des utilisateurs (de base)

```bash
curl -X GET "http://tenant1.local/api/admin/users" \
  -H "Authorization: Bearer 80|wf6jcuXelRM6tLgROlzoorgS4IZObHb13jOQtJUCe869d31b" \
  -H "Accept: application/json" \
  -H "X-Tenant-ID: 1"
```

**Réponse attendue:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "john.doe",
      "firstname": "John",
      "lastname": "Doe",
      "full_name": "John Doe",
      "email": "john.doe@example.com",
      "is_active": "YES",
      "status": "ACTIVE",
      "groups_list": "admin,manager",
      "created_at": "2024-01-01T00:00:00+00:00",
      ...
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 100,
    "total": 450
  }
}
```

### Test 2: Liste avec pagination personnalisée

```bash
curl -X GET "http://tenant1.local/api/admin/users?nbitemsbypage=10" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Accept: application/json" \
  -H "X-Tenant-ID: 1"
```

### Test 3: Recherche par nom d'utilisateur

```bash
curl -X GET "http://tenant1.local/api/admin/users" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: 1" \
  -d '{
    "filter": {
      "search": {
        "username": "admin"
      }
    }
  }'
```

### Test 4: Tri par date de création (décroissant)

```bash
curl -X GET "http://tenant1.local/api/admin/users" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: 1" \
  -d '{
    "filter": {
      "order": {
        "created_at": "desc"
      }
    }
  }'
```

### Test 5: Filtrer les utilisateurs actifs

```bash
curl -X GET "http://tenant1.local/api/admin/users" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: 1" \
  -d '{
    "filter": {
      "equal": {
        "is_active": "YES"
      }
    }
  }'
```

### Test 6: Recherche combinée (recherche + filtre + tri)

```bash
curl -X GET "http://tenant1.local/api/admin/users" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: 1" \
  -d '{
    "filter": {
      "search": {
        "email": "@example.com"
      },
      "equal": {
        "is_active": "YES",
        "status": "ACTIVE"
      },
      "order": {
        "created_at": "desc",
        "username": "asc"
      }
    }
  }'
```

### Test 7: Filtrer par plage de dates

```bash
curl -X GET "http://tenant1.local/api/admin/users" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: 1" \
  -d '{
    "filter": {
      "range": {
        "created_at_from": "2024-01-01",
        "created_at_to": "2024-12-31"
      },
      "order": {
        "created_at": "desc"
      }
    }
  }'
```

### Test 8: Obtenir les statistiques

```bash
curl -X GET "http://tenant1.local/api/admin/users/statistics" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Accept: application/json" \
  -H "X-Tenant-ID: 1"
```

**Réponse attendue:**
```json
{
  "success": true,
  "data": {
    "total": 450,
    "active": 420,
    "inactive": 30,
    "locked": 5
  }
}
```

### Test 9: Obtenir un utilisateur spécifique

```bash
curl -X GET "http://tenant1.local/api/admin/users/1" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Accept: application/json" \
  -H "X-Tenant-ID: 1"
```

## Résolution des Problèmes

### Erreur: "Unauthenticated"

**Cause:** Le token n'est pas valide ou a expiré.

**Solution:** Connectez-vous à nouveau pour obtenir un nouveau token.

### Erreur: "Table doesn't exist"

**Cause:** Certaines tables optionnelles n'existent pas dans votre base de données tenant.

**Solution:** C'est normal ! Le code a été mis à jour pour gérer automatiquement les tables manquantes. Les relations optionnelles seront simplement omises.

### Erreur: "SQLSTATE[42S02]: Base table or view not found"

**Cause:** Le code essaie d'accéder à une table qui n'existe pas.

**Solution:** Vérifiez que vous utilisez la dernière version du code avec la gestion des tables optionnelles.

### Pas de réponse / Timeout

**Cause:** Le serveur Laravel n'est pas démarré ou l'URL est incorrecte.

**Solution:**
1. Vérifiez que Laravel est lancé (`php artisan serve` ou Apache/Nginx)
2. Vérifiez que l'URL est correcte (http://tenant1.local ou http://localhost:8000)

## Vérifier les Tables Disponibles

Pour voir quelles tables existent dans votre base de données tenant :

```bash
mysql -u root -p
```

Puis :
```sql
USE site_theme32;  -- Remplacez par votre nom de base tenant
SHOW TABLES LIKE 't_users%';
```

## Format de Réponse Complet

Voici un exemple complet de réponse de l'API :

```json
{
  "success": true,
  "data": [
    {
      "id": 341,
      "username": "john.doe",
      "firstname": "John",
      "lastname": "Doe",
      "full_name": "John Doe",
      "email": "john.doe@example.com",
      "sex": "Mr",
      "phone": "+1234567890",
      "mobile": "+1234567890",
      "birthday": "1990-01-01",
      "picture": "",
      "application": "admin",
      "is_active": "YES",
      "is_guess": "NO",
      "is_locked": "NO",
      "locked_at": null,
      "is_secure_by_code": "NO",
      "status": "ACTIVE",
      "number_of_try": 0,
      "last_password_gen": "2024-01-01T00:00:00+00:00",
      "lastlogin": "2024-01-15T10:30:00+00:00",
      "created_at": "2024-01-01T00:00:00+00:00",
      "updated_at": "2024-01-15T10:30:00+00:00",
      "groups_list": "admin,manager",
      "teams_list": null,
      "functions_list": null,
      "profiles_list": null,
      "groups": [
        {
          "id": 1,
          "name": "admin",
          "permissions": null
        }
      ],
      "creator": {
        "id": 1,
        "username": "admin",
        "full_name": "Admin User"
      },
      "unlocker": null,
      "callcenter": null,
      "company_id": null,
      "callcenter_id": null,
      "team_id": null,
      "creator_id": 1,
      "unlocked_by": null
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 100,
    "total": 64,
    "from": 1,
    "to": 64
  },
  "statistics": {
    "total": 64,
    "active": 60,
    "inactive": 4,
    "locked": 0
  },
  "tenant": {
    "id": 1,
    "host": "tenant1.local"
  }
}
```

## Notes Importantes

1. **Token d'Authentification:** Remplacez `VOTRE_TOKEN` par le token réel obtenu lors de la connexion.

2. **X-Tenant-ID Header:** Ce header est obligatoire pour toutes les requêtes tenant.

3. **Tables Optionnelles:** Si certaines tables n'existent pas dans votre base de données (comme `t_users_team_users`, `t_users_functions`, `t_users_profiles`), les listes correspondantes seront `null` ou omises. C'est un comportement normal.

4. **Pagination:** Par défaut, l'API retourne 100 utilisateurs par page. Utilisez `nbitemsbypage` pour changer ce nombre.

5. **Performance:** L'API utilise des requêtes optimisées avec eager loading et GROUP_CONCAT pour minimiser le nombre de requêtes à la base de données.
