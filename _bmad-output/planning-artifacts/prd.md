---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
status: complete
completedAt: 2026-01-27
inputDocuments:
  - product-brief-backend-api-2026-01-27.md
  - Documentation.md
  - Modules/Site/README.md
  - Modules/User/PERMISSIONS_API_DOCUMENTATION.md
  - CLAUDE.md
workflowType: 'prd'
projectType: 'brownfield'
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 0
  projectDocs: 4
date: 2026-01-27
classification:
  projectType: 'API Backend Multi-tenant'
  domain: 'CRM / SaaS Multi-tenant'
  complexity: 'medium-high'
  projectContext: 'brownfield'
---

# Product Requirements Document - iCall26 SuperAdmin Improvements

**Author:** Mounkaila
**Date:** 2026-01-27
**Scope:** Amélioration de la couche SuperAdmin pour la gestion des modules par tenant, l'isolation du stockage fichiers et la configuration des services externes

---

## Table des Matières

1. [Project Classification](#1-project-classification)
2. [Success Criteria](#2-success-criteria)
3. [Module Lifecycle](#3-module-lifecycle)
4. [Storage Architecture](#4-storage-architecture)
5. [Scope & Phases](#5-scope--phases)
6. [User Journeys](#6-user-journeys)
7. [Domain Constraints](#7-domain-constraints)
8. [Technical Architecture](#8-technical-architecture)
9. [API Specifications](#9-api-specifications)
10. [Functional Requirements](#10-functional-requirements)
11. [Non-Functional Requirements](#11-non-functional-requirements)

---

## 1. Project Classification

| Aspect | Valeur |
|--------|--------|
| **Type de projet** | API Backend Multi-tenant (Laravel 12) |
| **Domaine** | CRM / SaaS Multi-tenant |
| **Complexité** | Moyenne-Haute |
| **Contexte** | Brownfield (migration Symfony 1 → Laravel) |

### Indicateurs de Complexité

- Architecture multi-tenant (base de données par tenant)
- Base de données existante à préserver (tables `t_*`)
- Système de permissions complexe (compatible Symfony 1)
- Centaines de tenants en production
- Intégration services externes (S3, Redis, SES, Meilisearch)

---

## 2. Success Criteria

### User Success (SuperAdmin)

| Critère | Mesure |
|---------|--------|
| Activation module (migrations + fichiers + config) | < 30 secondes |
| Désactivation module (cleanup complet) | < 30 secondes |
| Visibilité des modules par tenant | Vue d'ensemble en 1 clic |
| Configuration service externe | Test connexion < 5 secondes |

### Business Success

| Critère | Objectif |
|---------|----------|
| Temps de configuration tenant | **-50%** |
| Temps de backup/restore | **-70%** (isolation) |
| Offres modulaires | Facturation par module |
| Scalabilité | 500+ tenants |

### Technical Success

| Critère | Objectif |
|---------|----------|
| Disponibilité API SuperAdmin | **99.9%** |
| Temps de réponse API | **< 200ms** |
| Isolation fichiers | 100% par tenant |
| Rollback automatique | 0 donnée orpheline |

---

## 3. Module Lifecycle

### Activation (Installation)

| Étape | Action |
|-------|--------|
| 1. Vérification | Valider dépendances du module |
| 2. Base de données | Exécuter migrations dans BDD tenant |
| 3. Fichiers | Créer structure sur S3: `tenants/{tenant_id}/modules/{module}/` |
| 4. Configuration | Générer config: `tenants/{tenant_id}/config/module_{module}.json` |
| 5. Enregistrement | Marquer actif dans `t_site_modules` |

### Désactivation (Désinstallation)

| Étape | Action |
|-------|--------|
| 1. Vérification | Vérifier qu'aucun module n'en dépend |
| 2. Confirmation | Afficher impact + demander confirmation |
| 3. Backup | Proposer backup avant suppression |
| 4. Base de données | Rollback migrations du module |
| 5. Fichiers | Supprimer structure S3 du module |
| 6. Configuration | Supprimer fichiers config |
| 7. Enregistrement | Mettre à jour `t_site_modules` |

---

## 4. Storage Architecture

### Principe Fondamental

**Le serveur application ne contient que le code** — tous les fichiers tenants sont sur S3/Minio externe.

| Concept | Description |
|---------|-------------|
| Code Laravel | "Jetable", redéployable en minutes |
| Fichiers tenants | 100% sur S3/Minio externe |
| Isolation | Un dossier racine par tenant |

### Structure S3/Minio

```
Bucket: icall26-storage
└── tenants/
    └── {tenant_id}/
        ├── config/
        │   ├── module_customers.json
        │   └── module_contracts.json
        ├── documents/
        ├── exports/
        ├── imports/
        └── modules/
            ├── customers/
            │   ├── uploads/
            │   └── templates/
            └── contracts/
                ├── pdfs/
                └── signatures/

Bucket: icall26-backups
└── tenants/
    └── {tenant_id}/
        └── backup_{module}_{date}.zip
```

### Configuration Laravel

```php
// .env
FILESYSTEM_DISK=s3
AWS_BUCKET=icall26-storage
AWS_ENDPOINT=https://minio.your-server.com  // Si Minio

// Usage
Storage::disk('s3')->put("tenants/{$tenantId}/config/module_{$module}.json", $config);
Storage::disk('s3')->makeDirectory("tenants/{$tenantId}/modules/{$module}");
```

---

## 5. Scope & Phases

### Phase 1: MVP

**Objectif:** Gérer les modules par tenant avec isolation complète + configurer les services externes.

#### Must-Have

| Feature | Description |
|---------|-------------|
| API lister modules | `GET /api/superadmin/modules` |
| API modules tenant | `GET /api/superadmin/sites/{id}/modules` |
| API activer module | `POST` → migrations + S3 + config |
| API désactiver module | `DELETE` → backup + cleanup |
| Rollback automatique | Annulation complète si erreur |
| Vérification dépendances | Validation avant activation |
| Config S3/Minio | Credentials + bucket + endpoint |
| Config Database | Host + credentials Cloud SQL |
| Config Redis Cache | Host + port + password |
| Config Redis Queue | Host + port + password |
| Config Amazon SES | Credentials + région |
| Config Meilisearch | URL + API key |
| Dashboard Health | État de tous les services |

#### Should-Have (MVP si possible)

| Feature | Description |
|---------|-------------|
| Backup avant désactivation | ZIP des données |
| Statistiques stockage | Taille par tenant |

### Phase 2: Growth

- Interface UI SuperAdmin (Next.js)
- Activation/désactivation en masse
- Historique des changements (audit trail)
- Clonage de configuration tenant
- Dashboard statistiques global

### Phase 3: Vision

- Facturation automatique par module
- Monitoring usage par tenant
- Marketplace de modules

---

## 6. User Journeys

### Journey 1: Activation Module (Success Path)

**Persona:** Sarah, Technicienne Support (gère 150 tenants)

> Client "LogiTrans" a signé pour le module "Contracts".

1. Sarah accède au tenant "LogiTrans" dans SuperAdmin
2. Liste des modules avec statuts (actif/inactif)
3. Clic "Activer" sur module "Contracts"
4. Système vérifie dépendances → "Customers" déjà actif ✅
5. Progression: Migrations → Fichiers → Config
6. **25 secondes** → Succès avec rapport détaillé

### Journey 2: Désactivation Module (avec Backup)

**Persona:** Marc, Admin Système Senior

> Client "TechnoPlus" arrête le module "Meetings".

1. Marc accède au tenant "TechnoPlus"
2. Clic "Désactiver" sur "Meetings"
3. Avertissement: "⚠️ 47 réunions + 12 fichiers seront supprimés"
4. Coche "Backup avant suppression"
5. Backup généré → Confirme → Suppression propre

### Journey 3: Rollback Automatique

**Persona:** Sarah, Technicienne Support

> Activation du module "Analytics" échoue.

1. Lance activation "Analytics"
2. Migration 3 échoue: "Foreign key constraint fails"
3. Rollback automatique déclenché
4. Tables + fichiers + config annulés
5. Message: "❌ Rollback effectué. Aucune modification persistée."

### Journey 4: Configuration Services

**Persona:** Paul, Responsable Technique

> Configuration initiale du serveur.

1. Accède à la section "Services Externes"
2. Configure S3/Minio avec credentials
3. Test connexion → ✅ Connecté
4. Configure Redis, SES, Meilisearch
5. Dashboard affiche tous les services en vert

---

## 7. Domain Constraints

### Contraintes Base de Données

| Contrainte | Description |
|------------|-------------|
| Tables existantes | Préfixe `t_*`, ne pas modifier le schéma existant |
| Multi-tenant | Une BDD par tenant (stancl/tenancy) |
| Migrations module | Exécutées dans la BDD du tenant ciblé |

### Contraintes Architecture

| Contrainte | Description |
|------------|-------------|
| Modules Laravel | nwidart/laravel-modules |
| Authentification | Laravel Sanctum avec abilities |
| SuperAdmin | Base centrale (pas de tenant middleware) |

### Contraintes Services Externes

| Service | Contrainte |
|---------|------------|
| S3/Minio | SDK AWS standard, endpoint configurable |
| Redis | Versions 6.x+, bases séparées cache/queue |
| SES | Région configurable, email vérifié |
| Meilisearch | Index préfixés par tenant |

---

## 8. Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SuperAdmin API Layer                     │
├─────────────────────────────────────────────────────────────┤
│  ModuleController          │  ServiceConfigController       │
│  ├── listAvailableModules  │  ├── getS3Config              │
│  ├── listTenantModules     │  ├── updateS3Config           │
│  ├── activateModule        │  ├── testS3Connection         │
│  └── deactivateModule      │  └── [Redis, SES, Meili...]   │
├─────────────────────────────────────────────────────────────┤
│  Services Layer                                              │
│  ├── ModuleInstaller (install/uninstall avec rollback)      │
│  ├── TenantStorageManager (S3 operations)                   │
│  └── ServiceHealthChecker (test connexions)                 │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                  │
│  ├── Central DB → t_sites, t_site_modules, t_service_config │
│  └── Tenant DBs → Tables modules (t_contracts, etc.)        │
├─────────────────────────────────────────────────────────────┤
│  External Services                                           │
│  S3/Minio │ Cloud SQL │ Redis Cache │ Redis Queue │ SES │ Meili │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. API Specifications

### Gestion des Modules

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/superadmin/modules` | GET | Liste modules disponibles |
| `/api/superadmin/sites/{id}/modules` | GET | Modules actifs du tenant |
| `/api/superadmin/sites/{id}/modules/{module}` | POST | Activer module |
| `/api/superadmin/sites/{id}/modules/{module}` | DELETE | Désactiver module |
| `/api/superadmin/sites/{id}/modules/{module}/backup` | POST | Backup module |

### Configuration Services

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/superadmin/config/s3` | GET/PUT | Config S3/Minio |
| `/api/superadmin/config/s3/test` | POST | Test connexion S3 |
| `/api/superadmin/config/database` | GET/PUT | Config Cloud SQL |
| `/api/superadmin/config/redis-cache` | GET/PUT | Config Redis Cache |
| `/api/superadmin/config/redis-queue` | GET/PUT | Config Redis Queue |
| `/api/superadmin/config/ses` | GET/PUT | Config Amazon SES |
| `/api/superadmin/config/meilisearch` | GET/PUT | Config Meilisearch |
| `/api/superadmin/health` | GET | État tous services |

### Authentification

| Aspect | Implémentation |
|--------|---------------|
| Méthode | Laravel Sanctum |
| Ability | `role:superadmin` |
| Middleware | `auth:sanctum` (pas de tenant) |

### Schéma Table Centrale

```sql
CREATE TABLE t_site_modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    site_id INT NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    is_active ENUM('YES', 'NO') DEFAULT 'YES',
    installed_at DATETIME,
    uninstalled_at DATETIME NULL,
    config JSON NULL,
    FOREIGN KEY (site_id) REFERENCES t_sites(site_id),
    UNIQUE KEY unique_site_module (site_id, module_name)
);

CREATE TABLE t_service_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(50) NOT NULL UNIQUE,
    config JSON NOT NULL,
    updated_at DATETIME,
    updated_by INT
);
```

---

## 10. Functional Requirements

### Gestion des Modules - Découverte & Listing

- FR1: SuperAdmin peut lister tous les modules disponibles dans le système
- FR2: SuperAdmin peut voir les métadonnées de chaque module (nom, version, description, dépendances)
- FR3: SuperAdmin peut lister les modules actifs pour un tenant spécifique
- FR4: SuperAdmin peut voir le statut d'activation de chaque module par tenant
- FR5: SuperAdmin peut filtrer les modules par catégorie ou type
- FR6: SuperAdmin peut rechercher des modules par nom ou mot-clé

### Gestion des Modules - Activation

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

### Gestion des Modules - Désactivation

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

### Gestion des Modules - Rollback & Transactions

- FR28: Système exécute toutes les opérations d'activation dans une transaction atomique
- FR29: Système effectue un rollback automatique complet en cas d'échec d'activation
- FR30: Rollback annule les migrations, supprime les fichiers S3, supprime la config
- FR31: Système retourne un message d'erreur détaillé avec la cause de l'échec
- FR32: Aucune donnée orpheline ne persiste après un rollback
- FR33: Système effectue un rollback automatique complet en cas d'échec de désactivation
- FR34: Système journalise toutes les opérations pour audit

### Gestion des Modules - Dépendances

- FR35: SuperAdmin peut voir le graph des dépendances entre modules
- FR36: Système définit les dépendances dans la configuration de chaque module
- FR37: Système empêche la désactivation d'un module si d'autres modules en dépendent
- FR38: SuperAdmin peut voir quels modules dépendent d'un module donné

### Configuration Services Externes - S3/Minio

- FR39: SuperAdmin peut configurer les credentials S3/Minio (access key, secret key)
- FR40: SuperAdmin peut configurer le bucket par défaut pour le stockage tenant
- FR41: SuperAdmin peut configurer l'endpoint S3 (pour Minio ou S3 compatible)
- FR42: SuperAdmin peut configurer la région AWS si applicable
- FR43: SuperAdmin peut tester la connexion S3/Minio et voir le résultat
- FR44: Système valide les credentials avant de sauvegarder la configuration

### Configuration Services Externes - Base de Données

- FR45: SuperAdmin peut configurer les paramètres de connexion Cloud SQL (host, port, user, password)
- FR46: SuperAdmin peut configurer le préfixe des bases de données tenant
- FR47: SuperAdmin peut tester la connexion à la base de données centrale
- FR48: SuperAdmin peut voir les statistiques de connexion
- FR49: Système valide les credentials avant de sauvegarder la configuration

### Configuration Services Externes - Redis Cache

- FR50: SuperAdmin peut configurer les paramètres Redis Cache (host, port, password)
- FR51: SuperAdmin peut configurer le préfixe de cache par défaut
- FR52: SuperAdmin peut configurer la base de données Redis (0-15) pour le cache
- FR53: SuperAdmin peut tester la connexion Redis Cache et voir le résultat
- FR54: Système valide les credentials avant de sauvegarder la configuration

### Configuration Services Externes - Redis Queue

- FR55: SuperAdmin peut configurer les paramètres Redis Queue (host, port, password)
- FR56: SuperAdmin peut configurer le nom de la queue par défaut
- FR57: SuperAdmin peut configurer la base de données Redis (0-15) pour les queues
- FR58: SuperAdmin peut tester la connexion Redis Queue et voir le résultat
- FR59: Système valide les credentials avant de sauvegarder la configuration

### Configuration Services Externes - Amazon SES

- FR60: SuperAdmin peut configurer les credentials Amazon SES (access key, secret key)
- FR61: SuperAdmin peut configurer la région SES
- FR62: SuperAdmin peut configurer l'adresse email d'envoi par défaut
- FR63: SuperAdmin peut tester l'envoi d'un email via SES
- FR64: Système valide les credentials avant de sauvegarder la configuration

### Configuration Services Externes - Meilisearch

- FR65: SuperAdmin peut configurer l'URL du serveur Meilisearch
- FR66: SuperAdmin peut configurer la clé API Meilisearch (master key ou API key)
- FR67: SuperAdmin peut configurer le préfixe d'index par défaut
- FR68: SuperAdmin peut tester la connexion Meilisearch et voir le résultat
- FR69: Système valide les credentials avant de sauvegarder la configuration

### Dashboard & Health Check

- FR70: SuperAdmin peut voir un dashboard avec l'état de santé de tous les services externes
- FR71: Système affiche un indicateur visuel pour chaque service (connecté/déconnecté/erreur)
- FR72: SuperAdmin peut lancer un test de connectivité global de tous les services en un clic

---

## 11. Non-Functional Requirements

### Performance

| NFR | Critère |
|-----|---------|
| NFR-P1 | Temps de réponse API < **200ms** (95th percentile) |
| NFR-P2 | Activation module < **30 secondes** |
| NFR-P3 | Désactivation module < **30 secondes** |
| NFR-P4 | Liste modules tenant < **100ms** |
| NFR-P5 | Test connexion service < **5 secondes** |
| NFR-P6 | Batch (5+ modules) via jobs async |

### Sécurité

| NFR | Critère |
|-----|---------|
| NFR-S1 | Isolation stricte entre tenants |
| NFR-S2 | Authentification Sanctum obligatoire |
| NFR-S3 | Credentials chiffrés au repos (AES-256) |
| NFR-S4 | Communications HTTPS/TLS 1.2+ |
| NFR-S5 | Audit trail complet |
| NFR-S6 | Logs sans données sensibles |
| NFR-S7 | Tokens avec expiration configurable |
| NFR-S8 | Rate limiting endpoints sensibles |

### Scalabilité

| NFR | Critère |
|-----|---------|
| NFR-SC1 | Support **500+ tenants** |
| NFR-SC2 | Support **50 modules** par tenant |
| NFR-SC3 | Jobs activation/désactivation en queue |
| NFR-SC4 | Architecture stateless (scalable horizontalement) |
| NFR-SC5 | Cache Redis pour listes fréquentes |

### Intégration

| NFR | Critère |
|-----|---------|
| NFR-I1 | Timeout configurable par service (défaut 30s) |
| NFR-I2 | Retry avec backoff exponentiel (3 tentatives) |
| NFR-I3 | Fallback gracieux si service indisponible |
| NFR-I4 | Health check périodique configurable |
| NFR-I5 | Compatibilité S3/Minio via SDK AWS |
| NFR-I6 | Support Redis 6.x+ |

### Fiabilité

| NFR | Critère |
|-----|---------|
| NFR-R1 | Disponibilité **99.9%** |
| NFR-R2 | Transactions atomiques avec rollback |
| NFR-R3 | Zéro donnée orpheline après rollback |
| NFR-R4 | Backup optionnel avant suppression |
| NFR-R5 | Idempotence des opérations |
| NFR-R6 | Graceful degradation si S3 indisponible |

---

*Document généré le 2026-01-27 | PRD v1.0 | iCall26 SuperAdmin Improvements*
