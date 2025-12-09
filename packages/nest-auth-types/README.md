```text
███╗   ██╗███████╗███████╗████████╗    █████╗ ██╗   ██╗████████╗██╗  ██╗    ████████╗██╗   ██╗██████╗ ███████╗███████╗
████╗  ██║██╔════╝██╔════╝╚══██╔══╝   ██╔══██╗██║   ██║╚══██╔══╝██║  ██║    ╚══██╔══╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔════╝
██╔██╗ ██║█████╗  ███████╗   ██║      ███████║██║   ██║   ██║   ███████║       ██║    ╚████╔╝ ██████╔╝█████╗  ███████╗
██║╚██╗██║██╔══╝  ╚════██║   ██║      ██╔══██║██║   ██║   ██║   ██╔══██║       ██║     ╚██╔╝  ██╔═══╝ ██╔══╝  ╚════██║
██║ ╚████║███████╗███████║   ██║      ██║  ██║╚██████╔╝   ██║   ██║  ██║       ██║      ██║   ██║     ███████╗███████║
╚═╝  ╚═══╝╚══════╝╚══════╝   ╚═╝      ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝       ╚═╝      ╚═╝   ╚═╝     ╚══════╝╚══════╝
```

# @devlab-io/nest-auth-types

Bibliothèque de typage TypeScript contenant toutes les interfaces et types utilisés par les packages `@devlab-io/nest-auth` et `@devlab-io/nest-auth-client`.

## Installation

```bash
pnpm add @devlab-io/nest-auth-types
# ou
npm install @devlab-io/nest-auth-types
```

## Utilisation

Ce package exporte tous les types TypeScript nécessaires pour travailler avec le système d'authentification :

```typescript
import {
  User,
  UserAccount,
  Organisation,
  Establishment,
  Role,
  AuthResponse,
  SignInRequest,
  SignUpRequest,
  // ... et bien d'autres
} from '@devlab-io/nest-auth-types';
```

## Types principaux

### User

Représente un utilisateur du système avec ses informations personnelles.

```typescript
interface User {
  id: string;
  username: string;
  email: string;
  emailValidated: boolean;
  firstName?: string;
  lastName?: string;
  phone?: string;
  enabled: boolean;
  profilePicture?: string;
  acceptedTerms: boolean;
  acceptedPrivacyPolicy: boolean;
  createdAt: Date;
  updatedAt: Date;
  credentials: Credential[];
  actions: Action[];
  accounts: UserAccount[];
}
```

### UserAccount

Représente un compte utilisateur dans une organisation/établissement spécifique.

```typescript
interface UserAccount {
  id: string;
  organisation: Organisation;
  establishment: Establishment;
  user: User;
  roles: Role[];
  createdAt: Date;
  updatedAt: Date;
  enabled: boolean;
}
```

### Organisation

Représente une organisation.

```typescript
interface Organisation {
  id: string;
  name: string;
  // ... autres propriétés
}
```

### Establishment

Représente un établissement au sein d'une organisation.

```typescript
interface Establishment {
  id: string;
  name: string;
  organisation: Organisation;
  // ... autres propriétés
}
```

### Role

Représente un rôle avec ses permissions.

```typescript
interface Role {
  id: string;
  name: string;
  // ... autres propriétés
}
```

## Types de requêtes

### SignInRequest

```typescript
interface SignInRequest {
  email: string;
  password: string;
}
```

### SignUpRequest

```typescript
interface SignUpRequest {
  email: string;
  password: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  // ... autres propriétés
}
```

### AuthResponse

Réponse après une authentification réussie.

```typescript
interface AuthResponse {
  jwt: {
    accessToken: string;
    expiresIn: number;
  };
  userAccount: UserAccount;
}
```

## Exports

Tous les types sont exportés depuis le point d'entrée principal :

```typescript
import * from '@devlab-io/nest-auth-types';
```

Ou importez des types spécifiques :

```typescript
import { User, UserAccount, AuthResponse } from '@devlab-io/nest-auth-types';
```

## Documentation complète

Pour une liste complète de tous les types disponibles, consultez le code source dans le dossier `src/types/`.
