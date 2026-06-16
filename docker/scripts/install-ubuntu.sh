#!/usr/bin/env bash
# install-ubuntu.sh — bootstrap complet d'un VPS Ubuntu 22.04+ pour le backend.
#
# Idempotent : peut être ré-exécuté sans casser une install existante.
# A faire AVANT de lancer ce script :
#   1. VPS Ubuntu fraîchement provisionné, accessible en SSH root ou sudo.
#   2. Wildcard DNS pointé vers l'IP du VPS : *.tondomaine.com -> <IP>.
#   3. Repo Git accessible (clé SSH ou HTTPS public).
#
# Usage :
#   sudo bash install-ubuntu.sh tondomaine.com /var/www/backend-api git@github.com:user/backend-api.git

set -euo pipefail

DOMAIN="${1:-}"
INSTALL_DIR="${2:-/var/www/backend-api}"
GIT_REPO="${3:-}"
EMAIL_LE="${4:-admin@${DOMAIN}}"

if [ -z "$DOMAIN" ] || [ -z "$GIT_REPO" ]; then
    echo "Usage: sudo bash $0 <domain> [install_dir] <git_repo_url> [email_for_letsencrypt]"
    echo "Ex:   sudo bash $0 icall26.com /var/www/backend-api git@github.com:me/backend-api.git admin@icall26.com"
    exit 1
fi

if [ "$EUID" -ne 0 ]; then
    echo "Lance ce script avec sudo." ; exit 1
fi

echo "==> 1/6 : mise à jour du système"
apt-get update -y
apt-get upgrade -y

echo "==> 2/6 : installation des outils de base"
apt-get install -y \
    ca-certificates curl gnupg git ufw certbot \
    software-properties-common

echo "==> 3/6 : installation de Docker Engine + Compose plugin"
if ! command -v docker >/dev/null 2>&1; then
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
        | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
        https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
        > /etc/apt/sources.list.d/docker.list
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable --now docker
fi

echo "==> 4/6 : firewall (UFW) — autorise SSH, HTTP, HTTPS"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> 5/6 : clone du projet dans $INSTALL_DIR"
if [ ! -d "$INSTALL_DIR/.git" ]; then
    mkdir -p "$(dirname "$INSTALL_DIR")"
    git clone "$GIT_REPO" "$INSTALL_DIR"
else
    echo "    déjà cloné — git pull"
    git -C "$INSTALL_DIR" pull --ff-only
fi

cd "$INSTALL_DIR"

if [ ! -f .env ]; then
    cp .env.docker.example .env
    echo ""
    echo "    >>>> .env créé depuis .env.docker.example"
    echo "    >>>> ÉDITE-LE MAINTENANT (DB cloud, S3, Resend) puis relance ce script."
    echo "    >>>> nano $INSTALL_DIR/.env"
    exit 0
fi

# .env frontend (Next.js a son propre fichier d'env)
if [ -d frontend ] && [ ! -f frontend/.env ]; then
    if [ -f frontend/.env.example ]; then
        cp frontend/.env.example frontend/.env
    else
        : > frontend/.env
    fi
    echo "    >>>> frontend/.env créé"
fi

echo "==> 6/6 : certificat Let's Encrypt wildcard pour *.${DOMAIN}"
echo "    (utilise le challenge DNS-01 — nécessite une action manuelle pour ajouter"
echo "     un TXT record dans ta zone DNS)"
if [ ! -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
    certbot certonly --manual --preferred-challenges=dns \
        --agree-tos --email "$EMAIL_LE" \
        -d "$DOMAIN" -d "*.${DOMAIN}"
fi

# Remplace le placeholder du vhost prod
sed -i "s/tondomaine\.com/${DOMAIN}/g" docker/nginx/default.prod.conf

echo "==> Build + démarrage des containers (production)"
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Hydrate le volume app-public (nginx prod sert public/ depuis ce volume)
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm \
    -v backend-api_app-public:/shared-public \
    app sh -c "cp -r public/. /shared-public/"

# Migration de la DB centrale (1 fois)
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec -T \
    app php artisan migrate --force

# Cron quotidien pour renouveler le cert Let's Encrypt
if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
    (crontab -l 2>/dev/null ; echo "0 3 * * * certbot renew --quiet --post-hook 'docker compose -f $INSTALL_DIR/docker-compose.yml -f $INSTALL_DIR/docker-compose.prod.yml exec nginx nginx -s reload'") | crontab -
fi

echo ""
echo "============================================================"
echo "  Installation terminée."
echo "  Vérifie : https://${DOMAIN}"
echo "  Logs    : cd $INSTALL_DIR && docker compose logs -f"
echo "============================================================"
