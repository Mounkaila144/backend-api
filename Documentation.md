# iCall26


## 🎯 Vue d'Ensemble du Projet

### Qu'est-ce que ce projet ?

Ce projet est une **plateforme Multisite** moderne qui permet de gérer plusieurs CRM clients à partir d'une seule application.chaque CRM a son propre espace privé (sa base de données), mais tous partagent la même infrastructure (le code de l'application).

### Objectif Principal

Migrer l'ancien système iCall26 (construit avec Symfony 1, une technologie de 2007) vers une architecture moderne et performante utilisant :
- **Laravel 12** pour le backend (la partie serveur qui gère les données)
- **Next.js 16** pour le frontend (l'interface utilisateur dans le navigateur)

### État d'Avancement

✅ **Déjà Réalisé :**
- Création du projet Laravel 12 avec architecture modulaire
- Connexion à la base de données existante icall26
- Configuration du système multi-sites (multi-tenancy)
- Création de 4 modules de base : UsersGuard, User, Dashboard, Customer,et  CustomersContracts en cours de creation
- Création du projet Next.js 16 avec architecture modulaire
- Système d'authentification complet (login/logout)
- Interface d'administration dui CRM avec sidebar, navbar, gestion des langues
- Système de routage dynamique basé sur la base de données
- 4 modules frontend créés et fonctionnels

🚧 **En Cours :**
- Module CustomersContracts (gestion des contrats clients)
- Documentation complète du système

---

## 🏗️ Architecture Générale


### Les 3 Couches de l'Application

L'application est organisée en **3 couches distinctes** :

#### 1. Couche Superadmin (Administration Centrale)
- **Qui ?** Les administrateurs de la plateforme
- **Quoi ?** Gérer la liste des sites clients
- **Base de données ?** Base centrale uniquement
- **URL :** `/api/superadmin/*`
- **Exemple :** Ajouter un nouveau site client

#### 2. Couche Admin (Administration d'un Site CRM)
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
| **ESLint** | Vérificateur de code JavaScript |

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

### Les  Modules Frontend

| Module | Rôle | Composants Principaux |
|--------|------|----------------------|
| **UsersGuard** | Authentification | LoginForm, useAuth |
| **Dashboard** | Tableau de bord | Sidebar, DashboardContent, useMenus |
| **Customers** | Gestion clients | (en développement) |
| **CustomersContracts** | Gestion contrats | ContractsList1, ContractsList2, ContractForm |

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

### Prochaines Étapes du Projet

1. **Finaliser le module CustomersContracts**
   - Compléter tous les composants frontend
   - Ajouter tout les modules necessaire pour le bon fonctionement des contract

2. **Ajouter des nouveaux modules**
   - CustomersMeetings
   - etc ..

3. **Passer à Redis pour cache et sessions**
   -
