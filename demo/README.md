# Demo Auth Applications

Applications de démonstration pour tester nest-auth.

## Services

| Service          | Port | URL                       |
| ---------------- | ---- | ------------------------- |
| **Frontend**     | 3000 | http://localhost:3000     |
| **Backend API**  | 4001 | http://localhost:4001     |
| **Swagger Docs** | 4001 | http://localhost:4001/api |
| **PostgreSQL**   | 5432 | -                         |
| **Adminer**      | 8080 | http://localhost:8080     |
| **Inbucket**     | 9000 | http://localhost:9000     |

## Quick Start

### 1. Démarrer les services Docker

```bash
cd demo
docker-compose up -d
```

Cela démarre :

- **PostgreSQL** - Base de données
- **Adminer** - Interface web pour gérer la BDD
- **Inbucket** - Serveur mail de test (capture tous les emails)

### 2. Installer les dépendances

Depuis la racine du monorepo :

```bash
pnpm install
```

### 3. Build les packages

```bash
pnpm build
```

### 4. Configurer le backend

```bash
cd demo/demo-auth-backend
cp env.example .env
```

### 5. Exécuter les migrations

```bash
cd apps/demo-auth-backend
pnpm migration:run
```

Cela crée toutes les tables nécessaires et le compte admin.

### 6. Démarrer les applications

```bash
# Depuis la racine
pnpm dev
```

Ou séparément :

```bash
# Terminal 1 - Backend
pnpm dev:backend

# Terminal 2 - Frontend
pnpm dev:frontend
```

## Compte Admin par défaut

À la migration, un compte admin est créé :

- **Email:** admin@devlab.io (ou `ADMIN_EMAIL` dans .env)
- **Password:** ChangeMe1234\* (ou `ADMIN_PASSWORD` dans .env)

## Accès aux services

### Adminer (Gestion BDD)

- URL: http://localhost:8080
- Système: PostgreSQL
- Serveur: postgres
- Utilisateur: `nest-auth`
- Mot de passe: `ChangeMe1234*`
- Base de données: `nest-auth-db`

### Inbucket (Emails de test)

- URL: http://localhost:9000
- Tous les emails envoyés par l'application sont capturés ici
- Utilisez cette interface pour voir les emails de validation, reset password, etc.

## Structure

```
demo/
├── demo-auth-backend/     # NestJS backend
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   └── database/
│   │       └── data-source.ts  # TypeORM datasource
│   └── package.json
├── demo-auth-frontend/    # Next.js frontend
│   ├── app/
│   │   ├── auth/
│   │   │   ├── signin/
│   │   │   └── signup/
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── organisations/
│   │   └── establishments/
│   └── package.json
├── docker-compose.yml     # Services Docker (nom: demo-auth)
└── README.md
```

## Scripts de migration

```bash
# Exécuter les migrations
pnpm migration:run

# Voir l'état des migrations
pnpm migration:show

# Annuler la dernière migration
pnpm migration:revert
```

## Fonctionnalités à tester

1. **Sign In** - Connexion avec les identifiants admin
2. **Sign Up** - Création d'un nouveau compte
3. **Dashboard** - Vue d'ensemble du compte
4. **Users** - Liste des utilisateurs
5. **Organisations** - Gestion des organisations
6. **Establishments** - Gestion des établissements

## Arrêter les services

```bash
cd demo
docker-compose down
```

Pour supprimer les données :

```bash
docker-compose down -v
```
