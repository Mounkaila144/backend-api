# syntax=docker/dockerfile:1.7
#
# Multi-stage Dockerfile pour Laravel 12 (backend-api).
# Cibles disponibles :
#   - dev   : code monté en volume, xdebug, perms relâchées (docker-compose.override.yml)
#   - prod  : code copié dans l'image, opcache, autoloader optimisé (docker-compose.prod.yml)
#
# Build :
#   docker build --target=dev  -t backend-api:dev  .
#   docker build --target=prod -t backend-api:prod .

ARG PHP_VERSION=8.3

# ============================================================================
# Stage 1: vendor — composer dependencies (cache layer)
# ============================================================================
FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
COPY Modules/ ./Modules/
RUN composer install \
        --no-dev \
        --no-scripts \
        --no-autoloader \
        --prefer-dist \
        --no-interaction \
        --no-progress \
        --ignore-platform-reqs

# ============================================================================
# Stage 2: base — PHP-FPM avec toutes les extensions et binaires nécessaires
# ============================================================================
FROM php:${PHP_VERSION}-fpm-bookworm AS base

ENV DEBIAN_FRONTEND=noninteractive \
    COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_NO_INTERACTION=1

# Dépendances système + binaires utilisés par le projet
# - wkhtmltopdf : barryvdh/laravel-snappy (génération PDF)
# - pdftk-java  : mikehaertl/php-pdftk (manipulation PDF)
# - libzip/libpng/etc : extensions PHP
RUN apt-get update && apt-get install -y --no-install-recommends \
        bash curl git unzip ca-certificates \
        libicu-dev libzip-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev \
        libonig-dev libxml2-dev libcurl4-openssl-dev \
        wkhtmltopdf pdftk-java default-jre-headless \
        default-mysql-client \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        pdo_mysql bcmath intl mbstring gd zip exif opcache pcntl \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Configs PHP / PHP-FPM (les fichiers sont commit dans docker/php/)
COPY docker/php/php.ini      /usr/local/etc/php/conf.d/zz-app.ini
COPY docker/php/www.conf     /usr/local/etc/php-fpm.d/zz-www.conf
COPY docker/php/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# wkhtmltopdf path utilisé par .env (WKHTMLTOPDF_BINARY)
ENV WKHTMLTOPDF_BINARY=/usr/bin/wkhtmltopdf

EXPOSE 9000
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["php-fpm"]

# ============================================================================
# Stage 3: dev — code monté via volume, xdebug installé
# ============================================================================
FROM base AS dev

RUN pecl install xdebug \
    && docker-php-ext-enable xdebug

# En dev on tourne en root pour éviter les pénibilités de permissions sur
# Windows/WSL (les fichiers du projet appartiennent à l'utilisateur hôte).
# `entrypoint.sh` détecte APP_ENV=local et n'applique pas chown.

# ============================================================================
# Stage 4: prod — code baked dans l'image, opcache activé
# ============================================================================
FROM base AS prod

# Copie le code applicatif
COPY --chown=www-data:www-data . /var/www/html
COPY --chown=www-data:www-data --from=vendor /app/vendor /var/www/html/vendor

# Optimisations Laravel
RUN composer dump-autoload --no-dev --optimize --classmap-authoritative \
    && mkdir -p storage/framework/sessions storage/framework/views \
                storage/framework/cache storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R ug+rwX storage bootstrap/cache

USER www-data
