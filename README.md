# Documentation Complète - Système Multi-Sites iCall26

## 📋 Table des Matières

1. [Vue d'Ensemble du Projet](#vue-densemble-du-projet)
2. [Architecture Générale](#architecture-générale)
3. [Les Technologies Utilisées](#les-technologies-utilisées)
4. [Comment Fonctionne le Système Multi-Sites](#comment-fonctionne-le-système-multi-sites)
5. [Structure du Backend (API Laravel)](#structure-du-backend-api-laravel)
6. [Structure du Frontend (Interface Next.js)](#structure-du-frontend-interface-nextjs)
7. [Les Modules Développés](#les-modules-développés)
8. [Le Système d'Authentification](#le-système-dauthentification)
9. [Le Système de Menus Dynamiques](#le-système-de-menus-dynamiques)
10. [Les Outils de Développement](#les-outils-de-développement)

---

## 🎯 Vue d'Ensemble du Projet

### Qu'est-ce que ce projet ?

Ce projet est une **plateforme SaaS (Software as a Service)** moderne qui permet de gérer plusieurs sites clients à partir d'une seule application. C'est comme avoir un immeuble avec plusieurs appartements : chaque client a son propre espace privé (sa base de données), mais tous partagent la même infrastructure (le code de l'application).

### Objectif Principal

Migrer l'ancien système iCall26 (construit avec Symfony 1, une technologie de 2007) vers une architecture moderne et performante utilisant :
- **Laravel 12** pour le backend (la partie serveur qui gère les données)
- **Next.js 16** pour le frontend (l'interface utilisateur dans le navigateur)

### État d'Avancement

✅ **Déjà Réalisé :**
- Création du projet Laravel 12 avec architecture modulaire
- Connexion à la base de données existante icall26
- Configuration du système multi-sites (multi-tenancy)
- Création de 5 modules de base : UsersGuard, User, Dashboard, Customer, CustomersContracts
- Création du projet Next.js 16 avec architecture modulaire
- Système d'authentification complet (login/logout)
- Interface d'administration avec sidebar, navbar, gestion des langues
- Système de routage dynamique basé sur la base de données
- 7 modules frontend créés et fonctionnels

🚧 **En Cours :**
- Module CustomersContracts (gestion des contrats clients)
- Documentation complète du système

---

## 🏗️ Architecture Générale

### Schéma d'Architecture Globale

```
┌─────────────────────────────────────────────────────────────────────┐
│                         UTILISATEURS                                 │
│                     (Navigateur Web)                                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js 16)                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Interface Utilisateur (React 19)                           │   │
│  │  - Pages d'administration                                   │   │
│  │  - Composants réutilisables                                 │   │
│  │  - Gestion de l'état (Context API)                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Système de Modules                                         │   │
│  │  UsersGuard | Dashboard | Customers | Contracts | etc.     │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                    HTTP Requests (Axios)
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND (Laravel 12 API)                        │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Couche API (Routes & Controllers)                          │   │
│  │  /api/superadmin/* | /api/admin/* | /api/frontend/*        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Middleware Multi-Sites (InitializeTenancy)                 │   │
│  │  Détecte le site client et bascule vers sa base de données │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Système de Modules                                         │   │
│  │  UsersGuard | User | Dashboard | Customer | Contracts      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Sécurité (Laravel Sanctum)                                 │   │
│  │  Gestion des tokens d'authentification                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BASES DE DONNÉES (MySQL)                        │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  BASE CENTRALE (site_dev1)                                   │  │
│  │  Contient la liste de tous les sites clients (t_sites)      │  │
│  │  Site 1: domain=api.local, database=site_dev1               │  │
│  │  Site 75: domain=tenant1.local, database=site_theme32       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  BASES CLIENTS (une par site)                               │  │
│  │  - site_dev1 (205 utilisateurs)                             │  │
│  │  - site_theme32 (66 utilisateurs)                           │  │
│  │  Chaque base contient : t_users, t_customers, etc.          │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Les 3 Couches de l'Application

L'application est organisée en **3 couches distinctes** :

#### 1. Couche Superadmin (Administration Centrale)
- **Qui ?** Les administrateurs de la plateforme
- **Quoi ?** Gérer la liste des sites clients
- **Base de données ?** Base centrale uniquement
- **URL :** `/api/superadmin/*`
- **Exemple :** Ajouter un nouveau site client

#### 2. Couche Admin (Administration d'un Site)
- **Qui ?** Les administrateurs d'un site client spécifique
- **Quoi ?** Gérer les données de leur site (utilisateurs, clients, contrats)
- **Base de données ?** Base de données du site client
- **URL :** `/api/admin/*`
- **Exemple :** Créer un nouveau contrat client

#### 3. Couche Frontend (Interface Publique)
- **Qui ?** Les utilisateurs finaux d'un site client
- **Quoi ?** Consulter et utiliser les fonctionnalités publiques
- **Base de données ?** Base de données du site client
- **URL :** `/api/frontend/*`
- **Exemple :** Consulter un contrat existant

---

## 🛠️ Les Technologies Utilisées

### Backend (Serveur API)

| Technologie | Version | Rôle | Analogie |
|------------|---------|------|----------|
| **Laravel** | 12 | Framework PHP principal | C'est comme la fondation d'une maison : elle structure tout le reste |
| **PHP** | 8.2+ | Langage de programmation | Le langage que l'ordinateur comprend pour exécuter les instructions |
| **MySQL** | 8.0+ | Base de données | Comme un immense classeur numérique pour stocker toutes les informations |
| **Laravel Sanctum** | 4.2 | Authentification API | Le système de badges d'accès : vérifie qui a le droit d'entrer |
| **Stancl Tenancy** | 3.9.1 | Multi-sites | Le système qui isole chaque client dans son propre espace |
| **Nwidart Modules** | 12.0 | Architecture modulaire | Permet de découper l'application en modules indépendants |
| **Spatie Query Builder** | 6.3 | Filtres et recherches | Facilite la recherche et le tri des données |
| **Vite** | 7.x | Compilation des assets | Prépare les fichiers CSS/JS pour être utilisés |
| **Tailwind CSS** | 4.0 | Styles CSS | Framework de design pour une interface moderne |

### Frontend (Interface Utilisateur)

| Technologie | Version | Rôle | Analogie |
|------------|---------|------|----------|
| **Next.js** | 16 | Framework React | La structure de l'interface utilisateur |
| **React** | 19.2 | Bibliothèque UI | Les briques pour construire l'interface |
| **TypeScript** | 5 | Langage de programmation | JavaScript avec un système de vérification des erreurs |
| **Tailwind CSS** | 4.0 | Styles CSS | Le design et l'apparence de l'interface |
| **Axios** | 1.12.2 | Client HTTP | Le messager qui envoie et reçoit des données du serveur |
| **React Context** | Built-in | Gestion d'état | Permet de partager des données entre plusieurs composants |

### Outils de Développement

| Outil | Rôle |
|-------|------|
| **Composer** | Gestionnaire de packages PHP (comme un app store pour développeurs) |
| **NPM** | Gestionnaire de packages JavaScript |
| **Git** | Système de versioning (historique des modifications du code) |
| **PHPUnit** | Tests automatisés du backend |
| **Laravel Pint** | Formateur de code PHP (rend le code propre et cohérent) |
| **ESLint** | Vérificateur de code JavaScript |

---

## 🏢 Comment Fonctionne le Système Multi-Sites

### Concept du Multi-Tenancy (Multi-Sites)

Imaginez un immeuble d'appartements :
- **L'immeuble** = votre application Laravel
- **Chaque appartement** = un site client
- **La loge du concierge** = la base de données centrale
- **Les appartements** = les bases de données des clients

**Avantages :**
- Chaque client a ses propres données (privées et sécurisées)
- Un seul code à maintenir (mises à jour faciles)
- Isolation complète : si un client a un problème, les autres ne sont pas affectés

### Schéma de Fonctionnement

```
┌──────────────────────────────────────────────────────────────────┐
│  ÉTAPE 1 : Requête d'un Utilisateur                              │
│  URL: https://client1.icall.com/admin/customers                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  ÉTAPE 2 : Middleware InitializeTenancy                          │
│  1. Lit le nom de domaine: "client1.icall.com"                  │
│  2. Cherche dans la base centrale (t_sites)                     │
│  3. Trouve: site_id=75, database=site_theme32                   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  ÉTAPE 3 : Basculement de Base de Données                       │
│  Laravel se connecte maintenant à: site_theme32                 │
│  Toutes les requêtes SQL utilisent cette base                   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  ÉTAPE 4 : Traitement de la Requête                             │
│  Le controller récupère les clients de site_theme32             │
│  Retourne les données au format JSON                            │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  ÉTAPE 5 : Nettoyage                                             │
│  Laravel revient à la connexion par défaut (base centrale)      │
│  Prêt pour la prochaine requête                                 │
└──────────────────────────────────────────────────────────────────┘
```

### Les Deux Méthodes d'Identification

#### Méthode 1 : Par Domaine (Recommandée - Production)
```
https://client1.icall.com → site_id=75 → base=site_theme32
https://client2.icall.com → site_id=1  → base=site_dev1
```

#### Méthode 2 : Par En-tête HTTP (Développement)
```
GET http://localhost:8000/api/admin/customers
Header: X-Tenant-ID: 75
```

### Table t_sites (Registre des Sites)

Cette table dans la base centrale contient la configuration de tous les sites :

| Colonne | Description | Exemple |
|---------|-------------|---------|
| `site_id` | Identifiant unique du site | 75 |
| `site_host` | Nom de domaine | tenant1.local |
| `site_db_name` | Nom de la base de données | site_theme32 |
| `site_db_host` | Serveur de base de données | localhost |
| `site_db_login` | Utilisateur BDD | root |
| `site_db_password` | Mot de passe BDD | (vide) |
| `site_available` | Site actif ? | YES/NO |

---

## 📁 Structure du Backend (API Laravel)

### Arborescence Complète

```
C:\laragon\www\backend-api/
│
├── 📂 app/                          # Code principal de l'application
│   ├── 📂 Console/                  # Commandes artisan personnalisées
│   ├── 📂 Http/
│   │   └── 📂 Middleware/
│   │       └── InitializeTenancy.php  # ⭐ Middleware multi-sites
│   ├── 📂 Models/
│   │   ├── Tenant.php               # ⭐ Modèle du site client
│   │   └── User.php                 # Modèle utilisateur superadmin
│   └── 📂 Providers/                # Fournisseurs de services
│
├── 📂 bootstrap/                     # Initialisation de Laravel
│   └── app.php                      # ⭐ Enregistrement des middlewares
│
├── 📂 config/                        # Fichiers de configuration
│   ├── database.php                 # ⭐ Configuration BDD (mysql + tenant)
│   ├── tenancy.php                  # ⭐ Configuration multi-sites
│   ├── modules.php                  # Configuration des modules
│   └── sanctum.php                  # Configuration authentification API
│
├── 📂 database/                      # Base de données
│   ├── 📂 migrations/               # Migrations base centrale
│   │   ├── *_create_tenants_table.php
│   │   ├── *_create_domains_table.php
│   │   └── *_create_permission_tables.php
│   ├── 📂 migrations/tenant/        # Migrations bases clients (vide)
│   ├── 📂 seeders/                  # Données de test
│   └── 📂 sql/                      # Scripts SQL
│
├── 📂 Modules/                       # ⭐⭐⭐ MODULES APPLICATIFS
│   ├── 📂 UsersGuard/               # Authentification et utilisateurs
│   │   ├── 📂 Config/
│   │   ├── 📂 Database/migrations/
│   │   ├── 📂 Entities/             # Modèles (User, Group, Permission)
│   │   ├── 📂 Http/Controllers/
│   │   │   ├── 📂 Admin/            # Controllers admin (base tenant)
│   │   │   ├── 📂 Superadmin/       # Controllers superadmin (base centrale)
│   │   │   └── 📂 Frontend/         # Controllers publics (base tenant)
│   │   ├── 📂 Repositories/         # Logique d'accès aux données
│   │   ├── 📂 Routes/
│   │   │   ├── admin.php            # Routes admin
│   │   │   ├── superadmin.php       # Routes superadmin
│   │   │   └── frontend.php         # Routes frontend
│   │   ├── 📂 Tests/                # Tests automatisés
│   │   └── module.json              # Configuration du module
│   │
│   ├── 📂 User/                     # Gestion des utilisateurs
│   ├── 📂 Dashboard/                # Tableau de bord
│   ├── 📂 Customer/                 # ⭐ Gestion des clients
│   │   └── 📂 Entities/
│   │       ├── Customer.php         # Client principal
│   │       ├── CustomerAddress.php  # Adresses
│   │       ├── CustomerContact.php  # Contacts
│   │       ├── CustomerFinancial.php # Infos financières
│   │       ├── CustomerHouse.php    # Immeubles
│   │       └── ... (9 entités au total)
│   │
│   └── 📂 CustomersContracts/       # ⭐ Gestion des contrats (en cours)
│
├── 📂 public/                        # Point d'entrée web
│   └── index.php                    # Fichier d'entrée
│
├── 📂 routes/                        # Routes principales
│   ├── api.php                      # Route health check
│   ├── tenant.php                   # Routes tenant
│   └── web.php                      # Routes web
│
├── 📂 storage/                       # Fichiers générés
│   ├── 📂 app/                      # Fichiers uploadés
│   ├── 📂 logs/                     # Fichiers de logs
│   └── 📂 framework/                # Cache, sessions, views
│
├── 📂 tests/                         # Tests automatisés
│
├── 📜 composer.json                  # ⭐ Dépendances PHP
├── 📜 package.json                   # Dépendances JavaScript
├── 📜 .env                           # ⭐ Variables d'environnement
├── 📜 create-module.ps1              # ⭐ Script création modules
└── 📜 modules_statuses.json          # État des modules (actif/inactif)
```

### Les 5 Modules Actifs

#### 1. UsersGuard (Authentification)
**Rôle :** Gérer l'authentification et les utilisateurs

**Fonctionnalités :**
- Login / Logout
- Gestion des tokens d'authentification
- Gestion des utilisateurs (CRUD)
- Gestion des groupes
- Gestion des permissions

**Routes principales :**
- `POST /api/admin/auth/login` - Connexion
- `POST /api/admin/auth/logout` - Déconnexion
- `GET /api/admin/auth/me` - Informations utilisateur connecté
- `GET /api/admin/users` - Liste des utilisateurs

#### 2. Dashboard (Tableau de Bord)
**Rôle :** Afficher les statistiques et informations générales

**Fonctionnalités :**
- Statistiques globales
- Raccourcis vers les modules
- Notifications

#### 3. User (Utilisateurs)
**Rôle :** Gestion avancée des utilisateurs

**Fonctionnalités :**
- Profils utilisateurs
- Historique des actions
- Préférences

#### 4. Customer (Clients)
**Rôle :** Gérer les clients de l'entreprise

**Fonctionnalités :**
- CRUD clients
- Gestion des adresses
- Gestion des contacts
- Informations financières
- Gestion des immeubles
- Secteurs et syndicats

**Entités (9 au total) :**
- Customer - Informations principales du client
- CustomerAddress - Adresses du client
- CustomerContact - Contacts du client
- CustomerFinancial - Données financières
- CustomerHouse - Immeubles gérés
- CustomerSector - Secteurs d'activité
- CustomerSectorDept - Départements des secteurs
- CustomerUnion - Syndicats
- CustomerUnionI18n - Traductions des syndicats

#### 5. CustomersContracts (Contrats Clients) - En cours
**Rôle :** Gérer les contrats des clients

**Fonctionnalités prévues :**
- CRUD contrats
- États des contrats
- Historique des modifications
- Documents associés

### Configuration Importante (.env)

```env
# Base de données centrale
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=site_dev1          # Base centrale
DB_USERNAME=root
DB_PASSWORD=

# Multi-sites
TENANCY_IDENTIFICATION=domain   # Identification par domaine

# Cache et sessions (IMPORTANT pour multi-sites)
CACHE_DRIVER=file              # À changer en redis en production
SESSION_DRIVER=file            # À changer en redis en production

# Authentification
SANCTUM_STATEFUL_DOMAINS=localhost,127.0.0.1
```

**⚠️ Important pour la Production :**
- `CACHE_DRIVER=redis` - Pour isoler le cache entre les sites
- `SESSION_DRIVER=redis` - Pour isoler les sessions entre les sites

---

## 💻 Structure du Frontend (Interface Next.js)

### Arborescence Complète

```
C:\Users\Mounkaila\PhpstormProjects\icall26/
│
├── 📂 app/                           # ⭐ ROUTER Next.js (gestion des URLs)
│   ├── 📂 admin/                     # Routes d'administration
│   │   ├── 📂 [...slug]/            # ⭐ Route dynamique catch-all
│   │   │   └── page.tsx             # Charge DynamicModuleLoader
│   │   ├── 📂 login/
│   │   │   └── page.tsx             # Page de connexion
│   │   ├── 📂 dashboard/
│   │   │   └── page.tsx             # Tableau de bord
│   │   └── layout.tsx               # ⭐ Layout admin (sidebar, navbar)
│   │
│   ├── layout.tsx                   # Layout racine
│   ├── page.tsx                     # Page d'accueil
│   └── globals.css                  # ⭐ Styles globaux (Tailwind)
│
├── 📂 src/                           # ⭐⭐⭐ CODE SOURCE PRINCIPAL
│   │
│   ├── 📂 modules/                   # ⭐ MODULES MÉTIER
│   │   │
│   │   ├── 📂 UsersGuard/           # Module d'authentification
│   │   │   ├── 📂 admin/
│   │   │   │   ├── 📂 components/
│   │   │   │   │   └── LoginForm.tsx     # Formulaire de connexion
│   │   │   │   ├── 📂 hooks/
│   │   │   │   │   └── useAuth.ts        # ⭐ Hook d'authentification
│   │   │   │   ├── 📂 services/
│   │   │   │   │   └── authService.ts    # ⭐ Service API auth
│   │   │   │   └── 📂 config/
│   │   │   │       └── menu.config.ts    # Configuration menu
│   │   │   ├── 📂 types/
│   │   │   │   └── auth.types.ts         # Types TypeScript
│   │   │   └── index.ts                  # Export public du module
│   │   │
│   │   ├── 📂 Dashboard/            # Module tableau de bord
│   │   │   ├── 📂 admin/
│   │   │   │   ├── 📂 components/
│   │   │   │   │   ├── Sidebar.tsx       # ⭐ Barre latérale
│   │   │   │   │   └── DashboardContent.tsx
│   │   │   │   └── 📂 hooks/
│   │   │   │       └── useMenus.ts       # ⭐ Récupère les menus
│   │   │   └── index.ts
│   │   │
│   │   ├── 📂 Customers/            # Module clients
│   │   │   ├── 📂 admin/components/
│   │   │   ├── 📂 admin/services/
│   │   │   └── index.ts
│   │   │
│   │   ├── 📂 CustomersContracts/   # ⭐ Module contrats (principal)
│   │   │   ├── 📂 admin/
│   │   │   │   ├── 📂 components/
│   │   │   │   │   ├── ContractsList1.tsx
│   │   │   │   │   ├── ContractsList2.tsx
│   │   │   │   │   ├── ContractForm.tsx
│   │   │   │   │   └── ... (autres composants)
│   │   │   │   ├── 📂 hooks/
│   │   │   │   │   ├── useContracts.ts
│   │   │   │   │   ├── useContract.ts
│   │   │   │   │   └── useContractForm.ts
│   │   │   │   └── 📂 services/
│   │   │   │       └── contractService.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── 📂 CustomersContractsState/
│   │   ├── 📂 ProductsInstallerCommunication/
│   │   └── 📂 SystemMenu/
│   │
│   └── 📂 shared/                    # ⭐ CODE PARTAGÉ
│       │
│       ├── 📂 components/            # Composants réutilisables
│       │   ├── DynamicModuleLoader.tsx  # ⭐⭐ Chargeur de modules
│       │   ├── Navbar.tsx               # Barre de navigation
│       │   └── LanguageSwitcher.tsx     # Changement de langue
│       │
│       ├── 📂 lib/                   # Bibliothèques centrales
│       │   ├── api-client.ts            # ⭐⭐ Client HTTP Axios
│       │   ├── tenant-context.tsx       # ⭐ Context multi-sites
│       │   ├── language-context.tsx     # Context langue
│       │   ├── sidebar-context.tsx      # Context sidebar
│       │   └── init-modules.ts          # Initialisation modules
│       │
│       ├── 📂 utils/                 # Fonctions utilitaires
│       │   ├── routeGenerator.ts        # ⭐⭐ Génération routes
│       │   ├── menu-route-generator.ts  # Génération menus
│       │   └── permissions.ts           # Gestion permissions
│       │
│       ├── 📂 config/                # Configuration
│       └── 📂 types/                 # Types TypeScript partagés
│
├── 📂 public/                        # Fichiers statiques
│   ├── images/
│   └── favicon.ico
│
├── 📜 package.json                   # ⭐ Dépendances npm
├── 📜 tsconfig.json                  # ⭐ Configuration TypeScript
├── 📜 next.config.ts                 # Configuration Next.js
├── 📜 tailwind.config.ts             # Configuration Tailwind CSS
├── 📜 middleware.ts                  # Middleware Next.js
├── 📜 .env                           # Variables d'environnement
└── 📜 postcss.config.mjs             # Configuration PostCSS
```

### Les 7 Modules Frontend

| Module | Rôle | Composants Principaux |
|--------|------|----------------------|
| **UsersGuard** | Authentification | LoginForm, useAuth |
| **Dashboard** | Tableau de bord | Sidebar, DashboardContent, useMenus |
| **Customers** | Gestion clients | (en développement) |
| **CustomersContracts** | Gestion contrats | ContractsList1, ContractsList2, ContractForm |
| **CustomersContractsState** | États contrats | (en développement) |
| **ProductsInstallerCommunication** | Communication produits | (en développement) |
| **SystemMenu** | Gestion menus | (en développement) |

### Composants Clés Expliqués

#### 1. api-client.ts - Le Messager HTTP

**Rôle :** Communiquer avec le backend Laravel

```
Fonctionnement :
1. Ajoute automatiquement le token d'authentification à chaque requête
2. Gère les erreurs 401 (non autorisé) en redirigeant vers login
3. Configure l'URL de base de l'API
```

**Configuration :**
- URL de base : définie dans `.env` (`NEXT_PUBLIC_API_URL`)
- Intercepteur de requête : ajoute `Authorization: Bearer {token}`
- Intercepteur de réponse : détecte les erreurs d'authentification

#### 2. DynamicModuleLoader.tsx - Le Chargeur Dynamique

**Rôle :** Charger automatiquement les composants en fonction de l'URL

**Exemple de fonctionnement :**
```
URL : /admin/customers-contracts/contracts-list1

Transformation :
1. slug = ['customers-contracts', 'contracts-list1']
2. Module = CustomersContracts (PascalCase)
3. Component = ContractsList1 (PascalCase)
4. Chemin = src/modules/CustomersContracts/admin/components/ContractsList1.tsx

Chargement :
- Import dynamique du composant
- Affichage du composant
- Gestion des erreurs si le composant n'existe pas
```

**Avantages :**
- Pas besoin de créer une route pour chaque page
- Ajout de nouvelles pages simplement en créant le composant
- Chargement à la demande (performance)

#### 3. routeGenerator.ts - Le Générateur d'URLs

**Rôle :** Transformer les données de la base de données en URLs

**Exemple :**
```
Données BDD :
{
  module: "customers_contracts",
  name: "0010_contracts_list1",
  menu: ""
}

Transformations :
1. Suppression des préfixes numériques : "contracts_list1"
2. Conversion snake_case → kebab-case : "contracts-list1"
3. Conversion module : "customers-contracts"
4. Génération URL : "/admin/customers-contracts/contracts-list1"
```

#### 4. useAuth Hook - Gestion de l'Authentification

**Rôle :** Centraliser la logique d'authentification

**Données gérées :**
- `user` : Informations utilisateur connecté
- `token` : Token d'authentification
- `tenant` : Informations du site client
- `isAuthenticated` : État de connexion
- `isLoading` : État de chargement

**Méthodes :**
- `login(username, password, application)` : Se connecter
- `logout()` : Se déconnecter
- `refreshUser()` : Rafraîchir les infos utilisateur

**Stockage :**
- localStorage : `auth_token`, `user`, `tenant`

#### 5. Contexts - Partage de Données

**TenantProvider :**
- Stocke : `tenantId`, `domain`
- Utilisé par : toutes les pages admin/frontend
- Permet : identifier le site client actif

**LanguageProvider :**
- Stocke : langue sélectionnée
- Utilisé par : LanguageSwitcher
- Permet : multi-langue

**SidebarProvider :**
- Stocke : état ouvert/fermé de la sidebar
- Utilisé par : layout admin
- Permet : réduire/agrandir la barre latérale

---

## 📦 Les Modules Développés

### Qu'est-ce qu'un Module ?

Un **module** est comme un **mini-application indépendante** qui gère une fonctionnalité spécifique. Par exemple :
- Module **UsersGuard** = gère tout ce qui concerne les utilisateurs et l'authentification
- Module **Customer** = gère tout ce qui concerne les clients
- Module **CustomersContracts** = gère tout ce qui concerne les contrats

**Avantages de l'approche modulaire :**
- **Organisation** : Chaque fonctionnalité est isolée
- **Réutilisabilité** : Un module peut être réutilisé dans d'autres projets
- **Maintenance** : Facile de trouver le code d'une fonctionnalité
- **Travail en équipe** : Plusieurs développeurs peuvent travailler sur des modules différents sans conflit

### Structure Type d'un Module

```
Modules/MonModule/
│
├── 📂 Config/                    # Configuration du module
├── 📂 Database/
│   └── 📂 migrations/            # Migrations BDD du module
├── 📂 Entities/                  # Modèles de données (tables BDD)
│   └── MonModele.php
├── 📂 Http/
│   └── 📂 Controllers/
│       ├── 📂 Admin/             # Controllers admin (base tenant)
│       │   └── MonController.php
│       ├── 📂 Superadmin/        # Controllers superadmin (base centrale)
│       └── 📂 Frontend/          # Controllers publics (base tenant)
├── 📂 Repositories/              # Logique d'accès aux données
│   └── MonRepository.php
├── 📂 Routes/                    # Routes du module
│   ├── admin.php                 # Routes admin (/api/admin/*)
│   ├── superadmin.php            # Routes superadmin (/api/superadmin/*)
│   └── frontend.php              # Routes frontend (/api/frontend/*)
├── 📂 Tests/                     # Tests automatisés
│   ├── Unit/
│   └── Feature/
└── module.json                   # Métadonnées du module
```

### Module Customer - Cas d'Usage Réel

Le module **Customer** est un exemple complet de module avec plusieurs entités liées.

**Schéma de Base de Données :**

```
┌─────────────────────┐
│  t_customers        │  ← Table principale
│  ─────────────────  │
│  customer_id (PK)   │
│  customer_name      │
│  customer_email     │
│  ...                │
└──────────┬──────────┘
           │
           ├──────────┐
           │          │
           ▼          ▼
  ┌──────────────┐  ┌──────────────────┐
  │ t_customer_  │  │ t_customer_      │
  │   addresses  │  │   contacts       │
  │ ──────────── │  │ ──────────────── │
  │ address_id   │  │ contact_id       │
  │ customer_id  │  │ customer_id      │
  │ address      │  │ contact_name     │
  │ city         │  │ contact_phone    │
  └──────────────┘  └──────────────────┘
           │
           ▼
  ┌──────────────────┐
  │ t_customer_      │
  │   financial      │
  │ ──────────────── │
  │ financial_id     │
  │ customer_id      │
  │ payment_method   │
  │ bank_account     │
  └──────────────────┘
```

**Opérations disponibles (CRUD) :**

| Opération | Route | Méthode HTTP | Description |
|-----------|-------|--------------|-------------|
| **Lire tous** | `/api/admin/customers` | GET | Liste de tous les clients |
| **Lire un** | `/api/admin/customers/{id}` | GET | Détails d'un client |
| **Créer** | `/api/admin/customers` | POST | Créer un nouveau client |
| **Modifier** | `/api/admin/customers/{id}` | PUT | Modifier un client |
| **Supprimer** | `/api/admin/customers/{id}` | DELETE | Supprimer un client |
| **Statistiques** | `/api/admin/customers/stats` | GET | Statistiques clients |

---

## 🔐 Le Système d'Authentification

### Vue d'Ensemble

L'authentification utilise **Laravel Sanctum**, un système de tokens sécurisé.

**Concept :**
- Quand vous vous connectez, le serveur vous donne un **token** (comme un badge d'accès)
- À chaque requête, vous envoyez ce token
- Le serveur vérifie le token et autorise ou refuse l'accès

### Schéma de Flux d'Authentification

```
┌──────────────────────────────────────────────────────────────────┐
│  ÉTAPE 1 : Affichage de la Page de Login                        │
│  URL: https://client1.icall.com/admin/login                     │
│  Composant: LoginForm.tsx                                        │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  ÉTAPE 2 : Utilisateur Remplit le Formulaire                    │
│  Champs:                                                         │
│  - username: "admin"                                             │
│  - password: "123456"                                            │
│  - application: "admin"                                          │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  ÉTAPE 3 : Envoi de la Requête au Backend                       │
│  POST /api/admin/auth/login                                      │
│  Body: { username, password, application }                       │
│  Host: client1.icall.com (détection automatique du tenant)      │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  ÉTAPE 4 : Backend Traite la Requête                            │
│  1. Middleware InitializeTenancy détecte tenant (site_id=75)    │
│  2. Bascule vers base tenant (site_theme32)                     │
│  3. Vérifie username et password dans t_users                   │
│  4. Crée un token Sanctum                                        │
│  5. Retourne: { success: true, data: { token, user, tenant } }  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  ÉTAPE 5 : Frontend Reçoit la Réponse                           │
│  useAuth hook:                                                   │
│  1. Stocke token dans localStorage: "auth_token"                 │
│  2. Stocke user dans localStorage: "user"                        │
│  3. Stocke tenant dans localStorage: "tenant"                    │
│  4. Met à jour l'état: isAuthenticated = true                   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  ÉTAPE 6 : Redirection vers Dashboard                           │
│  router.push('/admin/customers-contracts/contracts-list1')      │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  REQUÊTES SUIVANTES : Authentification Automatique              │
│  Toutes les requêtes API incluent automatiquement:              │
│  Header: Authorization: Bearer {token}                           │
│  Intercepteur Axios ajoute le header automatiquement            │
└──────────────────────────────────────────────────────────────────┘
```

### Gestion des Erreurs

**Scénario : Token Expiré ou Invalide**

```
1. Utilisateur fait une action (ex: consulter la liste des contrats)
   ↓
2. Frontend envoie: GET /api/admin/contracts
   Header: Authorization: Bearer {expired_token}
   ↓
3. Backend répond: 401 Unauthorized
   ↓
4. Intercepteur Axios détecte le 401
   ↓
5. Supprime token, user, tenant du localStorage
   ↓
6. Redirige vers: /admin/login
   ↓
7. Message: "Votre session a expiré, veuillez vous reconnecter"
```

### Points de Sécurité

**Backend :**
- Tokens stockés dans table `personal_access_tokens` de chaque base tenant
- Tokens chiffrés
- Expiration configurable
- Support de la révocation

**Frontend :**
- Token stocké dans localStorage (accessible uniquement par l'application)
- HTTPS obligatoire en production
- Cookies `SameSite=Lax` pour CSRF protection
- Pas de stockage du mot de passe

---

## 🗺️ Le Système de Menus Dynamiques

### Concept

Au lieu de coder les menus en dur dans l'application, les **menus sont stockés dans la base de données**. Cela permet de :
- Modifier les menus sans toucher au code
- Gérer les permissions (afficher seulement les menus autorisés)
- Personnaliser les menus par site client

### Flux Complet

```
┌──────────────────────────────────────────────────────────────────┐
│  ÉTAPE 1 : Chargement de la Page Admin                          │
│  Composant: app/admin/layout.tsx                                │
│  Hook: useMenus() est appelé                                    │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  ÉTAPE 2 : Récupération des Menus depuis l'API                  │
│  GET /api/admin/menus/tree                                       │
│  Retourne la structure arborescente des menus                   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  ÉTAPE 3 : Structure des Données Reçues                         │
│  [                                                               │
│    {                                                             │
│      id: "1",                                                    │
│      name: "Contrats",                                           │
│      module: "customers_contracts",                              │
│      menu_name: "0010_contracts_list1",                          │
│      children: []                                                │
│    }                                                             │
│  ]                                                               │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  ÉTAPE 4 : Transformation en URLs                               │
│  routeGenerator.ts transforme:                                   │
│  {                                                               │
│    module: "customers_contracts"                                 │
│    name: "0010_contracts_list1"                                  │
│  }                                                               │
│  ↓                                                               │
│  URL: "/admin/customers-contracts/contracts-list1"              │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  ÉTAPE 5 : Affichage dans la Sidebar                            │
│  Composant: Sidebar.tsx rend:                                   │
│  ┌────────────────────────┐                                     │
│  │ 📋 Contrats            │ ← Lien cliquable                    │
│  └────────────────────────┘                                     │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  ÉTAPE 6 : Clic sur le Menu                                     │
│  Navigation vers: /admin/customers-contracts/contracts-list1    │
│  Route catch-all: app/admin/[...slug]/page.tsx                  │
│  slug = ['customers-contracts', 'contracts-list1']              │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  ÉTAPE 7 : Chargement Dynamique du Composant                    │
│  DynamicModuleLoader.tsx:                                        │
│  1. Transforme slug en PascalCase                               │
│     - Module: CustomersContracts                                │
│     - Component: ContractsList1                                 │
│  2. Chemin calculé:                                             │
│     src/modules/CustomersContracts/admin/components/            │
│       ContractsList1.tsx                                         │
│  3. Import dynamique du composant                               │
│  4. Affichage du composant                                      │
└──────────────────────────────────────────────────────────────────┘
```

### Table system_menu (Backend)

Structure de la table qui stocke les menus :

| Colonne | Type | Description | Exemple |
|---------|------|-------------|---------|
| `id` | INT | Identifiant unique | 1 |
| `name` | VARCHAR | Nom affiché | "Contrats" |
| `module` | VARCHAR | Nom du module | "customers_contracts" |
| `menu_name` | VARCHAR | Nom technique | "0010_contracts_list1" |
| `parent_id` | INT | ID parent (NULL si racine) | NULL |
| `order` | INT | Ordre d'affichage | 10 |
| `icon` | VARCHAR | Icône (optionnel) | "contract-icon" |
| `permissions` | VARCHAR | Permissions requises | "contracts.view" |

### Conventions de Nommage

**Backend (Base de données) :**
- Format : `snake_case`
- Module : `customers_contracts`
- Name : `0010_contracts_list1`
- Préfixe numérique pour l'ordre

**Frontend (URLs) :**
- Format : `kebab-case`
- URL : `/admin/customers-contracts/contracts-list1`
- Suppression des préfixes numériques

**Frontend (Code) :**
- Format : `PascalCase`
- Module : `CustomersContracts`
- Component : `ContractsList1`

### Transformation Automatique

**Fonction routeGenerator.ts :**

```
Entrée:
{
  module: "customers_contracts",
  name: "0010_contracts_list1"
}

Étapes:
1. Suppression préfixe: "0010_contracts_list1" → "contracts_list1"
2. Snake to kebab: "contracts_list1" → "contracts-list1"
3. Module transformation: "customers_contracts" → "customers-contracts"
4. Combinaison: "/admin/" + "customers-contracts" + "/" + "contracts-list1"

Sortie:
"/admin/customers-contracts/contracts-list1"
```

**Fonction DynamicModuleLoader.tsx :**

```
Entrée:
slug = ['customers-contracts', 'contracts-list1']

Étapes:
1. Extraction: module="customers-contracts", component="contracts-list1"
2. Kebab to PascalCase:
   - "customers-contracts" → "CustomersContracts"
   - "contracts-list1" → "ContractsList1"
3. Construction du chemin:
   "src/modules/CustomersContracts/admin/components/ContractsList1.tsx"

Sortie:
Composant React chargé dynamiquement
```

---

## 🛠️ Les Outils de Développement

### Scripts PowerShell

#### create-module.ps1 - Créateur de Modules Automatique

**Rôle :** Créer automatiquement un module complet avec toute la structure nécessaire

**Utilisation :**
```powershell
.\create-module.ps1 MonNouveauModule
```

**Ce qui est créé automatiquement :**
1. Structure de répertoires complète
2. Controllers Admin/Superadmin/Frontend avec méthodes CRUD
3. Routes configurées avec les bons middlewares
4. ServiceProviders et RouteServiceProvider
5. Fichier module.json
6. Activation automatique du module

**Avantages :**
- Gain de temps énorme (15 minutes → 30 secondes)
- Pas d'erreur de structure
- Cohérence entre tous les modules

### Scripts PHP Utilitaires

**Localisation :** Racine du projet backend

| Script | Rôle |
|--------|------|
| `check-tenants.php` | Liste tous les sites clients configurés |
| `check-tenant-users.php` | Affiche les utilisateurs d'un site |
| `check-token.php` | Vérifie si un token est valide |
| `check-tokens-location.php` | Trouve où sont stockés les tokens |
| `generate-token.php` | Crée un nouveau token Sanctum |
| `test-login.php` | Teste l'authentification |
| `test-tenant-api.php` | Teste une requête API tenant |

**Exemple d'utilisation :**
```bash
php check-tenants.php
# Affiche :
# Site ID: 1, Domain: api.local, Database: site_dev1
# Site ID: 75, Domain: tenant1.local, Database: site_theme32
```

### Commandes Artisan Importantes

**Gestion des modules :**
```bash
php artisan module:list              # Liste tous les modules
php artisan module:enable MonModule   # Active un module
php artisan module:disable MonModule  # Désactive un module
```

**Multi-sites :**
```bash
php artisan tenants:migrate          # Migrations sur tous les tenants
php artisan tenants:run migration --tenant=75  # Migration sur un tenant
```

**Développement :**
```bash
composer dev                         # Lance serveur + queue + logs
php artisan serve                    # Serveur uniquement (port 8000)
php artisan pail --timeout=0         # Visualisation des logs en temps réel
php artisan queue:listen --tries=1   # Worker pour les tâches en file d'attente
```

**Tests :**
```bash
composer test                        # Lance tous les tests
php artisan test                     # Alternative
php artisan test --coverage          # Avec couverture de code
```

**Cache :**
```bash
php artisan config:clear             # Vide le cache de configuration
php artisan cache:clear              # Vide le cache applicatif
composer dump-autoload               # Régénère l'autoloader
```

### Scripts NPM (Frontend)

```bash
npm run dev                          # Serveur développement (port 3000)
npm run build                        # Compilation production
npm run start                        # Démarre serveur production
npm run lint                         # Vérification du code
```

---

## 📊 Schémas Récapitulatifs

### Schéma 1 : Cycle de Vie d'une Requête

```
┌─────────────────────────────────────────────────────────────────┐
│  UTILISATEUR                                                    │
│  Clique sur "Liste des contrats"                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js)                                             │
│  Navigation : /admin/customers-contracts/contracts-list1        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  ROUTER Next.js                                                 │
│  Route catch-all : app/admin/[...slug]/page.tsx                 │
│  slug = ['customers-contracts', 'contracts-list1']              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  DYNAMIC MODULE LOADER                                          │
│  1. Transforme slug en PascalCase                               │
│  2. Charge dynamiquement le composant                           │
│  3. Composant : ContractsList1.tsx                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  COMPOSANT REACT                                                │
│  1. useContracts() hook appelé                                  │
│  2. contractService.getContracts() appelé                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  API CLIENT (Axios)                                             │
│  GET /api/admin/contracts                                       │
│  Headers:                                                       │
│  - Authorization: Bearer {token}                                │
│  - Host: client1.icall.com                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  BACKEND (Laravel)                                              │
│  1. Middleware InitializeTenancy                                │
│     - Lit Host: client1.icall.com                               │
│     - Trouve site_id=75, database=site_theme32                  │
│     - Bascule vers site_theme32                                 │
│  2. Middleware auth:sanctum                                     │
│     - Vérifie le token                                          │
│     - Charge l'utilisateur                                      │
│  3. Controller ContractsController@index                        │
│     - Repository récupère les contrats                          │
│     - Retourne JSON                                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  BASE DE DONNÉES                                                │
│  site_theme32.t_contracts                                       │
│  SELECT * FROM t_contracts WHERE ...                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  RÉPONSE                                                        │
│  {                                                              │
│    "success": true,                                             │
│    "data": [ {...}, {...}, ... ]                                │
│  }                                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  AFFICHAGE                                                      │
│  Composant ContractsList1 affiche les contrats                 │
│  dans un tableau HTML                                           │
└─────────────────────────────────────────────────────────────────┘
```

### Schéma 2 : Architecture Modulaire

```
┌───────────────────────────────────────────────────────────────────┐
│                        APPLICATION                                │
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Module    │  │   Module    │  │   Module    │             │
│  │ UsersGuard  │  │  Customer   │  │ Contracts   │   ...       │
│  │             │  │             │  │             │             │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │             │
│  │ │ Admin   │ │  │ │ Admin   │ │  │ │ Admin   │ │             │
│  │ │ Layer   │ │  │ │ Layer   │ │  │ │ Layer   │ │             │
│  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │             │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │             │
│  │ │Superadm.│ │  │ │Superadm.│ │  │ │Superadm.│ │             │
│  │ │  Layer  │ │  │ │  Layer  │ │  │ │  Layer  │ │             │
│  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │             │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │             │
│  │ │Frontend │ │  │ │Frontend │ │  │ │Frontend │ │             │
│  │ │  Layer  │ │  │ │  Layer  │ │  │ │  Layer  │ │             │
│  │ └─────────┘ │  │ └─────────┘ │  │ └─────────┘ │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                   │
│  Chaque module est INDÉPENDANT et RÉUTILISABLE                   │
└───────────────────────────────────────────────────────────────────┘
```

### Schéma 3 : Isolation Multi-Sites

```
┌──────────────────────────────────────────────────────────────────┐
│                     BASE CENTRALE (site_dev1)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Table t_sites                           │   │
│  ├───────┬─────────────────┬─────────────────┬────────────┤   │
│  │ ID    │ Domain          │ Database        │ Available  │   │
│  ├───────┼─────────────────┼─────────────────┼────────────┤   │
│  │ 1     │ api.local       │ site_dev1       │ YES        │   │
│  │ 75    │ tenant1.local   │ site_theme32    │ YES        │   │
│  │ 120   │ tenant2.local   │ site_theme45    │ YES        │   │
│  └───────┴─────────────────┴─────────────────┴────────────┘   │
└──────────────┬──────────────┬─────────────────┬────────────────┘
               │              │                 │
               ▼              ▼                 ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  site_dev1   │  │ site_theme32 │  │ site_theme45 │
    │              │  │              │  │              │
    │ t_users      │  │ t_users      │  │ t_users      │
    │ t_customers  │  │ t_customers  │  │ t_customers  │
    │ t_contracts  │  │ t_contracts  │  │ t_contracts  │
    │              │  │              │  │              │
    │ 205 users    │  │ 66 users     │  │ 142 users    │
    └──────────────┘  └──────────────┘  └──────────────┘

    ISOLATION TOTALE : Chaque site a ses propres données
```

---

## 🎓 Glossaire pour Non-Développeurs

| Terme | Explication | Analogie |
|-------|-------------|----------|
| **API** | Interface de Programmation (Application Programming Interface) | Comme le menu d'un restaurant : vous commandez ce que vous voulez, la cuisine (le backend) prépare et vous sert |
| **Backend** | La partie serveur de l'application (invisible pour l'utilisateur) | La cuisine d'un restaurant : où la nourriture est préparée |
| **Frontend** | L'interface utilisateur (ce que vous voyez dans le navigateur) | La salle du restaurant : où vous mangez et interagissez |
| **Base de données** | Système de stockage structuré des données | Un immense classeur numérique avec des tiroirs organisés |
| **Token** | Jeton d'authentification numérique | Un badge d'accès dans un immeuble sécurisé |
| **Middleware** | Programme qui intercepte et traite les requêtes | Un filtre ou un checkpoint de sécurité |
| **Route** | Chemin URL qui mène à une fonctionnalité | Une adresse qui indique où aller dans l'application |
| **Controller** | Composant qui gère la logique d'une fonctionnalité | Un chef cuisinier qui coordonne la préparation d'un plat |
| **Model** | Représentation d'une table de base de données | Le plan d'un tiroir de classeur : décrit sa structure |
| **Migration** | Script qui modifie la structure de la base de données | Un plan de rénovation pour un bâtiment |
| **Composant** | Morceau réutilisable d'interface utilisateur | Une brique Lego : peut être utilisée dans plusieurs constructions |
| **Hook** | Fonction React qui gère la logique et l'état | Un assistant personnel qui gère certaines tâches pour vous |
| **Context** | Système de partage de données entre composants | Une salle d'attente partagée où tout le monde a accès aux magazines |
| **CRUD** | Create, Read, Update, Delete (les 4 opérations de base) | Ajouter, Lire, Modifier, Supprimer des fiches dans un classeur |
| **Multi-tenancy** | Architecture où plusieurs clients partagent la même application | Un immeuble avec plusieurs appartements privés |
| **Module** | Package de fonctionnalités indépendant | Un outil dans une boîte à outils : peut être utilisé seul |
| **Repository** | Couche qui gère l'accès aux données | Le bibliothécaire : sait où trouver chaque livre |
| **Service** | Classe qui encapsule la logique métier | Un employé spécialisé dans une tâche spécifique |

---

## 🚀 Pour Aller Plus Loin

### Documentation Technique Complète

Pour les développeurs qui souhaitent approfondir :

**Backend :**
- `CLAUDE.md` - Guide complet du projet
- `MULTI-TENANT-GUIDE.md` - Guide multi-sites détaillé
- `TUTORIEL_COMPLET_LARAVEL_NEXTJS_MULTITENANCY.md` - Tutorial complet

**Frontend :**
- `CLAUDE.md` - Guide du projet Next.js
- `ARCHITECTURE.md` - Architecture détaillée
- `MODULES.md` - Système modulaire
- `DYNAMIC-ROUTING.md` - Routage dynamique
- `QUICK-START.md` - Démarrage rapide

### Commandes de Développement Utiles

**Backend :**
```bash
# Installation
composer setup

# Développement
composer dev

# Tests
composer test

# Créer un module
.\create-module.ps1 MonModule
```

**Frontend :**
```bash
# Installation
npm install

# Développement
npm run dev

# Production
npm run build
npm run start
```

### Prochaines Étapes du Projet

1. **Finaliser le module CustomersContracts**
   - Compléter tous les composants frontend
   - Ajouter les états de contrat
   - Implémenter la gestion des documents

2. **Ajouter de nouveaux modules**
   - ProductsInstallerCommunication (complet)
   - CustomersContractsState (états détaillés)
   - Autres modules métier

3. **Améliorer la sécurité**
   - Passer à Redis pour cache et sessions
   - Implémenter 2FA (double authentification)
   - Audit de sécurité complet

4. **Performance**
   - Optimisation des requêtes SQL
   - Mise en cache stratégique
   - Lazy loading des modules

5. **Documentation**
   - Vidéos de démonstration
   - Guide utilisateur final
   - Formation des équipes

---

## 📞 Support et Contact

**Pour toute question ou assistance :**
- Documentation technique : voir les fichiers CLAUDE.md et autres guides
- Issues GitHub : (si applicable)
- Email : (à définir)

---

**Date de dernière mise à jour :** 28 Octobre 2025
**Version de la documentation :** 1.0
**Statut du projet :** En développement actif

---

*Cette documentation a été créée pour expliquer clairement l'architecture et le fonctionnement du système iCall26 à un public non-technique. Elle sera mise à jour régulièrement au fur et à mesure de l'avancement du projet.*
