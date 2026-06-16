# Installer le projet sur un nouveau PC Windows + connecter la base centrale AWS

Ce guide explique **pas à pas** comment installer `backend-api` sur une machine
Windows neuve et faire fonctionner la **base de données centrale**, qui est
hébergée sur **AWS RDS (MySQL)** et **n'est PAS accessible publiquement**.

> Pour l'installation Laravel générique (PHP, Composer, Laragon), voir aussi
> `INSTALL.md`. Ce document se concentre sur **la partie base de données AWS**,
> qui est le point délicat.

---

## 1. Comprendre l'architecture (important)

La base centrale `site_dev1` vit sur un serveur **AWS RDS privé**, dans la région
`eu-west-3` (Paris). « Privé » veut dire qu'**aucune machine sur Internet ne peut
s'y connecter directement** — pas même ton PC.

Pour y accéder depuis Windows en développement, on passe par un **tunnel SSH** à
travers un serveur **EC2 « rebond »** (jump host) qui, lui, est dans le même
réseau (VPC) que le RDS :

```
  Ton PC Windows                EC2 (Paris, dans le VPC du RDS)        RDS MySQL (privé)
 ┌───────────────┐   tunnel SSH  ┌────────────────────────┐  réseau   ┌──────────────────┐
 │ Laravel       │──────────────▶│  ubuntu@15.188.10.76    │──privé───▶│ database-1 :3306 │
 │ 127.0.0.1:3307│   port 22     │  (autorisé par le SG)   │           │   site_dev1      │
 └───────────────┘               └────────────────────────┘           └──────────────────┘
```

Laravel croit parler à une base MySQL locale sur `127.0.0.1:3307`. En réalité ce
port est « branché » par le tunnel SSH sur le RDS distant.

**Conséquence pratique :** tant que le tunnel SSH n'est pas ouvert, la base ne
répond pas. C'est normal.

---

## 2. Prérequis

| Outil | Pourquoi | Vérifier |
|---|---|---|
| PHP 8.2+ avec `pdo_mysql`, `redis` | Lancer Laravel | `php -v` / `php -m` |
| Composer | Dépendances PHP | `composer -V` |
| Laragon (ou MySQL + Redis local) | Redis local pour le cache | service Redis sur `127.0.0.1:6379` |
| OpenSSH client | Ouvrir le tunnel (`ssh`) | `ssh -V` (inclus dans Windows 10/11) |
| La clé privée EC2 `.pem` | S'authentifier sur l'EC2 | ex. `C:\Users\<toi>\Downloads\icall26ec2.pem` |
| Accès console AWS | Vérifier/ouvrir les règles réseau | — |

---

## 3. Récupérer le projet et les dépendances

```powershell
git clone <URL_DU_DEPOT> backend-api
cd backend-api
composer install
Copy-Item .env.example .env   # ou .env.docker.example selon ton cas
php artisan key:generate
```

---

## 4. Télécharger le certificat racine AWS RDS

AWS RDS impose le TLS. Il faut le certificat racine public d'Amazon (CA bundle).
Il n'est **pas secret**, on peut le télécharger librement :

```powershell
if (-not (Test-Path storage/certs)) { New-Item -ItemType Directory -Force storage/certs | Out-Null }
Invoke-WebRequest -Uri "https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem" `
  -OutFile "storage/certs/global-bundle.pem"
```

---

## 5. Configurer le `.env` pour la base centrale

Édite la section base de données du `.env` :

```dotenv
DB_CONNECTION=mysql
# On pointe sur le TUNNEL local, pas directement sur le RDS
DB_HOST=127.0.0.1
DB_PORT=3307
DB_DATABASE=site_dev1
DB_USERNAME=nigerdev
DB_PASSWORD=<mot_de_passe_RDS>

# TLS exigé par AWS RDS — certificat racine Amazon
MYSQL_ATTR_SSL_CA=C:/laragon/www/backend-api/storage/certs/global-bundle.pem
# À travers le tunnel on se connecte à 127.0.0.1 : on vérifie le CA mais PAS le
# hostname du certificat (VERIFY_CA, pas VERIFY_IDENTITY). Sinon SSL échoue.
MYSQL_ATTR_SSL_VERIFY_SERVER_CERT=false
```

> Adapte le chemin de `MYSQL_ATTR_SSL_CA` à l'emplacement réel du projet sur la
> nouvelle machine (slashes avant `/`, PDO les accepte sous Windows).

Configure aussi Redis sur le **localhost** (le template Docker met `redis`, qui
n'existe pas sur Windows) :

```dotenv
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

---

## 6. Corriger les permissions de la clé `.pem` (Windows)

SSH **refuse** une clé privée trop accessible (`UNPROTECTED PRIVATE KEY FILE`).
Sous Windows, on restreint les droits du fichier au seul utilisateur courant :

```powershell
$key = "C:\Users\<toi>\Downloads\icall26ec2.pem"
icacls $key /reset
icacls $key /inheritance:r
icacls $key /grant:r "$($env:USERNAME):(R)"
```

À faire **une seule fois** par machine.

---

## 7. Ouvrir le tunnel SSH

Ouvre un **terminal dédié** (PowerShell) et laisse-le tourner toute la session :

```powershell
ssh -i "C:\Users\<toi>\Downloads\icall26ec2.pem" `
    -o ServerAliveInterval=60 -o ServerAliveCountMax=3 `
    -N -L 3307:database-1.cfcqkqei4rlq.eu-west-3.rds.amazonaws.com:3306 `
    ubuntu@15.188.10.76
```

Explications des options :
- `-L 3307:RDS:3306` : redirige le port local **3307** vers le **3306** du RDS.
  (On évite 3306 en local car Laragon y fait déjà tourner MySQL.)
- `-N` : pas de shell, juste le tunnel.
- `ServerAliveInterval` : envoie un keepalive pour éviter que le tunnel se coupe
  après une période d'inactivité (`client_loop: send disconnect: Connection reset`).
- `ubuntu@...` : `ubuntu` car l'EC2 est une AMI Ubuntu (sur Amazon Linux ce serait
  `ec2-user`).

> ⚠️ **Le tunnel doit rester ouvert.** Si tu fermes ce terminal, redémarres le PC,
> ou perds le réseau, la base ne répond plus → rouvre le tunnel.
>
> ⚠️ **L'IP publique de l'EC2 change** à chaque arrêt/redémarrage de l'instance.
> Si la connexion SSH timeout, vérifie l'IP publique actuelle dans la console EC2.

---

## 8. Côté AWS : autoriser ta connexion (une fois)

Deux règles réseau doivent exister (à faire dans la console AWS) :

1. **Sur le Security Group de l'EC2** : autoriser **SSH (port 22)** depuis **ton
   IP publique**. Trouve ton IP avec :
   ```powershell
   (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content
   ```
   Source de la règle : `<ton_IP>/32`.

2. **Sur le Security Group du RDS** : autoriser **MySQL (3306)** depuis l'EC2 —
   soit par l'**IP privée de l'EC2** (`172.31.x.x/32`), soit par le **Security
   Group de l'EC2**. (C'est ce qui permet à l'EC2 de joindre le RDS.)

> Si ton IP publique change (box résidentielle), il faut remettre à jour la
> règle SSH (1).

---

## 9. Vider le cache de config et tester

Laravel met souvent la config en cache (`bootstrap/cache/config.php`). **Après
toute modif du `.env`**, vide-le, sinon tes changements sont ignorés :

```powershell
php artisan config:clear
```

Teste la connexion (le tunnel doit être ouvert) :

```powershell
php artisan tinker --execute="echo DB::connection('mysql')->getDatabaseName();"
```

Tu dois voir `site_dev1`.

---

## 10. Créer la base et lancer les migrations (1re install)

Si la base `site_dev1` n'existe pas encore sur le RDS :

```powershell
php artisan tinker --execute="config(['database.connections.nodb' => array_merge(config('database.connections.mysql'), ['database' => null])]); DB::connection('nodb')->statement('CREATE DATABASE IF NOT EXISTS site_dev1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'); echo 'OK';"
```

Puis migre le schéma central :

```powershell
php artisan migrate
```

Démarre l'application :

```powershell
php artisan serve
```

---

## 11. Workflow quotidien (après la 1re install)

1. Ouvrir le terminal du **tunnel SSH** (section 7) et le laisser tourner.
2. Lancer `php artisan serve` (et le frontend Next.js si besoin).
3. Coder. Si tu modifies le `.env` → `php artisan config:clear`.

---

## 12. Dépannage (erreurs rencontrées et solutions)

| Message d'erreur | Cause | Solution |
|---|---|---|
| `[2002] connection timed out` au test DB | Tunnel fermé, ou IP EC2 changée, ou règle SSH manquante | Rouvrir le tunnel ; vérifier l'IP publique EC2 ; vérifier la règle SSH 22 |
| `Connection refused` sur `127.0.0.1:3307` | Le tunnel n'est pas ouvert | Lancer la commande `ssh ... -L 3307:...` |
| `Cannot connect to MySQL using SSL` | Vérification du hostname du certificat | Mettre `MYSQL_ATTR_SSL_VERIFY_SERVER_CERT=false` + `config:clear` |
| `UNPROTECTED PRIVATE KEY FILE` / `bad permissions` | Droits de la clé `.pem` trop ouverts | Lancer les commandes `icacls` (section 6) |
| `Permission denied (publickey)` | Mauvais nom d'utilisateur SSH | `ubuntu` (AMI Ubuntu) ou `ec2-user` (Amazon Linux) |
| `RDS_UNREACHABLE` depuis l'EC2 | Le SG du RDS n'autorise pas l'EC2 | Ajouter l'IP privée / le SG de l'EC2 dans l'inbound 3306 du RDS |
| `getaddrinfo for redis failed` | `REDIS_HOST=redis` (nom Docker) | Mettre `REDIS_HOST=127.0.0.1` + `config:clear` |
| `Unknown database 'site_dev1'` | La base n'existe pas sur le RDS | La créer (section 10) |
| Le `.env` semble ignoré | Config en cache | `php artisan config:clear` |

---

## 13. Vérifier rapidement que le tunnel est vivant

```powershell
(Test-NetConnection -ComputerName 127.0.0.1 -Port 3307).TcpTestSucceeded
```

`True` = tunnel ouvert. `False` = relancer le tunnel.

---

## 14. Accéder aux bases avec phpMyAdmin (local Windows)

Le phpMyAdmin de Laragon tourne en local ; il se connecte au RDS **à travers le
tunnel SSH** (`127.0.0.1:3307`). On ajoute simplement un second « serveur » dans
sa config : ton MySQL local reste accessible, et un nouveau choix « AWS RDS »
apparaît.

### a. Éditer la config de phpMyAdmin

Fichier : `C:\laragon\etc\apps\phpmyadmin\config.inc.php`
(si Laragon ouvre l'autre version, c'est `C:\laragon\etc\apps\phpmyadmin6\config.inc.php`).

Juste **avant** le bloc `/** End of servers configuration */`, ajoute :

```php
/**
 * Second server: base CENTRALE AWS RDS (via tunnel SSH sur 127.0.0.1:3307)
 * Prérequis: le tunnel doit être OUVERT (voir section 7).
 */
$i++;
$cfg['Servers'][$i]['auth_type'] = 'cookie';
$cfg['Servers'][$i]['verbose']   = 'AWS RDS (site_dev1)';
$cfg['Servers'][$i]['host']      = '127.0.0.1';
$cfg['Servers'][$i]['port']      = 3307;
$cfg['Servers'][$i]['compress']  = false;
$cfg['Servers'][$i]['AllowNoPassword'] = false;
/* SSL: RDS impose TLS. CA racine Amazon, sans vérif du hostname (tunnel -> 127.0.0.1). */
$cfg['Servers'][$i]['ssl']        = true;
$cfg['Servers'][$i]['ssl_ca']     = 'C:/laragon/www/backend-api/storage/certs/global-bundle.pem';
$cfg['Servers'][$i]['ssl_verify'] = false;
```

### b. Se connecter

1. Ouvre le **tunnel SSH** (section 7) et laisse-le tourner.
2. Menu Laragon → **MySQL → phpMyAdmin** (ou `http://localhost/phpmyadmin`).
3. Sur la page de connexion, un menu déroulant **« Server »** apparaît → choisis
   **AWS RDS (site_dev1)**.
4. Identifiants : `nigerdev` / `<mot de passe RDS>`.

### c. Dépannage phpMyAdmin (local)

| Symptôme | Cause | Solution |
|---|---|---|
| « Connexion refusée » | Tunnel fermé | Rouvrir le tunnel (section 7) |
| Pas de menu « Server » | Laragon ouvre `phpmyadmin6` | Ajouter le même bloc dans `phpmyadmin6/config.inc.php` |
| Erreur SSL | CA introuvable | Vérifier le chemin de `global-bundle.pem` |
