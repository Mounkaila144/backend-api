---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories']
inputDocuments:
  - prd.md
  - architecture.md
workflowType: 'epics-and-stories'
project_name: 'iCall26 SuperAdmin Improvements'
user_name: 'Mounkaila'
date: '2026-01-27'
status: 'complete'
completedAt: '2026-01-27'
---

# iCall26 SuperAdmin Improvements - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for iCall26 SuperAdmin Improvements, decomposing the requirements from the PRD and Architecture documents into implementable stories. Le projet améliore la couche SuperAdmin pour la gestion des modules par tenant, l'isolation du stockage fichiers et la configuration des services externes.

## Requirements Inventory

### Functional Requirements

**Gestion des Modules - Découverte & Listing (FR1-FR6)**

- FR1: SuperAdmin peut lister tous les modules disponibles dans le système
- FR2: SuperAdmin peut voir les métadonnées de chaque module (nom, version, description, dépendances)
- FR3: SuperAdmin peut lister les modules actifs pour un tenant spécifique
- FR4: SuperAdmin peut voir le statut d'activation de chaque module par tenant
- FR5: SuperAdmin peut filtrer les modules par catégorie ou type
- FR6: SuperAdmin peut rechercher des modules par nom ou mot-clé

**Gestion des Modules - Activation (FR7-FR16)**

- FR7: SuperAdmin peut activer un module pour un tenant spécifique
- FR8: Système vérifie automatiquement les dépendances avant activation
- FR9: Système bloque l'activation si une dépendance est manquante avec message explicatif
- FR10: Système exécute les migrations du module dans la BDD du tenant
- FR11: Système crée la structure de fichiers du module sur S3 (`tenants/{tenant_id}/modules/{module}/`)
- FR12: Système génère les fichiers de configuration du module sur S3 (`tenants/{tenant_id}/config/module_{module}.json`)
- FR13: Système enregistre l'activation dans `t_site_modules` avec timestamp
- FR14: Système retourne un rapport détaillé du résultat d'activation
- FR15: SuperAdmin peut activer plusieurs modules en une seule opération (batch)
- FR16: Système respecte l'ordre des dépendances lors d'une activation en batch

**Gestion des Modules - Désactivation (FR17-FR27)**

- FR17: SuperAdmin peut désactiver un module pour un tenant spécifique
- FR18: Système affiche un avertissement avec l'impact de la désactivation
- FR19: SuperAdmin peut demander une confirmation avant désactivation
- FR20: SuperAdmin peut créer un backup avant désactivation
- FR21: Système vérifie qu'aucun autre module ne dépend du module à désactiver
- FR22: Système supprime les tables du module de la BDD du tenant
- FR23: Système supprime la structure de fichiers du module sur S3
- FR24: Système supprime les fichiers de configuration du module sur S3
- FR25: Système met à jour `t_site_modules` avec timestamp de désactivation
- FR26: Système retourne un rapport détaillé du résultat de désactivation
- FR27: SuperAdmin peut désactiver plusieurs modules en une seule opération (batch)

**Gestion des Modules - Rollback & Transactions (FR28-FR34)**

- FR28: Système exécute toutes les opérations d'activation dans une transaction atomique
- FR29: Système effectue un rollback automatique complet en cas d'échec d'activation
- FR30: Rollback annule les migrations, supprime les fichiers S3, supprime la config
- FR31: Système retourne un message d'erreur détaillé avec la cause de l'échec
- FR32: Aucune donnée orpheline ne persiste après un rollback
- FR33: Système effectue un rollback automatique complet en cas d'échec de désactivation
- FR34: Système journalise toutes les opérations pour audit

**Gestion des Modules - Dépendances (FR35-FR38)**

- FR35: SuperAdmin peut voir le graph des dépendances entre modules
- FR36: Système définit les dépendances dans la configuration de chaque module
- FR37: Système empêche la désactivation d'un module si d'autres modules en dépendent
- FR38: SuperAdmin peut voir quels modules dépendent d'un module donné

**Configuration Services Externes - S3/Minio (FR39-FR44)**

- FR39: SuperAdmin peut configurer les credentials S3/Minio (access key, secret key)
- FR40: SuperAdmin peut configurer le bucket par défaut pour le stockage tenant
- FR41: SuperAdmin peut configurer l'endpoint S3 (pour Minio ou S3 compatible)
- FR42: SuperAdmin peut configurer la région AWS si applicable
- FR43: SuperAdmin peut tester la connexion S3/Minio et voir le résultat
- FR44: Système valide les credentials avant de sauvegarder la configuration

**Configuration Services Externes - Base de Données (FR45-FR49)**

- FR45: SuperAdmin peut configurer les paramètres de connexion Cloud SQL (host, port, user, password)
- FR46: SuperAdmin peut configurer le préfixe des bases de données tenant
- FR47: SuperAdmin peut tester la connexion à la base de données centrale
- FR48: SuperAdmin peut voir les statistiques de connexion
- FR49: Système valide les credentials avant de sauvegarder la configuration

**Configuration Services Externes - Redis Cache (FR50-FR54)**

- FR50: SuperAdmin peut configurer les paramètres Redis Cache (host, port, password)
- FR51: SuperAdmin peut configurer le préfixe de cache par défaut
- FR52: SuperAdmin peut configurer la base de données Redis (0-15) pour le cache
- FR53: SuperAdmin peut tester la connexion Redis Cache et voir le résultat
- FR54: Système valide les credentials avant de sauvegarder la configuration

**Configuration Services Externes - Redis Queue (FR55-FR59)**

- FR55: SuperAdmin peut configurer les paramètres Redis Queue (host, port, password)
- FR56: SuperAdmin peut configurer le nom de la queue par défaut
- FR57: SuperAdmin peut configurer la base de données Redis (0-15) pour les queues
- FR58: SuperAdmin peut tester la connexion Redis Queue et voir le résultat
- FR59: Système valide les credentials avant de sauvegarder la configuration

**Configuration Services Externes - Amazon SES (FR60-FR64)**

- FR60: SuperAdmin peut configurer les credentials Amazon SES (access key, secret key)
- FR61: SuperAdmin peut configurer la région SES
- FR62: SuperAdmin peut configurer l'adresse email d'envoi par défaut
- FR63: SuperAdmin peut tester l'envoi d'un email via SES
- FR64: Système valide les credentials avant de sauvegarder la configuration

**Configuration Services Externes - Meilisearch (FR65-FR69)**

- FR65: SuperAdmin peut configurer l'URL du serveur Meilisearch
- FR66: SuperAdmin peut configurer la clé API Meilisearch (master key ou API key)
- FR67: SuperAdmin peut configurer le préfixe d'index par défaut
- FR68: SuperAdmin peut tester la connexion Meilisearch et voir le résultat
- FR69: Système valide les credentials avant de sauvegarder la configuration

**Dashboard & Health Check (FR70-FR72)**

- FR70: SuperAdmin peut voir un dashboard avec l'état de santé de tous les services externes
- FR71: Système affiche un indicateur visuel pour chaque service (connecté/déconnecté/erreur)
- FR72: SuperAdmin peut lancer un test de connectivité global de tous les services en un clic

### NonFunctional Requirements

**Performance (NFR-P1 à NFR-P6)**

- NFR-P1: Temps de réponse API < 200ms (95th percentile)
- NFR-P2: Activation module < 30 secondes
- NFR-P3: Désactivation module < 30 secondes
- NFR-P4: Liste modules tenant < 100ms
- NFR-P5: Test connexion service < 5 secondes
- NFR-P6: Batch (5+ modules) via jobs async

**Sécurité (NFR-S1 à NFR-S8)**

- NFR-S1: Isolation stricte entre tenants
- NFR-S2: Authentification Sanctum obligatoire
- NFR-S3: Credentials chiffrés au repos (AES-256)
- NFR-S4: Communications HTTPS/TLS 1.2+
- NFR-S5: Audit trail complet
- NFR-S6: Logs sans données sensibles
- NFR-S7: Tokens avec expiration configurable
- NFR-S8: Rate limiting endpoints sensibles

**Scalabilité (NFR-SC1 à NFR-SC5)**

- NFR-SC1: Support 500+ tenants
- NFR-SC2: Support 50 modules par tenant
- NFR-SC3: Jobs activation/désactivation en queue
- NFR-SC4: Architecture stateless (scalable horizontalement)
- NFR-SC5: Cache Redis pour listes fréquentes

**Intégration (NFR-I1 à NFR-I6)**

- NFR-I1: Timeout configurable par service (défaut 30s)
- NFR-I2: Retry avec backoff exponentiel (3 tentatives)
- NFR-I3: Fallback gracieux si service indisponible
- NFR-I4: Health check périodique configurable
- NFR-I5: Compatibilité S3/Minio via SDK AWS
- NFR-I6: Support Redis 6.x+

**Fiabilité (NFR-R1 à NFR-R6)**

- NFR-R1: Disponibilité 99.9%
- NFR-R2: Transactions atomiques avec rollback
- NFR-R3: Zéro donnée orpheline après rollback
- NFR-R4: Backup optionnel avant suppression
- NFR-R5: Idempotence des opérations
- NFR-R6: Graceful degradation si S3 indisponible

### Additional Requirements

**Exigences Architecture**

- Projet Brownfield: Extension de l'architecture Laravel existante
- Module Superadmin: Tout le code dans `Modules/Superadmin/`
- Saga Pattern: Orchestration transactions multi-ressources (BDD + S3 + Config)
- Tables centrales: `t_site_modules`, `t_service_config` dans BDD centrale
- Cache Redis: Keys `modules:available`, `modules:tenant:{id}`, `modules:dependencies`
- Packages requis: spatie/laravel-activitylog, spatie/laravel-health
- Encryption: Laravel `Crypt::encrypt()` pour credentials
- Rate Limiting: Différencié (read: 100/min, write: 30/min, heavy: 10/min)
- Events: ModuleActivated, ModuleDeactivated, ServiceConfigUpdated
- Logging: Canal dédié `superadmin`
- API Response: Transformation snake_case (BDD) → camelCase (API) via Resources
- Tests: Couverture minimum 80%

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 2 | Lister modules disponibles |
| FR2 | Epic 2 | Voir métadonnées modules |
| FR3 | Epic 2 | Lister modules actifs tenant |
| FR4 | Epic 2 | Voir statut activation |
| FR5 | Epic 2 | Filtrer modules |
| FR6 | Epic 2 | Rechercher modules |
| FR7 | Epic 3 | Activer module |
| FR8 | Epic 3 | Vérifier dépendances |
| FR9 | Epic 3 | Bloquer si dépendance manquante |
| FR10 | Epic 3 | Exécuter migrations |
| FR11 | Epic 3 | Créer structure S3 |
| FR12 | Epic 3 | Générer config S3 |
| FR13 | Epic 3 | Enregistrer activation |
| FR14 | Epic 3 | Rapport activation |
| FR15 | Epic 3 | Activation batch |
| FR16 | Epic 3 | Ordre dépendances batch |
| FR17 | Epic 4 | Désactiver module |
| FR18 | Epic 4 | Avertissement impact |
| FR19 | Epic 4 | Confirmation désactivation |
| FR20 | Epic 4 | Backup avant désactivation |
| FR21 | Epic 4 | Vérifier modules dépendants |
| FR22 | Epic 4 | Supprimer tables module |
| FR23 | Epic 4 | Supprimer fichiers S3 |
| FR24 | Epic 4 | Supprimer config S3 |
| FR25 | Epic 4 | Mettre à jour t_site_modules |
| FR26 | Epic 4 | Rapport désactivation |
| FR27 | Epic 4 | Désactivation batch |
| FR28 | Epic 3 | Transaction atomique |
| FR29 | Epic 3 | Rollback automatique |
| FR30 | Epic 3 | Annulation complète rollback |
| FR31 | Epic 3 | Message erreur détaillé |
| FR32 | Epic 3 | Zéro donnée orpheline |
| FR33 | Epic 4 | Rollback désactivation |
| FR34 | Epic 3, 4 | Audit trail |
| FR35 | Epic 2 | Graph dépendances |
| FR36 | Epic 2 | Définir dépendances |
| FR37 | Epic 2 | Empêcher désactivation |
| FR38 | Epic 2 | Voir modules dépendants |
| FR39 | Epic 5 | Config credentials S3 |
| FR40 | Epic 5 | Config bucket S3 |
| FR41 | Epic 5 | Config endpoint S3 |
| FR42 | Epic 5 | Config région AWS |
| FR43 | Epic 5 | Test connexion S3 |
| FR44 | Epic 5 | Validation credentials S3 |
| FR45 | Epic 5 | Config connexion Database |
| FR46 | Epic 5 | Config préfixe BDD tenant |
| FR47 | Epic 5 | Test connexion Database |
| FR48 | Epic 5 | Stats connexion Database |
| FR49 | Epic 5 | Validation credentials Database |
| FR50 | Epic 5 | Config Redis Cache |
| FR51 | Epic 5 | Config préfixe cache |
| FR52 | Epic 5 | Config DB Redis cache |
| FR53 | Epic 5 | Test connexion Redis Cache |
| FR54 | Epic 5 | Validation credentials Redis Cache |
| FR55 | Epic 5 | Config Redis Queue |
| FR56 | Epic 5 | Config nom queue |
| FR57 | Epic 5 | Config DB Redis queue |
| FR58 | Epic 5 | Test connexion Redis Queue |
| FR59 | Epic 5 | Validation credentials Redis Queue |
| FR60 | Epic 5 | Config credentials SES |
| FR61 | Epic 5 | Config région SES |
| FR62 | Epic 5 | Config email défaut SES |
| FR63 | Epic 5 | Test envoi email SES |
| FR64 | Epic 5 | Validation credentials SES |
| FR65 | Epic 5 | Config URL Meilisearch |
| FR66 | Epic 5 | Config API key Meilisearch |
| FR67 | Epic 5 | Config préfixe index Meilisearch |
| FR68 | Epic 5 | Test connexion Meilisearch |
| FR69 | Epic 5 | Validation credentials Meilisearch |
| FR70 | Epic 6 | Dashboard santé services |
| FR71 | Epic 6 | Indicateurs visuels |
| FR72 | Epic 6 | Test global services |

## Epic List

### Epic 1: Infrastructure Module SuperAdmin
Établir les fondations techniques du module SuperAdmin avec les tables centrales, services de base et configuration du logging.
**FRs couverts:** Prérequis techniques (requis par FR10-FR14, FR22-FR25, FR28-FR34)

### Epic 2: Découverte et Navigation des Modules
Permettre au SuperAdmin de voir et comprendre tous les modules disponibles, leurs métadonnées et dépendances.
**FRs couverts:** FR1, FR2, FR3, FR4, FR5, FR6, FR35, FR36, FR37, FR38

### Epic 3: Activation des Modules
Permettre au SuperAdmin d'activer des modules pour un tenant avec migrations, fichiers S3, configuration et rollback automatique.
**FRs couverts:** FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR28, FR29, FR30, FR31, FR32, FR34

### Epic 4: Désactivation des Modules
Permettre au SuperAdmin de désactiver des modules avec avertissements d'impact, backup optionnel et nettoyage complet.
**FRs couverts:** FR17, FR18, FR19, FR20, FR21, FR22, FR23, FR24, FR25, FR26, FR27, FR33, FR34

### Epic 5: Configuration Services Externes
Permettre au SuperAdmin de configurer et tester tous les services externes (S3, Database, Redis, SES, Meilisearch).
**FRs couverts:** FR39-FR69

### Epic 6: Dashboard Santé Globale
Fournir une vue d'ensemble de l'état de santé de tous les services externes avec tests de connectivité.
**FRs couverts:** FR70, FR71, FR72

---

## Epic 1: Infrastructure Module SuperAdmin

**Objectif:** Établir les fondations techniques du module SuperAdmin avec les tables centrales, services de base, configuration du logging et de l'audit trail.

**NFRs adressés:** NFR-S2, NFR-S3, NFR-S5, NFR-S6, NFR-S8

---

### Story 1.1: Création du Module Superadmin

As a développeur,
I want créer la structure du module Superadmin avec nwidart/laravel-modules,
So that j'ai une base organisée pour implémenter toutes les fonctionnalités SuperAdmin.

**Acceptance Criteria:**

**Given** le projet Laravel existant avec nwidart/laravel-modules installé
**When** je crée le module Superadmin
**Then** la structure `Modules/Superadmin/` est créée avec tous les dossiers requis
**And** le fichier `module.json` est configuré correctement
**And** le `SuperadminServiceProvider` est enregistré
**And** les routes superadmin.php sont configurées avec le middleware `auth:sanctum`

**Technical Notes:**
- Commande: `php artisan module:make Superadmin`
- Structure conforme à l'Architecture document (Config, Entities, Http, Services, etc.)

---

### Story 1.2: Migration Table t_site_modules

As a SuperAdmin,
I want que le système dispose d'une table pour tracker les modules activés par tenant,
So that le système peut gérer l'état des modules pour chaque site.

**Acceptance Criteria:**

**Given** la base de données centrale (site_dev1)
**When** j'exécute les migrations
**Then** la table `t_site_modules` est créée avec les colonnes:
  - `id` INT AUTO_INCREMENT PRIMARY KEY
  - `site_id` INT NOT NULL (FK vers t_sites)
  - `module_name` VARCHAR(100) NOT NULL
  - `is_active` ENUM('YES', 'NO') DEFAULT 'YES'
  - `installed_at` DATETIME
  - `uninstalled_at` DATETIME NULL
  - `config` JSON NULL
**And** un index unique existe sur (site_id, module_name)
**And** la foreign key vers t_sites est créée

**Technical Notes:**
- Migration dans `database/migrations/` (central, pas tenant)
- Conventions: préfixe `t_`, ENUM pour booléens

---

### Story 1.3: Migration Table t_service_config

As a SuperAdmin,
I want que le système dispose d'une table pour stocker la configuration des services externes,
So that les credentials et paramètres sont persistés de manière sécurisée.

**Acceptance Criteria:**

**Given** la base de données centrale (site_dev1)
**When** j'exécute les migrations
**Then** la table `t_service_config` est créée avec les colonnes:
  - `id` INT AUTO_INCREMENT PRIMARY KEY
  - `service_name` VARCHAR(50) NOT NULL UNIQUE
  - `config` JSON NOT NULL
  - `updated_at` DATETIME
  - `updated_by` INT NULL
**And** un index unique existe sur service_name

**Technical Notes:**
- Les credentials dans le JSON seront chiffrés via Laravel Crypt

---

### Story 1.4: Modèle SiteModule avec Encryption

As a développeur,
I want un modèle Eloquent pour la table t_site_modules,
So that je peux interagir avec les données de modules activés de manière type-safe.

**Acceptance Criteria:**

**Given** la table t_site_modules existe
**When** j'utilise le modèle SiteModule
**Then** je peux créer, lire, modifier et supprimer des enregistrements
**And** le modèle utilise la connexion `mysql` (central)
**And** le cast JSON est appliqué sur la colonne `config`
**And** les relations vers Site sont définies
**And** les scopes `active()` et `forTenant($siteId)` sont disponibles

**Technical Notes:**
- Emplacement: `Modules/Superadmin/Entities/SiteModule.php`
- Pas de timestamps Laravel (utilise installed_at/uninstalled_at)

---

### Story 1.5: Modèle ServiceConfig avec Encryption

As a développeur,
I want un modèle Eloquent pour la table t_service_config avec chiffrement automatique des credentials,
So that les données sensibles sont protégées au repos.

**Acceptance Criteria:**

**Given** la table t_service_config existe
**When** je sauvegarde une configuration avec des credentials
**Then** les champs sensibles (secret_key, password, api_key) sont automatiquement chiffrés
**And** lors de la lecture, les champs sont automatiquement déchiffrés
**And** le modèle utilise la connexion `mysql` (central)
**And** les méthodes `getDecryptedConfig()` et `setEncryptedConfig()` sont disponibles

**Technical Notes:**
- Utiliser Laravel `Crypt::encryptString()` / `Crypt::decryptString()`
- Liste des champs sensibles: aws_secret_key, password, api_key, master_key

---

### Story 1.6: Configuration Logging Canal Superadmin

As a développeur,
I want un canal de logging dédié pour les opérations SuperAdmin,
So that les logs sont isolés et facilement consultables.

**Acceptance Criteria:**

**Given** le fichier config/logging.php
**When** je configure le canal superadmin
**Then** un nouveau canal `superadmin` est disponible
**And** les logs sont écrits dans `storage/logs/superadmin.log`
**And** le format inclut timestamp, level, message et context
**And** les données sensibles ne sont jamais loggées (passwords, keys)

**Technical Notes:**
- Ajouter dans config/logging.php channels array
- Utiliser le driver 'daily' avec rotation

---

### Story 1.7: Installation Packages Spatie

As a développeur,
I want installer et configurer spatie/laravel-activitylog et spatie/laravel-health,
So that l'audit trail et les health checks sont disponibles.

**Acceptance Criteria:**

**Given** le projet Laravel
**When** j'installe les packages Spatie
**Then** spatie/laravel-activitylog est installé et configuré
**And** spatie/laravel-health est installé et configuré
**And** les migrations activity_log sont publiées et exécutées
**And** le fichier config/activitylog.php est configuré pour le canal superadmin
**And** le fichier config/health.php est créé

**Technical Notes:**
- `composer require spatie/laravel-activitylog spatie/laravel-health`
- `php artisan vendor:publish --provider="Spatie\Activitylog\ActivitylogServiceProvider"`

---

### Story 1.8: Configuration Rate Limiting SuperAdmin

As a SuperAdmin,
I want que les endpoints API soient protégés par rate limiting,
So that le système est protégé contre les abus.

**Acceptance Criteria:**

**Given** les routes SuperAdmin
**When** je configure le rate limiting
**Then** trois limiteurs sont définis:
  - `superadmin-read`: 100 requêtes/minute (GET)
  - `superadmin-write`: 30 requêtes/minute (POST/PUT config)
  - `superadmin-heavy`: 10 requêtes/minute (activation/désactivation)
**And** les limiteurs sont appliqués aux routes appropriées
**And** les réponses 429 incluent le header Retry-After

**Technical Notes:**
- Configurer dans `app/Providers/RouteServiceProvider.php` ou `bootstrap/app.php`
- Utiliser `RateLimiter::for()`

---

### Story 1.9: Events et Listeners de Base

As a développeur,
I want les events et listeners de base pour l'audit trail,
So that toutes les opérations importantes sont tracées.

**Acceptance Criteria:**

**Given** le module Superadmin
**When** je crée les events de base
**Then** les events suivants existent:
  - `ModuleActivated`
  - `ModuleDeactivated`
  - `ModuleActivationFailed`
  - `ServiceConfigUpdated`
**And** chaque event contient les données pertinentes (entity, user_id, metadata)
**And** le listener `LogModuleActivation` enregistre dans activity_log
**And** le listener `InvalidateModuleCache` invalide le cache concerné

**Technical Notes:**
- Events dans `Modules/Superadmin/Events/`
- Listeners dans `Modules/Superadmin/Listeners/`
- Enregistrer dans EventServiceProvider du module

---

## Epic 2: Découverte et Navigation des Modules

**Objectif:** Permettre au SuperAdmin de voir et comprendre tous les modules disponibles dans le système, leurs métadonnées, statuts d'activation par tenant, et les dépendances entre modules.

**FRs couverts:** FR1, FR2, FR3, FR4, FR5, FR6, FR35, FR36, FR37, FR38

**NFRs adressés:** NFR-P1, NFR-P4, NFR-SC5

---

### Story 2.1: Service ModuleDiscovery - Liste des Modules Disponibles

As a SuperAdmin,
I want voir la liste de tous les modules disponibles dans le système,
So that je sais quels modules peuvent être activés pour les tenants.

**Acceptance Criteria:**

**Given** le système avec plusieurs modules installés (nwidart/laravel-modules)
**When** j'appelle `GET /api/superadmin/modules`
**Then** je reçois la liste de tous les modules avec:
  - name (nom du module)
  - version
  - description
  - dependencies (liste des dépendances)
  - category (optionnel)
**And** la réponse est en format JSON avec transformation camelCase
**And** le temps de réponse est < 100ms

**Technical Notes:**
- Service: `Modules/Superadmin/Services/ModuleDiscovery.php`
- Méthode: `getAvailableModules()`
- Lire les module.json de chaque module dans `Modules/*/`

---

### Story 2.2: API Liste Modules Disponibles

As a SuperAdmin,
I want un endpoint API pour récupérer les modules disponibles,
So that je peux les afficher dans l'interface.

**Acceptance Criteria:**

**Given** je suis authentifié avec le rôle superadmin
**When** j'appelle `GET /api/superadmin/modules`
**Then** je reçois une réponse 200 avec la liste des modules
**And** chaque module a les champs: name, version, description, dependencies
**And** la réponse utilise ModuleResource pour la transformation
**And** le rate limiter `superadmin-read` est appliqué

**Given** je ne suis pas authentifié
**When** j'appelle `GET /api/superadmin/modules`
**Then** je reçois une réponse 401 Unauthorized

**Technical Notes:**
- Controller: `Modules/Superadmin/Http/Controllers/Superadmin/ModuleController.php`
- Resource: `Modules/Superadmin/Http/Resources/ModuleResource.php`

---

### Story 2.3: Service ModuleDiscovery - Modules par Tenant

As a SuperAdmin,
I want voir les modules activés pour un tenant spécifique,
So that je connais l'état actuel des modules du client.

**Acceptance Criteria:**

**Given** un tenant avec certains modules activés
**When** j'appelle la méthode `getModulesForTenant($siteId)`
**Then** je reçois la liste des modules avec leur statut (actif/inactif)
**And** pour chaque module actif, j'ai la date d'installation
**And** pour chaque module inactif, j'ai la date de désinstallation si applicable
**And** les données viennent de la table t_site_modules

**Technical Notes:**
- Enrichir le service ModuleDiscovery
- Joindre les données de t_site_modules avec les modules disponibles

---

### Story 2.4: API Modules par Tenant

As a SuperAdmin,
I want un endpoint API pour récupérer les modules d'un tenant,
So that je peux voir l'état des modules pour ce client.

**Acceptance Criteria:**

**Given** je suis authentifié avec le rôle superadmin
**When** j'appelle `GET /api/superadmin/sites/{siteId}/modules`
**Then** je reçois une réponse 200 avec:
  - Liste de tous les modules (disponibles + statut pour ce tenant)
  - Pour chaque module: name, isActive, installedAt, uninstalledAt

**Given** le siteId n'existe pas
**When** j'appelle l'endpoint
**Then** je reçois une réponse 404 Not Found

**Technical Notes:**
- Utiliser le modèle Site existant pour valider le siteId
- Resource: TenantModuleResource avec statut inclus

---

### Story 2.5: Filtrage et Recherche des Modules

As a SuperAdmin,
I want filtrer et rechercher les modules par catégorie ou mot-clé,
So that je trouve rapidement les modules qui m'intéressent.

**Acceptance Criteria:**

**Given** la liste des modules disponibles
**When** j'appelle `GET /api/superadmin/modules?category=crm`
**Then** je reçois uniquement les modules de la catégorie CRM

**Given** la liste des modules disponibles
**When** j'appelle `GET /api/superadmin/modules?search=contract`
**Then** je reçois les modules dont le nom ou la description contient "contract"

**Given** les deux filtres
**When** j'appelle `GET /api/superadmin/modules?category=crm&search=client`
**Then** les filtres sont combinés (AND)

**Technical Notes:**
- Ajouter paramètres query: `category`, `search`
- FormRequest pour validation des paramètres

---

### Story 2.6: Service ModuleDependencyResolver

As a SuperAdmin,
I want comprendre les dépendances entre modules,
So that je sais quels modules activer avant d'autres.

**Acceptance Criteria:**

**Given** un module avec des dépendances définies
**When** j'appelle `getDependencies($moduleName)`
**Then** je reçois la liste des modules requis (dépendances directes)

**Given** un module
**When** j'appelle `getDependents($moduleName)`
**Then** je reçois la liste des modules qui dépendent de ce module

**Given** un module et un tenant
**When** j'appelle `getMissingDependencies($moduleName, $siteId)`
**Then** je reçois les dépendances non activées pour ce tenant

**Technical Notes:**
- Service: `Modules/Superadmin/Services/ModuleDependencyResolver.php`
- Lire les dépendances depuis module.json de chaque module

---

### Story 2.7: API Graph des Dépendances

As a SuperAdmin,
I want voir le graphe des dépendances entre modules,
So that je comprends les relations et l'ordre d'activation.

**Acceptance Criteria:**

**Given** je suis authentifié avec le rôle superadmin
**When** j'appelle `GET /api/superadmin/modules/dependencies`
**Then** je reçois un graphe de dépendances:
```json
{
  "data": {
    "nodes": [
      {"name": "Customers", "dependencies": []},
      {"name": "Contracts", "dependencies": ["Customers"]}
    ],
    "edges": [
      {"from": "Contracts", "to": "Customers"}
    ]
  }
}
```

**Technical Notes:**
- Utiliser ModuleDependencyResolver.getDependencyGraph()
- Format adapté pour visualisation frontend

---

### Story 2.8: API Modules Dépendants

As a SuperAdmin,
I want savoir quels modules dépendent d'un module donné,
So that je comprends l'impact de sa désactivation.

**Acceptance Criteria:**

**Given** le module "Customers" avec des modules dépendants
**When** j'appelle `GET /api/superadmin/modules/customers/dependents`
**Then** je reçois la liste: ["Contracts", "Invoices", ...]

**Given** un module sans dépendants
**When** j'appelle l'endpoint
**Then** je reçois une liste vide

**Technical Notes:**
- Route: `modules/{module}/dependents`
- Utiliser ModuleDependencyResolver.getDependents()

---

### Story 2.9: Cache des Modules avec Redis

As a SuperAdmin,
I want que les listes de modules soient cachées,
So that les performances sont optimales.

**Acceptance Criteria:**

**Given** le premier appel à la liste des modules
**When** je récupère les modules
**Then** les données sont mises en cache Redis avec la clé `modules:available` (TTL 10min)

**Given** la liste des modules d'un tenant
**When** je récupère les modules
**Then** les données sont mises en cache avec la clé `modules:tenant:{siteId}` (TTL 5min)

**Given** le graphe des dépendances
**When** je récupère le graphe
**Then** les données sont mises en cache avec la clé `modules:dependencies` (TTL 30min)

**Given** un module est activé/désactivé
**When** l'opération est terminée
**Then** le cache du tenant concerné est invalidé

**Technical Notes:**
- Service: `Modules/Superadmin/Services/ModuleCacheService.php`
- Utiliser Cache::tags() pour invalidation groupée

---

## Epic 3: Activation des Modules

**Objectif:** Permettre au SuperAdmin d'activer des modules pour un tenant avec exécution des migrations, création de structure S3, génération de configuration, et rollback automatique complet en cas d'échec.

**FRs couverts:** FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR28, FR29, FR30, FR31, FR32, FR34

**NFRs adressés:** NFR-P2, NFR-R2, NFR-R3, NFR-S1, NFR-S5

---

### Story 3.1: Service TenantStorageManager - Création Structure S3

As a SuperAdmin,
I want que le système crée la structure de fichiers S3 pour un module,
So that le tenant dispose de l'espace de stockage nécessaire.

**Acceptance Criteria:**

**Given** un tenant et un module à activer
**When** j'appelle `createModuleStructure($tenantId, $moduleName)`
**Then** la structure suivante est créée sur S3:
```
tenants/{tenant_id}/modules/{module}/
├── uploads/
├── templates/
└── exports/
```
**And** les dossiers sont créés avec les permissions appropriées

**Given** une erreur S3 (bucket inaccessible)
**When** la création échoue
**Then** une exception `StorageException` est levée avec le détail

**Technical Notes:**
- Service: `Modules/Superadmin/Services/TenantStorageManager.php`
- Utiliser `Storage::disk('s3')->makeDirectory()`

---

### Story 3.2: Service TenantStorageManager - Génération Config S3

As a SuperAdmin,
I want que le système génère les fichiers de configuration du module sur S3,
So that le module dispose de sa configuration initiale.

**Acceptance Criteria:**

**Given** un tenant et un module à activer
**When** j'appelle `generateModuleConfig($tenantId, $moduleName, $options)`
**Then** un fichier JSON est créé: `tenants/{tenant_id}/config/module_{module}.json`
**And** le fichier contient la configuration par défaut du module
**And** les options personnalisées sont fusionnées

**Given** une configuration existante
**When** je régénère la config
**Then** l'ancienne configuration est préservée et fusionnée

**Technical Notes:**
- Lire la config par défaut depuis `Modules/{Module}/Config/config.php`
- Stocker en JSON sur S3

---

### Story 3.3: Service TenantMigrationRunner

As a SuperAdmin,
I want que le système exécute les migrations du module dans la BDD du tenant,
So that les tables nécessaires sont créées.

**Acceptance Criteria:**

**Given** un tenant et un module avec des migrations
**When** j'appelle `runMigrations($tenant, $moduleName)`
**Then** les migrations du module sont exécutées dans la BDD du tenant
**And** le contexte tenant est correctement initialisé avant l'exécution
**And** le contexte tenant est nettoyé après l'exécution

**Given** une migration qui échoue
**When** l'erreur survient
**Then** une exception `MigrationException` est levée avec:
  - Le nom de la migration qui a échoué
  - Le message d'erreur SQL
  - La liste des migrations déjà appliquées

**Technical Notes:**
- Service: `Modules/Superadmin/Services/TenantMigrationRunner.php`
- Utiliser `tenancy()->initialize($tenant)` puis `Artisan::call('migrate')`
- Migrations dans `Modules/{Module}/Database/Migrations/`

---

### Story 3.4: Service SagaOrchestrator - Pattern Saga

As a développeur,
I want un orchestrateur Saga pour coordonner les opérations multi-ressources,
So that le rollback est automatique et complet en cas d'échec.

**Acceptance Criteria:**

**Given** une séquence d'étapes (migrations, S3, config, DB)
**When** j'exécute le Saga
**Then** chaque étape est exécutée dans l'ordre
**And** chaque étape a une méthode de compensation définie
**And** le statut de chaque étape est tracké

**Given** une étape qui échoue
**When** l'erreur survient
**Then** les étapes de compensation sont exécutées en ordre inverse
**And** toutes les ressources créées sont nettoyées
**And** un rapport détaillé est retourné

**Technical Notes:**
- Service: `Modules/Superadmin/Services/SagaOrchestrator.php`
- Pattern: Command avec compensate()
- Logging de chaque étape sur canal superadmin

---

### Story 3.5: Service ModuleInstaller - Activation Simple

As a SuperAdmin,
I want activer un module pour un tenant,
So that le client peut utiliser cette fonctionnalité.

**Acceptance Criteria:**

**Given** un tenant et un module disponible
**When** j'appelle `activate($siteId, $moduleName)`
**Then** le Saga exécute dans l'ordre:
  1. Vérification des dépendances
  2. Exécution des migrations (tenant DB)
  3. Création structure S3
  4. Génération config S3
  5. Enregistrement dans t_site_modules
**And** un event `ModuleActivated` est dispatché
**And** le cache du tenant est invalidé
**And** un rapport détaillé est retourné

**Given** une dépendance manquante
**When** j'essaie d'activer
**Then** l'activation est bloquée avec message explicatif

**Technical Notes:**
- Service: `Modules/Superadmin/Services/ModuleInstaller.php`
- Utiliser SagaOrchestrator pour la coordination

---

### Story 3.6: API Activation Module

As a SuperAdmin,
I want un endpoint API pour activer un module,
So that je peux activer des modules via l'interface.

**Acceptance Criteria:**

**Given** je suis authentifié avec le rôle superadmin
**When** j'appelle `POST /api/superadmin/sites/{siteId}/modules/{module}`
**Then** le module est activé pour le tenant
**And** je reçois une réponse 201 avec le rapport d'activation:
```json
{
  "message": "Module activated successfully",
  "data": {
    "moduleName": "Contracts",
    "siteId": 123,
    "installedAt": "2026-01-27T10:30:00Z",
    "steps": [
      {"step": "dependencies", "status": "success"},
      {"step": "migrations", "status": "success", "count": 3},
      {"step": "s3_structure", "status": "success"},
      {"step": "config", "status": "success"},
      {"step": "database", "status": "success"}
    ]
  }
}
```

**Given** le module est déjà activé
**When** j'appelle l'endpoint
**Then** je reçois une réponse 409 Conflict

**Technical Notes:**
- FormRequest: `ActivateModuleRequest` pour validation
- Rate limiter: `superadmin-heavy`

---

### Story 3.7: Rollback Automatique Activation

As a SuperAdmin,
I want que le système annule automatiquement toutes les modifications en cas d'échec,
So that aucune donnée orpheline ne persiste.

**Acceptance Criteria:**

**Given** une activation en cours
**When** une étape échoue (ex: migration)
**Then** le rollback automatique est déclenché
**And** les migrations exécutées sont annulées (rollback)
**And** les fichiers S3 créés sont supprimés
**And** la configuration S3 est supprimée
**And** aucun enregistrement n'est créé dans t_site_modules
**And** un event `ModuleActivationFailed` est dispatché
**And** l'erreur est loggée sur le canal superadmin

**Given** un rollback qui échoue partiellement
**When** une compensation échoue
**Then** l'erreur est loggée avec les détails des ressources non nettoyées
**And** une alerte est générée pour intervention manuelle

**Technical Notes:**
- Saga compensations dans l'ordre inverse
- Logger chaque étape de compensation

---

### Story 3.8: Rapport Détaillé d'Activation

As a SuperAdmin,
I want un rapport détaillé après activation,
So that je comprends ce qui a été fait.

**Acceptance Criteria:**

**Given** une activation réussie
**When** l'opération est terminée
**Then** le rapport inclut:
  - Nom du module et tenant
  - Timestamp d'installation
  - Durée totale de l'opération
  - Détail de chaque étape (migrations count, fichiers créés, etc.)
  - Avertissements éventuels

**Given** une activation échouée
**When** l'opération échoue
**Then** le rapport inclut:
  - Étape qui a échoué
  - Message d'erreur détaillé
  - Étapes de compensation exécutées
  - État final (rollback complet ou partiel)

**Technical Notes:**
- Classe: `ActivationReport` ou structure dans la réponse
- Stocker dans activity_log via spatie/laravel-activitylog

---

### Story 3.9: Activation Batch de Modules

As a SuperAdmin,
I want activer plusieurs modules en une seule opération,
So that je gagne du temps lors de la configuration d'un nouveau tenant.

**Acceptance Criteria:**

**Given** une liste de modules à activer
**When** j'appelle `POST /api/superadmin/sites/{siteId}/modules/batch` avec:
```json
{"modules": ["Customers", "Contracts", "Invoices"]}
```
**Then** les modules sont activés dans l'ordre des dépendances
**And** si Contracts dépend de Customers, Customers est activé en premier
**And** je reçois un rapport pour chaque module

**Given** plus de 5 modules
**When** j'appelle l'endpoint
**Then** l'opération est exécutée via un job en background
**And** je reçois un ID de job pour suivre la progression

**Given** un module échoue dans le batch
**When** l'erreur survient
**Then** les modules suivants ne sont pas activés
**And** les modules précédents restent activés
**And** le rapport indique l'échec et les modules non traités

**Technical Notes:**
- Job: `Modules/Superadmin/Jobs/BatchActivateModulesJob.php`
- Utiliser Laravel Bus::batch() pour tracking
- FormRequest: `BatchActivateModulesRequest`

---

### Story 3.10: Audit Trail Activation

As a SuperAdmin,
I want que toutes les activations soient enregistrées dans l'audit trail,
So that je peux retracer les changements.

**Acceptance Criteria:**

**Given** une activation de module (réussie ou échouée)
**When** l'opération est terminée
**Then** un enregistrement est créé dans activity_log avec:
  - log_name: 'superadmin'
  - description: 'Module activated' ou 'Module activation failed'
  - subject: SiteModule
  - causer: User (SuperAdmin qui a fait l'action)
  - properties: détails de l'opération

**Given** l'audit trail
**When** je consulte les logs
**Then** je peux filtrer par tenant, module, utilisateur, date

**Technical Notes:**
- Utiliser spatie/laravel-activitylog
- Listener `LogModuleActivation` sur event `ModuleActivated`

---

## Epic 4: Désactivation des Modules

**Objectif:** Permettre au SuperAdmin de désactiver des modules avec avertissements d'impact, backup optionnel avant suppression, et nettoyage complet des ressources.

**FRs couverts:** FR17, FR18, FR19, FR20, FR21, FR22, FR23, FR24, FR25, FR26, FR27, FR33, FR34

**NFRs adressés:** NFR-P3, NFR-R2, NFR-R3, NFR-R4, NFR-S5

---

### Story 4.1: Service TenantStorageManager - Suppression Structure S3

As a SuperAdmin,
I want que le système supprime la structure de fichiers S3 d'un module,
So that les fichiers du tenant sont nettoyés lors de la désactivation.

**Acceptance Criteria:**

**Given** un tenant avec un module activé ayant des fichiers S3
**When** j'appelle `deleteModuleStructure($tenantId, $moduleName)`
**Then** le dossier `tenants/{tenant_id}/modules/{module}/` est supprimé récursivement
**And** le fichier de config `tenants/{tenant_id}/config/module_{module}.json` est supprimé
**And** un log est créé avec le nombre de fichiers supprimés

**Given** le dossier n'existe pas
**When** j'appelle la suppression
**Then** l'opération réussit silencieusement (idempotence)

**Technical Notes:**
- Utiliser `Storage::disk('s3')->deleteDirectory()`
- Compter les fichiers avant suppression pour le rapport

---

### Story 4.2: Service TenantStorageManager - Backup Module

As a SuperAdmin,
I want créer un backup des données du module avant désactivation,
So that les données peuvent être restaurées si nécessaire.

**Acceptance Criteria:**

**Given** un tenant avec un module activé
**When** j'appelle `backupModule($tenantId, $moduleName)`
**Then** un fichier ZIP est créé: `tenants/{tenant_id}/backups/backup_{module}_{date}.zip`
**And** le ZIP contient tous les fichiers du module
**And** le ZIP contient un export des données des tables du module
**And** le chemin du backup est retourné

**Given** le backup échoue
**When** une erreur survient
**Then** une exception est levée avec le détail
**And** aucun fichier partiel ne reste

**Technical Notes:**
- Utiliser ZipArchive ou league/flysystem-ziparchive
- Exporter les tables en SQL ou JSON

---

### Story 4.3: Service TenantMigrationRunner - Rollback Migrations

As a SuperAdmin,
I want que le système annule les migrations du module,
So that les tables sont supprimées lors de la désactivation.

**Acceptance Criteria:**

**Given** un tenant avec un module activé
**When** j'appelle `rollbackMigrations($tenant, $moduleName)`
**Then** les migrations du module sont annulées dans l'ordre inverse
**And** les tables du module sont supprimées de la BDD tenant
**And** le contexte tenant est correctement géré

**Given** un rollback qui échoue
**When** une erreur survient
**Then** une exception `MigrationException` est levée
**And** les tables déjà supprimées ne sont pas restaurées

**Technical Notes:**
- Utiliser `Artisan::call('migrate:rollback', ['--path' => ...])`
- Attention aux foreign keys (ordre de suppression)

---

### Story 4.4: Service Impact Analysis

As a SuperAdmin,
I want voir l'impact d'une désactivation avant de confirmer,
So that je comprends les conséquences de mon action.

**Acceptance Criteria:**

**Given** un tenant avec un module à désactiver
**When** j'appelle `analyzeDeactivationImpact($siteId, $moduleName)`
**Then** je reçois un rapport d'impact:
  - Nombre de lignes dans chaque table du module
  - Nombre de fichiers sur S3
  - Taille totale des fichiers
  - Liste des modules dépendants (si applicable)

**Given** d'autres modules dépendent de ce module
**When** j'analyse l'impact
**Then** le rapport inclut un avertissement bloquant

**Technical Notes:**
- Compter les lignes via COUNT(*)
- Lister les fichiers S3 et calculer la taille

---

### Story 4.5: API Analyse Impact Désactivation

As a SuperAdmin,
I want un endpoint pour analyser l'impact d'une désactivation,
So that je peux voir les conséquences avant de confirmer.

**Acceptance Criteria:**

**Given** je suis authentifié avec le rôle superadmin
**When** j'appelle `GET /api/superadmin/sites/{siteId}/modules/{module}/impact`
**Then** je reçois une réponse 200 avec:
```json
{
  "data": {
    "moduleName": "Contracts",
    "canDeactivate": true,
    "impact": {
      "tables": [
        {"name": "t_contracts", "rowCount": 47},
        {"name": "t_contract_items", "rowCount": 156}
      ],
      "files": {
        "count": 12,
        "totalSizeBytes": 4521984
      },
      "dependentModules": []
    },
    "warnings": []
  }
}
```

**Given** d'autres modules dépendent de ce module
**When** j'appelle l'endpoint
**Then** `canDeactivate` est false
**And** `warnings` contient la liste des modules dépendants

**Technical Notes:**
- Utiliser le service Impact Analysis
- Rate limiter: `superadmin-read`

---

### Story 4.6: Service ModuleInstaller - Désactivation Simple

As a SuperAdmin,
I want désactiver un module pour un tenant,
So that le client n'utilise plus cette fonctionnalité.

**Acceptance Criteria:**

**Given** un tenant et un module activé
**When** j'appelle `deactivate($siteId, $moduleName, $options)`
**Then** le Saga exécute dans l'ordre:
  1. Vérification qu'aucun module ne dépend de celui-ci
  2. Backup optionnel si demandé
  3. Rollback des migrations (tenant DB)
  4. Suppression structure S3
  5. Suppression config S3
  6. Mise à jour t_site_modules (uninstalled_at)
**And** un event `ModuleDeactivated` est dispatché
**And** le cache du tenant est invalidé

**Given** d'autres modules dépendent de ce module
**When** j'essaie de désactiver
**Then** la désactivation est bloquée avec message explicatif

**Technical Notes:**
- Méthode: `ModuleInstaller.deactivate()`
- Option: `withBackup: true/false`

---

### Story 4.7: API Désactivation Module

As a SuperAdmin,
I want un endpoint API pour désactiver un module,
So that je peux désactiver des modules via l'interface.

**Acceptance Criteria:**

**Given** je suis authentifié avec le rôle superadmin
**When** j'appelle `DELETE /api/superadmin/sites/{siteId}/modules/{module}`
**Then** le module est désactivé pour le tenant
**And** je reçois une réponse 200 avec le rapport de désactivation

**Given** l'option backup
**When** j'appelle avec `?backup=true`
**Then** un backup est créé avant la suppression
**And** le rapport inclut le chemin du backup

**Given** le module n'est pas activé
**When** j'appelle l'endpoint
**Then** je reçois une réponse 404 Not Found

**Given** d'autres modules dépendent de ce module
**When** j'appelle l'endpoint
**Then** je reçois une réponse 409 Conflict avec la liste des dépendants

**Technical Notes:**
- FormRequest: `DeactivateModuleRequest`
- Rate limiter: `superadmin-heavy`

---

### Story 4.8: Rollback Automatique Désactivation

As a SuperAdmin,
I want que le système annule la désactivation en cas d'échec,
So that le module reste fonctionnel si quelque chose échoue.

**Acceptance Criteria:**

**Given** une désactivation en cours
**When** une étape échoue (ex: suppression S3)
**Then** le rollback est déclenché
**And** les migrations ne sont pas ré-exécutées (déjà rollback)
**And** si possible, les fichiers sont restaurés depuis le backup
**And** l'enregistrement t_site_modules n'est pas modifié
**And** un event `ModuleDeactivationFailed` est dispatché

**Technical Notes:**
- Saga compensation plus complexe
- Si backup existe, tenter de restaurer

---

### Story 4.9: Rapport Détaillé de Désactivation

As a SuperAdmin,
I want un rapport détaillé après désactivation,
So that je comprends ce qui a été supprimé.

**Acceptance Criteria:**

**Given** une désactivation réussie
**When** l'opération est terminée
**Then** le rapport inclut:
  - Nom du module et tenant
  - Timestamp de désinstallation
  - Nombre de tables supprimées
  - Nombre de fichiers supprimés et taille
  - Chemin du backup (si créé)
  - Durée totale

**Technical Notes:**
- Structure similaire au rapport d'activation
- Stocker dans activity_log

---

### Story 4.10: Désactivation Batch de Modules

As a SuperAdmin,
I want désactiver plusieurs modules en une seule opération,
So that je peux nettoyer rapidement un tenant.

**Acceptance Criteria:**

**Given** une liste de modules à désactiver
**When** j'appelle `DELETE /api/superadmin/sites/{siteId}/modules/batch` avec:
```json
{"modules": ["Contracts", "Invoices"], "backup": true}
```
**Then** les modules sont désactivés dans l'ordre inverse des dépendances
**And** si Invoices dépend de Contracts, Invoices est désactivé en premier
**And** un backup global est créé si demandé

**Given** plus de 5 modules
**When** j'appelle l'endpoint
**Then** l'opération est exécutée via un job en background

**Technical Notes:**
- Job: `BatchDeactivateModulesJob`
- Ordre inverse des dépendances

---

### Story 4.11: Audit Trail Désactivation

As a SuperAdmin,
I want que toutes les désactivations soient enregistrées dans l'audit trail,
So that je peux retracer les suppressions.

**Acceptance Criteria:**

**Given** une désactivation de module (réussie ou échouée)
**When** l'opération est terminée
**Then** un enregistrement est créé dans activity_log avec:
  - description: 'Module deactivated' ou 'Module deactivation failed'
  - properties: détails incluant backup path si applicable

**Technical Notes:**
- Listener sur event `ModuleDeactivated`
- Inclure les métriques de suppression dans properties

---

## Epic 5: Configuration Services Externes

**Objectif:** Permettre au SuperAdmin de configurer tous les services externes (S3/Minio, Database, Redis Cache, Redis Queue, Amazon SES, Meilisearch) avec validation des credentials et test de connexion.

**FRs couverts:** FR39-FR69 (31 FRs)

**NFRs adressés:** NFR-S3, NFR-I1, NFR-I2, NFR-I5, NFR-I6

---

### Story 5.1: Service ServiceConfigManager

As a développeur,
I want un service central pour gérer les configurations de services,
So that toutes les opérations de config passent par un point unique.

**Acceptance Criteria:**

**Given** le service ServiceConfigManager
**When** j'appelle `getConfig($serviceName)`
**Then** je reçois la configuration du service avec credentials déchiffrés

**When** j'appelle `updateConfig($serviceName, $config)`
**Then** les credentials sont chiffrés et sauvegardés
**And** un event `ServiceConfigUpdated` est dispatché
**And** le cache de config est invalidé

**When** j'appelle `validateConfig($serviceName, $config)`
**Then** la configuration est validée selon les règles du service

**Technical Notes:**
- Service: `Modules/Superadmin/Services/ServiceConfigManager.php`
- Utiliser le modèle ServiceConfig avec encryption

---

### Story 5.2: Health Checker S3/Minio

As a SuperAdmin,
I want tester la connexion S3/Minio,
So that je sais si le stockage est correctement configuré.

**Acceptance Criteria:**

**Given** une configuration S3 valide
**When** j'appelle `testConnection()`
**Then** le système tente de:
  1. Lister les buckets
  2. Écrire un fichier test
  3. Lire le fichier test
  4. Supprimer le fichier test
**And** je reçois un résultat de succès avec latence

**Given** une configuration invalide
**When** le test échoue
**Then** je reçois un résultat d'échec avec le message d'erreur détaillé

**Technical Notes:**
- Service: `Modules/Superadmin/Services/Checkers/S3HealthChecker.php`
- Timeout: 5 secondes max
- Fichier test: `_health_check_{timestamp}.txt`

---

### Story 5.3: API Configuration S3/Minio

As a SuperAdmin,
I want configurer les paramètres S3/Minio via API,
So that je peux définir le stockage externe.

**Acceptance Criteria:**

**Given** je suis authentifié avec le rôle superadmin
**When** j'appelle `GET /api/superadmin/config/s3`
**Then** je reçois la configuration actuelle (sans secret_key en clair)

**When** j'appelle `PUT /api/superadmin/config/s3` avec:
```json
{
  "accessKey": "AKIA...",
  "secretKey": "...",
  "bucket": "icall26-storage",
  "endpoint": "https://s3.amazonaws.com",
  "region": "eu-west-1"
}
```
**Then** la configuration est validée puis sauvegardée
**And** le secret_key est chiffré au repos

**When** j'appelle `POST /api/superadmin/config/s3/test`
**Then** un test de connexion est exécuté
**And** je reçois le résultat (success/failure avec détails)

**Technical Notes:**
- FormRequest: `UpdateS3ConfigRequest`
- Ne jamais retourner secret_key en clair (masqué: "****...")

---

### Story 5.4: Health Checker Database

As a SuperAdmin,
I want tester la connexion à la base de données,
So that je sais si la DB centrale est accessible.

**Acceptance Criteria:**

**Given** la configuration database actuelle
**When** j'appelle `testConnection()`
**Then** le système tente de:
  1. Établir une connexion
  2. Exécuter une requête simple (SELECT 1)
  3. Récupérer la version du serveur
**And** je reçois un résultat avec latence et version

**When** j'appelle `getStatistics()`
**Then** je reçois:
  - Nombre de connexions actives
  - Taille de la base de données
  - Uptime du serveur

**Technical Notes:**
- Service: `Modules/Superadmin/Services/Checkers/DatabaseHealthChecker.php`
- Utiliser DB::connection('mysql') pour la centrale

---

### Story 5.5: API Configuration Database

As a SuperAdmin,
I want configurer et tester les paramètres de base de données via API,
So that je peux gérer la connexion DB centrale.

**Acceptance Criteria:**

**Given** je suis authentifié avec le rôle superadmin
**When** j'appelle `GET /api/superadmin/config/database`
**Then** je reçois la configuration (host, port, database, username, sans password)

**When** j'appelle `PUT /api/superadmin/config/database` avec les nouveaux paramètres
**Then** la configuration est validée et sauvegardée

**When** j'appelle `POST /api/superadmin/config/database/test`
**Then** un test de connexion est exécuté avec les stats

**Technical Notes:**
- La modification de la config DB est sensible
- Valider que la nouvelle config fonctionne avant de sauvegarder

---

### Story 5.6: Health Checker Redis

As a SuperAdmin,
I want tester les connexions Redis (cache et queue),
So that je sais si Redis est correctement configuré.

**Acceptance Criteria:**

**Given** une configuration Redis valide
**When** j'appelle `testConnection($type)` (cache ou queue)
**Then** le système tente de:
  1. Se connecter au serveur Redis
  2. Écrire une clé test
  3. Lire la clé test
  4. Supprimer la clé test
  5. Récupérer les infos serveur
**And** je reçois un résultat avec latence et version Redis

**Given** une configuration invalide
**When** le test échoue
**Then** je reçois un message d'erreur détaillé

**Technical Notes:**
- Service: `Modules/Superadmin/Services/Checkers/RedisHealthChecker.php`
- Supporter les deux instances (cache et queue)

---

### Story 5.7: API Configuration Redis Cache

As a SuperAdmin,
I want configurer les paramètres Redis Cache via API,
So that je peux définir le cache distribué.

**Acceptance Criteria:**

**Given** je suis authentifié avec le rôle superadmin
**When** j'appelle `GET /api/superadmin/config/redis-cache`
**Then** je reçois la configuration (host, port, database, prefix)

**When** j'appelle `PUT /api/superadmin/config/redis-cache` avec:
```json
{
  "host": "redis.example.com",
  "port": 6379,
  "password": "...",
  "database": 0,
  "prefix": "icall26_cache_"
}
```
**Then** la configuration est sauvegardée

**When** j'appelle `POST /api/superadmin/config/redis-cache/test`
**Then** un test de connexion est exécuté

**Technical Notes:**
- FormRequest: `UpdateRedisConfigRequest`
- Database: 0-15 (validation)

---

### Story 5.8: API Configuration Redis Queue

As a SuperAdmin,
I want configurer les paramètres Redis Queue via API,
So that je peux définir le backend de queues.

**Acceptance Criteria:**

**Given** je suis authentifié avec le rôle superadmin
**When** j'appelle `GET /api/superadmin/config/redis-queue`
**Then** je reçois la configuration

**When** j'appelle `PUT /api/superadmin/config/redis-queue` avec:
```json
{
  "host": "redis.example.com",
  "port": 6379,
  "password": "...",
  "database": 1,
  "queue": "default"
}
```
**Then** la configuration est sauvegardée

**When** j'appelle `POST /api/superadmin/config/redis-queue/test`
**Then** un test de connexion est exécuté

**Technical Notes:**
- Database différente du cache (ex: 1 vs 0)

---

### Story 5.9: Health Checker Amazon SES

As a SuperAdmin,
I want tester la connexion Amazon SES,
So that je sais si l'envoi d'emails fonctionne.

**Acceptance Criteria:**

**Given** une configuration SES valide
**When** j'appelle `testConnection()`
**Then** le système vérifie:
  1. Les credentials sont valides
  2. Le quota d'envoi actuel
  3. Les identités vérifiées

**When** j'appelle `sendTestEmail($recipient)`
**Then** un email de test est envoyé
**And** je reçois confirmation de l'envoi

**Technical Notes:**
- Service: `Modules/Superadmin/Services/Checkers/SesHealthChecker.php`
- Utiliser AWS SDK pour PHP

---

### Story 5.10: API Configuration Amazon SES

As a SuperAdmin,
I want configurer les paramètres Amazon SES via API,
So that je peux définir l'envoi d'emails.

**Acceptance Criteria:**

**Given** je suis authentifié avec le rôle superadmin
**When** j'appelle `GET /api/superadmin/config/ses`
**Then** je reçois la configuration (region, fromEmail, sans secret)

**When** j'appelle `PUT /api/superadmin/config/ses` avec:
```json
{
  "accessKey": "AKIA...",
  "secretKey": "...",
  "region": "eu-west-1",
  "fromEmail": "noreply@icall26.com"
}
```
**Then** la configuration est sauvegardée

**When** j'appelle `POST /api/superadmin/config/ses/test`
**Then** un test de connexion est exécuté (sans envoi d'email)

**When** j'appelle `POST /api/superadmin/config/ses/test-email` avec:
```json
{"recipient": "test@example.com"}
```
**Then** un email de test est envoyé à l'adresse spécifiée

**Technical Notes:**
- FormRequest: `UpdateSesConfigRequest`
- Valider le format de fromEmail

---

### Story 5.11: Health Checker Meilisearch

As a SuperAdmin,
I want tester la connexion Meilisearch,
So that je sais si le moteur de recherche fonctionne.

**Acceptance Criteria:**

**Given** une configuration Meilisearch valide
**When** j'appelle `testConnection()`
**Then** le système vérifie:
  1. Connexion au serveur
  2. Validation de la clé API
  3. Liste des index existants
  4. Version du serveur
**And** je reçois un résultat avec les détails

**Technical Notes:**
- Service: `Modules/Superadmin/Services/Checkers/MeilisearchHealthChecker.php`
- Utiliser le client Meilisearch PHP

---

### Story 5.12: API Configuration Meilisearch

As a SuperAdmin,
I want configurer les paramètres Meilisearch via API,
So that je peux définir le moteur de recherche.

**Acceptance Criteria:**

**Given** je suis authentifié avec le rôle superadmin
**When** j'appelle `GET /api/superadmin/config/meilisearch`
**Then** je reçois la configuration (url, indexPrefix, sans apiKey)

**When** j'appelle `PUT /api/superadmin/config/meilisearch` avec:
```json
{
  "url": "https://meilisearch.example.com",
  "apiKey": "...",
  "indexPrefix": "icall26_"
}
```
**Then** la configuration est sauvegardée

**When** j'appelle `POST /api/superadmin/config/meilisearch/test`
**Then** un test de connexion est exécuté

**Technical Notes:**
- FormRequest: `UpdateMeilisearchConfigRequest`
- Valider le format de l'URL

---

### Story 5.13: Audit Trail Configuration Services

As a SuperAdmin,
I want que toutes les modifications de configuration soient auditées,
So that je peux retracer les changements.

**Acceptance Criteria:**

**Given** une modification de configuration de service
**When** la configuration est sauvegardée
**Then** un enregistrement est créé dans activity_log avec:
  - description: 'Service config updated'
  - subject: ServiceConfig
  - properties: service_name, fields modifiés (sans credentials)

**Technical Notes:**
- Ne jamais logger les credentials en clair
- Logger uniquement les noms de champs modifiés

---

## Epic 6: Dashboard Santé Globale

**Objectif:** Fournir une vue d'ensemble de l'état de santé de tous les services externes avec indicateurs visuels et tests de connectivité globaux.

**FRs couverts:** FR70, FR71, FR72

**NFRs adressés:** NFR-I3, NFR-I4

---

### Story 6.1: Service ServiceHealthChecker Global

As a développeur,
I want un service qui agrège les health checks de tous les services,
So that je peux obtenir une vue d'ensemble en un seul appel.

**Acceptance Criteria:**

**Given** tous les health checkers configurés
**When** j'appelle `checkAll()`
**Then** tous les services sont testés en parallèle
**And** je reçois un résultat agrégé avec le statut de chaque service

**When** j'appelle `checkService($serviceName)`
**Then** seul ce service est testé
**And** je reçois le résultat détaillé

**Technical Notes:**
- Service: `Modules/Superadmin/Services/ServiceHealthChecker.php`
- Exécuter les checks en parallèle (async)
- Timeout global configurable

---

### Story 6.2: API Dashboard Santé Services

As a SuperAdmin,
I want un endpoint pour voir l'état de santé de tous les services,
So that je peux surveiller l'infrastructure en un coup d'œil.

**Acceptance Criteria:**

**Given** je suis authentifié avec le rôle superadmin
**When** j'appelle `GET /api/superadmin/health`
**Then** je reçois une réponse 200 avec:
```json
{
  "data": {
    "overallStatus": "healthy",
    "checkedAt": "2026-01-27T10:30:00Z",
    "services": [
      {
        "name": "s3",
        "status": "healthy",
        "latencyMs": 45,
        "message": null
      },
      {
        "name": "database",
        "status": "healthy",
        "latencyMs": 12,
        "message": null
      },
      {
        "name": "redis-cache",
        "status": "healthy",
        "latencyMs": 3,
        "message": null
      },
      {
        "name": "redis-queue",
        "status": "healthy",
        "latencyMs": 4,
        "message": null
      },
      {
        "name": "ses",
        "status": "degraded",
        "latencyMs": 890,
        "message": "High latency detected"
      },
      {
        "name": "meilisearch",
        "status": "unhealthy",
        "latencyMs": null,
        "message": "Connection refused"
      }
    ]
  }
}
```

**And** `overallStatus` est:
  - "healthy" si tous les services sont healthy
  - "degraded" si au moins un service est degraded
  - "unhealthy" si au moins un service est unhealthy

**Technical Notes:**
- Resource: `HealthCheckResource`
- Rate limiter: `superadmin-read`

---

### Story 6.3: API Test Global de Connectivité

As a SuperAdmin,
I want lancer un test de connectivité global en un clic,
So that je peux vérifier rapidement que tout fonctionne.

**Acceptance Criteria:**

**Given** je suis authentifié avec le rôle superadmin
**When** j'appelle `POST /api/superadmin/health/test-all`
**Then** tous les services sont testés avec des opérations complètes:
  - S3: write/read/delete test file
  - Database: query execution
  - Redis: set/get/del test key
  - SES: credential validation
  - Meilisearch: index listing
**And** je reçois le résultat détaillé de chaque test

**And** le temps de réponse total est < 30 secondes

**Technical Notes:**
- Exécuter les tests en parallèle
- Retourner les résultats au fur et à mesure si possible

---

### Story 6.4: Indicateurs Visuels de Statut

As a SuperAdmin,
I want que les statuts de services aient des indicateurs clairs,
So that je comprends rapidement l'état de chaque service.

**Acceptance Criteria:**

**Given** le dashboard santé
**When** je consulte l'état des services
**Then** chaque service a un statut parmi:
  - `healthy` (vert): Service opérationnel, latence normale
  - `degraded` (jaune): Service opérationnel mais latence élevée ou avertissement
  - `unhealthy` (rouge): Service non opérationnel ou erreur
  - `unknown` (gris): Service non configuré ou non testé

**And** les seuils de latence sont configurables par service

**Technical Notes:**
- Seuils par défaut:
  - S3: healthy < 500ms, degraded < 2000ms
  - Database: healthy < 100ms, degraded < 500ms
  - Redis: healthy < 50ms, degraded < 200ms

---

### Story 6.5: Cache des Health Checks

As a SuperAdmin,
I want que les résultats de health check soient cachés brièvement,
So that les appels répétés ne surchargent pas les services.

**Acceptance Criteria:**

**Given** un health check récent (< 30 secondes)
**When** j'appelle à nouveau `GET /api/superadmin/health`
**Then** le résultat caché est retourné
**And** le header `X-Cache-Status: HIT` est présent

**Given** un health check périmé (> 30 secondes)
**When** j'appelle l'endpoint
**Then** un nouveau check est exécuté
**And** le résultat est mis en cache

**Given** j'appelle `POST /api/superadmin/health/test-all`
**When** le test est exécuté
**Then** le cache est invalidé et rafraîchi

**Technical Notes:**
- Cache TTL: 30 secondes
- Clé cache: `health:all`

---

### Story 6.6: Intégration spatie/laravel-health

As a développeur,
I want intégrer spatie/laravel-health pour les checks standards,
So that je bénéficie des checks prédéfinis du package.

**Acceptance Criteria:**

**Given** le package spatie/laravel-health installé
**When** je configure les checks
**Then** les checks suivants sont activés:
  - `DatabaseCheck` (connexion centrale)
  - `RedisCheck` (cache et queue)
  - `EnvironmentCheck`
  - `UsedDiskSpaceCheck`
**And** les checks custom (S3, SES, Meilisearch) sont ajoutés

**And** le endpoint `/health` natif du package est accessible (optionnel)

**Technical Notes:**
- Configurer dans `config/health.php`
- Nos checkers custom implémentent l'interface du package

---

### Story 6.7: Audit Trail Health Checks

As a SuperAdmin,
I want que les tests de santé manuels soient enregistrés,
So that je peux voir l'historique des vérifications.

**Acceptance Criteria:**

**Given** un test de santé global lancé manuellement
**When** le test est terminé
**Then** un enregistrement est créé dans activity_log avec:
  - description: 'Health check performed'
  - properties: résultat global, services en erreur

**Technical Notes:**
- Seuls les tests manuels (`POST /health/test-all`) sont loggés
- Les GET automatiques ne sont pas loggés

---

*Document généré le 2026-01-27 | Epics & Stories v1.0 | iCall26 SuperAdmin Improvements*
