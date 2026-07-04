# Dockerfile — conteneurise l'API Laravel de RIMArch.
# Même logique qu'un Dockerfile Node, mais pour PHP.

# 1. Image de base : PHP 8.2 en ligne de commande (cli), car ton start.sh
#    lance le serveur avec "php -S".
FROM php:8.2-cli

# 2. Installer les librairies système + les extensions PHP dont Laravel
#    et tes dépendances ont besoin (l'équivalent des extensions de ton
#    nixpacks.toml). C'est la partie spécifique à PHP.
RUN apt-get update && apt-get install -y \
      git unzip \
      libonig-dev libzip-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql mbstring zip gd bcmath \
    && rm -rf /var/lib/apt/lists/*

# 3. Installer Composer (le "npm" de PHP). On le copie depuis son image
#    officielle : plus propre que de le télécharger à la main.
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# 4. Dossier de travail dans le conteneur.
WORKDIR /app

# 5. Copier tout le code de l'API (le .dockerignore exclut vendor, .env...).
COPY . .

# 6. Installer les dépendances PHP en version production, puis rendre
#    start.sh exécutable.
RUN composer install --no-dev --optimize-autoloader --no-interaction \
    && chmod +x start.sh

# 7. Le port d'écoute (start.sh utilise la variable $PORT).
ENV PORT=8000
EXPOSE 8000

# 8. Commande de démarrage : ton script existant (migrations + serveur).
CMD ["bash", "start.sh"]
