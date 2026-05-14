# RIMArch — Système de Gestion des Archives

Plateforme web complète de gestion documentaire et d'archivage pour la Mauritanie. Développée avec Laravel (API REST) et React/Vite (frontend).

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React 19, Vite 5, Tailwind CSS 4 |
| Backend | Laravel 11, PHP 8.2, Sanctum |
| Base de données | MySQL |
| Déploiement | Railway (auto-deploy via GitHub) |
| Stockage fichiers | Railway Volume (persistant) |
| Emails | Resend |
| PDF | DomPDF |

## Architecture

```
RIMArch/
├── rimarch-api/        # API Laravel (port 8000 en dev)
└── rimarch-frontend/   # App React (port 3000 en dev)
```

Le frontend proxifie `/api` vers le backend via Vite en développement. En production, `VITE_API_URL` pointe directement vers le service Railway de l'API.

## Fonctionnalités

### Authentification
- Inscription, connexion, déconnexion
- Vérification d'email obligatoire
- Mot de passe oublié / réinitialisation
- Tokens via Laravel Sanctum

### Documents
- Upload de fichiers (drag & drop sur la page, ou bouton)
- Aperçu en ligne des PDFs et images
- Téléchargement individuel ou en lot (ZIP)
- Suppression individuelle ou en lot
- Recherche plein texte + filtres avancés (type, catégorie, date, taille)
- Export CSV et PDF du catalogue

### Tableau de bord
- Statistiques admin (documents, utilisateurs, stockage, catégories)
- Graphe des uploads des 7 derniers jours
- Fil d'activité récente

### Administration
- Gestion des utilisateurs (créer, supprimer, changer de rôle)
- Journaux d'audit complets avec filtres
- Export des logs en CSV et PDF (A4 paysage)

### Notifications
- Cloche temps réel (polling 30s, pause si onglet inactif)
- Marquer lu / marquer tout lu
- Rollback UI si l'API échoue

### Rôles
| Rôle | Permissions |
|---|---|
| `admin` | Tout accès, gestion utilisateurs, logs |
| `archiviste` | Upload, modifier, supprimer des documents |
| `consultant` | Upload uniquement |
| `lecteur` | Lecture et téléchargement uniquement |

## Installation locale

### Prérequis
- PHP 8.2+, Composer
- Node.js 18+, npm
- MySQL
- XAMPP ou équivalent pour MySQL en local

### Backend

```bash
cd rimarch-api
composer install
cp .env.example .env          # puis remplir les variables
php artisan key:generate
php artisan migrate --seed
php artisan serve             # http://127.0.0.1:8000
```

Variables `.env` essentielles :
```
DB_DATABASE=rimarch
DB_USERNAME=root
DB_PASSWORD=
FRONTEND_URL=http://localhost:3000
MAIL_MAILER=resend
RESEND_KEY=your_key
```

### Frontend

```bash
cd rimarch-frontend
npm install
npm run dev                   # http://localhost:3000
```

### Compte admin par défaut
```
Email    : admin@rimarch.com
Password : Admin@2024!
```

## Déploiement (Railway)

Le projet se déploie automatiquement sur Railway à chaque push sur `main`.

- **API** : service `rimarch-api` avec `nixpacks.toml` → PHP built-in server
- **Frontend** : service `rimarch-frontend` avec build Vite + Express server
- **Volume** monté sur `/app/storage/app` pour la persistance des fichiers uploadés

Variables d'environnement Railway à configurer sur le service API :
```
APP_ENV=production
APP_KEY=...
DB_CONNECTION=mysql
DB_HOST=...
FRONTEND_URL=https://your-frontend.up.railway.app
RESEND_KEY=...
```

## Production

| Service | URL |
|---|---|
| API | https://rimarch-production-8ad8.up.railway.app |
| Frontend | Voir Railway dashboard |
