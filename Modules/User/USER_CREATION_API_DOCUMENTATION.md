# API de création d'utilisateurs avec assignations

## Vue d'ensemble

L'API permet maintenant de créer des utilisateurs avec toutes leurs assignations (groupes, fonctions, profils, équipes, attributions, et permissions) en une seule requête.

### Fonctionnalité clé
Lorsque vous assignez un **groupe** à un utilisateur, **toutes les permissions de ce groupe sont automatiquement assignées** à l'utilisateur.

---

## 1. Récupérer les options disponibles

**Endpoint:** `GET /api/admin/users/creation-options`

**Headers:**
```
Authorization: Bearer {token}
X-Tenant-ID: {tenant_id}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "groups": [
      {
        "id": 1,
        "name": "Administrateurs",
        "permissions_count": 150,
        "permission_ids": [1, 2, 3, ...]
      }
    ],
    "permission_groups": [
      {
        "id": 1,
        "name": "Gestion des utilisateurs",
        "permissions": [
          {
            "id": 1,
            "name": "settings_user_create"
          },
          {
            "id": 2,
            "name": "settings_user_edit"
          }
        ]
      }
    ],
    "functions": [
      {
        "id": 1,
        "name": "Chef d'équipe"
      }
    ],
    "profiles": [
      {
        "id": 1,
        "name": "Téléprospecteur"
      }
    ],
    "teams": [
      {
        "id": 1,
        "name": "Équipe A",
        "manager_id": 5
      }
    ],
    "attributions": [
      {
        "id": 1,
        "name": "Attribution 1"
      }
    ],
    "callcenters": [
      {
        "id": 1,
        "name": "Call Center Paris"
      }
    ]
  }
}
```

---

## 2. Créer un utilisateur avec assignations

**Endpoint:** `POST /api/admin/users`

**Headers:**
```
Authorization: Bearer {token}
X-Tenant-ID: {tenant_id}
Content-Type: application/json
```

**Corps de la requête:**
```json
{
  "username": "johndoe",
  "password": "password123",
  "email": "john@example.com",
  "firstname": "John",
  "lastname": "Doe",
  "sex": "MR",
  "phone": "0123456789",
  "mobile": "0612345678",
  "birthday": "1990-01-15",
  "is_active": "YES",
  "application": "admin",

  "callcenter_id": 1,
  "team_id": 2,
  "company_id": 1,

  "group_ids": [1, 3],
  "function_ids": [2, 5],
  "profile_ids": [1],
  "team_ids": [1, 2],
  "attribution_ids": [3],
  "permission_ids": [10, 20, 30]
}
```

### Champs requis
- `username` : Nom d'utilisateur unique (max 16 caractères)
- `password` : Mot de passe (6-32 caractères)
- `email` : Email unique
- `application` : "admin" ou "frontend"

### Champs optionnels

**Informations personnelles:**
- `firstname` : Prénom (max 16 caractères)
- `lastname` : Nom (max 32 caractères)
- `sex` : "MR", "MS", ou "MRS"
- `phone` : Téléphone fixe (max 20 caractères)
- `mobile` : Téléphone mobile (max 20 caractères)
- `birthday` : Date de naissance (format: YYYY-MM-DD)
- `is_active` : "YES" ou "NO" (défaut: "NO")

**Clés étrangères:**
- `callcenter_id` : ID du call center
- `team_id` : ID de l'équipe principale
- `company_id` : ID de l'entreprise

**Assignations (tableaux d'IDs):**
- `group_ids` : IDs des groupes (⚠️ Les permissions des groupes seront automatiquement assignées)
- `function_ids` : IDs des fonctions
- `profile_ids` : IDs des profils
- `team_ids` : IDs des équipes (many-to-many)
- `attribution_ids` : IDs des attributions
- `permission_ids` : IDs des permissions individuelles (en plus des permissions des groupes)

---

## 3. Logique d'assignation des permissions

### Assignation automatique
Lorsque vous assignez des groupes via `group_ids`, le système:
1. Assigne les groupes à l'utilisateur
2. **Récupère automatiquement toutes les permissions de ces groupes**
3. Assigne ces permissions à l'utilisateur

### Permissions individuelles
Vous pouvez également assigner des permissions individuelles via `permission_ids`:
- Ces permissions s'ajoutent à celles des groupes
- Les doublons sont automatiquement évités
- Utile pour donner des permissions supplémentaires spécifiques

### Exemple pratique

**Requête:**
```json
{
  "username": "manager1",
  "password": "secure123",
  "email": "manager@company.com",
  "application": "admin",
  "group_ids": [1, 2],      // Groupe 1 a 100 permissions, Groupe 2 a 50 permissions
  "permission_ids": [200]    // Permission individuelle supplémentaire
}
```

**Résultat:**
- L'utilisateur aura les 2 groupes assignés
- L'utilisateur aura ~150 permissions (100 + 50, sans doublons)
- L'utilisateur aura également la permission 200 si elle n'était pas déjà dans les groupes

---

## 4. Réponse de création

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 123,
    "username": "johndoe",
    "email": "john@example.com",
    "firstname": "John",
    "lastname": "Doe",
    "full_name": "John Doe",
    "is_active": "YES",
    "application": "admin",

    "groups": [
      {
        "id": 1,
        "name": "Administrateurs"
      }
    ],

    "functions": [
      {
        "id": 2,
        "name": "Chef d'équipe"
      }
    ],

    "profiles": "Téléprospecteur",

    "teams": [
      {
        "id": 1,
        "name": "Équipe A"
      }
    ],

    "permissions": 153,

    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

---

## 5. Cas d'usage

### Cas 1 : Créer un administrateur complet
```json
{
  "username": "admin_john",
  "password": "AdminPass123!",
  "email": "admin@company.com",
  "firstname": "John",
  "lastname": "Admin",
  "application": "admin",
  "is_active": "YES",
  "group_ids": [1]  // Groupe "Administrateurs" avec toutes les permissions
}
```

### Cas 2 : Créer un téléprospecteur
```json
{
  "username": "telepro1",
  "password": "Secure123!",
  "email": "telepro@company.com",
  "application": "admin",
  "is_active": "YES",
  "callcenter_id": 1,
  "team_id": 3,
  "group_ids": [5],          // Groupe "Téléprospecteurs"
  "profile_ids": [2],        // Profil "Téléprospecteur"
  "function_ids": [10]       // Fonction "Prospection"
}
```

### Cas 3 : Créer un chef d'équipe avec permissions spécifiques
```json
{
  "username": "team_leader",
  "password": "Leader123!",
  "email": "leader@company.com",
  "application": "admin",
  "is_active": "YES",
  "team_id": 5,
  "group_ids": [3],                    // Groupe "Managers"
  "function_ids": [1],                 // Fonction "Chef d'équipe"
  "team_ids": [5, 6],                  // Gère plusieurs équipes
  "permission_ids": [150, 151, 152]    // Permissions supplémentaires spécifiques
}
```

---

## 6. Validation et erreurs

### Erreurs de validation courantes

**Username déjà utilisé:**
```json
{
  "message": "The username has already been taken.",
  "errors": {
    "username": ["The username has already been taken."]
  }
}
```

**Email déjà utilisé:**
```json
{
  "message": "The email has already been taken.",
  "errors": {
    "email": ["The email has already been taken."]
  }
}
```

**ID de groupe invalide:**
```json
{
  "message": "The selected group_ids.0 is invalid.",
  "errors": {
    "group_ids.0": ["The selected group_ids.0 is invalid."]
  }
}
```

---

## 7. Frontend - Comment implémenter

### Étape 1 : Récupérer les options au chargement du formulaire
```javascript
async function loadCreationOptions() {
  const response = await fetch('/api/admin/users/creation-options', {
    headers: {
      'Authorization': 'Bearer ' + token,
      'X-Tenant-ID': tenantId
    }
  });

  const { data } = await response.json();

  // data.groups - Liste des groupes avec leurs permissions
  // data.permission_groups - Permissions groupées par catégorie
  // data.functions - Liste des fonctions
  // data.profiles - Liste des profils
  // data.teams - Liste des équipes
  // data.attributions - Liste des attributions
  // data.callcenters - Liste des call centers

  return data;
}
```

### Étape 2 : Afficher les groupes avec auto-sélection des permissions
```javascript
// Quand l'utilisateur coche un groupe
function onGroupChecked(groupId, isChecked) {
  const group = groups.find(g => g.id === groupId);

  if (isChecked) {
    // Cocher automatiquement toutes les permissions du groupe
    group.permission_ids.forEach(permId => {
      checkPermission(permId);
    });
  } else {
    // Décocher les permissions du groupe
    group.permission_ids.forEach(permId => {
      uncheckPermission(permId);
    });
  }
}
```

### Étape 3 : Soumettre le formulaire
```javascript
async function createUser(formData) {
  const payload = {
    username: formData.username,
    password: formData.password,
    email: formData.email,
    firstname: formData.firstname,
    lastname: formData.lastname,
    application: 'admin',
    is_active: 'YES',

    // Tableaux d'IDs sélectionnés
    group_ids: getSelectedGroupIds(),
    function_ids: getSelectedFunctionIds(),
    profile_ids: getSelectedProfileIds(),
    team_ids: getSelectedTeamIds(),
    permission_ids: getSelectedPermissionIds()
  };

  const response = await fetch('/api/admin/users', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'X-Tenant-ID': tenantId,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  return await response.json();
}
```

---

## 8. Remarques importantes

1. **Permissions automatiques** : Lorsque vous assignez un groupe, les permissions sont automatiquement assignées. Vous n'avez pas besoin de les envoyer dans `permission_ids`.

2. **Sécurité** : Le mot de passe est automatiquement hashé avec bcrypt avant d'être stocké.

3. **Unicité** : Les combinaisons `username` + `application` et `email` + `application` doivent être uniques.

4. **Traductions** : Les noms de fonctions, profils et attributions sont automatiquement retournés en français.

5. **Validation** : Tous les IDs sont validés pour s'assurer qu'ils existent dans la base de données.

6. **Transactions** : La création et toutes les assignations sont effectuées dans une transaction pour garantir la cohérence des données.
