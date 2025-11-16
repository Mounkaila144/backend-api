# Documentation des filtres - API Utilisateurs

## Vue d'ensemble

L'API utilisateurs supporte de nombreux filtres pour affiner vos recherches. Les filtres sont organisés en 3 catégories :
1. **Recherche** (`filter[search]`) - Recherche textuelle
2. **Égalité** (`filter[equal]`) - Filtres exacts (y compris relations)
3. **Plage** (`filter[range]`) - Filtres par plage de dates

---

## 1. Filtre de recherche (`filter[search]`)

### Format simple (recommandé)

Recherche dans plusieurs champs à la fois :

```
GET /api/admin/users?filter[search]=joh
```

**Champs recherchés :**
- `username`
- `firstname`
- `lastname`
- `email`
- `phone`
- `mobile`

**Exemple :**
```
http://tenant1.local/api/admin/users?filter[search]=john
```
→ Trouve tous les utilisateurs dont le nom d'utilisateur, prénom, nom, email, téléphone ou mobile contient "john"

---

### Format avancé (recherche par champ spécifique)

Recherche dans des champs spécifiques :

```
GET /api/admin/users?filter[search][username]=joh&filter[search][email]=gmail
```

**Champs disponibles :**
- `filter[search][query]` - Recherche globale (username, firstname, lastname, email)
- `filter[search][id]` - ID exact
- `filter[search][username]` - Nom d'utilisateur
- `filter[search][firstname]` - Prénom
- `filter[search][lastname]` - Nom de famille
- `filter[search][email]` - Email
- `filter[search][phone]` - Téléphone fixe
- `filter[search][mobile]` - Téléphone mobile

**Exemple :**
```
http://tenant1.local/api/admin/users?filter[search][username]=admin&filter[search][email]=@gmail.com
```

---

## 2. Filtres d'égalité (`filter[equal]`)

### Filtres sur les colonnes simples

#### Statuts
```
filter[equal][is_active]=YES          # Utilisateurs actifs uniquement
filter[equal][is_active]=NO           # Utilisateurs inactifs uniquement
filter[equal][status]=ACTIVE          # Statut actif
filter[equal][status]=DELETE          # Statut supprimé
filter[equal][is_locked]=YES          # Utilisateurs verrouillés
filter[equal][is_locked]=NO           # Utilisateurs non verrouillés
filter[equal][is_secure_by_code]=YES  # Sécurisés par code
filter[equal][sex]=MR                 # Hommes uniquement
filter[equal][sex]=MS                 # Femmes non mariées
filter[equal][sex]=MRS                # Femmes mariées
```

**Exemple :**
```
http://tenant1.local/api/admin/users?filter[equal][is_active]=YES&filter[equal][is_locked]=NO
```
→ Utilisateurs actifs et non verrouillés

---

#### Foreign Keys (clés étrangères)

```
filter[equal][company_id]=5           # Entreprise spécifique
filter[equal][company_id]=             # Pas d'entreprise (NULL)
filter[equal][callcenter_id]=3        # Call center spécifique
filter[equal][callcenter_id]=         # Pas de call center (NULL)
filter[equal][creator_id]=10          # Créé par l'utilisateur 10
filter[equal][creator_id]=IS_NULL     # Pas de créateur
filter[equal][unlocked_by]=5          # Déverrouillé par l'utilisateur 5
filter[equal][unlocked_by]=           # Pas déverrouillé
```

**Exemple :**
```
http://tenant1.local/api/admin/users?filter[equal][callcenter_id]=3&filter[equal][is_active]=YES
```
→ Utilisateurs actifs du call center 3

---

### Filtres sur les relations (par ID)

Ces filtres utilisent `whereHas` pour filtrer par relation :

```
filter[equal][group_id]=5          # Utilisateurs du groupe 5
filter[equal][team_id]=2           # Utilisateurs de l'équipe 2
filter[equal][function_id]=3       # Utilisateurs avec la fonction 3
filter[equal][profile_id]=7        # Utilisateurs avec le profil 7
filter[equal][attribution_id]=4    # Utilisateurs avec l'attribution 4
```

**Exemple :**
```
http://tenant1.local/api/admin/users?filter[equal][group_id]=359&filter[equal][team_id]=5
```
→ Utilisateurs du groupe 359 ET de l'équipe 5

**Exemple multi-relations :**
```
http://tenant1.local/api/admin/users?filter[equal][group_id]=10&filter[equal][profile_id]=2&filter[equal][is_active]=YES
```
→ Utilisateurs actifs du groupe 10 avec le profil 2

---

## 3. Filtres de plage (`filter[range]`)

Filtres pour les dates :

```
filter[range][created_at_from]=2025-01-01         # Créés après le 1er janvier 2025
filter[range][created_at_to]=2025-12-31           # Créés avant le 31 décembre 2025
filter[range][lastlogin_from]=2025-01-15          # Dernière connexion après le 15 janvier
filter[range][lastlogin_to]=2025-01-31            # Dernière connexion avant le 31 janvier
```

**Exemple :**
```
http://tenant1.local/api/admin/users?filter[range][created_at_from]=2025-01-01&filter[range][created_at_to]=2025-01-31
```
→ Utilisateurs créés en janvier 2025

---

## 4. Tri (`filter[order]`)

Trier les résultats par colonne :

```
filter[order][id]=desc              # Tri par ID décroissant
filter[order][username]=asc         # Tri par nom d'utilisateur croissant
filter[order][created_at]=desc      # Tri par date de création décroissante
filter[order][lastname]=asc         # Tri par nom de famille croissant
```

**Exemple :**
```
http://tenant1.local/api/admin/users?filter[order][created_at]=desc
```
→ Utilisateurs les plus récents en premier

**Tri multiple :**
```
http://tenant1.local/api/admin/users?filter[order][is_active]=desc&filter[order][lastname]=asc
```
→ Actifs d'abord, puis triés par nom de famille

---

## 5. Pagination

```
page=1                  # Numéro de page
nbitemsbypage=10        # Nombre d'éléments par page
nbitemsbypage=*         # Tous les éléments (max 10000)
```

**Exemple :**
```
http://tenant1.local/api/admin/users?page=2&nbitemsbypage=25
```
→ Page 2 avec 25 utilisateurs par page

---

## 6. Exemples complets

### Exemple 1 : Recherche simple

```
GET /api/admin/users?filter[search]=john&page=1&nbitemsbypage=10
```
→ Recherche "john" dans username, firstname, lastname, email, phone, mobile

---

### Exemple 2 : Utilisateurs actifs d'un groupe

```
GET /api/admin/users?filter[equal][group_id]=359&filter[equal][is_active]=YES&filter[order][lastname]=asc
```
→ Utilisateurs actifs du groupe 359, triés par nom de famille

---

### Exemple 3 : Utilisateurs d'un call center avec un profil spécifique

```
GET /api/admin/users?filter[equal][callcenter_id]=3&filter[equal][profile_id]=40&filter[equal][is_active]=YES
```
→ Utilisateurs actifs du call center 3 avec le profil 40

---

### Exemple 4 : Utilisateurs créés récemment

```
GET /api/admin/users?filter[range][created_at_from]=2025-01-01&filter[order][created_at]=desc&nbitemsbypage=20
```
→ 20 utilisateurs les plus récents créés depuis le 1er janvier 2025

---

### Exemple 5 : Recherche avancée multi-critères

```
GET /api/admin/users?filter[search]=admin&filter[equal][group_id]=1&filter[equal][is_active]=YES&filter[equal][is_locked]=NO&filter[order][id]=desc&page=1&nbitemsbypage=50
```
→ Recherche "admin" dans les utilisateurs actifs, non verrouillés du groupe 1, triés par ID décroissant, 50 par page

---

### Exemple 6 : Utilisateurs sans entreprise

```
GET /api/admin/users?filter[equal][company_id]=&filter[equal][is_active]=YES
```
→ Utilisateurs actifs sans entreprise assignée

---

### Exemple 7 : Utilisateurs d'une équipe créés ce mois-ci

```
GET /api/admin/users?filter[equal][team_id]=5&filter[range][created_at_from]=2025-11-01&filter[range][created_at_to]=2025-11-30
```
→ Utilisateurs de l'équipe 5 créés en novembre 2025

---

## 7. Combiner plusieurs filtres

Vous pouvez combiner autant de filtres que nécessaire :

```
GET /api/admin/users?
  filter[search]=john&
  filter[equal][group_id]=10&
  filter[equal][team_id]=5&
  filter[equal][is_active]=YES&
  filter[equal][is_locked]=NO&
  filter[range][created_at_from]=2025-01-01&
  filter[order][lastname]=asc&
  page=1&
  nbitemsbypage=25
```

**Tous les filtres sont cumulatifs (AND logic)** - l'utilisateur doit correspondre à TOUS les critères.

---

## 8. Format des réponses

### Réponse paginée

```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "username": "johndoe",
      "firstname": "John",
      "lastname": "Doe",
      ...
    }
  ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 25,
    "total": 120,
    "from": 1,
    "to": 25
  },
  "statistics": {
    "total": 120,
    "active": 95,
    "inactive": 25,
    "locked": 3
  }
}
```

---

## 9. Encodage URL

N'oubliez pas d'encoder les URLs correctement :

**Non encodé :**
```
filter[search]=john doe
```

**Encodé (correct) :**
```
filter%5Bsearch%5D=john%20doe
```

La plupart des clients HTTP (Postman, Axios, etc.) encodent automatiquement les URLs.

---

## 10. Résumé des filtres disponibles

| Type | Paramètre | Valeurs | Description |
|------|-----------|---------|-------------|
| **Search** | `filter[search]` | string | Recherche globale |
| **Search** | `filter[search][username]` | string | Recherche par username |
| **Search** | `filter[search][firstname]` | string | Recherche par prénom |
| **Search** | `filter[search][lastname]` | string | Recherche par nom |
| **Search** | `filter[search][email]` | string | Recherche par email |
| **Search** | `filter[search][phone]` | string | Recherche par téléphone |
| **Search** | `filter[search][mobile]` | string | Recherche par mobile |
| **Equal** | `filter[equal][is_active]` | YES/NO | Statut actif |
| **Equal** | `filter[equal][is_locked]` | YES/NO | Statut verrouillé |
| **Equal** | `filter[equal][status]` | ACTIVE/DELETE | Statut général |
| **Equal** | `filter[equal][sex]` | MR/MS/MRS | Sexe |
| **Equal** | `filter[equal][group_id]` | integer | ID du groupe |
| **Equal** | `filter[equal][team_id]` | integer | ID de l'équipe |
| **Equal** | `filter[equal][function_id]` | integer | ID de la fonction |
| **Equal** | `filter[equal][profile_id]` | integer | ID du profil |
| **Equal** | `filter[equal][attribution_id]` | integer | ID de l'attribution |
| **Equal** | `filter[equal][company_id]` | integer/'' | ID de l'entreprise |
| **Equal** | `filter[equal][callcenter_id]` | integer/'' | ID du call center |
| **Equal** | `filter[equal][creator_id]` | integer/IS_NULL | ID du créateur |
| **Equal** | `filter[equal][unlocked_by]` | integer/IS_NULL | ID du déverrouilleur |
| **Range** | `filter[range][created_at_from]` | date | Date de création min |
| **Range** | `filter[range][created_at_to]` | date | Date de création max |
| **Range** | `filter[range][lastlogin_from]` | date | Dernière connexion min |
| **Range** | `filter[range][lastlogin_to]` | date | Dernière connexion max |
| **Order** | `filter[order][field]` | asc/desc | Tri par champ |
| **Pagination** | `page` | integer | Numéro de page |
| **Pagination** | `nbitemsbypage` | integer/* | Éléments par page |