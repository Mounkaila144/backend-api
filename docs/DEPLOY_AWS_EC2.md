# Déployer le projet Laravel sur un serveur AWS EC2

> ℹ️ **La production tourne désormais avec Docker.** Pour la méthode réellement
> utilisée (Docker Compose + images du dépôt, SSL wildcard, phpMyAdmin, pièges
> rencontrés), voir **[`DEPLOY_AWS_EC2_DOCKER.md`](./DEPLOY_AWS_EC2_DOCKER.md)**.
> Le guide ci-dessous décrit l'alternative en **installation native**
> (php/nginx/supervisor sur l'hôte), conservée pour référence.

ssh -i "C:\Users\Mounkaila\Downloads\icall26ec2.pem" ubuntu@15.188.10.76

Ce guide explique comment installer `backend-api` sur un serveur **EC2 (Ubuntu)**
en **production**, et le connecter à la base centrale **AWS RDS**.

> Différence clé avec le poste de dev Windows : **en production il n'y a PAS de
> tunnel SSH**. L'EC2 est dans le **même VPC/région que le RDS**, donc il joint
> la base **directement et en privé**. C'est plus simple et plus robuste.

---

## 0. Règle d'or : EC2 et RDS dans la même région + même VPC

Avant tout, vérifie que :
- L'**EC2** et le **RDS** sont dans la **même région** (ici `eu-west-3` / Paris).
- L'**EC2** est dans le **même VPC** que le RDS.

Si ce n'est pas le cas, l'EC2 ne pourra pas joindre le RDS (réseaux séparés). On
ne « déplace » pas une instance : il faut en **recréer** une dans la bonne région
(une nouvelle instance ne coûte rien en soi sur le Free Tier `t3.micro`).

```
  Internet ──HTTPS──▶  EC2 (Paris, VPC du RDS)  ──réseau privé──▶  RDS MySQL (privé)
                       Nginx + PHP-FPM + Laravel                   database-1 : 3306
```

---

## 1. Configurer les Security Groups

| Security Group | Règle entrante | Source | Pourquoi |
|---|---|---|---|
| **EC2** | SSH (22) | `<ton_IP>/32` | Toi, pour administrer |
| **EC2** | HTTP (80) | `0.0.0.0/0` | Trafic web (redirige vers HTTPS) |
| **EC2** | HTTPS (443) | `0.0.0.0/0` | Trafic web sécurisé |
| **RDS** | MySQL (3306) | **le SG de l'EC2** | L'EC2 doit joindre la base |

> Pour le RDS, mets comme source le **Security Group de l'EC2** (et non une IP) :
> ainsi toute instance dans ce SG est autorisée, même si son IP change.

---

## 2. Se connecter à l'EC2

```bash
ssh -i icall26ec2.pem ubuntu@<IP_PUBLIQUE_EC2>
```

(`ubuntu` pour une AMI Ubuntu ; `ec2-user` pour Amazon Linux.)

---

## 3. Installer la pile logicielle

```bash
sudo apt update && sudo apt upgrade -y

# PHP 8.3 + extensions requises par Laravel/multi-tenant
sudo apt install -y php8.3-cli php8.3-fpm php8.3-mysql php8.3-redis \
  php8.3-mbstring php8.3-xml php8.3-curl php8.3-zip php8.3-bcmath php8.3-gd \
  nginx redis-server git unzip

# Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# (optionnel) wkhtmltopdf pour la génération de PDF
sudo apt install -y wkhtmltopdf
```

Vérifie : `php -v`, `composer -V`, `redis-cli ping` (doit répondre `PONG`).

---

## 4. Récupérer le projet

```bash
cd /var/www
sudo git clone <URL_DU_DEPOT> backend-api
sudo chown -R ubuntu:www-data backend-api
cd backend-api
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate
```

---

## 5. Télécharger le certificat racine RDS

```bash
mkdir -p storage/certs
curl -o storage/certs/global-bundle.pem \
  https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
```

---

## 6. Configurer le `.env` (production, connexion DIRECTE au RDS)

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.tondomaine.com

# Connexion DIRECTE au RDS (pas de tunnel : on est dans le même VPC)
DB_CONNECTION=mysql
DB_HOST=database-1.cfcqkqei4rlq.eu-west-3.rds.amazonaws.com
DB_PORT=3306
DB_DATABASE=site_dev1
DB_USERNAME=nigerdev
DB_PASSWORD=<mot_de_passe_RDS>

# TLS RDS
MYSQL_ATTR_SSL_CA=/var/www/backend-api/storage/certs/global-bundle.pem
# En connexion directe on PEUT vérifier le hostname (VERIFY_IDENTITY).
# Laisse à true (ou retire la ligne) ; ne mets false QUE si tu passes par un tunnel.
MYSQL_ATTR_SSL_VERIFY_SERVER_CERT=true

# Redis local à l'EC2
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Cache / sessions / queue sur Redis (isolation tenant)
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
```

> Différences avec le dev Windows : `DB_HOST` = endpoint RDS réel (pas
> `127.0.0.1`), `DB_PORT=3306`, et `MYSQL_ATTR_SSL_VERIFY_SERVER_CERT=true`
> (la connexion directe permet la vérification stricte du certificat).

---

## 7. Préparer l'application

```bash
php artisan migrate --force        # schéma central (t_sites, ...)
# php artisan db:seed --force      # si tu veux les données initiales

# Permissions d'écriture pour le serveur web
sudo chown -R ubuntu:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache

# Caches de production (à refaire à chaque déploiement)
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

> ⚠️ Après `config:cache`, le `.env` n'est plus relu. Si tu changes le `.env`,
> relance `php artisan config:cache` (ou `config:clear` en debug).

---

## 8. Configurer Nginx

Crée `/etc/nginx/sites-available/backend-api` :

```nginx
server {
    listen 80;
    server_name api.tondomaine.com;
    root /var/www/backend-api/public;

    index index.php;
    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* { deny all; }
}
```

Activer et recharger :

```bash
sudo ln -s /etc/nginx/sites-available/backend-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 9. HTTPS (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.tondomaine.com
```

Certbot configure le renouvellement automatique et la redirection HTTP→HTTPS.

---

## 9 bis. (Optionnel) Installer phpMyAdmin sur le serveur

Sur l'EC2, phpMyAdmin se connecte au RDS **directement** (même VPC, pas de
tunnel). ⚠️ Un phpMyAdmin exposé sur Internet est une **cible d'attaque
majeure** — applique impérativement les protections de la section « Sécurité »
plus bas.

### a. Installer les paquets

```bash
sudo apt install -y phpmyadmin
```

> À l'invite du choix de serveur web : **ne coche ni apache2 ni lighttpd**
> (on est sous Nginx) → valide à vide. Si l'écran de config `dbconfig-common`
> apparaît, choisis **No** (la base de phpMyAdmin n'est pas nécessaire ici).

### b. Brancher phpMyAdmin au RDS (et non à un MySQL local)

phpMyAdmin n'a pas de MySQL local : on le pointe sur l'endpoint RDS. Édite
`/etc/phpmyadmin/config.inc.php` et ajoute, avant la fin du fichier :

```php
$i++;
$cfg['Servers'][$i]['auth_type'] = 'cookie';
$cfg['Servers'][$i]['verbose']   = 'AWS RDS (site_dev1)';
$cfg['Servers'][$i]['host']      = 'database-1.cfcqkqei4rlq.eu-west-3.rds.amazonaws.com';
$cfg['Servers'][$i]['port']      = 3306;
$cfg['Servers'][$i]['compress']  = false;
$cfg['Servers'][$i]['AllowNoPassword'] = false;
/* SSL: connexion directe -> on PEUT vérifier le certificat (CA Amazon). */
$cfg['Servers'][$i]['ssl']        = true;
$cfg['Servers'][$i]['ssl_ca']     = '/var/www/backend-api/storage/certs/global-bundle.pem';
$cfg['Servers'][$i]['ssl_verify'] = true;
```

### c. Servir phpMyAdmin via Nginx (sous un chemin non deviné)

Dans le bloc `server { ... }` de ton site (section 8), ajoute un emplacement
avec un **chemin secret** (évite `/phpmyadmin`, trop scanné par les bots) :

```nginx
    # Chemin volontairement non standard
    location /secret-pma {
        alias /usr/share/phpmyadmin;
        index index.php;

        location ~ ^/secret-pma/(.+\.php)$ {
            alias /usr/share/phpmyadmin/$1;
            fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            include fastcgi_params;
        }
        location ~* ^/secret-pma/(.+\.(?:css|js|png|jpg|gif|ico|woff2?))$ {
            alias /usr/share/phpmyadmin/$1;
        }
    }
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Accès : `https://api.tondomaine.com/secret-pma` (identifiants RDS `nigerdev`).

### d. Sécuriser (OBLIGATOIRE sur serveur public)

- **HTTPS only** : sers phpMyAdmin uniquement derrière le TLS (section 9).
- **Restreindre par IP** (idéal) — ajoute dans le `location /secret-pma` :
  ```nginx
        allow 74.244.12.63;   # ton IP
        deny all;
  ```
- **Double authentification HTTP** devant phpMyAdmin :
  ```bash
  sudo apt install -y apache2-utils
  sudo htpasswd -c /etc/nginx/.htpasswd_pma monlogin
  ```
  puis dans le `location /secret-pma` :
  ```nginx
        auth_basic "Acces restreint";
        auth_basic_user_file /etc/nginx/.htpasswd_pma;
  ```
- **Chemin non standard** (déjà fait : `/secret-pma`).
- Garde phpMyAdmin **à jour** (`sudo apt upgrade`).

> Alternative plus sûre : **ne pas exposer phpMyAdmin du tout** et y accéder
> depuis ton PC via le tunnel SSH (voir le guide Windows, section 14). Tu gardes
> une interface graphique sans ouvrir de porte sur Internet.

---

## 10. Worker de file d'attente (queues)

Laravel a besoin d'un worker pour les jobs (emails, PDF, etc.). On le supervise
avec `supervisor` pour qu'il redémarre tout seul :

```bash
sudo apt install -y supervisor
```

Crée `/etc/supervisor/conf.d/backend-api-worker.conf` :

```ini
[program:backend-api-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/backend-api/artisan queue:work redis --sleep=3 --tries=3
autostart=true
autorestart=true
user=ubuntu
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/backend-api/storage/logs/worker.log
stopwaitsecs=3600
```

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start backend-api-worker:*
```

---

## 11. Tâches planifiées (scheduler)

Ajoute le cron Laravel (édite avec `crontab -e`) :

```cron
* * * * * cd /var/www/backend-api && php artisan schedule:run >> /dev/null 2>&1
```

---

## 12. Vérifications finales

```bash
# La base répond ?
php artisan tinker --execute="echo DB::connection('mysql')->getDatabaseName();"  # -> site_dev1

# Migrations à jour ?
php artisan migrate:status

# Le site répond ?
curl -I https://api.tondomaine.com
```

---

## 13. Procédure de redéploiement (mises à jour)

```bash
cd /var/www/backend-api
php artisan down                 # mode maintenance
git pull
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
sudo supervisorctl restart backend-api-worker:*
php artisan up                   # fin maintenance
```

---

## 14. Notes de sécurité

- **Jamais** `APP_DEBUG=true` en production (fuite de stack traces).
- Le `.env` ne doit **jamais** être commité (vérifie `.gitignore`).
- Restreins SSH (22) à ton IP, pas à `0.0.0.0/0`.
- Le mot de passe RDS reste **uniquement** dans le `.env` du serveur.
- Pour une IP publique stable sur l'EC2, attache une **Elastic IP** (gratuite
  tant qu'elle est attachée à une instance active).
- Le certificat `global-bundle.pem` est public (CA Amazon) : pas un secret.
