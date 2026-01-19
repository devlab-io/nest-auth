```text
███╗   ██╗███████╗███████╗████████╗    █████╗ ██╗   ██╗████████╗██╗  ██╗
████╗  ██║██╔════╝██╔════╝╚══██╔══╝   ██╔══██╗██║   ██║╚══██╔══╝██║  ██║
██╔██╗ ██║█████╗  ███████╗   ██║      ███████║██║   ██║   ██║   ███████║
██║╚██╗██║██╔══╝  ╚════██║   ██║      ██╔══██║██║   ██║   ██║   ██╔══██║
██║ ╚████║███████╗███████║   ██║      ██║  ██║╚██████╔╝   ██║   ██║  ██║
╚═╝  ╚═══╝╚══════╝╚══════╝   ╚═╝      ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝
```

# Nest Auth Monorepo

Monorepo contenant les packages NestJS Authentication.

## A Faire

Gérer un client mobile :

- Remote Mobile App Attestation (RMAA) with Runtime Self-Protection (RASP)
- Authorization Code Flow with PKCE (Proof Key for Code Exchange)

Redesign Organisation / Establishment system:

- maybe the notion of groups is enough ?
- roles define for a wall group

Composite roles:

- roles with children and mostyly a parent with inherited permission

## Introduction

Ce monorepo fournit une solution complète d'authentification pour les applications NestJS. Il est composé de trois packages complémentaires qui travaillent ensemble pour offrir une authentification robuste, sécurisée et facile à intégrer.

### Fonctionnalités principales

- 🔐 **Authentification complète** : Inscription, connexion, déconnexion, réinitialisation de mot de passe
- 👥 **Gestion multi-comptes** : Support des utilisateurs avec plusieurs comptes dans différentes organisations/établissements
- 📱 **Multi-clients** : Support web, mobile (deeplinks) et API avec configuration distincte par client
- 🔑 **Gestion des rôles** : Système de rôles et permissions intégré
- 📧 **Validation par email** : Envoi et validation d'emails avec tokens sécurisés (liens ou codes 8 caractères)
- 🎫 **Tokens JWT** : Authentification basée sur JWT avec gestion automatique des tokens
- 📦 **Client TypeScript** : Client HTTP typé pour applications frontend (Next.js, React, etc.)
- 🛡️ **Sécurité** : Protection CSRF, validation des données, gestion sécurisée des tokens

## Structure du monorepo

Ce repository contient trois packages :

### 📦 `@devlab-io/nest-auth-types`

Bibliothèque de typage TypeScript contenant toutes les interfaces et types utilisés par les autres packages. Ce package est une dépendance commune qui garantit la cohérence des types entre le backend et le frontend.

**📖 Documentation** : Voir le [README du package](./packages/nest-auth-types/README.md)

### 📦 `@devlab-io/nest-auth`

Bibliothèque NestJS principale contenant les modules, services, contrôleurs, entités et migrations pour l'authentification. C'est le cœur du système d'authentification qui doit être intégré dans votre application NestJS backend.

**📖 Documentation** : Voir le [README du package](./packages/nest-auth/README.md)

### 📦 `@devlab-io/nest-auth-client`

Bibliothèque client pour applications frontend (Next.js, React, etc.) permettant de consommer les routes de l'API nest-auth. Inclut :

- Services HTTP typés pour toutes les routes
- Gestion automatique des tokens d'authentification (cookies, localStorage)
- État d'authentification réactif avec callbacks
- Support des comptes multiples

**📖 Documentation** : Voir le [README du package](./packages/nest-auth-client/README.md)

## Installation

### Configuration GitHub Packages

Ces packages sont distribués via GitHub Packages (registry npm privé). Vous devez configurer l'authentification avant de pouvoir les installer.

1. **Générer un GitHub Personal Access Token** :
   - Allez sur https://github.com/settings/tokens
   - Créez un nouveau token avec les permissions suivantes :
     - `read:packages` - pour télécharger les packages
     - `repo` - si le repository est privé

2. **Configurer npm/pnpm pour utiliser GitHub Packages** :

   Créez ou modifiez le fichier `.npmrc` à la racine de votre projet (ou `~/.npmrc` pour une configuration globale) :

   ```ini
   @devlab-io:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
   ```

   Ou configurez via la ligne de commande :

   ```bash
   # Pour npm
   npm config set @devlab-io:registry https://npm.pkg.github.com
   npm config set //npm.pkg.github.com/:_authToken YOUR_GITHUB_TOKEN

   # Pour pnpm
   pnpm config set @devlab-io:registry https://npm.pkg.github.com
   pnpm config set //npm.pkg.github.com/:_authToken YOUR_GITHUB_TOKEN
   ```

   Utilisation d'une variable d'environnement (recommandé pour CI/CD) :

   ```bash
   # Définir le token comme variable d'environnement
   export NPM_TOKEN=YOUR_GITHUB_TOKEN

   # Puis dans .npmrc :
   @devlab-io:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${NPM_TOKEN}
   ```

3. **Autoriser un autre repository GitHub à utiliser la bibliothèque**

   Allez dans les [paramètres du package](https://github.com/orgs/devlab-io/packages/npm/nest-auth/settings) et autorisez le repository qui utilise la bibliothèque :
   - Cliquez sur "Add Repository"
   - Choisissez le repository à ajouter
   - Cliquez sur "Add Repository"

### Installation des packages

Une fois l'authentification configurée, vous pouvez installer les packages :

```bash
# Installer tous les packages
pnpm add @devlab-io/nest-auth-types @devlab-io/nest-auth @devlab-io/nest-auth-client

# Ou individuellement
pnpm add @devlab-io/nest-auth-types
pnpm add @devlab-io/nest-auth
pnpm add @devlab-io/nest-auth-client
```

Pour voir les versions disponibles, consultez la [page des releases](https://github.com/devlab-io/nest-auth/releases) ou la [page GitHub Packages](https://github.com/orgs/devlab-io/packages/npm/package/nest-auth).

## Utilisation

Pour apprendre à utiliser chaque package, consultez la documentation détaillée :

- **[@devlab-io/nest-auth-types](./packages/nest-auth-types/README.md)** - Types et interfaces TypeScript
- **[@devlab-io/nest-auth](./packages/nest-auth/README.md)** - Module NestJS backend
- **[@devlab-io/nest-auth-client](./packages/nest-auth-client/README.md)** - Client frontend

## Développement

### Commandes utiles pour contribuer au développement du monorepo

```bash
# Installer les dépendances (tous les packages)
pnpm install

# Build tous les packages
pnpm build

# Build un package spécifique
pnpm build:types    # nest-auth-types
pnpm build:auth     # nest-auth
pnpm build:client   # nest-auth-client

# Vérification des types
pnpm type-check

# Formatage du code
pnpm format

# Lint
pnpm lint

# Nettoyer les dossiers dist
pnpm clean
```

### Structure des packages

```
packages/
├── nest-auth-types/     # Types TypeScript
├── nest-auth/           # Bibliothèque NestJS principale
└── nest-auth-client/    # Client HTTP + Gestion d'état
```

## Publishing

Le projet utilise un workflow Git Flow automatisé via GitHub Actions pour publier la bibliothèque.

### Publier une nouvelle version

1. **Via GitHub Actions** :
   - Allez dans l'onglet "Actions" de votre repository GitHub
   - Sélectionnez le workflow "Publish to GitHub Packages"
   - Cliquez sur "Run workflow"
   - Sélectionnez la branche `develop` (requis)
   - Entrez les informations suivantes :
     - **Version tag** : La version à publier (ex: `v1.0.1` ou `1.0.1`)
     - **Release description** : Description de la release (sera utilisée pour le tag et la release GitHub)
   - Cliquez sur "Run workflow"

2. **Le workflow va automatiquement** :
   - ✅ Checkout et pull de `develop`
   - ✅ Merge de `develop` dans `main`
   - ✅ Checkout et pull de `main`
   - ✅ Installation des dépendances
   - ✅ Build du package
   - ✅ Vérification du formatage (Prettier)
   - ✅ Vérification du linting (ESLint)
   - ✅ Vérification des types TypeScript
   - ✅ Exécution des tests
   - ✅ Mise à jour de la version dans `package.json`
   - ✅ Commit et push de la mise à jour de version sur `main`
   - ✅ Création et push du tag git
   - ✅ Création des archives (`.tar.gz` et `.zip`)
   - ✅ Publication sur GitHub Packages
   - ✅ Création de la release GitHub avec les archives
   - ✅ Merge de `main` dans `develop`
   - ✅ Push de `develop`

**Important** :

- Le workflow ne peut être déclenché que depuis la branche `develop`
- La branche `main` ne peut être modifiée que par ce workflow
- Si un des checks (format, lint, type-check, tests) échoue, la publication est annulée
- Les archives sont automatiquement attachées à la release GitHub

### Vérifier la publication

Après la publication, vous pouvez vérifier :

- Le package sur [GitHub Packages](https://github.com/orgs/devlab-io/packages/npm/package/nest-auth)
- La release sur [GitHub Releases](https://github.com/devlab-io/nest-auth/releases)

## License

**PROPRIETARY LICENSE**

Copyright (c) 2024 DevLab.io

All rights reserved.

This software and associated documentation files (the "Software") are the exclusive property of DevLab.io.

**RESTRICTIONS:**

1. This Software is proprietary and confidential.
2. Unauthorized copying, modification, distribution, or use of this Software, via any medium, is strictly prohibited.
3. This Software may only be used by DevLab.io and its authorized personnel.
4. Any use of this Software by unauthorized parties is strictly prohibited and may result in legal action.

**NO LICENSE GRANTED:**

No license is granted to any person or entity to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, except as explicitly authorized by DevLab.io in writing.

For licensing inquiries, please contact: devlab.io
