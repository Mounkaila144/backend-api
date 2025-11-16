# API de mise à jour d'utilisateurs avec assignations

## Vue d'ensemble

L'API permet de mettre à jour un utilisateur existant avec toutes ses assignations (groupes, fonctions, profils, équipes, attributions, et permissions) en une seule requête.

### Fonctionnalité clé
La méthode utilise la **synchronisation** (sync) au lieu de l'ajout (attach), ce qui signifie que :
- Les anciennes assignations sont **remplacées** par les nouvelles
- Vous devez envoyer **toutes** les assignations que vous voulez conserver
- Ce qui n'est pas envoyé sera **supprimé**

---

## Endpoint

**Route:** `PUT /api/admin/users/{id}` ou `PATCH /api/admin/users/{id}`

**Headers:**
```
Authorization: Bearer {token}
X-Tenant-ID: {tenant_id}
Content-Type: application/json
```

---

## Corps de la requête

### Exemple complet

```json
{
  "username": "johndoe_updated",
  "password": "newpassword123",
  "email": "john.updated@example.com",
  "firstname": "John",
  "lastname": "Doe Updated",
  "sex": "MR",
  "phone": "0123456789",
  "mobile": "0612345678",
  "birthday": "1990-01-15",
  "is_active": "YES",
  "is_locked": "NO",
  "application": "admin",

  "callcenter_id": 2,
  "team_id": 3,
  "company_id": 1,

  "group_ids": [1, 3, 5],
  "function_ids": [2, 4],
  "profile_ids": [1],
  "team_ids": [1, 2, 3],
  "attribution_ids": [3, 4],
  "permission_ids": [10, 20, 30, 40, 50]
}
```

---

## Champs disponibles

### Informations de base (optionnelles)
- `username` : Nom d'utilisateur (max 16 caractères, unique)
- `password` : Nouveau mot de passe (6-32 caractères)
- `email` : Email (unique)
- `firstname` : Prénom (max 16 caractères)
- `lastname` : Nom (max 32 caractères)
- `sex` : "MR", "MS", ou "MRS"
- `phone` : Téléphone fixe (max 20 caractères)
- `mobile` : Téléphone mobile (max 20 caractères)
- `birthday` : Date de naissance (YYYY-MM-DD)
- `is_active` : "YES" ou "NO"
- `is_locked` : "YES" ou "NO"
- `is_secure_by_code` : "YES" ou "NO"
- `status` : "ACTIVE" ou "DELETE"
- `application` : "admin" ou "frontend"

### Clés étrangères
- `callcenter_id` : ID du call center
- `team_id` : ID de l'équipe principale
- `company_id` : ID de l'entreprise

### Assignations (tableaux d'IDs)
- `group_ids` : IDs des groupes (⚠️ Remplace tous les groupes existants)
- `function_ids` : IDs des fonctions (⚠️ Remplace toutes les fonctions existantes)
- `profile_ids` : IDs des profils (⚠️ Remplace tous les profils existants)
- `team_ids` : IDs des équipes (⚠️ Remplace toutes les équipes existantes)
- `attribution_ids` : IDs des attributions (⚠️ Remplace toutes les attributions existantes)
- `permission_ids` : IDs des permissions (⚠️ Remplace toutes les permissions existantes)

---

## Comportement de synchronisation

### ⚠️ IMPORTANT : Comportement de remplacement

Contrairement à la création, la mise à jour **remplace complètement** les assignations existantes :

**Exemple :**

Utilisateur actuel :
```json
{
  "id": 123,
  "group_ids": [1, 2, 3],
  "permission_ids": [10, 20, 30, 40, 50]
}
```

Vous envoyez :
```json
{
  "group_ids": [1, 5],
  "permission_ids": [10, 60, 70]
}
```

Résultat final :
```json
{
  "id": 123,
  "group_ids": [1, 5],           // Groupes 2 et 3 supprimés, groupe 5 ajouté
  "permission_ids": [10, 60, 70] // Permissions 20,30,40,50 supprimées, 60,70 ajoutées
}
```

---

## Mise à jour partielle vs complète

### Option 1 : Mise à jour partielle (sans assignations)

Si vous ne voulez modifier que le prénom et le téléphone :

```json
{
  "firstname": "NewFirstName",
  "phone": "0999999999"
}
```

Les groupes, fonctions, profils, etc. **ne seront PAS modifiés** car vous ne les avez pas inclus dans la requête.

### Option 2 : Mise à jour complète (avec assignations)

Si vous envoyez `group_ids`, alors **tous les groupes seront remplacés** par ceux que vous envoyez :

```json
{
  "firstname": "NewFirstName",
  "group_ids": [1, 2]  // TOUS les groupes seront remplacés par [1, 2]
}
```

---

## Cas d'usage

### Cas 1 : Modifier uniquement les informations de base

```json
PUT /api/admin/users/123
{
  "firstname": "Jean",
  "lastname": "Dupont",
  "phone": "0123456789",
  "is_active": "YES"
}
```

✅ Résultat : Seules les infos de base sont modifiées, les groupes/permissions restent intacts.

---

### Cas 2 : Ajouter un groupe supplémentaire

⚠️ Vous devez récupérer les groupes existants et ajouter le nouveau :

**Étape 1 : Récupérer l'utilisateur actuel**
```javascript
GET /api/admin/users/123
// Réponse : { groups: [{id: 1}, {id: 2}] }
```

**Étape 2 : Envoyer tous les groupes (anciens + nouveaux)**
```json
PUT /api/admin/users/123
{
  "group_ids": [1, 2, 5]  // Les 2 anciens + le nouveau (5)
}
```

---

### Cas 3 : Retirer un groupe

**Étape 1 : Récupérer l'utilisateur actuel**
```javascript
GET /api/admin/users/123
// Réponse : { groups: [{id: 1}, {id: 2}, {id: 3}] }
```

**Étape 2 : Envoyer uniquement les groupes à conserver**
```json
PUT /api/admin/users/123
{
  "group_ids": [1, 3]  // Le groupe 2 est retiré
}
```

---

### Cas 4 : Remplacer toutes les permissions

```json
PUT /api/admin/users/123
{
  "permission_ids": [100, 101, 102, 103]
}
```

✅ Résultat : L'utilisateur n'aura QUE ces 4 permissions, toutes les anciennes seront supprimées.

---

### Cas 5 : Retirer toutes les permissions

```json
PUT /api/admin/users/123
{
  "permission_ids": []
}
```

✅ Résultat : Toutes les permissions de l'utilisateur seront supprimées.

---

## Workflow frontend recommandé

### Lors du chargement du formulaire d'édition

1. **Récupérer les données actuelles de l'utilisateur**
   ```javascript
   const response = await fetch(`/api/admin/users/${userId}`);
   const user = await response.json();

   // Pre-remplir le formulaire avec les valeurs existantes
   const currentGroupIds = user.data.groups.map(g => g.id);
   const currentPermissionIds = ... // Récupérer depuis le backend
   ```

2. **Afficher les cases cochées selon les assignations actuelles**
   ```javascript
   // Cocher les groupes actuels
   currentGroupIds.forEach(id => checkGroup(id));

   // Cocher les permissions actuelles
   currentPermissionIds.forEach(id => checkPermission(id));
   ```

### Lors de la soumission

3. **Récupérer toutes les cases cochées**
   ```javascript
   const formData = {
     firstname: form.firstname,
     lastname: form.lastname,

     // Envoyer TOUS les IDs cochés
     group_ids: getCheckedGroupIds(),
     function_ids: getCheckedFunctionIds(),
     profile_ids: getCheckedProfileIds(),
     permission_ids: getCheckedPermissionIds()
   };
   ```

4. **Envoyer la requête de mise à jour**
   ```javascript
   const response = await fetch(`/api/admin/users/${userId}`, {
     method: 'PUT',
     headers: {
       'Authorization': `Bearer ${token}`,
       'X-Tenant-ID': tenantId,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify(formData)
   });
   ```

---

## Réponse

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": 123,
    "username": "johndoe_updated",
    "email": "john.updated@example.com",
    "firstname": "John",
    "lastname": "Doe Updated",
    "full_name": "John Doe Updated",
    "is_active": "YES",
    "is_locked": "NO",

    "groups": [
      {
        "id": 1,
        "name": "Administrateurs"
      },
      {
        "id": 3,
        "name": "Managers"
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
      },
      {
        "id": 2,
        "name": "Équipe B"
      }
    ],

    "permissions": 153,

    "updated_at": "2025-01-15T14:30:00Z"
  }
}
```

---

## Erreurs possibles

### Username déjà utilisé
```json
{
  "message": "The username has already been taken.",
  "errors": {
    "username": ["The username has already been taken."]
  }
}
```

### ID invalide
```json
{
  "message": "The selected group_ids.0 is invalid.",
  "errors": {
    "group_ids.0": ["The selected group_ids.0 is invalid."]
  }
}
```

### Utilisateur non trouvé
```json
{
  "message": "No query results for model [Modules\\User\\Entities\\User] 999",
  "exception": "Illuminate\\Database\\Eloquent\\ModelNotFoundException"
}
```

---

## Différences avec la création

| Aspect | Création (POST) | Mise à jour (PUT) |
|--------|----------------|-------------------|
| Champs requis | `username`, `password`, `email`, `application` | Tous optionnels |
| Mot de passe | Requis | Optionnel (ne pas envoyer pour ne pas changer) |
| Comportement assignations | Ajout (attach) | Remplacement (sync) |
| Assignations omises | Pas d'assignation | Pas de modification |
| Tableau vide `[]` | Pas d'assignation | Suppression de toutes les assignations |

---

## Astuces importantes

✅ **Pour ajouter une assignation** : Récupérez les existantes + ajoutez la nouvelle
✅ **Pour retirer une assignation** : Envoyez uniquement celles à conserver
✅ **Pour ne pas modifier les assignations** : Ne les incluez pas dans la requête
✅ **Pour vider toutes les assignations** : Envoyez un tableau vide `[]`
✅ **Pour changer le mot de passe** : Incluez le champ `password`
✅ **Pour ne pas changer le mot de passe** : Ne pas inclure le champ `password`
