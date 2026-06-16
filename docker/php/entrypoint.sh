#!/usr/bin/env bash
# Entrypoint commun dev/prod. Gère :
#   - Permissions storage/ et bootstrap/cache (en root, en prod uniquement)
#   - Génération APP_KEY si absent
#   - Caches Laravel (config/route/view) en prod
#   - Migrations central (--force) si AUTO_MIGRATE=true
#
# Toutes les étapes sont idempotentes : un container qui redémarre fait
# le minimum.
set -euo pipefail

cd /var/www/html

echo "[entrypoint] APP_ENV=${APP_ENV:-?}  CMD=$*"

# --- Permissions (prod-only) -------------------------------------------------
# En dev on est root et le code est monté depuis l'hôte : surtout ne pas chown.
if [ "${APP_ENV:-local}" != "local" ] && [ "$(id -u)" = "0" ]; then
    chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true
fi

# --- APP_KEY ----------------------------------------------------------------
# Ne génère QUE si APP_KEY est strictement vide ou exactement "base64:".
# `key:generate --force` est buggy sur bind-mount Windows : au lieu de remplacer
# la ligne, il concatène. Avec 3 containers (app/worker/scheduler) qui démarrent
# en parallèle, le .env finit avec des clés enchaînées sur des centaines de Ko.
# La règle : si la clé contient déjà du contenu (même corrompu), on n'y touche
# pas — c'est à l'installeur PowerShell ou à l'humain de fixer manuellement.
case "${APP_KEY:-}" in
    ""|"base64:")
        if [ -f .env ]; then
            echo "[entrypoint] APP_KEY absent — génération unique"
            php artisan key:generate --force --ansi || true
        fi
        ;;
    *)
        : # APP_KEY déjà défini, on ne touche à rien
        ;;
esac

# --- Caches Laravel ---------------------------------------------------------
# En dev : `optimize:clear` au lieu des *:clear individuels. Les fichiers
# bootstrap/cache/services.php et packages.php peuvent rester stales après
# modification d'une classe (signature controller, méthode service supprimée…)
# et provoquer des TypeErrors au boot, masqués par un cascade d'erreurs dans
# le LogManager. `rm -f` en plus garantit qu'aucun fichier orphelin ne reste.
if [ "${APP_ENV:-local}" != "local" ]; then
    php artisan config:cache --ansi
    php artisan route:cache  --ansi
    php artisan view:cache   --ansi
else
    rm -f bootstrap/cache/*.php 2>/dev/null || true
    php artisan optimize:clear --ansi || true
fi

# --- Migrations central (opt-in) --------------------------------------------
# AUTO_MIGRATE=true seulement si tu acceptes que CHAQUE démarrage du container
# tente une migration sur la DB centrale. Laisse à false en cluster (plusieurs
# replicas qui se battraient sur les locks).
if [ "${AUTO_MIGRATE:-false}" = "true" ]; then
    echo "[entrypoint] running migrations on central DB"
    php artisan migrate --force --ansi
fi

exec "$@"
