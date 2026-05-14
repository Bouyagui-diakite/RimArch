# RIMArch Frontend

Interface React de la plateforme RIMArch. Single Page Application construite avec Vite et Tailwind CSS.

## Stack

- **React** 19
- **Vite** 5
- **Tailwind CSS** 4
- **React Router** 7
- **Axios** (requêtes HTTP)
- **JSZip** (téléchargement en lot)

## Installation

```bash
npm install
npm run dev       # http://localhost:3000
```

## Scripts

```bash
npm run dev       # Serveur de développement avec HMR
npm run build     # Build de production dans dist/
npm run preview   # Prévisualiser le build
npm run lint      # ESLint
npm run test      # Vitest (tests unitaires)
```

## Variables d'environnement

| Variable | Description | Exemple |
|---|---|---|
| `VITE_API_URL` | URL de l'API en production | `https://rimarch-production-8ad8.up.railway.app/` |

En développement, le proxy Vite redirige automatiquement `/api` vers `http://127.0.0.1:8000`.

## Structure

```
src/
├── api/            # Fonctions d'appel à l'API (axios)
├── components/     # Composants réutilisables
├── context/        # Providers React (Auth, Theme, Toast, Notifications)
├── hooks/          # Hooks personnalisés
├── layouts/        # AppLayout (sidebar + topbar)
├── pages/          # Pages de l'application
│   └── admin/      # Pages admin (utilisateurs, logs)
└── utils/          # Utilitaires (téléchargement de blobs)
```

## Pages

| Route | Page | Accès |
|---|---|---|
| `/login` | Connexion | Public |
| `/register` | Inscription | Public |
| `/verify-email` | Vérification email | Public |
| `/forgot-password` | Mot de passe oublié | Public |
| `/reset-password` | Réinitialisation | Public |
| `/dashboard` | Tableau de bord | Connecté + vérifié |
| `/documents` | Gestion des documents | Connecté + vérifié |
| `/documents/:id` | Détail d'un document | Connecté + vérifié |
| `/profil` | Mon profil | Connecté + vérifié |
| `/admin/utilisateurs` | Gestion des utilisateurs | Admin |
| `/admin/logs` | Journaux d'audit | Admin |

## Déploiement Railway

Le build est lancé par `npm run build` puis servi via `node server.js` (Express).
La variable `VITE_API_URL` doit être configurée dans Railway avant le build.
