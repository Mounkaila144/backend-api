# Guide d'installation - iCall26 CRM

## Architecture du projet

Le projet est compose de deux parties :

| Composant | Technologie | Description |
|-----------|------------|-------------|
| **Backend API** | Laravel 11 + PHP 8.2 | API REST multi-tenant (base de donnees par tenant) |
| **Frontend** | Next.js 15 + React 18 + TypeScript | Interface d'administration avec MUI |

Le systeme utilise une architecture **multi-tenant par domaine** : chaque client (tenant) a son propre nom de domaine et sa propre base de donnees.

---

## 1. Pre-requis

Installez les logiciels suivants avant de commencer :

### Obligatoires

| Logiciel | Version minimale | Lien |
|----------|-----------------|------|
| **PHP** | 8.2+ | https://www.php.net/downloads |
| **Composer** | 2.x | https://getcomposer.org/download/ |
| **Node.js** | 18+ (LTS recommande) | https://nodejs.org/ |
| **npm** | 9+ (inclus avec Node.js) | - |
| **MySQL** | 5.7+ ou MariaDB 10.4+ | Inclus dans Laragon/XAMPP |
| **Redis** | 6+ | Inclus dans Laragon, ou https://redis.io/ |
| **Git** | 2.x | https://git-scm.com/ |

### Extensions PHP requises

```
php-mysql, php-redis (phpredis), php-xml, php-curl, php-mbstring, php-zip, php-gd, php-bcmath
```

### Environnement de developpement (choisir un)

| Option | Description |
|--------|-------------|
| **Laragon** (recommande pour Windows) | https://laragon.org/download/ - Inclut Apache, MySQL, Redis, PHP |
| **XAMPP** | https://www.apachefriends.org/ - Inclut Apache, MySQL, PHP |

> **Note** : Laragon est recommande car il inclut Redis nativement et simplifie la gestion des virtual hosts.

---

## 2. Installation du Backend (Laravel API)

### 2.1 Placement du projet

Selon votre environnement :

| Environnement | Dossier cible |
|---------------|---------------|
| **Laragon** | `C:\laragon\www\backend-api\` |
| **XAMPP** | `C:\xampp\htdocs\backend-api\` |

```bash
# Cloner ou deplacer le projet dans le bon dossier
# Exemple avec Laragon :
cd C:\laragon\www\
git clone <url-du-repo> backend-api

# Exemple avec XAMPP :
cd C:\xampp\htdocs\
git clone <url-du-repo> backend-api
```

### 2.2 Installation des dependances PHP

```bash
cd backend-api
composer install
```

### 2.3 Configuration du fichier .env

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Generer la cle d'application
php artisan key:generate
```

Ouvrez le fichier `.env` et configurez les valeurs suivantes :

```env
APP_NAME="Multi-Tenant API"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

# --- BASE DE DONNEES CENTRALE ---
# Cette base contient la table t_sites qui reference tous les tenants
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306          # 3306 par defaut (Laragon peut utiliser 3307)
DB_DATABASE=site_dev1
DB_USERNAME=root
DB_PASSWORD=          # Vide par defaut sur Laragon/XAMPP

# --- REDIS (obligatoire pour le multi-tenant) ---
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# --- SANCTUM (API tokens) ---
SANCTUM_STATEFUL_DOMAINS=localhost:3000,tenant1.local
SANCTUM_EXPIRATION=60

# --- CORS (autoriser le frontend) ---
FRONTEND_URL=http://localhost:3000

# --- TENANCY ---
TENANCY_DATABASE_CONNECTION=mysql
TENANCY_IDENTIFICATION=domain
```

> **Important** : Le port MySQL peut varier. Verifiez dans Laragon (Menu > MySQL > port) ou XAMPP.

### 2.4 Creation de la base de donnees centrale

Creez la base de donnees `site_dev1` dans votre serveur MySQL :

```bash
# Via la ligne de commande MySQL
mysql -u root -e "CREATE DATABASE IF NOT EXISTS site_dev1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Ou via phpMyAdmin (http://localhost/phpmyadmin)
# Creer une base nommee : site_dev1
```

### 2.5 Executer les migrations

```bash
php artisan migrate
```

> **Note** : Les tables des tenants utilisent un schema existant (migration Symfony 1). Ne creez pas de nouvelles migrations pour les tables existantes.

### 2.6 Verifier l'installation

```bash
# Demarrer le serveur de developpement Laravel
php artisan serve

# Tester que l'API repond
curl http://localhost:8000/health
```

Le serveur de developpement n'est necessaire que pour les tests rapides. En production, on utilise Apache via le virtual host (voir section 4).

---

## 3. Installation du Frontend (Next.js)

### 3.1 Placement du projet

Le frontend peut etre place n'importe ou sur votre machine :

```bash
# Exemple
cd C:\Users\VotreNom\Projects\
git clone <url-du-repo-frontend> icall26-front
```

### 3.2 Installation des dependances

```bash
cd icall26-front
npm install
```

### 3.3 Configuration du fichier .env.local

Creez le fichier `.env.local` a la racine du projet frontend :

```env
# -----------------------------------------------------------------------------
# App
# -----------------------------------------------------------------------------
BASEPATH=
NEXT_PUBLIC_APP_URL=http://tenant1.local

# -----------------------------------------------------------------------------
# Authentication (NextAuth.js)
# -----------------------------------------------------------------------------
NEXTAUTH_BASEPATH=/api/auth
NEXTAUTH_URL=http://tenant1.local/api/auth
NEXTAUTH_SECRET=votre-cle-secrete-aleatoire-ici

# -----------------------------------------------------------------------------
# API
# -----------------------------------------------------------------------------
API_URL=/api
NEXT_PUBLIC_API_URL=/api
```

> **Important** : `NEXT_PUBLIC_APP_URL` et `NEXTAUTH_URL` doivent correspondre au domaine du virtual host que vous allez configurer (ex: `http://tenant1.local`).

### 3.4 Demarrer le serveur de developpement

```bash
npm run dev
```

Le frontend demarre sur `http://localhost:3000`. Mais pour que le multi-tenant fonctionne, vous devez passer par le virtual host (voir section 4).

---

## 4. Configuration du Virtual Host (OBLIGATOIRE)

Le virtual host est **indispensable** pour que le multi-tenant fonctionne. Il fait le lien entre :
- Le domaine du tenant (ex: `tenant1.local`)
- Le backend Laravel (API)
- Le frontend Next.js (interface)

### 4.1 Principe de fonctionnement

```
Navigateur --> tenant1.local:81
                    |
                    v
              Apache (Virtual Host)
                    |
        +-----------+-----------+
        |                       |
   /api, /storage          Tout le reste
        |                       |
        v                       v
   Laravel API            Next.js (port 3000)
   (DocumentRoot)         (Reverse Proxy)
```

- Les requetes `/api/*` et `/storage/*` sont servies par **Laravel** (directement via Apache)
- Toutes les autres requetes sont proxifiees vers **Next.js** sur le port 3000

### 4.2 Modifier le fichier hosts

Ajoutez le domaine local dans votre fichier hosts :

**Windows** : `C:\Windows\System32\drivers\etc\hosts` (ouvrir en tant qu'administrateur)

```
127.0.0.1    tenant1.local
```

> Vous pouvez ajouter autant de domaines que vous avez de tenants :
> ```
> 127.0.0.1    tenant1.local
> 127.0.0.1    tenant2.local
> 127.0.0.1    demo.local
> ```

### 4.3 Creer le fichier de configuration Apache

#### Avec Laragon

Creez le fichier suivant :

**Chemin** : `C:\laragon\etc\apache2\sites-enabled\01-tenant1.local.conf`

```apache
<VirtualHost *:81>
    ServerName tenant1.local
    DocumentRoot "C:/laragon/www/backend-api/public"

    <Directory "C:/laragon/www/backend-api/public">
        AllowOverride All
        Require all granted
    </Directory>

    # Preserver le header Host pour le multi-tenant
    ProxyPreserveHost On
    ProxyTimeout 60

    # IMPORTANT : ne pas proxifier les routes Laravel
    ProxyPass "/api" "!"
    ProxyPass "/storage" "!"
    ProxyPassMatch "^/(index\.php)$" "!"

    # Desactiver le cache pour les assets Next.js en dev
    <LocationMatch "^/_next">
        Header set Cache-Control "no-cache, no-store, must-revalidate"
    </LocationMatch>

    # Proxifier tout le reste vers Next.js (port 3000)
    ProxyPass        "/"  "http://localhost:3000/"
    ProxyPassReverse "/"  "http://localhost:3000/"

    ErrorLog  "logs/tenant1-error.log"
    CustomLog "logs/tenant1-access.log" common
</VirtualHost>
```

#### Avec XAMPP

Modifiez le fichier `C:\xampp\apache\conf\extra\httpd-vhosts.conf` et ajoutez la meme configuration, en adaptant le `DocumentRoot` :

```apache
<VirtualHost *:80>
    ServerName tenant1.local
    DocumentRoot "C:/xampp/htdocs/backend-api/public"

    <Directory "C:/xampp/htdocs/backend-api/public">
        AllowOverride All
        Require all granted
    </Directory>

    ProxyPreserveHost On
    ProxyTimeout 60

    ProxyPass "/api" "!"
    ProxyPass "/storage" "!"
    ProxyPassMatch "^/(index\.php)$" "!"

    <LocationMatch "^/_next">
        Header set Cache-Control "no-cache, no-store, must-revalidate"
    </LocationMatch>

    ProxyPass        "/"  "http://localhost:3000/"
    ProxyPassReverse "/"  "http://localhost:3000/"

    ErrorLog  "logs/tenant1-error.log"
    CustomLog "logs/tenant1-access.log" common
</VirtualHost>
```

> **Note** : Avec XAMPP, vous devez aussi activer les modules `proxy`, `proxy_http` et `headers` dans `httpd.conf` :
> ```
> LoadModule proxy_module modules/mod_proxy.so
> LoadModule proxy_http_module modules/mod_proxy_http.so
> LoadModule headers_module modules/mod_headers.so
> ```

### 4.4 Verifier les modules Apache (Laragon)

Dans Laragon, les modules proxy sont generalement deja actives. Si ce n'est pas le cas :
- Menu Laragon > Apache > httpd.conf
- Decommenter les lignes :
  ```
  LoadModule proxy_module modules/mod_proxy.so
  LoadModule proxy_http_module modules/mod_proxy_http.so
  LoadModule headers_module modules/mod_headers.so
  ```

### 4.5 Redemarrer Apache

- **Laragon** : Clic droit sur l'icone > Restart All Services
- **XAMPP** : XAMPP Control Panel > Apache > Stop puis Start

### 4.6 Verifier le port

| Environnement | Port par defaut | URL d'acces |
|---------------|----------------|-------------|
| **Laragon** | 81 (si Apache partage avec Nginx) ou 80 | `http://tenant1.local:81` ou `http://tenant1.local` |
| **XAMPP** | 80 | `http://tenant1.local` |

> Adaptez le port dans la configuration du VirtualHost (`*:81` ou `*:80`) selon votre installation.

---

## 5. Demarrer l'application

### 5.1 Ordre de demarrage

1. **Demarrer Laragon/XAMPP** (Apache + MySQL + Redis)
2. **Demarrer le frontend** :
   ```bash
   cd icall26-front
   npm run dev
   ```
3. **Acceder a l'application** via le navigateur : `http://tenant1.local:81`

### 5.2 URLs importantes

| URL | Description |
|-----|-------------|
| `http://tenant1.local:81` | Application frontend (via virtual host) |
| `http://tenant1.local:81/api/health` | Verification que l'API fonctionne |
| `http://tenant1.local:81/fr/login` | Page de connexion admin |
| `http://tenant1.local:81/fr/loginsuperadmin` | Page de connexion superadmin |
| `http://localhost:3000` | Frontend direct (sans virtual host - le multi-tenant ne fonctionnera pas) |

### 5.3 Connexion

#### Admin (tenant)
- URL : `http://tenant1.local:81/fr/login`
- Utilisez les identifiants stockes dans la table `t_users` de la base de donnees du tenant

#### Superadmin (central)
- URL : `http://tenant1.local:81/fr/loginsuperadmin`
- Utilisez les identifiants stockes dans la table `t_users_superadmin` de la base centrale `site_dev1`

---

## 6. Configuration de la base de donnees des tenants

Chaque tenant doit avoir une entree dans la table `t_sites` de la base centrale (`site_dev1`) :

| Colonne | Description | Exemple |
|---------|-------------|---------|
| `site_host` | Domaine du tenant | `tenant1.local` |
| `site_db_name` | Nom de la base du tenant | `tenant1_db` |
| `site_db_host` | Host MySQL | `127.0.0.1` |
| `site_db_login` | Utilisateur MySQL | `root` |
| `site_db_password` | Mot de passe MySQL | (vide) |
| `site_db_port` | Port MySQL | `3306` |
| `site_available` | Actif ou non | `YES` |

> La base de donnees du tenant doit exister et contenir les tables du schema Symfony 1 (t_users, t_groups, etc.).

---

## 7. Commandes utiles

### Backend (Laravel)

```bash
# Demarrer le serveur de dev (alternative au virtual host)
php artisan serve

# Lancer la queue de traitement
php artisan queue:listen --tries=1

# Voir les logs en temps reel
php artisan pail --timeout=0

# Tout lancer en parallele
composer dev

# Vider le cache
php artisan cache:clear
php artisan config:clear

# Lister les routes
php artisan route:list

# Lancer les tests
php artisan test
```

### Frontend (Next.js)

```bash
# Demarrer en mode developpement
npm run dev

# Construire pour la production
npm run build

# Demarrer en mode production
npm run start

# Verifier le code (ESLint)
npm run lint

# Formater le code
npm run format
```

---

## 8. Depannage

### Le site affiche une page blanche ou erreur 502
- Verifiez que Next.js est bien demarre (`npm run dev`)
- Verifiez que le port correspond (3000 par defaut)

### L'API retourne 404
- Verifiez que le `DocumentRoot` pointe vers le dossier `public/` de Laravel
- Verifiez que `AllowOverride All` est bien configure

### Erreur "Tenant not found"
- Verifiez que le domaine (ex: `tenant1.local`) est bien dans la table `t_sites` (colonne `site_host`)
- Verifiez que `site_available` est a `YES`

### Erreur de connexion Redis
- Verifiez que Redis est demarre (Laragon : icone verte / XAMPP : installer Redis separement)
- Verifiez les parametres REDIS_* dans le `.env`

### Erreur "SQLSTATE Access denied"
- Verifiez `DB_USERNAME`, `DB_PASSWORD` et `DB_PORT` dans le `.env`
- Testez la connexion : `mysql -u root -p -P 3306`

### Le frontend ne charge pas les donnees
- Verifiez que vous accedez via le virtual host (`tenant1.local`) et non via `localhost:3000`
- Ouvrez les DevTools (F12) > Console et Network pour voir les erreurs

---

## 9. Structure des projets

### Backend

```
backend-api/
├── app/                    # Code principal Laravel
│   ├── Http/
│   │   ├── Controllers/    # Controleurs API
│   │   └── Middleware/      # Middleware (tenant, auth, permissions)
│   ├── Models/             # Modeles centraux (Tenant, User superadmin)
│   └── Traits/             # HasPermissions (systeme de permissions)
├── Modules/                # Modules metier (28 modules)
│   ├── CustomersContracts/ # Gestion des contrats
│   ├── CustomersMeetings/  # Gestion des rendez-vous
│   ├── User/               # Gestion des utilisateurs
│   └── ...
├── config/                 # Configuration Laravel + tenancy
├── database/               # Migrations centrales
├── routes/                 # Routes globales
└── .env                    # Configuration environnement
```

### Frontend

```
icall26-front/
├── src/
│   ├── app/                # Pages Next.js (App Router)
│   │   └── [lang]/         # Routing i18n (fr, en, ar)
│   │       ├── admin/      # Pages admin
│   │       └── superadmin/ # Pages superadmin
│   ├── modules/            # Modules metier (12 modules)
│   │   ├── CustomersContracts/
│   │   ├── CustomersMeetings/
│   │   └── ...
│   ├── shared/             # Code partage (API client, permissions, i18n)
│   └── components/         # Composants UI reutilisables
├── .env.local              # Configuration environnement
└── next.config.ts          # Configuration Next.js
```

---

## 10. Notes importantes

1. **Ne modifiez jamais les tables existantes** : ce projet est une migration depuis Symfony 1. Toutes les tables `t_*` doivent rester compatibles avec l'ancien systeme.

2. **Multi-tenant** : chaque requete API doit passer par le virtual host pour que le tenant soit correctement identifie par le header `Host`.

3. **Redis est obligatoire** : le cache et les sessions multi-tenant necessitent Redis pour l'isolation entre tenants.

4. **Permissions** : le systeme de permissions est compatible Symfony 1 (`hasCredential()`). Les permissions sont stockees dans `t_permissions` et liees aux groupes via `t_group_permission`.
