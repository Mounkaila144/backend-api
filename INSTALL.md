# Guide d'installation — backend-api

Guide pas-à-pas pour installer et démarrer le projet en **développement local
(Windows)** ou en **production (serveur Ubuntu)**.

> **À qui s'adresse ce guide ?** À toi, ou à n'importe qui (même non-développeur)
> qui doit installer le projet sur une nouvelle machine. Suis les sections dans
> l'ordre — **chaque commande est copiable telle quelle**.

---

## Sommaire

- [Architecture en 30 secondes](#architecture-en-30-secondes)
- [Prérequis](#prérequis)
- [1. Installation Windows — dev local](#1-installation-windows--dev-local)
- [2. Installation Ubuntu — serveur prod](#2-installation-ubuntu--serveur-prod)
- [3. Configuration `.env` (DB cloud)](#3-configuration-env-db-cloud)
- [4. Migrations de la base centrale](#4-migrations-de-la-base-centrale)
- [5. Seeders (création du superadmin)](#5-seeders-création-du-superadmin)
- [6. Premier login](#6-premier-login)
- [7. Commandes utiles au quotidien](#7-commandes-utiles-au-quotidien)
- [8. Dépannage (FAQ)](#8-dépannage-faq)

---

## Architecture en 30 secondes

```
┌─ Cloud DB managé (Railway / OVH / autre) ──────┐
│  • DB centrale (t_sites, t_users superadmin)   │
│  • DB tenant 1, 2, ..., N                      │
└────────────────────────────────────────────────┘
              ↑ TCP (env_file .env → DB_HOST)
┌─ Machine locale OU VPS Ubuntu ─────────────────┐
│  Docker Compose :                              │
│    • app        (Laravel 12, PHP-FPM 8.3)      │
│    • frontend   (Next.js 15, MUI 6)            │
│    • nginx      (reverse proxy /api/* + /*)    │
│    • redis      (cache, sessions, queue)       │
│    • worker     (php artisan queue:work)       │
│    • scheduler  (php artisan schedule:work)    │
└────────────────────────────────────────────────┘
```

- **Pas de MySQL local** : la DB tourne sur un cloud managé.
- **Pas de vhost à créer par tenant** : nginx route `*.tondomaine.com` automatiquement (wildcard).
- **Redis local** au container, isolation par préfixe (`stancl/tenancy`).

---

## Prérequis

### Windows (dev local)
- **Docker Desktop** ≥ 4.30 → <https://www.docker.com/products/docker-desktop/>
- **Git** → <https://git-scm.com/>
- 8 GB RAM mini, 16 GB recommandé
- 20 GB d'espace disque libre

### Ubuntu (serveur prod)
- Ubuntu 22.04 ou 24.04
- Accès sudo / root
- 2 vCPU, 4 GB RAM mini
- Nom de domaine avec DNS wildcard `*.tondomaine.com → IP_DU_VPS`

### DB cloud (les deux cas)
- Une instance MySQL managée (Railway, OVH Cloud DB, AWS RDS, etc.)
- Connection string sous forme : `mysql://user:pass@host:port/dbname`

---

## 1. Installation Windows — dev local

### Méthode 1-clic (recommandée)

1. **Cloner le projet** :
   ```bash
   git clone <url-du-repo> C:\laragon\www\backend-api
   cd C:\laragon\www\backend-api
   ```

2. **Lancer Docker Desktop** et attendre que la barre de statut affiche `Engine running`.

3. **Double-clic** sur :
   ```
   docker\scripts\install-windows.bat
   ```

4. **Cliquer "Oui" au prompt UAC** (élévation administrateur — nécessaire pour modifier le fichier `hosts`).

5. L'installeur enchaîne automatiquement :
   - ✓ Vérification Docker Desktop
   - ✓ Ajout des entrées `127.0.0.1 superadmin.local tenant1.local …` dans `hosts`
   - ✓ Création de `.env` depuis `.env.docker.example` + génération `APP_KEY` aléatoire
   - ✓ Création de `frontend/.env` + génération `NEXTAUTH_SECRET` aléatoire
   - ✓ Build des images Docker (3-10 min la première fois)
   - ✓ Démarrage des containers
   - ✓ Tente la migration (échouera si DB pas configurée — voir étape 3)
   - ✓ Ouvre le navigateur sur `http://superadmin.local:8080`

6. **À mi-chemin, Notepad s'ouvre** sur `.env` pour que tu remplisses les credentials DB. Voir [section 3](#3-configuration-env-db-cloud) pour le détail.

### Méthode manuelle (si l'installeur échoue)

```bash
# Depuis C:\laragon\www\backend-api
cp .env.docker.example .env
cp frontend/.env.example frontend/.env

# Éditer .env (DB_HOST etc — voir section 3)
notepad .env

# Build + démarrage
docker compose build --parallel
docker compose up -d

# Ajouter manuellement dans C:\Windows\System32\drivers\etc\hosts (en admin) :
#   127.0.0.1  superadmin.local
#   127.0.0.1  tenant1.local
```

---

## 2. Installation Ubuntu — serveur prod

### Pré-config DNS

Avant de lancer le script, configure ton DNS chez ton registrar :

```
A    tondomaine.com         <IP_DU_VPS>
A    *.tondomaine.com       <IP_DU_VPS>
```

Vérifier la propagation :
```bash
dig +short tondomaine.com
dig +short test.tondomaine.com   # doit aussi répondre grâce au wildcard
```

### Lancer l'installeur

```bash
# Sur le VPS, en root ou via sudo
sudo bash docker/scripts/install-ubuntu.sh \
    tondomaine.com \
    /var/www/backend-api \
    git@github.com:user/backend-api.git \
    admin@tondomaine.com
```

Le script :
1. Met à jour le système (`apt update && upgrade`)
2. Installe Docker Engine + Compose plugin
3. Configure le firewall UFW (SSH + 80 + 443)
4. Clone le repo dans `/var/www/backend-api`
5. Crée `.env` depuis le template — **t'arrête pour que tu l'édites** (`nano .env`)
6. **Re-lance le script** une fois `.env` rempli
7. Génère un certificat **wildcard Let's Encrypt** via challenge DNS (manuel — il te demandera d'ajouter un TXT record temporaire)
8. Build + démarre la stack en mode prod
9. Lance les migrations
10. Met en place le cron de renouvellement SSL

À la fin, ton site est accessible sur `https://tondomaine.com` et `https://*.tondomaine.com`.

---

## 3. Configuration `.env` (DB cloud)

### Format Railway

```
mysql://root:MOTDEPASSE@switchyard.proxy.rlwy.net:42373/railway
```

devient dans `.env` :

```env
DB_CONNECTION=mysql
DB_HOST=switchyard.proxy.rlwy.net
DB_PORT=42373
DB_DATABASE=railway
DB_USERNAME=root
DB_PASSWORD=MOTDEPASSE
```

### Variables critiques à vérifier

| Variable | Valeur dev | Valeur prod |
|---|---|---|
| `APP_ENV` | `local` | `production` |
| `APP_DEBUG` | `true` | `false` |
| `APP_URL` | `http://superadmin.local:8080` | `https://tondomaine.com` |
| `APP_KEY` | généré auto | généré auto |
| `DB_HOST` | hostname cloud | hostname cloud |
| `REDIS_HOST` | `redis` (toujours) | `redis` (toujours) |
| `SUPERADMIN_DOMAIN` | `superadmin.local` | `admin.tondomaine.com` |
| `WKHTMLTOPDF_BINARY` | `/usr/bin/wkhtmltopdf` | `/usr/bin/wkhtmltopdf` |

### ⚠ Pièges connus

- **JAMAIS** de commentaires `# ...` après une valeur (`KEY=value # comment`). Docker Compose `env_file` les inclut dans la valeur. Mets-les sur leur propre ligne.
- **JAMAIS** d'espaces autour du `=` (`KEY = value` → invalide).
- Les valeurs avec espaces ou caractères spéciaux : entoure-les de guillemets (`MAIL_FROM_NAME="Mon App"`).

### Recharger après édition

```bash
docker compose up -d --force-recreate app worker scheduler
```

---

## 4. Migrations de la base centrale

Une fois `.env` rempli avec les bonnes credentials DB :

```bash
# Vérifier la connexion
docker compose exec app php artisan db:show
# Doit afficher : Database: railway (ou ta DB), Tables: 0
```

Lancer les migrations :

```bash
docker compose exec app php artisan migrate --force
```

**Sortie attendue** :
```
INFO  Preparing database.
INFO  Running migrations.

  0001_01_01_000000_create_users_table .............................. DONE
  0001_01_01_000001_create_cache_table .............................. DONE
  ...
  2026_02_15_210936_add_theme_and_media_columns_to_t_sites_table .... DONE
```

Vérifier l'état :

```bash
docker compose exec app php artisan migrate:status
```

À la fin tu dois avoir **17 migrations marquées `[1] Ran`** ou similaires, et 21 tables créées (`t_sites`, `t_users`, `t_site_modules`, etc.).

---

## 5. Seeders (création du superadmin)

```bash
docker compose exec app php artisan db:seed --class=SuperadminSeeder --force
```

**Sortie attendue** :
```
INFO  Seeding database.
Superadmin: username=superadmin  password=123  (DB centrale)
```

Le seeder est **idempotent** : tu peux le relancer pour reset le mot de passe à `123` à tout moment.

### Identifiants par défaut

```
Username : superadmin
Password : 123
Email    : superadmin@example.com
```

> ⚠ Le mot de passe `123` est volontairement faible pour le dev local. **AVANT prod**, modifie `database/seeders/SuperadminSeeder.php` (constante `DEFAULT_PASSWORD`) ou retire l'appel dans `DatabaseSeeder.php`.

### Lancer tous les seeders

```bash
docker compose exec app php artisan db:seed --force
```

---

## 6. Premier login

1. Ouvre le navigateur sur :
   - **Dev** : <http://superadmin.local:8080/fr/login>
   - **Prod** : <https://admin.tondomaine.com/fr/login>

2. Identifiants :
   - Username : `superadmin`
   - Password : `123`

3. Tu devrais arriver sur le tableau de bord superadmin avec la liste des tenants (`t_sites`, vide au premier démarrage).

### Créer le premier tenant

Depuis l'interface superadmin :
- Menu **Sites / Tenants** → **Créer**
- Renseigner `site_host`, `site_db_name`, `site_db_host`, etc. (les credentials d'une autre DB managée que tu auras créée pour ce tenant)
- Sauvegarder
- Lancer la migration tenant :
  ```bash
  docker compose exec app php artisan tenants:migrate --tenant=<id>
  ```

---

## 7. Commandes utiles au quotidien

### Stack Docker

```bash
docker compose ps                  # état des containers
docker compose logs -f             # logs en direct (tous services)
docker compose logs -f app         # logs Laravel uniquement
docker compose logs -f frontend    # logs Next.js uniquement
docker compose down                # tout arrêter
docker compose up -d               # redémarrer
docker compose restart app         # redémarrer juste Laravel
docker compose build --parallel    # rebuild images (après modif Dockerfile)
```

### Shells

```bash
docker compose exec app bash       # shell dans Laravel
docker compose exec frontend sh    # shell dans Next.js
docker compose exec redis redis-cli  # CLI Redis
```

### Laravel artisan

```bash
docker compose exec app php artisan migrate              # migrations centrale
docker compose exec app php artisan tenants:migrate      # migrations tenants
docker compose exec app php artisan db:seed              # seeders
docker compose exec app php artisan route:list           # liste des routes
docker compose exec app php artisan cache:clear          # vider cache app
docker compose exec app php artisan config:clear         # vider cache config
docker compose exec app php artisan tinker               # REPL Laravel
```

### Modules (nwidart/laravel-modules)

```bash
docker compose exec app php artisan module:list                  # lister modules
docker compose exec app php artisan module:enable <Name>         # activer un module
docker compose exec app php artisan module:make <Name>           # créer un module
docker compose exec app php artisan module:make-migration ...    # nouvelle migration
```

### Frontend (Next.js)

```bash
docker compose exec frontend pnpm install       # ré-installer deps
docker compose exec frontend pnpm lint          # lint
docker compose exec frontend pnpm build         # build prod
```

### Réinitialisation totale (panique)

```bash
docker compose down -v               # tout arrêter ET supprimer les volumes
docker compose build --no-cache      # rebuild from scratch
docker compose up -d
docker compose exec app php artisan migrate --force
docker compose exec app php artisan db:seed --force
```

---

## 8. Dépannage (FAQ)

### "Please provide a valid cache path"

**Cause** : un volume Docker masque `storage/framework/views` du host.

**Fix** :
```bash
docker compose down -v
docker compose up -d
```

### "Module not found: '@mui/utils'" (frontend)

**Cause** : `pnpm install` n'a pas hoisté les dépendances transitives MUI.

**Fix** :
```bash
docker compose down
docker volume rm backend-api_frontend-node-modules
docker compose build frontend
docker compose up -d
```

### `APP_KEY=base64:xxx=base64:yyy=` (clé concaténée)

**Cause** : race condition entre `app`/`worker`/`scheduler` qui ont tous lancé `key:generate` au démarrage.

**Fix** :
```bash
# Reset à vide
sed -i 's|^APP_KEY=.*|APP_KEY=|' .env
# Régénère une seule fois
docker compose exec app php artisan key:generate --force
```

### "require(/var/www/html/bootstrap/cache/routes-v7.php): Failed to open stream"

**Cause** : cache Laravel obsolète.

**Fix** :
```bash
rm -f bootstrap/cache/*.php
docker compose restart app
```

### "Duplicate column name 'site_db_ssl_enabled'" en migration

**Cause** : deux migrations ajoutent la même colonne. Le projet patché le 2026-01-30 utilise `Schema::hasColumn` pour idempotence.

**Fix si tu vois encore l'erreur** : `git pull` pour récupérer le patch, puis :
```bash
docker compose exec app php artisan migrate --force
```

### "Connection refused" sur la DB

**Cause** : `.env` mal configuré ou DB cloud pas joignable.

**Fix** :
```bash
# Test depuis le container
docker compose exec app php artisan db:show

# Si erreur :
# - vérifie DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD dans .env
# - vérifie depuis l'hôte que le port est ouvert :
#   nc -zv <DB_HOST> <DB_PORT>
# - whitelist l'IP du VPS dans la console du provider cloud
```

### Le frontend Next.js ne se recharge pas (hot reload)

**Cause** : Watch packs ne fonctionnent pas sur Windows/WSL sans polling.

**Fix** : déjà actif via `WATCHPACK_POLLING=true` dans `docker-compose.override.yml`. Si le problème persiste, redémarre :
```bash
docker compose restart frontend
```

### Port 80 déjà utilisé (Laragon Apache)

**Symptôme** : `bind: address already in use` au démarrage de nginx.

**Fix** : la stack écoute sur **8080** par défaut (pour cohabiter avec Laragon). Accès via `http://superadmin.local:8080`. Pour passer à 80 :
1. Stopper Apache Laragon
2. Modifier `docker-compose.override.yml` : `"80:80"` au lieu de `"8080:80"`
3. `docker compose up -d`

### Voir les logs en cas d'erreur 500 Laravel

```bash
docker compose logs -f app
# OU le fichier de log Laravel
docker compose exec app tail -f storage/logs/laravel.log
```

---

## Annexe : structure du projet

```
backend-api/
├── app/                    # Laravel core
├── Modules/                # nwidart/laravel-modules
│   ├── Site/               # gestion tenants
│   ├── Superadmin/         # interface superadmin
│   ├── User/, UsersGuard/  # users + permissions
│   └── ...
├── frontend/               # Next.js 15 (Materialize MUI)
│   ├── src/
│   ├── package.json
│   └── Dockerfile
├── docker/
│   ├── nginx/              # default.conf (dev) + default.prod.conf
│   ├── php/                # php.ini, www.conf, entrypoint.sh
│   └── scripts/
│       ├── install-windows.bat / .ps1
│       └── install-ubuntu.sh
├── database/
│   ├── migrations/         # 17 migrations centrales
│   └── seeders/
│       ├── DatabaseSeeder.php
│       └── SuperadminSeeder.php
├── docker-compose.yml          # base (dev + prod)
├── docker-compose.override.yml # dev (auto-loaded)
├── docker-compose.prod.yml     # prod (-f explicite)
├── Dockerfile                  # Laravel multi-stage
├── .env                        # ⚠ NE PAS COMMITTER
├── .env.docker.example         # template à copier
└── INSTALL.md                  # ce fichier
```
