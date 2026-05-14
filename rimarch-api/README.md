# RIMArch API

Backend Laravel 11 de la plateforme RIMArch. Fournit une API REST authentifiée via Laravel Sanctum.

## Stack

- **PHP** 8.2
- **Laravel** 11
- **MySQL** (base de données)
- **Laravel Sanctum** (authentification par tokens)
- **DomPDF** (export PDF)
- **Resend** (envoi d'emails)

## Installation

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

## Variables d'environnement clés

```env
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=rimarch
DB_USERNAME=root
DB_PASSWORD=

MAIL_MAILER=resend
RESEND_KEY=your_resend_key
MAIL_FROM_ADDRESS="noreply@rimarch.app"
```

## Endpoints principaux

### Auth — `/api/auth`
| Méthode | Route | Description |
|---|---|---|
| POST | `/login` | Connexion |
| POST | `/register` | Inscription |
| POST | `/logout` | Déconnexion |
| GET | `/me` | Utilisateur connecté |
| PUT | `/profile` | Modifier profil |
| PUT | `/password` | Changer mot de passe |
| POST | `/forgot-password` | Demande de reset |
| POST | `/reset-password` | Reset du mot de passe |
| GET | `/email/verify/{id}/{hash}` | Vérification email |
| POST | `/email/resend` | Renvoyer l'email |

### Documents — `/api/documents`
| Méthode | Route | Description |
|---|---|---|
| GET | `/` | Liste paginée avec filtres |
| POST | `/` | Upload d'un document |
| GET | `/{id}` | Détail d'un document |
| PUT | `/{id}` | Modifier titre/description/catégorie |
| DELETE | `/{id}` | Supprimer |
| GET | `/{id}/download` | Télécharger (attachment) |
| GET | `/{id}/preview` | Aperçu en ligne (inline) |

### Notifications — `/api/notifications`
| Méthode | Route | Description |
|---|---|---|
| GET | `/` | Liste des notifications |
| POST | `/{id}/read` | Marquer comme lu |
| POST | `/read-all` | Tout marquer comme lu |

### Exports — `/api/export`
| Méthode | Route | Description |
|---|---|---|
| GET | `/documents` | Export CSV des documents |
| GET | `/documents/pdf` | Export PDF du catalogue |

### Admin — `/api/admin` (rôle admin requis)
| Méthode | Route | Description |
|---|---|---|
| GET | `/stats` | Statistiques tableau de bord |
| GET | `/users` | Liste des utilisateurs |
| POST | `/users` | Créer un utilisateur |
| PUT | `/users/{id}/role` | Changer le rôle |
| DELETE | `/users/{id}` | Supprimer un utilisateur |
| GET | `/roles` | Liste des rôles |
| GET | `/logs` | Journaux d'audit |
| GET | `/export/logs` | Export CSV des logs |
| GET | `/export/logs/pdf` | Export PDF des logs |

## Rôles

| Rôle | Slug |
|---|---|
| Administrateur | `admin` |
| Archiviste | `archiviste` |
| Consultant | `consultant` |
| Lecteur | `lecteur` |

## Déploiement Railway

Le déploiement est géré par `nixpacks.toml`. Au démarrage :
1. Migrations automatiques (`php artisan migrate --force`)
2. Création des dossiers de stockage
3. Serveur PHP built-in sur `$PORT`

Le Volume Railway doit être monté sur `/app/storage/app` pour la persistance des fichiers.
