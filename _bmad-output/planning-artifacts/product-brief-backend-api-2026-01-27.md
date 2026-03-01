---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments:
  - Documentation.md
  - Modules/Site/README.md
  - Modules/User/PERMISSIONS_API_DOCUMENTATION.md
  - Modules/User/RESUME_PERMISSIONS.md
  - CLAUDE.md
date: 2026-01-27
author: Mounkaila
project_name: iCall26 (backend-api)
scope: SuperAdmin Improvements
status: complete
---

# Product Brief: iCall26 - SuperAdmin Improvements

## Executive Summary

Ce projet vise à **améliorer la couche SuperAdmin** de la plateforme CRM multi-tenant iCall26, actuellement en cours de migration de Symfony 1 vers Laravel 12 + Next.js 16.

L'objectif principal est de doter les administrateurs de la plateforme d'outils puissants pour :
1. **Gérer les modules par tenant** : Activer/désactiver des modules spécifiques pour chaque client
2. **Isoler le stockage fichiers par tenant** : Chaque tenant dispose de son propre espace de stockage pour faciliter les backups
3. **Configurer les services externes** : Gérer les intégrations (S3, Redis, SES, Meilisearch) depuis une interface centralisée

---

## Core Vision

### Problem Statement

La plateforme iCall26 gère des centaines de tenants, mais le SuperAdmin actuel manque de fonctionnalités essentielles :

- **Pas de gestion granulaire des modules** : Impossible d'activer/désactiver des fonctionnalités par tenant
- **Stockage fichiers non isolé** : Les fichiers des tenants ne sont pas séparés, compliquant les backups et la gestion
- **Configuration des services dispersée** : Les paramètres des services externes ne sont pas gérables depuis le SuperAdmin

### Problem Impact

| Problème | Impact Business |
|----------|-----------------|
| Modules non configurables | Impossible de personnaliser l'offre par client ou de facturer par fonctionnalité |
| Fichiers non isolés | Backups complexes, risque de mélange de données, restauration difficile |
| Services non centralisés | Configuration manuelle, erreurs potentielles, maintenance coûteuse |

### Why Existing Solutions Fall Short

L'ancien système Symfony 1 possédait un système de modules par tenant, mais :
- L'architecture ne permet pas une migration directe
- Le stockage fichiers n'était pas conçu pour le cloud (S3/Minio)
- Aucune interface de configuration des services externes n'existait

### Proposed Solution

#### 1. Gestion des Modules par Tenant

**Concept :**
- Chaque module Laravel peut être activé/désactivé par tenant
- Table de liaison `t_site_modules` pour tracker les modules actifs par site
- API SuperAdmin pour gérer les activations

**Fonctionnalités :**
- Liste des modules disponibles dans le système
- Activation/désactivation individuelle ou en masse
- Vérification des dépendances entre modules
- Historique des changements de configuration

#### 2. Stockage Fichiers Isolé par Tenant

**Concept :**
- Chaque tenant dispose de son propre "bucket" ou dossier racine
- Structure : `{storage}/{tenant_id}/` pour tous les fichiers du tenant
- Compatible S3/Minio pour le stockage cloud

**Bénéfices :**
- Backup/restauration par tenant simplifié (géré par le SuperAdmin/Support)
- Isolation complète des données
- Migration de tenant facilitée
- Facturation du stockage par client possible

**Structure proposée :**
```
storage/
├── tenant_1/
│   ├── documents/
│   ├── images/
│   ├── exports/
│   └── imports/
├── tenant_2/
│   ├── documents/
│   ├── images/
│   └── ...
└── tenant_N/
    └── ...
```

#### 3. Configuration des Services Externes (Future)

**Services à configurer depuis le SuperAdmin :**
- S3/Minio : Credentials, buckets, régions
- Redis : Connexions, préfixes de cache
- Amazon SES : Configuration email par tenant
- Meilisearch : Index par tenant

### Key Differentiators

1. **Reproduction du comportement Symfony 1** : Le système de modules par tenant existait — on le modernise
2. **Architecture cloud-native** : Stockage S3 avec isolation par tenant dès la conception
3. **Backups granulaires** : Possibilité de backup/restaurer un seul tenant sans affecter les autres
4. **Flexibilité commerciale** : Permet de créer des offres différenciées (modules en option)
5. **Scalabilité** : Chaque tenant peut avoir ses propres quotas de stockage

---

## Target Users

### Utilisateur Principal : SuperAdmin (Support/Plateforme)

**Profil :**
- Administrateur de la plateforme iCall26
- Équipe support qui gère des centaines de tenants
- Responsable de la configuration globale, des backups et de la maintenance

**Responsabilités :**
- Créer et configurer les nouveaux tenants
- Activer/désactiver les modules pour chaque tenant
- Gérer les backups et restaurations des données par tenant
- Superviser l'état de santé de la plateforme

**Besoins :**
- Interface centralisée pour gérer tous les tenants
- Gestion rapide des modules (activation/désactivation en quelques clics)
- Backups isolés par tenant pour faciliter les opérations de maintenance
- Vue d'ensemble de la configuration de chaque tenant

**Pain Points Actuels :**
- Configuration manuelle et dispersée
- Pas de visibilité sur les modules actifs par tenant
- Backups complexes car fichiers non isolés entre tenants
- Pas d'interface unifiée pour les opérations de maintenance

### Utilisateur Secondaire : Admin Tenant

**Profil :**
- Administrateur d'un site client spécifique
- Utilise les fonctionnalités du CRM pour son entreprise

**Relation avec le SuperAdmin :**
- Ne gère PAS les backups (responsabilité du SuperAdmin/Support)
- Bénéficie des modules activés par le SuperAdmin
- Voit uniquement les modules qui lui sont attribués

**Bénéfice indirect :**
- Expérience personnalisée (seuls les modules pertinents sont visibles)
- Interface simplifiée sans fonctionnalités inutiles

---

## Success Metrics

### Métriques Techniques

| Métrique | Objectif |
|----------|----------|
| Temps d'activation d'un module | < 5 secondes |
| Temps de backup d'un tenant | Proportionnel à la taille, isolé des autres |
| Disponibilité API SuperAdmin | 99.9% |
| Temps de réponse API | < 200ms |

### Métriques Business

| Métrique | Objectif |
|----------|----------|
| Réduction temps de configuration tenant | -50% |
| Réduction temps de backup/restore | -70% (grâce à l'isolation) |
| Capacité à créer des offres modulaires | Oui |

---

## Constraints & Assumptions

### Contraintes Techniques

1. **Base de données existante** : Les tables `t_sites` existent déjà — ne pas modifier le schéma existant de manière destructive
2. **Compatibilité modules Laravel** : Utiliser le système `nwidart/laravel-modules` déjà en place
3. **Multi-tenancy** : Respecter l'architecture `stancl/tenancy` existante
4. **API-first** : Toutes les fonctionnalités doivent être exposées via API REST

### Contraintes Business

1. **Rétro-compatibilité** : Le comportement doit reproduire l'ancien système Symfony 1
2. **Pas de downtime** : Les modifications ne doivent pas impacter les tenants existants
3. **Centaines de tenants** : La solution doit supporter l'échelle actuelle

### Assumptions

1. Le frontend SuperAdmin (Next.js) existe ou sera créé séparément
2. Les modules Laravel sont déjà structurés de manière cohérente
3. L'infrastructure S3/Minio est disponible ou sera provisionnée

---

## Scope du Projet

### In Scope (Phase Actuelle)

- [x] Gestion des modules par tenant depuis le SuperAdmin
- [x] Isolation du stockage fichiers par tenant (structure S3/Minio)
- [x] API SuperAdmin pour l'activation/désactivation des modules
- [ ] Interface de gestion (si frontend SuperAdmin existe)

### Out of Scope (Phases Futures)

- Configuration des services externes (SES, Meilisearch) depuis l'UI
- Facturation automatique basée sur les modules actifs
- Monitoring de l'usage par tenant
- Migration automatique des fichiers existants

---

## Next Steps

1. **PRD** : Rédiger le Product Requirements Document avec les spécifications détaillées
2. **Architecture** : Concevoir le schéma de base de données et les APIs
3. **Implementation** : Développer les fonctionnalités par épics

