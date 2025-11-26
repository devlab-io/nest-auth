```text
███╗   ██╗███████╗███████╗████████╗    █████╗ ██╗   ██╗████████╗██╗  ██╗    ██████╗██╗     ██╗███████╗███╗   ██╗████████╗
████╗  ██║██╔════╝██╔════╝╚══██╔══╝   ██╔══██╗██║   ██║╚══██╔══╝██║  ██║   ██╔════╝██║     ██║██╔════╝████╗  ██║╚══██╔══╝
██╔██╗ ██║█████╗  ███████╗   ██║      ███████║██║   ██║   ██║   ███████║   ██║     ██║     ██║█████╗  ██╔██╗ ██║   ██║   
██║╚██╗██║██╔══╝  ╚════██║   ██║      ██╔══██║██║   ██║   ██║   ██╔══██║   ██║     ██║     ██║██╔══╝  ██║╚██╗██║   ██║   
██║ ╚████║███████╗███████║   ██║      ██║  ██║╚██████╔╝   ██║   ██║  ██║   ╚██████╗███████╗██║███████╗██║ ╚████║   ██║   
╚═╝  ╚═══╝╚══════╝╚══════╝   ╚═╝      ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝    ╚═════╝╚══════╝╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝   
```


# @devlab-io/nest-auth-client

Bibliothèque client pour applications frontend (Next.js, React, etc.) permettant de consommer les routes de l'API nest-auth.

## Installation

```bash
yarn add @devlab-io/nest-auth-client
# ou
npm install @devlab-io/nest-auth-client
```

## Fonctionnalités

- ✅ Services HTTP typés pour toutes les routes d'authentification
- ✅ Gestion automatique des tokens (cookies, localStorage)
- ✅ État d'authentification réactif avec callbacks
- ✅ Support des comptes multiples
- ✅ Validation automatique des sessions
- ✅ Synchronisation token/cookies/storage

## Initialisation

### Configuration de base

```typescript
import { AuthClient } from '@devlab-io/nest-auth-client';

// Initialiser le client (une seule fois au démarrage de l'application)
const userAccount = await AuthClient.initialize({
  baseURL: 'https://api.example.com',
  timeout: 30000,
  cookieName: 'access_token',
  // localStorage sera utilisé par défaut en browser
});
```

### Configuration avancée

```typescript
import { AuthClient } from '@devlab-io/nest-auth-client';

// Avec storage personnalisé
const customStorage = {
  getItem: (key: string) => /* votre implémentation */,
  setItem: (key: string, value: string) => /* votre implémentation */,
  removeItem: (key: string) => /* votre implémentation */,
};

await AuthClient.initialize({
  baseURL: 'https://api.example.com',
  timeout: 30000,
  cookieName: 'access_token',
  storage: customStorage, // ou null pour désactiver le storage
  headers: {
    'X-Custom-Header': 'value',
  },
});
```

## Utilisation des services

### Service d'authentification

```typescript
import { AuthClient } from '@devlab-io/nest-auth-client';

// Connexion
const response = await AuthClient.auth.signIn({
  email: 'user@example.com',
  password: 'password123',
});
// Le token est automatiquement configuré après sign-in

// Déconnexion
await AuthClient.auth.signOut();
// Le token est automatiquement supprimé

// Obtenir le compte actuel
const account = await AuthClient.auth.getAccount();

// Inscription
await AuthClient.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  firstName: 'John',
  lastName: 'Doe',
});
```

### Service utilisateur

```typescript
// Obtenir un utilisateur par ID
const user = await AuthClient.users.getById('user-id');

// Mettre à jour le profil
await AuthClient.users.patch('user-id', {
  firstName: 'Jane',
  lastName: 'Smith',
  phone: '+33123456789',
});
```

### Service de comptes utilisateur

```typescript
// Rechercher des comptes
const accounts = await AuthClient.userAccounts.search({
  userId: 'user-id',
});

// Obtenir un compte par ID
const account = await AuthClient.userAccounts.getById('account-id');
```

### Autres services

```typescript
// Organisations
const organisations = await AuthClient.organisations.search();

// Établissements
const establishments = await AuthClient.establishments.search();

// Rôles
const roles = await AuthClient.roles.search();

// Sessions
const sessions = await AuthClient.sessions.search();
```

## État d'authentification

### Accéder à l'état

```typescript
import { AuthState } from '@devlab-io/nest-auth-client';

// Obtenir le compte utilisateur actuel
const userAccount = AuthState.userAccount;

// Obtenir le token
const token = AuthState.token;

// Vérifier si l'utilisateur a un rôle
const isAdmin = AuthState.hasRole('admin');

// Vérifier si l'état est initialisé
const isInitialized = AuthState.initialized;
```

### S'abonner aux changements

```typescript
import { AuthState } from '@devlab-io/nest-auth-client';

// S'abonner aux changements de compte utilisateur
const unsubscribe = AuthState.onUserAccountChange((userAccount) => {
  if (userAccount) {
    console.log('Utilisateur connecté:', userAccount.user.email);
  } else {
    console.log('Utilisateur déconnecté');
  }
});

// Se désabonner
unsubscribe();
```

## Intégration Next.js

Pour une intégration complète dans Next.js avec React Context et composants de navigation, consultez les exemples dans le dossier `examples/nextjs/` :

- `AuthProvider.tsx` - Provider React avec initialisation
- `Navigation.tsx` - Composant de navigation avec menu profil

Voir aussi la documentation dans le README principal du monorepo pour un guide d'intégration complet.

## Exemple complet

```typescript
import { AuthClient, AuthState } from '@devlab-io/nest-auth-client';

// 1. Initialiser au démarrage de l'application
const userAccount = await AuthClient.initialize({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
});

if (userAccount) {
  console.log('Session restaurée:', userAccount.user.email);
}

// 2. S'abonner aux changements
AuthState.onUserAccountChange((account) => {
  console.log('État changé:', account ? 'connecté' : 'déconnecté');
});

// 3. Utiliser les services
try {
  const response = await AuthClient.auth.signIn({
    email: 'user@example.com',
    password: 'password123',
  });
  
  console.log('Connecté avec succès:', response.userAccount.user.email);
} catch (error) {
  console.error('Erreur de connexion:', error);
}

// 4. Accéder à l'état
const currentAccount = AuthState.userAccount;
const hasAdminRole = AuthState.hasRole('admin');
```

## API Reference

### AuthClient

Classe statique principale pour accéder aux services.

- `AuthClient.initialize(config)` - Initialiser le client
- `AuthClient.auth` - Service d'authentification
- `AuthClient.users` - Service utilisateur
- `AuthClient.userAccounts` - Service de comptes utilisateur
- `AuthClient.organisations` - Service organisations
- `AuthClient.establishments` - Service établissements
- `AuthClient.roles` - Service rôles
- `AuthClient.sessions` - Service sessions

### AuthState

Classe statique pour gérer l'état d'authentification.

- `AuthState.userAccount` - Compte utilisateur actuel
- `AuthState.token` - Token d'authentification
- `AuthState.initialized` - État d'initialisation
- `AuthState.hasRole(roleName)` - Vérifier un rôle
- `AuthState.onUserAccountChange(callback)` - S'abonner aux changements
- `AuthState.setToken(token)` - Définir le token (interne)
- `AuthState.setUserAccount(account)` - Définir le compte (interne)
- `AuthState.clear()` - Effacer l'état

## Types

Tous les types sont importés depuis `@devlab-io/nest-auth-types` :

```typescript
import { UserAccount, User, AuthResponse } from '@devlab-io/nest-auth-types';
```

