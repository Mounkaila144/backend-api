# Déploiement AWS EC2 — version Docker (production réelle)

> **C'est la méthode effectivement utilisée en production** (`icall26.ptrniger.com`).
> Le guide `DEPLOY_AWS_EC2.md` (install native php/nginx/supervisor) reste valable
> comme alternative, mais la prod tourne avec **Docker Compose** et les images du
> dépôt (`docker-compose.yml` + `docker-compose.prod.yml`).

Architecture : un seul EC2 (Ubuntu, même VPC/région que le RDS) fait tourner
toute la stack en conteneurs ; le RDS MySQL est joint **directement** (réseau
privé, pas de tunnel).

```
Internet ──443──▶ nginx (conteneur) ──┬─ /api,/sanctum,/up ─▶ app  (PHP-FPM Laravel)
                                       └─ tout le reste ─────▶ frontend (Next.js)
                  app/worker/scheduler ──réseau privé──▶ RDS MySQL (eu-west-3)
                  redis (conteneur) = cache/sessions/queue
```

Services : `app`, `frontend`, `nginx`, `redis`, `worker`, `scheduler`
(+ `phpmyadmin` optionnel). **Pas de conteneur MySQL** : la base est sur RDS.

---

## 0. Pré-requis AWS

| Élément | Valeur réelle |
|---|---|
| Région | `eu-west-3` (Paris) — **identique au RDS** |
| Instance | Ubuntu, ≥ 2 Go RAM (le build Next.js est gourmand) |
| Elastic IP | `13.38.184.4` (attachée → IP publique stable) |
| Security Group EC2 | entrant : 22 (ton IP), 80 et 443 (`0.0.0.0/0`) |
| Security Group RDS | entrant : 3306 depuis **le SG de l'EC2** |
| Domaine | `icall26.ptrniger.com` + wildcard `*.icall26.ptrniger.com` |

DNS requis (chez le registrar) :

| Type | Nom | Valeur |
|---|---|---|
| `A` | `icall26.ptrniger.com` | `13.38.184.4` |
| `A` | `*.icall26.ptrniger.com` | `13.38.184.4` |

Le wildcard couvre `superadmin.`, `dbadmin.` et tous les sous-domaines de tenants.

---

## 1. Préparer le serveur (disque + swap)

L'instance de base manquait d'espace **et** de RAM pour les builds. À faire une fois :

```bash
# --- Étendre le disque (ex. volume EBS agrandi de 8 -> 32 Go côté console AWS) ---
sudo growpart /dev/nvme0n1 1
sudo resize2fs /dev/nvme0n1p1
df -h /            # vérifier l'espace libre

# --- Swap (indispensable : le build Next.js dépasse 2 Go de RAM) ---
sudo fallocate -l 4G /swapfile2
sudo chmod 600 /swapfile2
sudo mkswap /swapfile2 && sudo swapon /swapfile2
echo '/swapfile2 none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

## 2. Installer Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu      # se reconnecter pour que le groupe prenne effet
docker --version && docker compose version
```

## 3. Récupérer le projet + certif RDS

```bash
sudo mkdir -p /var/www && sudo chown ubuntu:ubuntu /var/www
cd /var/www && git clone <URL_DEPOT> backend-api && cd backend-api

# Certificat racine RDS (référencé par MYSQL_ATTR_SSL_CA, chemin DANS le conteneur)
mkdir -p storage/certs
curl -o storage/certs/global-bundle.pem \
  https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
```

## 4. Configurer les `.env`

```bash
cp .env.docker.example .env
```

Champs à ajuster dans `.env` (prod) :

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_KEY=                     # généré au 1er boot par l'entrypoint si vide
APP_URL=https://superadmin.icall26.ptrniger.com
FRONTEND_URL=https://icall26.ptrniger.com
SANCTUM_STATEFUL_DOMAINS=icall26.ptrniger.com,*.icall26.ptrniger.com
SUPERADMIN_DOMAIN=superadmin.icall26.ptrniger.com

DB_CONNECTION=mysql
DB_HOST=database-1.cfcqkqei4rlq.eu-west-3.rds.amazonaws.com
DB_PORT=3306
DB_DATABASE=site_dev1
DB_USERNAME=nigerdev
DB_PASSWORD=<mot_de_passe_RDS>
MYSQL_ATTR_SSL_CA=/var/www/html/storage/certs/global-bundle.pem
MYSQL_ATTR_SSL_VERIFY_SERVER_CERT=true

REDIS_HOST=redis            # nom du service Docker (PAS 127.0.0.1)
SESSION_DRIVER=redis
CACHE_STORE=redis
QUEUE_CONNECTION=redis
AUTO_MIGRATE=false          # migrations manuelles (cf. §7)
```

`frontend/.env` (copier `frontend/.env.example`) : générer un secret et pointer
l'API en relatif (même origine via nginx) :

```dotenv
NEXT_PUBLIC_APP_URL=https://icall26.ptrniger.com
NEXTAUTH_URL=https://icall26.ptrniger.com/api/auth
NEXTAUTH_SECRET=<openssl rand -base64 32>
API_URL=/api
NEXT_PUBLIC_API_URL=/api
```

## 5. Adapter la conf nginx prod

`docker/nginx/default.prod.conf` est un gabarit : remplacer le domaine d'exemple
par le vrai (`server_name` + chemins de certificat) :

```bash
sed -i 's/tondomaine\.com/icall26.ptrniger.com/g' docker/nginx/default.prod.conf
```

---

## 6. Build & démarrage

```bash
cd /var/www/backend-api
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Hydrater le volume `app-public` (obligatoire au 1er démarrage)

En prod, nginx sert `public/` depuis un volume nommé qu'il faut remplir à partir
de l'image `app` (sinon `index.php` est introuvable → 404) :

```bash
docker run --rm --user root --entrypoint sh \
  -v backend-api_app-public:/dest backend-api:prod \
  -c "cp -r /var/www/html/public/. /dest/"
```

> ⚠️ **Pièges de build déjà corrigés dans le dépôt** (à connaître si tu touches
> aux Dockerfiles) :
> - **`Dockerfile` (étape `vendor`)** : `composer install --ignore-platform-reqs`.
>   L'image `composer:2` embarque PHP 8.5, or les deps exigent PHP 8.1–8.4 ;
>   le runtime réel est `php:8.3-fpm` (correct), donc on ignore la vérif de
>   plateforme uniquement à l'étape de téléchargement des paquets.
> - **`frontend/Dockerfile` (étape `builder`)** :
>   - `pnpm build:icons && pnpm exec prisma generate` avant `pnpm build`
>     (le fichier généré `generated-icons.css` est gitignoré, il faut le régénérer).
>   - `ENV NODE_OPTIONS=--max-old-space-size=4096` (sinon « JavaScript heap out of
>     memory » à la génération statique sur petite instance → d'où le swap §1).
> - **`frontend/next.config.ts`** : `eslint.ignoreDuringBuilds=true` et
>   `typescript.ignoreBuildErrors=true` — le lint/typecheck ne doit pas bloquer un
>   build de déploiement (toujours vérifiable via `pnpm lint` / `pnpm tsc`).

---

## 7. Migrations + seeders

```bash
CMP="docker compose -f docker-compose.yml -f docker-compose.prod.yml"
$CMP exec app php artisan migrate --force
$CMP exec app php artisan db:seed --class=SuperadminSeeder --force
# -> superadmin par défaut : username=superadmin / password=123  (À CHANGER)
```

Vérifier : `curl -I https://icall26.ptrniger.com/up` doit répondre `200`.

---

## 8. Certificat SSL wildcard (Let's Encrypt, DNS-01)

Le wildcard `*.icall26.ptrniger.com` impose une validation **DNS-01** (TXT).

```bash
sudo apt install -y certbot dnsutils
```

On pilote certbot avec un **hook** (versionné : `docker/certbot-dns-auth.sh`) qui
n'autorise la validation que lorsque la valeur TXT est présente sur **tous les
serveurs autoritaires** :

```bash
sudo certbot certonly --manual --preferred-challenges=dns \
  --manual-auth-hook /home/ubuntu/certbot-dns-auth.sh \
  --non-interactive --agree-tos -m <email> \
  -d icall26.ptrniger.com -d '*.icall26.ptrniger.com'
```

À chaque domaine, certbot affiche une valeur ; on l'ajoute en TXT à
`_acme-challenge.icall26.ptrniger.com`, le hook attend la propagation, puis LE
valide. Le certificat atterrit dans `/etc/letsencrypt/live/icall26.ptrniger.com/`,
exactement où le nginx prod le monte.

> ⚠️ **Piège DNS Hostinger (`dns-parking.com`)** rencontré en vrai :
> - Les deux serveurs `ns1`/`ns2` se synchronisent **lentement** (~15 min) et de
>   façon **incohérente**. LE interroge les deux → il faut que la valeur soit
>   présente sur **ns1 ET ns2** simultanément (le hook l'exige, comparaison
>   **exacte** `grep -Fx`).
> - Apex + wildcard sont validés ensemble : les **deux** valeurs TXT doivent
>   coexister au même nom (ajouter, ne pas remplacer).
> - Bien **copier-coller** la valeur sans caractère parasite.
> - **Renouvellement** : ce hook *attend* la propagation mais ne *crée* pas le
>   TXT → le renouvellement auto échouera. Avant J+90, soit refaire la manip,
>   soit (recommandé) **migrer le DNS sur Cloudflare** et utiliser
>   `certbot-dns-cloudflare` (wildcard 100 % automatique).

---

## 9. phpMyAdmin (optionnel) — sous-domaine HTTPS protégé

Service `phpmyadmin` branché sur le RDS, exposé sur `dbadmin.icall26.ptrniger.com`
derrière nginx avec **auth HTTP basic** (en plus du login MySQL).
Fichiers : `docker-compose.pma.yml`, `docker/nginx/dbadmin.conf`.

```bash
# Générer les identifiants auth HTTP (NON committé, à refaire par serveur)
USER=dbadmin; PASS=$(openssl rand -base64 12 | tr -d '/+=' | cut -c1-14)
echo "${USER}:$(openssl passwd -apr1 "$PASS")" > docker/nginx/.htpasswd
echo "auth HTTP -> $USER / $PASS"

# Démarrer (3 fichiers compose) + recharger nginx
CMP="docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.pma.yml"
$CMP up -d
$CMP exec nginx nginx -s reload
```

- Accès : `https://dbadmin.icall26.ptrniger.com` → auth HTTP, puis login MySQL
  (`nigerdev`).
- RDS n'impose pas le TLS (`require_secure_transport=0`) : connexion directe OK.
- **Limite d'import 2 Go** : réglée via `UPLOAD_LIMIT/MEMORY_LIMIT` dans
  `docker-compose.pma.yml` et `client_max_body_size 2048M` dans `dbadmin.conf`.
  Astuce gros imports : envoyer un `.sql.gz` (bien plus léger).

---

## 10. Accès Git (push depuis le serveur)

Clé SSH de déploiement sur le serveur, ajoutée au compte/dépôt GitHub :

```bash
ssh-keygen -t ed25519 -C "ec2-icall26-deploy" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub          # à coller dans GitHub (SSH key / Deploy key)
git remote set-url origin git@github.com:<owner>/backend-api.git
ssh -T git@github.com              # doit saluer le compte
```

---

## 11. CI/CD — déploiement continu (GitHub Actions + GHCR)

À chaque `push` sur `master`, le workflow `.github/workflows/deploy.yml` :
1. **construit** les images `app` et `frontend` sur les runners GitHub (pas sur
   l'EC2 qui manque de RAM) ;
2. les **publie** sur GHCR, taguées `:<sha>` **et** `:latest` ;
3. **déploie** par SSH : `docker compose pull` (override `docker-compose.deploy.yml`
   → images GHCR), `up -d`, hydratation du volume `app-public`, `migrate --force`,
   puis `docker image prune`.

### Configuration unique (à faire une fois)

**Secrets GitHub** (Settings → Secrets and variables → Actions → *New repository secret*) :

| Secret | Valeur |
|---|---|
| `EC2_HOST` | `13.38.184.4` |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | clé **privée** `~/.ssh/ci_deploy` du serveur (dédiée CI ; la publique est dans `~/.ssh/authorized_keys`) |

- **Actions → General → Workflow permissions** : « Read and write » (publication GHCR via `GITHUB_TOKEN`).
- (Recommandé) **Settings → Environments → `production`** : ajoute un *Required reviewer*
  pour exiger une approbation manuelle avant chaque déploiement.
- Le serveur doit être sur la branche `master` (`git checkout master`).

### Rollback

Le pipeline tague chaque image par SHA. Pour revenir à une version :

```bash
cd /var/www/backend-api
export IMAGE_TAG=<ancien_sha_court>
CMP="docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.deploy.yml"
echo <token> | docker login ghcr.io -u <user> --password-stdin   # si paquet privé
$CMP pull && $CMP up -d
```

### Repli : déploiement manuel (sans CI)

```bash
cd /var/www/backend-api
CMP="docker compose -f docker-compose.yml -f docker-compose.prod.yml"
git pull && $CMP build && $CMP up -d
docker run --rm --user root --entrypoint sh -v backend-api_app-public:/dest \
  backend-api:prod -c "cp -r /var/www/html/public/. /dest/"
$CMP exec app php artisan migrate --force
```

L'entrypoint régénère `config:cache`/`route:cache`/`view:cache` à chaque boot.

---

## 12. Sécurité

- `APP_DEBUG=false` en prod, **jamais** `.env`/`frontend/.env`/`.htpasswd`
  committés (cf. `.gitignore`).
- Mot de passe RDS uniquement dans le `.env` du serveur ; SG RDS limité au SG EC2.
- Superadmin par défaut `superadmin/123` → **changer immédiatement**.
- `global-bundle.pem` est public (CA Amazon), pas un secret — il est versionné
  dans le dépôt (`storage/certs/`) ; la commande `curl` du §3 ne sert qu'à le
  (re)télécharger si besoin.
