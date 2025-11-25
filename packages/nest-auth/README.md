```text
███╗   ██╗███████╗███████╗████████╗    █████╗ ██╗   ██╗████████╗██╗  ██╗
████╗  ██║██╔════╝██╔════╝╚══██╔══╝   ██╔══██╗██║   ██║╚══██╔══╝██║  ██║
██╔██╗ ██║█████╗  ███████╗   ██║      ███████║██║   ██║   ██║   ███████║
██║╚██╗██║██╔══╝  ╚════██║   ██║      ██╔══██║██║   ██║   ██║   ██╔══██║
██║ ╚████║███████╗███████║   ██║      ██║  ██║╚██████╔╝   ██║   ██║  ██║
╚═╝  ╚═══╝╚══════╝╚══════╝   ╚═╝      ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝
```

# @devlab-io/nest-auth

NestJS authentication module

## Installation

This package is distributed via GitHub Packages (private npm registry).
Install it using npm or yarn.

### Authentication to Github Packages

Since this is a private package, you need to configure authentication:

1. **Generate a GitHub Personal Access Token**:
   - Go to https://github.com/settings/tokens
   - Create a new token with the following permissions:
     - `read:packages` - to download packages
     - `repo` - if the repository is private

2. **Configure npm/yarn to use GitHub Packages**:

   Create or edit `.npmrc` file in your project root (or `~/.npmrc` for global configuration):

   ```ini
   @devlab-io:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
   ```

   Or configure via command line:

   ```bash
   # For npm
   npm config set @devlab-io:registry https://npm.pkg.github.com
   npm config set //npm.pkg.github.com/:_authToken YOUR_GITHUB_TOKEN

   # For yarn
   yarn config set @devlab-io:registry https://npm.pkg.github.com
   yarn config set //npm.pkg.github.com/:_authToken YOUR_GITHUB_TOKEN
   ```

   Using environment variable (recommended for CI/CD):

   ```bash
   # Set the token as environment variable
   export NPM_TOKEN=YOUR_GITHUB_TOKEN

   # Then in .npmrc:
   @devlab-io:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${NPM_TOKEN}
   ```

### Actual installation

3. **Install the Package**:

   Using npm:

   ```bash
   npm install @devlab-io/nest-auth
   ```

   Using yarn:

   ```bash
   yarn add @devlab-io/nest-auth
   ```

   Or add directly in `package.json`:

   ```json
   {
     "dependencies": {
       "@devlab-io/nest-auth": "^1.0.0"
     }
   }
   ```

   To see available versions, check the [releases page](https://github.com/devlab-io/nest-auth/releases) or the [GitHub Packages page](https://github.com/orgs/devlab-io/packages/npm/package/nest-auth).

### Github Actions

4. **Autoriser un autre repertoire Gihub à utiliser la bibliothèque**

   Il faut aller dans les [paramètres du package](https://github.com/orgs/devlab-io/packages/npm/nest-auth/settings) et autoriser le repertoire qui utilise la bibliothèque:
   - Cliquer sur "Add Repository"
   - Choisir le repository à ajouter
   - Cliquer sur "Add Repository"

## Usage

Import and configure the module in your `AppModule`:

```typescript
import { Module } from '@nestjs/common';
import { AuthModule } from '@devlab-io/nest-auth';
import { MailerModule } from '@devlab-io/nest-mailer';

@Module({
  imports: [
    MailerModule.forRoot({
      // Your MailerModule configuration
    }),
    AuthModule.forRoot({
      auth: {
        admin: {
          email: 'administrator@devlab.io',
        },
      },
    }),
  ],
})
export class AppModule {}
```

**Note**: `AuthModule` requires `MailerModule` to be imported in your application. Make sure to import and configure `MailerModule` before `AuthModule` in your `AppModule`.

Environment variables:

- `ADMIN_EMAIL` - Auth (default: `admin@devlab.io`)

## API

### Controlers

- /auth/signin
- /auth/signup
  ...

### Services

```typescript
TODO;
```

### Types

```typescript
TODO;
```

## Development

### Commandes utiles pour contribuer au devellopement de la lib

```bash
# Install dependencies
yarn install

# Build
yarn run build

# Type check
yarn run type-check

# Format code
yarn run format

# Lint
yarn run lint
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
