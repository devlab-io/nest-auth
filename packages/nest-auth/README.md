```text
███╗   ██╗███████╗███████╗████████╗    █████╗ ██╗   ██╗████████╗██╗  ██╗
████╗  ██║██╔════╝██╔════╝╚══██╔══╝   ██╔══██╗██║   ██║╚══██╔══╝██║  ██║
██╔██╗ ██║█████╗  ███████╗   ██║      ███████║██║   ██║   ██║   ███████║
██║╚██╗██║██╔══╝  ╚════██║   ██║      ██╔══██║██║   ██║   ██║   ██╔══██║
██║ ╚████║███████╗███████║   ██║      ██║  ██║╚██████╔╝   ██║   ██║  ██║
╚═╝  ╚═══╝╚══════╝╚══════╝   ╚═╝      ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝
```

# @devlab-io/nest-auth

Module d'authentification complet pour NestJS avec support multi-comptes, rôles, organisations et établissements.

## Installation

Ce package est distribué via GitHub Packages (registry npm privé). Consultez le [README principal](../../README.md) pour les instructions d'installation et de configuration.

```bash
yarn add @devlab-io/nest-auth
# ou
npm install @devlab-io/nest-auth
```

## Configuration

### Configuration de base

Importez et configurez le module dans votre `AppModule` :

```typescript
import { Module } from '@nestjs/common';
import { AuthModule } from '@devlab-io/nest-auth';
import { MailerModule } from '@devlab-io/nest-mailer';

@Module({
  imports: [
    MailerModule.forRoot({
      // Votre configuration MailerModule
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

**Note importante** : `AuthModule` nécessite que `MailerModule` soit importé dans votre application. Assurez-vous d'importer et de configurer `MailerModule` avant `AuthModule` dans votre `AppModule`.

### Variables d'environnement

Le module utilise des variables d'environnement pour la configuration. Toutes les variables sont optionnelles et ont des valeurs par défaut.

#### Configuration JWT

```env
# Secret pour signer les tokens JWT (requis en production)
AUTH_JWT_SECRET=abcdefghijklmnopqrstuvwxyz0123456789

# Durée de validité du token (format: nombre + unité: s, m, h, d)
# Exemples: 1h, 30m, 7d, 3600s
AUTH_JWT_EXPIRES_IN=1h
```

#### Configuration Admin

```env
# Email de l'administrateur créé lors de la migration
AUTH_ADMIN_EMAIL=admin@devlab.io

# Mot de passe de l'administrateur créé lors de la migration
AUTH_ADMIN_PASSWORD=ChangeMe1234*
```

#### Configuration Utilisateur

```env
# Autoriser l'inscription publique (true/false)
AUTH_USER_CAN_SIGN_UP=true

# Rôles par défaut assignés lors de l'inscription (séparés par des virgules)
AUTH_USER_DEFAULT_ROLES=user
```

#### Configuration Google OAuth

```env
# ID client Google OAuth
AUTH_GOOGLE_CLIENT_ID=

# Secret client Google OAuth
AUTH_GOOGLE_CLIENT_SECRET=

# URL de callback Google OAuth
AUTH_GOOGLE_CALLBACK_URL=
```

**Note** : Si toutes les variables Google sont renseignées, l'authentification Google sera automatiquement activée.

#### Configuration des Actions (Tokens)

Les routes d'actions définissent les URLs frontend qui seront utilisées dans les emails envoyés aux utilisateurs. Ces routes doivent correspondre à des pages frontend existantes qui acceptent un paramètre de token et appellent les endpoints correspondants du contrôleur `/auth`.

```env
# Durée de validité des tokens d'invitation (en heures)
AUTH_ACTION_INVITE=24
# Route frontend pour accepter une invitation
AUTH_ACTION_INVITE_ROUTE=auth/accept-invitation
# Organisation par défaut pour les invitations (optionnel)
AUTH_ACTION_INVITE_ORGANISATION=
# Établissement par défaut pour les invitations (optionnel)
AUTH_ACTION_INVITE_ESTABLISHMENT=

# Validation d'email
AUTH_ACTION_VALIDATE_EMAIL=24
AUTH_ACTION_VALIDATE_EMAIL_ROUTE=auth/validate-email

# Acceptation des conditions d'utilisation
AUTH_ACTION_ACCEPT_TERMS=24
AUTH_ACTION_ACCEPT_TERMS_ROUTE=auth/accept-terms

# Acceptation de la politique de confidentialité
AUTH_ACTION_ACCEPT_PRIVACY_POLICY=24
AUTH_ACTION_ACCEPT_PRIVACY_POLICY_ROUTE=auth/accept-privacy-policy

# Réinitialisation de mot de passe
AUTH_ACTION_RESET_PASSWORD=24
AUTH_ACTION_RESET_PASSWORD_ROUTE=auth/reset-password

# Changement de mot de passe
AUTH_ACTION_CHANGE_PASSWORD=24
AUTH_ACTION_CHANGE_PASSWORD_ROUTE=auth/change-password

# Changement d'email
AUTH_ACTION_CHANGE_EMAIL=24
AUTH_ACTION_CHANGE_EMAIL_ROUTE=auth/change-email
```

**Important** : Les routes configurées doivent correspondre à des pages frontend existantes. Ces pages doivent :

1. **Accepter les paramètres `token` et `email`** : Les URLs générées dans les emails incluront toujours deux paramètres :
   - `token` : Le token d'action à utiliser
   - `email` : L'adresse email de l'utilisateur (utilisé pour la validation)

   Exemple : `/auth/accept-invitation?token=xxx&email=user@example.com`

2. **Appeler l'endpoint correspondant** : Chaque page doit appeler l'endpoint POST approprié du contrôleur `/auth` avec le token et l'email reçus :

   | Route configurée             | Page frontend                                                  | Endpoint à appeler                               |
   | ---------------------------- | -------------------------------------------------------------- | ------------------------------------------------ |
   | `auth/accept-invitation`     | `/auth/accept-invitation?token=xxx&email=user@example.com`     | `POST /auth/accept-invitation`                   |
   | `auth/validate-email`        | `/auth/validate-email?token=xxx&email=user@example.com`        | `POST /auth/accept-email-validation`             |
   | `auth/accept-terms`          | `/auth/accept-terms?token=xxx&email=user@example.com`          | `POST /auth/accept-terms`                        |
   | `auth/accept-privacy-policy` | `/auth/accept-privacy-policy?token=xxx&email=user@example.com` | `POST /auth/accept-privacy-policy`               |
   | `auth/reset-password`        | `/auth/reset-password?token=xxx&email=user@example.com`        | `POST /auth/accept-reset-password`               |
   | `auth/change-password`       | `/auth/change-password?token=xxx&email=user@example.com`       | `POST /auth/accept-change-password`              |
   | `auth/change-email`          | `/auth/change-email?token=xxx&email=user@example.com`          | `POST /auth/accept-change-email` (si implémenté) |

   **Note** : Tous les endpoints d'acceptation d'actions requièrent à la fois le `token` et l'`email` dans le body de la requête pour valider que le token correspond bien à l'email fourni.

**Exemple d'implémentation frontend** (Next.js) :

```typescript
// app/auth/reset-password/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token || !email) {
      alert('Token ou email manquant');
      return;
    }

    if (password !== confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      const response = await fetch('https://api.example.com/auth/accept-reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          email, // L'email est requis pour valider que le token correspond bien à cet email
          newPassword: password,
        }),
      });

      if (response.ok) {
        alert('Mot de passe réinitialisé avec succès');
        // Rediriger vers la page de connexion
      } else {
        alert('Erreur lors de la réinitialisation');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Une erreur est survenue');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="password"
        placeholder="Nouveau mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Confirmer le mot de passe"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />
      <button type="submit">Réinitialiser le mot de passe</button>
    </form>
  );
}
```

**Note** : Les URLs complètes dans les emails seront construites en combinant l'URL frontend (définie via le guard `FrontendUrlGuard`) avec la route configurée, le token et l'email. Par exemple : `https://frontend.example.com/auth/reset-password?token=abc123...&email=user@example.com`

L'email est toujours inclus dans les paramètres d'URL pour permettre à la page frontend de valider que le token correspond bien à l'email de l'utilisateur avant d'appeler l'API.

#### Configuration des Tenants (Organisations/Établissements)

```env
# Organisations à créer lors de la migration (séparées par des virgules)
AUTH_TENANTS_ORGANISATIONS=Organisation1,Organisation2

# Établissements à créer lors de la migration (format: Organisation:Établissement, séparés par des virgules)
AUTH_TENANTS_ESTABLISHMENTS=Organisation1:Établissement1,Organisation1:Établissement2,Organisation2:Établissement1
```

### Extension des Entités et Services

Le module permet d'étendre les entités et services par défaut pour ajouter des fonctionnalités personnalisées, des relations supplémentaires ou des dépendances personnalisées.

#### Extension des Entités

Vous pouvez étendre les entités `UserEntity`, `OrganisationEntity` et `EstablishmentEntity` pour ajouter des propriétés ou des relations supplémentaires :

```typescript
import { Entity, Column, OneToMany } from 'typeorm';
import { UserEntity } from '@devlab-io/nest-auth';
import { OrderEntity } from './order.entity';

@Entity('users')
export class ExtendedUserEntity extends UserEntity {
  @Column({ nullable: true })
  phoneNumber?: string;

  @OneToMany(() => OrderEntity, (order) => order.user)
  orders: OrderEntity[];
}
```

Configurez votre entité étendue dans `AuthModule` :

```typescript
import { Module } from '@nestjs/common';
import { AuthModule } from '@devlab-io/nest-auth';
import { ExtendedUserEntity } from './entities/extended-user.entity';

@Module({
  imports: [
    AuthModule.forRoot({
      auth: {
        entities: {
          UserEntity: ExtendedUserEntity,
        },
      },
    }),
  ],
})
export class AppModule {}
```

#### Extension des Services

Le module utilise un **pattern "Override"** pour l'extension des services. Les services par défaut sont fournis via des tokens d'injection, et vous pouvez les remplacer en fournissant votre propre implémentation avec le même token.

##### Exemple 1 : Extension de UserService avec dépendance custom

**1. Créez votre service étendu :**

```typescript
// services/extended-user.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { 
  DefaultUserService, 
  UserService, 
  UserConfigToken,
  UserConfig,
  CredentialService,
  ActionService,
} from '@devlab-io/nest-auth';
import { ExtendedUserEntity } from '../entities/extended-user.entity';
import { SmsService } from './sms.service';

@Injectable()
export class ExtendedUserService
  extends DefaultUserService
  implements UserService
{
  constructor(
    @Inject(UserConfigToken) userConfig: UserConfig,
    dataSource: DataSource,
    @InjectRepository(ExtendedUserEntity)
    userRepository: Repository<ExtendedUserEntity>,
    credentialService: CredentialService,
    actionService: ActionService,
    // ✨ Ajoutez vos dépendances custom
    private readonly smsService: SmsService,
  ) {
    super(
      userConfig,
      dataSource,
      userRepository,
      credentialService,
      actionService,
    );
  }

  async create(request: CreateUserRequest): Promise<ExtendedUserEntity> {
    const user = await super.create(request);

    // ✨ Logique personnalisée
    if (user.phoneNumber) {
      await this.smsService.sendWelcomeSms(user.phoneNumber);
    }

    return user;
  }

  // Ajoutez vos méthodes personnalisées
  async findByPhoneNumber(phoneNumber: string): Promise<ExtendedUserEntity | null> {
    return this.userRepository.findOne({ where: { phoneNumber } });
  }
}
```

**2. Créez un module pour vos services custom :**

```typescript
// custom-auth.module.ts
import { Module } from '@nestjs/common';
import { ExtendedUserService } from './services/extended-user.service';
import { SmsService } from './services/sms.service';
import { UserServiceToken } from '@devlab-io/nest-auth';

@Module({
  providers: [
    SmsService,
    ExtendedUserService,
    // 🔑 Override via token
    {
      provide: UserServiceToken,
      useExisting: ExtendedUserService,
    },
  ],
  exports: [ExtendedUserService],
})
export class CustomAuthModule {}
```

**3. Importez dans votre AppModule :**

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from '@devlab-io/nest-auth';
import { CustomAuthModule } from './custom-auth.module';

@Module({
  imports: [
    AuthModule.forRoot({
      auth: {
        entities: {
          UserEntity: ExtendedUserEntity,
        },
      },
    }),
    CustomAuthModule, // Importe après AuthModule
  ],
})
export class AppModule {}
```

##### Exemple 2 : Extension de EstablishmentService (pour multi-tenant)

```typescript
// services/client.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  DefaultEstablishmentService,
  EstablishmentService,
  UserServiceToken,
  OrganisationServiceToken,
  UserService,
  OrganisationService,
} from '@devlab-io/nest-auth';
import { ClientEntity } from '../entities/client.entity';
import { BillingService } from './billing.service';

@Injectable()
export class ClientService
  extends DefaultEstablishmentService
  implements EstablishmentService
{
  constructor(
    @InjectRepository(ClientEntity)
    establishmentRepository: Repository<ClientEntity>,
    @InjectRepository(UserEntity)
    userRepository: Repository<UserEntity>,
    @Inject(UserServiceToken)
    userService: UserService,
    @Inject(OrganisationServiceToken)
    organisationService: OrganisationService,
    // ✨ Service custom pour la facturation
    private readonly billingService: BillingService,
  ) {
    super(
      establishmentRepository,
      userRepository,
      userService,
      organisationService,
    );
  }

  async create(request: CreateEstablishmentRequest): Promise<ClientEntity> {
    const client = await super.create(request);

    // ✨ Créer un compte de facturation automatiquement
    await this.billingService.createAccount(client.id);

    return client;
  }

  async suspendForNonPayment(id: string): Promise<void> {
    const client = await this.findById(id);
    if (client) {
      client.isEnabled = false;
      await this.establishmentRepository.save(client);
      // Logique métier supplémentaire
    }
  }
}
```

Configuration du module :

```typescript
// client.module.ts
import { Module } from '@nestjs/common';
import { ClientService } from './services/client.service';
import { BillingService } from './services/billing.service';
import { EstablishmentServiceToken } from '@devlab-io/nest-auth';

@Module({
  providers: [
    BillingService,
    ClientService,
    {
      provide: EstablishmentServiceToken,
      useExisting: ClientService,
    },
  ],
  exports: [ClientService],
})
export class ClientModule {}
```

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from '@devlab-io/nest-auth';
import { ClientModule } from './client/client.module';

@Module({
  imports: [
    AuthModule.forRoot({
      auth: {
        entities: {
          EstablishmentEntity: ClientEntity,
        },
      },
    }),
    ClientModule,
  ],
})
export class AppModule {}
```

#### Tokens disponibles pour l'override

Le module expose les tokens suivants pour l'override des services :

```typescript
import { 
  UserServiceToken,
  OrganisationServiceToken,
  EstablishmentServiceToken,
} from '@devlab-io/nest-auth';
```

#### Points Importants

1. **Pattern Override** : Utilisez les tokens d'injection (`UserServiceToken`, `OrganisationServiceToken`, `EstablishmentServiceToken`) pour remplacer les services par défaut.

2. **useExisting vs useClass** :
   - `useExisting` : Réutilise l'instance du service créée par NestJS (recommandé)
   - `useClass` : Crée une nouvelle instance spécifique pour le token

3. **Ordre d'import** : Importez `AuthModule` **avant** vos modules custom pour que l'override fonctionne correctement.

4. **Héritage des Services** : Vos services étendus doivent hériter de `DefaultUserService`, `DefaultOrganisationService` ou `DefaultEstablishmentService` et implémenter l'interface correspondante.

5. **Repositories** : Si vous étendez une entité, utilisez le bon type de repository dans votre service étendu (par exemple, `Repository<ExtendedUserEntity>` au lieu de `Repository<UserEntity>`).

6. **Dépendances Custom** : Toutes les dépendances custom doivent être enregistrées comme providers dans votre module. NestJS les injectera automatiquement.

7. **Services par Défaut** : Si vous n'overridez pas un service, le module utilisera l'implémentation par défaut.

## Migrations

Le module fournit une migration TypeORM pour créer toutes les tables nécessaires. Vous devez l'intégrer dans votre configuration TypeORM DataSource.

### Intégration dans DataSource

Créez un fichier `data-source.ts` à la racine de votre projet :

```typescript
import { DataSource } from 'typeorm';
import { CreateAuthSchema1700000000000 } from '@devlab-io/nest-auth/database';

export const AppDataSource = new DataSource({
  type: 'postgres', // ou votre type de base de données
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [
    // Vos entités
  ],
  migrations: [
    CreateAuthSchema1700000000000,
    // Vos autres migrations
  ],
  synchronize: false, // Toujours false en production
  logging: process.env.NODE_ENV === 'development',
});
```

### Exécution des migrations

```bash
# Générer la migration (si vous utilisez TypeORM CLI)
npm run typeorm migration:generate -- -n CreateAuthSchema

# Exécuter les migrations
npm run typeorm migration:run

# Revenir en arrière
npm run typeorm migration:revert
```

### Ce que crée la migration

La migration `CreateAuthSchema1700000000000` crée :

1. **Table `roles`** : Rôles système (admin, user, etc.)
2. **Table `users`** : Utilisateurs avec informations personnelles
3. **Table `organisations`** : Organisations (entreprises)
4. **Table `establishments`** : Établissements (restaurants, magasins, etc.)
5. **Table `credentials`** : Identifiants (mot de passe, Google OAuth)
6. **Table `user_accounts`** : Comptes utilisateur liant users/organisations/établissements
7. **Table `user_account_roles`** : Table de jonction pour les rôles des comptes
8. **Table `action_tokens`** : Tokens pour invitations, réinitialisations, etc.
9. **Table `action_token_roles`** : Table de jonction pour les rôles des tokens
10. **Table `sessions`** : Sessions JWT actives

La migration crée également :

- Un utilisateur administrateur par défaut (configurable via `AUTH_ADMIN_EMAIL` et `AUTH_ADMIN_PASSWORD`)
- L'organisation et l'établissement "Devlab" par défaut
- Les organisations et établissements configurés via `AUTH_TENANTS_ORGANISATIONS` et `AUTH_TENANTS_ESTABLISHMENTS`
- Le rôle "admin" par défaut

## Routes API

### Authentification (`/auth`)

#### `GET /auth/account`

Récupère le compte utilisateur actuellement authentifié.

- **Authentification** : Requise (JWT)
- **Réponse** : `UserAccountDto` ou `null`

#### `POST /auth/sign-up`

Inscription d'un nouvel utilisateur.

- **Body** : `SignUpRequestDto`
  ```typescript
  {
    email: string;
    password: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  }
  ```
- **Réponse** : `void`

#### `POST /auth/sign-in`

Connexion d'un utilisateur.

- **Body** : `SignInRequestDto`
  ```typescript
  {
    email: string;
    password: string;
  }
  ```
- **Réponse** : `AuthResponseDto` (contient le token JWT et le compte utilisateur)

#### `POST /auth/sign-out`

Déconnexion et invalidation de la session actuelle.

- **Authentification** : Requise (JWT)
- **Réponse** : `void`

#### `POST /auth/invite`

Envoie une invitation à un utilisateur.

- **Authentification** : Requise (JWT)
- **Body** : `InviteRequestDto`
  ```typescript
  {
    email: string;
    organisationId: string;
    establishmentId: string;
    roles?: string[];
  }
  ```
- **Réponse** : `void`

#### `POST /auth/accept-invitation`

Accepte une invitation et crée un compte.

- **Body** : `AcceptInvitationRequestDto`
  ```typescript
  {
    token: string;
    password: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  }
  ```
- **Réponse** : `AuthResponseDto`

#### `POST /auth/send-email-validation`

Envoie un token de validation d'email.

- **Authentification** : Requise (JWT)
- **Query** : `id` (ID de l'utilisateur)
- **Réponse** : `void`

#### `POST /auth/accept-email-validation`

Valide un email avec un token.

- **Body** : `ValidateEmailRequestDto`
  ```typescript
  {
    token: string;
  }
  ```
- **Réponse** : `void`

#### `POST /auth/send-change-password`

Envoie un token pour changer le mot de passe.

- **Authentification** : Requise (JWT)
- **Query** : `id` (ID de l'utilisateur)
- **Réponse** : `void`

#### `POST /auth/accept-change-password`

Change le mot de passe avec un token.

- **Body** : `ChangePasswordRequestDto`
  ```typescript
  {
    token: string;
    newPassword: string;
  }
  ```
- **Réponse** : `void`

#### `POST /auth/send-reset-password`

Envoie un token de réinitialisation de mot de passe.

- **Query** : `email` (Email de l'utilisateur)
- **Réponse** : `void`

#### `POST /auth/accept-reset-password`

Réinitialise le mot de passe avec un token.

- **Body** : `ResetPasswordRequestDto`
  ```typescript
  {
    token: string;
    newPassword: string;
  }
  ```
- **Réponse** : `void`

#### `POST /auth/add-accept-terms`

Génère un token pour accepter les conditions d'utilisation.

- **Query** : `id` (ID de l'utilisateur)
- **Réponse** : `void`

#### `POST /auth/accept-terms`

Accepte les conditions d'utilisation avec un token.

- **Body** : `AcceptTermsRequestDto`
  ```typescript
  {
    token: string;
  }
  ```
- **Réponse** : `void`

#### `POST /auth/add-accept-privacy-policy`

Génère un token pour accepter la politique de confidentialité.

- **Query** : `id` (ID de l'utilisateur)
- **Réponse** : `void`

#### `POST /auth/accept-privacy-policy`

Accepte la politique de confidentialité avec un token.

- **Body** : `AcceptPrivacyPolicyRequestDto`
  ```typescript
  {
    token: string;
  }
  ```
- **Réponse** : `void`

### Utilisateurs (`/users`)

#### `POST /users`

Crée un nouvel utilisateur.

- **Body** : `CreateUserRequestDto`
- **Réponse** : `UserDto`

#### `GET /users`

Recherche des utilisateurs avec pagination et filtres.

- **Query** : Paramètres de recherche (`UserQueryParams`) + `page` (défaut: 1) + `limit` (défaut: 10)
- **Réponse** : `UserPageDto`

#### `GET /users/by-id`

Trouve un utilisateur par ID.

- **Query** : `id` (ID de l'utilisateur)
- **Réponse** : `UserDto | null`

#### `GET /users/by-email`

Trouve un utilisateur par email.

- **Query** : `email` (Email de l'utilisateur)
- **Réponse** : `UserDto | null`

#### `GET /users/me`

Récupère le profil de l'utilisateur authentifié.

- **Authentification** : Requise (JWT)
- **Réponse** : `UserDto`

#### `POST /users/me`

Met à jour le profil de l'utilisateur authentifié.

- **Authentification** : Requise (JWT)
- **Body** : `UpdateUserRequestDto`
- **Réponse** : `UserDto`

#### `DELETE /users/me`

Supprime le compte de l'utilisateur authentifié.

- **Authentification** : Requise (JWT)
- **Réponse** : `void`

#### `GET /users/:id`

Récupère un utilisateur par ID.

- **Param** : `id` (ID de l'utilisateur)
- **Réponse** : `UserDto`

#### `GET /users/:id/exists`

Vérifie si un utilisateur existe par ID.

- **Param** : `id` (ID de l'utilisateur)
- **Réponse** : `boolean`

#### `PATCH /users/:id`

Met à jour partiellement un utilisateur.

- **Param** : `id` (ID de l'utilisateur)
- **Body** : `PatchUserRequestDto`
- **Réponse** : `UserDto`

#### `POST /users/:id`

Met à jour complètement un utilisateur.

- **Param** : `id` (ID de l'utilisateur)
- **Body** : `UpdateUserRequestDto`
- **Réponse** : `UserDto`

#### `PATCH /users/:id/enable`

Active un compte utilisateur.

- **Param** : `id` (ID de l'utilisateur)
- **Réponse** : `UserDto`

#### `PATCH /users/:id/disable`

Désactive un compte utilisateur.

- **Param** : `id` (ID de l'utilisateur)
- **Réponse** : `UserDto`

#### `DELETE /users/:id`

Supprime un utilisateur.

- **Param** : `id` (ID de l'utilisateur)
- **Réponse** : `void`

#### `GET /users/:id/sessions`

Récupère toutes les sessions d'un utilisateur.

- **Param** : `id` (ID de l'utilisateur)
- **Réponse** : `SessionDto[]`

#### `GET /users/:id/sessions/active`

Récupère toutes les sessions actives d'un utilisateur.

- **Param** : `id` (ID de l'utilisateur)
- **Réponse** : `SessionDto[]`

#### `DELETE /users/:id/sessions`

Supprime toutes les sessions d'un utilisateur.

- **Param** : `id` (ID de l'utilisateur)
- **Réponse** : `DeleteSessionsResponseDto` (contient le nombre de sessions supprimées)

### Comptes Utilisateur (`/user-accounts`)

#### `POST /user-accounts`

Crée un nouveau compte utilisateur.

- **Body** : `CreateUserAccountRequestDto`
  ```typescript
  {
    userId: string;
    organisationId: string;
    establishmentId: string;
    roles?: string[];
  }
  ```
- **Réponse** : `UserAccountDto`

#### `GET /user-accounts`

Recherche des comptes utilisateur avec pagination et filtres.

- **Query** : Paramètres de recherche (`UserAccountQueryParams`) + `page` (défaut: 1) + `limit` (défaut: 10)
- **Réponse** : `UserAccountPageDto`

#### `GET /user-accounts/by-id`

Trouve un compte utilisateur par ID.

- **Query** : `id` (ID du compte)
- **Réponse** : `UserAccountDto | null`

#### `GET /user-accounts/:id`

Récupère un compte utilisateur par ID.

- **Param** : `id` (ID du compte)
- **Réponse** : `UserAccountDto`

#### `GET /user-accounts/:id/exists`

Vérifie si un compte utilisateur existe par ID.

- **Param** : `id` (ID du compte)
- **Réponse** : `boolean`

#### `POST /user-accounts/:id`

Met à jour complètement un compte utilisateur.

- **Param** : `id` (ID du compte)
- **Body** : `UpdateUserAccountRequestDto`
- **Réponse** : `UserAccountDto`

#### `PATCH /user-accounts/:id`

Met à jour partiellement un compte utilisateur.

- **Param** : `id` (ID du compte)
- **Body** : `UpdateUserAccountRequestDto`
- **Réponse** : `UserAccountDto`

#### `PATCH /user-accounts/:id/enable`

Active un compte utilisateur.

- **Param** : `id` (ID du compte)
- **Réponse** : `UserAccountDto`

#### `PATCH /user-accounts/:id/disable`

Désactive un compte utilisateur.

- **Param** : `id` (ID du compte)
- **Réponse** : `UserAccountDto`

#### `DELETE /user-accounts/:id`

Supprime un compte utilisateur.

- **Param** : `id` (ID du compte)
- **Réponse** : `void`

### Organisations (`/organisations`)

#### `POST /organisations`

Crée une nouvelle organisation.

- **Body** : `CreateOrganisationRequestDto`
  ```typescript
  {
    name: string;
  }
  ```
- **Réponse** : `OrganisationDto`

#### `GET /organisations`

Recherche des organisations avec pagination et filtres.

- **Query** : Paramètres de recherche (`OrganisationQueryParams`) + `page` (défaut: 1) + `limit` (défaut: 10)
- **Réponse** : `OrganisationPageDto`

#### `GET /organisations/by-id`

Trouve une organisation par ID.

- **Query** : `id` (ID de l'organisation)
- **Réponse** : `OrganisationDto | null`

#### `GET /organisations/by-name`

Trouve une organisation par nom.

- **Query** : `name` (Nom de l'organisation)
- **Réponse** : `OrganisationDto | null`

#### `GET /organisations/:id`

Récupère une organisation par ID.

- **Param** : `id` (ID de l'organisation)
- **Réponse** : `OrganisationDto`

#### `GET /organisations/:id/exists`

Vérifie si une organisation existe par ID.

- **Param** : `id` (ID de l'organisation)
- **Réponse** : `boolean`

#### `POST /organisations/:id`

Met à jour complètement une organisation.

- **Param** : `id` (ID de l'organisation)
- **Body** : `UpdateOrganisationRequestDto`
- **Réponse** : `OrganisationDto`

#### `PATCH /organisations/:id`

Met à jour partiellement une organisation.

- **Param** : `id` (ID de l'organisation)
- **Body** : `UpdateOrganisationRequestDto`
- **Réponse** : `OrganisationDto`

#### `PATCH /organisations/:id/enable`

Active une organisation.

- **Param** : `id` (ID de l'organisation)
- **Réponse** : `OrganisationDto`

#### `PATCH /organisations/:id/disable`

Désactive une organisation.

- **Param** : `id` (ID de l'organisation)
- **Réponse** : `OrganisationDto`

#### `DELETE /organisations/:id`

Supprime une organisation.

- **Param** : `id` (ID de l'organisation)
- **Réponse** : `void`

### Établissements (`/establishments`)

#### `POST /establishments`

Crée un nouvel établissement.

- **Body** : `CreateEstablishmentRequestDto`
  ```typescript
  {
    name: string;
    organisationId: string;
  }
  ```
- **Réponse** : `EstablishmentDto`

#### `GET /establishments`

Recherche des établissements avec pagination et filtres.

- **Query** : Paramètres de recherche (`EstablishmentQueryParams`) + `page` (défaut: 1) + `limit` (défaut: 10)
- **Réponse** : `EstablishmentPageDto`

#### `GET /establishments/by-id`

Trouve un établissement par ID.

- **Query** : `id` (ID de l'établissement)
- **Réponse** : `EstablishmentDto | null`

#### `GET /establishments/by-name`

Trouve un établissement par nom et organisation.

- **Query** : `name` (Nom de l'établissement) + `organisationId` (ID de l'organisation)
- **Réponse** : `EstablishmentDto | null`

#### `GET /establishments/:id`

Récupère un établissement par ID.

- **Param** : `id` (ID de l'établissement)
- **Réponse** : `EstablishmentDto`

#### `GET /establishments/:id/exists`

Vérifie si un établissement existe par ID.

- **Param** : `id` (ID de l'établissement)
- **Réponse** : `boolean`

#### `POST /establishments/:id`

Met à jour complètement un établissement.

- **Param** : `id` (ID de l'établissement)
- **Body** : `UpdateEstablishmentRequestDto`
- **Réponse** : `EstablishmentDto`

#### `PATCH /establishments/:id`

Met à jour partiellement un établissement.

- **Param** : `id` (ID de l'établissement)
- **Body** : `UpdateEstablishmentRequestDto`
- **Réponse** : `EstablishmentDto`

#### `PATCH /establishments/:id/enable`

Active un établissement.

- **Param** : `id` (ID de l'établissement)
- **Réponse** : `EstablishmentDto`

#### `PATCH /establishments/:id/disable`

Désactive un établissement.

- **Param** : `id` (ID de l'établissement)
- **Réponse** : `EstablishmentDto`

#### `DELETE /establishments/:id`

Supprime un établissement.

- **Param** : `id` (ID de l'établissement)
- **Réponse** : `void`

### Rôles (`/roles`)

#### `GET /roles`

Récupère tous les rôles disponibles.

- **Réponse** : `RoleDto[]`

### Sessions (`/sessions`)

#### `GET /sessions`

Recherche des sessions avec filtres.

- **Query** : `SessionQueryParams` (userId, loginDate, expirationDate, active)
- **Réponse** : `SessionDto[]`

#### `GET /sessions/active`

Récupère toutes les sessions actives (non expirées).

- **Réponse** : `SessionDto[]`

#### `GET /sessions/:token`

Récupère une session par token.

- **Param** : `token` (Token JWT)
- **Réponse** : `SessionDto`

#### `DELETE /sessions/:token`

Supprime une session par token.

- **Param** : `token` (Token JWT)
- **Réponse** : `void`

#### `DELETE /sessions/expired`

Supprime toutes les sessions expirées.

- **Réponse** : `DeleteSessionsResponseDto` (contient le nombre de sessions supprimées)

## Développement

### Commandes utiles pour contribuer au développement de la lib

```bash
# Installer les dépendances
yarn install

# Build
yarn run build

# Vérification des types
yarn run type-check

# Formatage du code
yarn run format

# Lint
yarn run lint
```

## Publishing

Le projet utilise un workflow Git Flow automatisé via GitHub Actions pour publier la bibliothèque. Consultez le [README principal](../../README.md) pour plus de détails sur le processus de publication.

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
