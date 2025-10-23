# 📚 Guide de Migration Symfony 1 → Laravel 11 API + Next.js 15

## 📋 Fichiers Disponibles

Vous avez **2 tutoriels complets** pour migrer votre application:

### 1️⃣ **TUTORIEL_COMPLET_LARAVEL_NEXTJS.md** (Principal)

Le tutoriel principal qui couvre:
- ✅ Installation Laravel 11 API
- ✅ Configuration base de données existante (sans modification)
- ✅ Architecture modulaire (nwidart/laravel-modules)
- ✅ Création module UsersGuard complet
- ✅ Authentification API (Sanctum)
- ✅ Frontend Next.js 15 avec login/dashboard
- ✅ Optimisations pour millions de données
- ✅ Scripts utilitaires (create-module.ps1, test-api.ps1)

**👉 Commencez par ce fichier!**

---

### 2️⃣ **TUTORIEL_MULTI_TENANCY_LARAVEL.md** (Multi-Tenant)

Tutoriel dédié à l'architecture multi-tenant avec:
- 🏢 Configuration `stancl/tenancy`
- 🏢 Utilisation de votre table `t_sites` existante
- 🏢 Connexions dynamiques aux bases de données séparées
- 🏢 Middleware d'identification des sites
- 🏢 Routes séparées central/tenant
- 🏢 Authentification superadmin + tenant
- 🏢 Frontend avec sélection de site
- 🏢 Scripts de test multi-tenancy

**👉 Lisez ce fichier après avoir suivi le tutoriel principal!**

---

## 🚀 Ordre de Lecture Recommandé

### Étape 1: Tutoriel Principal (Jours 1-3)

```
TUTORIEL_COMPLET_LARAVEL_NEXTJS.md
├─ Section 1-2:  Prérequis et installation
├─ Section 3-5:  Backend Laravel + modules
├─ Section 6-7:  Modèles + Module UsersGuard
├─ Section 8:    Authentification API
├─ Section 9:    Frontend Next.js
├─ Section 10:   Optimisations
└─ Section 11-12: Migration + Tests
```

**Résultat après cette étape:**
- ✅ Backend Laravel fonctionnel
- ✅ Module UsersGuard complet
- ✅ Frontend Next.js avec login
- ✅ API testée et fonctionnelle

---

### Étape 2: Multi-Tenancy (Jour 4)

```
TUTORIEL_MULTI_TENANCY_LARAVEL.md
├─ Installation stancl/tenancy
├─ Configuration modèle Tenant
├─ Middleware InitializeTenancy
├─ Routes central/tenant séparées
├─ Contrôleurs superadmin (gestion sites)
├─ Authentification multi-tenant
└─ Frontend sélection de site
```

**Résultat après cette étape:**
- ✅ Support multi-tenant complet
- ✅ Base superadmin + bases tenant
- ✅ Identification par domaine/header
- ✅ Connexions dynamiques DB
- ✅ Interface sélection de site

---

## 🎯 Votre Architecture Actuelle

### Base Superadmin (Centrale)

```sql
-- Table t_sites dans la base superadmin
t_sites
├─ site_id
├─ site_host        (exemple.com)
├─ site_db_name     (db_site_exemple)
├─ site_db_login    (root)
├─ site_db_password (password)
└─ site_db_host     (localhost)
```

### Bases Tenant (Séparées)

```
Site 1: db_site1
├─ t_users
├─ t_groups
├─ t_permissions
└─ ...

Site 2: db_site2
├─ t_users
├─ t_groups
├─ t_permissions
└─ ...
```

---

## 📊 Comparaison Avant/Après

| Aspect | Symfony 1 (Actuel) | Laravel 11 (Futur) |
|--------|-------------------|-------------------|
| **Framework** | Symfony 1.x (2008) | Laravel 11 (2024) |
| **Templates** | Smarty 2/3 | API JSON (Next.js) |
| **AJAX** | $.ajax2 custom | Axios standard |
| **ORM** | mfObject3 custom | Eloquent ORM |
| **Modules** | Dossiers custom | Laravel Modules |
| **Multi-tenant** | Custom switch DB | stancl/tenancy |
| **Auth** | Sessions PHP | JWT Sanctum |
| **Cache** | Aucun | Redis |
| **Frontend** | Smarty .tpl | Next.js 15 React |
| **API** | Aucune | RESTful API |
| **Mobile** | Impossible | API consommable |

---

## 🛠️ Structure Finale du Projet

```
C:\xampp\htdocs\
│
├─ backend-api/              ✅ Laravel 11 API
│  ├─ app/Models/
│  │  ├─ User.php           # Modèle de base
│  │  └─ Tenant.php         # Modèle multi-tenant (t_sites)
│  │
│  ├─ Modules/              ✅ Architecture modulaire
│  │  ├─ UsersGuard/
│  │  │  ├─ Entities/       # Modèles (Group, Permission, Session)
│  │  │  ├─ Http/Controllers/
│  │  │  │  ├─ Admin/
│  │  │  │  ├─ Superadmin/
│  │  │  │  └─ Frontend/
│  │  │  ├─ Repositories/   # Business logic
│  │  │  ├─ Routes/
│  │  │  │  ├─ admin.php
│  │  │  │  ├─ superadmin.php
│  │  │  │  └─ frontend.php
│  │  │  └─ module.json
│  │  │
│  │  ├─ ServerSiteManager/ # Module 2
│  │  ├─ AppDomoprime/      # Module 3
│  │  └─ ...                # Vos autres modules
│  │
│  ├─ create-module.ps1     # Script création modules
│  ├─ test-api.ps1          # Script test API
│  └─ .env                  # Config (DB superadmin)
│
├─ frontend-nextjs/         ✅ Next.js 15
│  ├─ src/
│  │  ├─ app/
│  │  │  ├─ select-site/    # Sélection du site
│  │  │  ├─ login/          # Login tenant
│  │  │  └─ dashboard/      # Dashboard
│  │  │
│  │  └─ lib/
│  │     ├─ api/
│  │     │  ├─ client.ts    # API client (avec X-Tenant-ID)
│  │     │  └─ services/    # Services API
│  │     │
│  │     └─ tenant-context.tsx  # Context multi-tenant
│  │
│  └─ .env.local            # Config API URL
│
└─ project/                 # Ancien code Symfony (garder temporairement)
   └─ modules/
```

---

## 📝 Checklist Complète de Migration

### Phase 1: Setup Backend (Sections 1-8)

- [ ] Installer Laravel 11
- [ ] Configurer connexion DB existante
- [ ] Installer Laravel Modules
- [ ] Créer script create-module.ps1
- [ ] Créer module UsersGuard
- [ ] Créer modèles Eloquent
- [ ] Créer repositories
- [ ] Créer contrôleurs Admin/Superadmin/Frontend
- [ ] Configurer routes par layer
- [ ] Installer Sanctum
- [ ] Créer AuthController
- [ ] Tester API avec Postman

### Phase 2: Setup Frontend (Section 9)

- [ ] Créer projet Next.js 15
- [ ] Installer dépendances (axios, react-query)
- [ ] Créer API client
- [ ] Créer services (auth, groups, etc.)
- [ ] Créer page login
- [ ] Créer page dashboard
- [ ] Tester login end-to-end

### Phase 3: Multi-Tenancy (TUTORIEL_MULTI_TENANCY_LARAVEL.md)

- [ ] Installer stancl/tenancy
- [ ] Créer modèle Tenant (utilise t_sites)
- [ ] Créer TenancyServiceProvider
- [ ] Créer middleware InitializeTenancy
- [ ] Créer SiteController (superadmin)
- [ ] Séparer routes central/tenant
- [ ] Modifier AuthController (login superadmin + tenant)
- [ ] Créer page sélection site (Next.js)
- [ ] Créer TenantContext (React)
- [ ] Modifier API client (header X-Tenant-ID)
- [ ] Tester multi-tenancy complet

### Phase 4: Migration Autres Modules (Section 11)

- [ ] Lister tous vos modules Symfony
- [ ] Pour chaque module:
  - [ ] Créer module Laravel
  - [ ] Migrer modèles
  - [ ] Migrer repositories
  - [ ] Migrer contrôleurs
  - [ ] Configurer routes
  - [ ] Tester endpoints

### Phase 5: Optimisations (Section 10)

- [ ] Configurer Redis cache
- [ ] Ajouter eager loading
- [ ] Optimiser queries lourdes
- [ ] Indexer DB si nécessaire
- [ ] Configurer chunking pour batch
- [ ] Tester performance

### Phase 6: Production (Section 12)

- [ ] Tester l'API complète
- [ ] Build frontend (npm run build)
- [ ] Optimiser Laravel (config:cache, route:cache)
- [ ] Configurer .env production
- [ ] Déployer

---

## 🎓 Concepts Clés à Comprendre

### 1. Architecture Modulaire Laravel

Chaque module est **indépendant** et contient:
- Ses propres modèles (Entities)
- Ses propres contrôleurs (Admin/Superadmin/Frontend)
- Ses propres routes
- Sa propre logique métier (Repositories)

**Avantage**: Pas de mélange de code entre modules!

### 2. Multi-Tenancy avec Bases Séparées

- Base **centrale** (superadmin) = gestion des sites
- Bases **tenant** (une par site) = données des sites
- Connexion **dynamique** selon le site identifié

**Avantage**: Isolation complète des données!

### 3. API REST Laravel + Frontend Next.js

- Backend = API JSON uniquement (pas de templates)
- Frontend = Application React moderne
- Communication via HTTP/JSON

**Avantage**: Backend peut servir web + mobile + desktop!

---

## 🆘 Aide et Support

### Problèmes Courants

**1. Erreur connexion DB:**
```bash
php artisan tinker
>>> DB::connection()->getPdo();
```

**2. Module non trouvé:**
```bash
composer dump-autoload
php artisan module:enable UsersGuard
```

**3. CORS errors:**
- Vérifier `config/cors.php`
- Vérifier `FRONTEND_URL` dans `.env`

**4. Multi-tenant non détecté:**
- Vérifier middleware `tenant` dans routes
- Vérifier header `X-Tenant-ID` dans requêtes

### Ressources

- **Laravel 11**: https://laravel.com/docs/11.x
- **Laravel Modules**: https://nwidart.com/laravel-modules
- **Tenancy for Laravel**: https://tenancyforlaravel.com/
- **Next.js 15**: https://nextjs.org/docs
- **Sanctum**: https://laravel.com/docs/11.x/sanctum

---

## 🎯 Résumé

**Vous avez tout pour réussir:**

1. 📘 **Tutoriel principal** - Setup complet de A à Z
2. 🏢 **Tutoriel multi-tenancy** - Configuration tenant
3. 🛠️ **Scripts utilitaires** - Automatisation
4. 📋 **Checklist complète** - Rien n'est oublié
5. 🎓 **Concepts expliqués** - Compréhension profonde

**Temps estimé:**
- Phase 1-2 (Backend + Frontend): **2-3 jours**
- Phase 3 (Multi-tenancy): **1 jour**
- Phase 4-6 (Migration + Prod): **Variable selon nombre de modules**

**🚀 Commencez maintenant avec `TUTORIEL_COMPLET_LARAVEL_NEXTJS.md`!**

---

## 📞 Questions Fréquentes

**Q: Dois-je modifier mes tables existantes?**
R: **Non!** Laravel utilisera vos tables telles quelles via les modèles Eloquent.

**Q: Puis-je garder mon ancien système pendant la migration?**
R: **Oui!** Les deux systèmes peuvent coexister (ports différents).

**Q: Le multi-tenancy est-il obligatoire?**
R: **Oui** pour votre système car vous avez plusieurs sites avec bases séparées.

**Q: Combien de temps pour migrer tous les modules?**
R: Environ **1-2 jours par module** selon la complexité.

**Q: Et si j'ai des millions de lignes?**
R: Les optimisations (Section 10) sont faites pour ça: cache Redis, cursors, chunking.

**Bon courage! 🚀**
