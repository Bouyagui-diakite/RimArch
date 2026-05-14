#!/bin/bash
set -e

# Migrations
php artisan migrate --force

# Storage directories
mkdir -p storage/app/documents storage/app/private storage/framework/cache \
         storage/framework/sessions storage/framework/views storage/logs
chmod -R 777 storage bootstrap/cache

# Config cache
php artisan config:cache

# Run scheduler every 60 seconds in the background
while true; do
    php artisan schedule:run --no-interaction
    sleep 60
done &

# Start PHP server (foreground — keeps the container alive)
php -S 0.0.0.0:$PORT -t public/
