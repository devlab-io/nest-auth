# Guide d'Extension avec Services Génériques dans nest-auth

Ce document explique comment étendre les entités et types de `nest-auth` en utilisant une approche basée sur des **services génériques**. Cette approche permet aux services de `nest-auth` d'accepter des entités étendues sans nécessiter d'héritage de services.

## Table des matières

1. [Principe de l'approche générique](#1-principe-de-lapproche-générique)
2. [Migration : Ajouter des colonnes aux tables](#2-migration-ajouter-des-colonnes-aux-tables)
3. [Extension des interfaces TypeScript](#3-extension-des-interfaces-typescript)
4. [Extension des entités TypeORM](#4-extension-des-entités-typeorm)
5. [Modifications nécessaires dans nest-auth](#5-modifications-nécessaires-dans-nest-auth)
6. [Configuration du module avec génériques](#6-configuration-du-module-avec-génériques)
7. [Utilisation dans l'application](#7-utilisation-dans-lapplication)
8. [Exemple complet](#8-exemple-complet)

---

## 1. Principe de l'approche générique

### Concept

Au lieu d'avoir des services qui utilisent directement `UserEntity`, les services sont **génériques** et acceptent n'importe quelle entité qui étend `UserEntity`. Cela permet :

- ✅ Utiliser directement les services de `nest-auth` avec vos entités étendues
- ✅ Pas besoin d'hériter des services
- ✅ Type-safe avec TypeScript
- ✅ Flexibilité maximale

### Structure

```typescript
// Dans nest-auth (modifié pour accepter des génériques)
export class UserService<T extends UserEntity = UserEntity> {
  constructor(
    private readonly userRepository: Repository<T>,
    // ...
  ) {}
  
  async create(request: CreateUserRequest): Promise<T> {
    // ...
  }
}

// Dans l'application
const userService = new UserService<ExtendedUserEntity>(
  extendedUserRepository,
  // ...
);
```

---

## 2. Migration : Ajouter des colonnes aux tables

### Exemple : Migration pour étendre la table `users`

```typescript
// src/database/migrations/1700000001000-AddCustomUserFields.ts
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCustomUserFields1700000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ajouter une colonne pour la langue préférée
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'preferred_language',
        type: 'varchar',
        length: '10',
        isNullable: true,
        default: "'fr'",
      }),
    );

    // Ajouter une colonne pour le fuseau horaire
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'timezone',
        type: 'varchar',
        length: '50',
        isNullable: true,
        default: "'Europe/Paris'",
      }),
    );

    // Ajouter une colonne pour un champ personnalisé
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'custom_field',
        type: 'text',
        isNullable: true,
      }),
    );

    // Ajouter un index si nécessaire
    await queryRunner.createIndex('users', {
      name: 'idx_users_preferred_language',
      columnNames: ['preferred_language'],
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer l'index
    await queryRunner.dropIndex('users', 'idx_users_preferred_language');

    // Supprimer les colonnes
    await queryRunner.dropColumn('users', 'custom_field');
    await queryRunner.dropColumn('users', 'timezone');
    await queryRunner.dropColumn('users', 'preferred_language');
  }
}
```

### Configuration du DataSource

```typescript
// src/database/datasource.ts
import { DataSource } from 'typeorm';
import {
  // Entités de base de nest-auth (gardées pour référence)
  UserEntity as BaseUserEntity,
  ActionEntity,
  CredentialEntity,
  EstablishmentEntity,
  OrganisationEntity,
  RoleEntity,
  SessionEntity,
  UserAccountEntity,
  // Migration de base de nest-auth
  CreateAuthSchema1700000000000,
} from '@devlab-io/nest-auth';
import {
  // Votre entité étendue
  ExtendedUserEntity,
  // Votre migration d'extension
  AddCustomUserFields1700000001000,
} from './database';

const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseConfig.url,
  synchronize: databaseConfig.synchronize,
  logging: databaseConfig.logging,
  entities: [
    // Utiliser ExtendedUserEntity au lieu de BaseUserEntity
    ExtendedUserEntity, // ✅ Votre entité étendue
    // Autres entités de nest-auth (peuvent aussi être étendues)
    ActionEntity,
    CredentialEntity,
    EstablishmentEntity,
    OrganisationEntity,
    RoleEntity,
    SessionEntity,
    UserAccountEntity,
    // Vos autres entités...
  ],
  migrations: [
    // Migration de base de nest-auth (en premier)
    CreateAuthSchema1700000000000,
    // Votre migration d'extension (après)
    AddCustomUserFields1700000001000,
    // Vos autres migrations...
  ],
  migrationsTableName: 'migrations',
  migrationsRun: databaseConfig.migrationsRun,
  dropSchema: databaseConfig.dropSchema,
});

export default AppDataSource;
```

---

## 3. Extension des interfaces TypeScript

### Module Augmentation

```typescript
// src/types/nest-auth-extensions.d.ts
import '@devlab-io/nest-auth';

declare module '@devlab-io/nest-auth' {
  /**
   * Extension de l'interface User
   */
  interface User {
    preferredLanguage?: string;
    timezone?: string;
    customField?: string;
  }

  /**
   * Extension de CreateUserRequest
   */
  interface CreateUserRequest {
    preferredLanguage?: string;
    timezone?: string;
    customField?: string;
  }

  /**
   * Extension de UpdateUserRequest
   */
  interface UpdateUserRequest {
    preferredLanguage?: string;
    timezone?: string;
    customField?: string;
  }

  /**
   * Extension de PatchUserRequest
   */
  interface PatchUserRequest {
    preferredLanguage?: string;
    timezone?: string;
    customField?: string;
  }

  /**
   * Extension de UserQueryParams
   */
  interface UserQueryParams {
    preferredLanguage?: string;
    timezone?: string;
    customField?: string;
  }
}
```

---

## 4. Extension des entités TypeORM

### Créer l'entité étendue

```typescript
// src/entities/user.entity.ts
import {
  Column,
  Entity,
} from 'typeorm';
import { UserEntity as BaseUserEntity } from '@devlab-io/nest-auth';

/**
 * Entité User étendue avec des champs personnalisés
 * 
 * Cette entité hérite de UserEntity de nest-auth et ajoute des colonnes supplémentaires.
 * Elle pointe vers la même table 'users'.
 */
@Entity({ name: 'users' }) // ✅ Même nom de table que l'entité de base
export class ExtendedUserEntity extends BaseUserEntity {
  /**
   * Langue préférée de l'utilisateur
   */
  @Column({
    name: 'preferred_language',
    type: 'varchar',
    length: 10,
    nullable: true,
    default: 'fr',
  })
  preferredLanguage?: string;

  /**
   * Fuseau horaire de l'utilisateur
   */
  @Column({
    name: 'timezone',
    type: 'varchar',
    length: 50,
    nullable: true,
    default: 'Europe/Paris',
  })
  timezone?: string;

  /**
   * Champ personnalisé libre
   */
  @Column({
    name: 'custom_field',
    type: 'text',
    nullable: true,
  })
  customField?: string;
}
```

**Points importants :**
- ✅ Hérite de `BaseUserEntity` (l'entité de nest-auth)
- ✅ Utilise le même nom de table (`@Entity({ name: 'users' })`)
- ✅ Les relations et colonnes de base sont héritées automatiquement
- ✅ Les décorateurs TypeORM fonctionnent avec l'héritage

---

## 5. Modifications nécessaires dans nest-auth

### Explication : Comment les champs personnalisés sont gérés

**Mécanisme automatique :**

1. **Lors de la création (`create`)** :
   - Le module augmentation étend `CreateUserRequest` avec vos champs (`preferredLanguage`, `timezone`, `customField`)
   - `CreateUserRequest` contient donc ces champs au niveau TypeScript
   - Si le repository est typé avec `Repository<ExtendedUserEntity>`, TypeORM accepte tous les champs de `ExtendedUserEntity`
   - Lors de `repository.create({ ...request })`, tous les champs du request (y compris les étendus) sont inclus
   - TypeORM sauvegarde tous les champs présents dans l'entité

2. **Lors de la mise à jour (`update`)** :
   - Le module augmentation étend `UpdateUserRequest` avec vos champs
   - On assigne directement les champs étendus à l'entité : `user.preferredLanguage = request.preferredLanguage`
   - TypeORM détecte les changements et sauvegarde tous les champs modifiés

**Important :** 
- ✅ Si vous utilisez `Repository<ExtendedUserEntity>`, TypeORM connaît les colonnes étendues
- ✅ Le module augmentation permet à TypeScript d'accepter les champs étendus dans les requests
- ✅ L'assignment direct fonctionne car l'entité a ces propriétés

### Détail : Implémentation des méthodes `create` et `update`

**Principe : Dans une bibliothèque, on ne connaît pas les champs étendus à l'avance**

La bibliothèque doit être **générique** et accepter n'importe quels champs additionnels sans les connaître explicitement.

**Approche recommandée : Utiliser les métadonnées TypeORM pour filtrer automatiquement**

```typescript
// src/auth/services/user.service.ts (VERSION AVEC GÉNÉRIQUES)
import { Repository, EntityMetadata } from 'typeorm';

@Injectable()
export class UserService<T extends UserEntity = UserEntity> {
  private readonly logger: Logger = new Logger(UserService.name);
  protected userRepository?: Repository<T>;

  // ... constructor ...

  /**
   * Extract only column properties from an object (exclude relations and methods)
   * 
   * @param obj - Object containing potential entity properties
   * @returns Object with only column properties
   */
  private extractColumnProperties(obj: any, metadata: EntityMetadata): Partial<T> {
    const columns = metadata.columns.map(col => col.propertyName);
    const result: any = {};
    
    for (const key in obj) {
      // ✅ Inclure uniquement les colonnes (pas les relations, pas les méthodes)
      if (columns.includes(key) && obj[key] !== undefined) {
        result[key] = obj[key];
      }
    }
    
    return result as Partial<T>;
  }

  /**
   * Create a new user
   * 
   * ✅ Cette méthode fonctionne avec n'importe quels champs étendus (colonnes simples)
   * ✅ Les relations personnalisées doivent être gérées séparément (voir plus bas)
   */
  public async create(request: CreateUserRequest): Promise<T> {
    if (!this.userRepository) {
      throw new Error('Repository not set.');
    }

    // Générer le username
    const username: string = await this.generateUsername(request);

    // Champs de base avec transformations
    const baseFields = {
      email: request.email.toLowerCase(),
      emailValidated: false,
      username: username,
      firstName: request.firstName ? capitalize(request.firstName) : undefined,
      lastName: request.lastName?.toUpperCase(),
      phone: request.phone?.toUpperCase(),
      profilePicture: request.profilePicture,
      acceptedTerms: request.acceptedTerms,
      acceptedPrivacyPolicy: request.acceptedPrivacyPolicy,
      enabled: true,
    };

    // ✅ APPROCHE GÉNÉRIQUE : Utiliser les métadonnées TypeORM pour filtrer
    // Cela permet d'inclure automatiquement TOUS les champs étendus (colonnes)
    // sans les connaître à l'avance
    
    // Obtenir les métadonnées de l'entité
    const metadata = this.userRepository.metadata;
    
    // Extraire uniquement les colonnes du request (incluant les champs étendus)
    // Cela exclut automatiquement les relations et méthodes
    const extendedFields = this.extractColumnProperties(request, metadata);
    
    // ✅ Combiner les champs de base et les champs étendus
    // TypeORM acceptera tous les champs présents dans l'entité
    let user: T = this.userRepository.create({
      ...baseFields,
      ...extendedFields, // ✅ Inclut automatiquement preferredLanguage, timezone, customField, etc.
    } as Partial<T>);

    // Sauvegarder l'entité (avec tous ses champs)
    user = await this.userRepository.save(user);

    // ✅ Gérer les relations connues de la bibliothèque (credentials, actions)
    // Ces relations sont gérées séparément car elles nécessitent une logique spécifique
    if (request.credentials && request.credentials.length > 0) {
      for (const credential of request.credentials) {
        if (credential.type === 'password' && credential.password) {
          await this.credentialService.createPasswordCredential(
            user.id,
            credential.password,
          );
        } else if (credential.type === 'google' && credential.googleId) {
          await this.credentialService.createGoogleCredential(
            user.id,
            credential.googleId,
          );
        }
      }
    }

    if (request.actions && request.actions.length > 0) {
      for (const action of request.actions) {
        await this.actionService.create({
          type: action.type,
          user: user,
          expiresIn: action.expiresIn,
          roles: action.roles,
        });
      }
    }

    // ✅ RELATIONS PERSONNALISÉES : Voir section dédiée ci-dessous
    // Les relations personnalisées doivent être gérées dans votre application
    // ou via un hook/callback (voir plus bas)

    return user;
  }
```

**Méthode `update` : Gestion des champs personnalisés (générique)**

```typescript
public async update(id: string, request: UpdateUserRequest): Promise<T> {
  if (!this.userRepository) {
    throw new Error('Repository not set.');
  }

  // Récupérer l'utilisateur existant
  let user: T = await this.getById(id);

  // ✅ Mettre à jour les champs de base (explicites) avec transformations
  if (request.email !== undefined) {
    user.email = request.email.toLowerCase();
  }
  if (request.username !== undefined) {
    user.username = await this.generateUsername({
      ...user,
      ...request,
    } as GenerateUsernameRequest);
  }
  if (request.firstName !== undefined) {
    user.firstName = capitalize(request.firstName);
  }
  if (request.lastName !== undefined) {
    user.lastName = request.lastName.toUpperCase();
  }
  if (request.phone !== undefined) {
    user.phone = request.phone.toUpperCase();
  }
  if (request.emailValidated !== undefined) {
    user.emailValidated = request.emailValidated;
  }
  if (request.enabled !== undefined) {
    user.enabled = request.enabled;
  }
  if (request.profilePicture !== undefined) {
    user.profilePicture = request.profilePicture;
  }
  if (request.acceptedTerms !== undefined) {
    user.acceptedTerms = request.acceptedTerms;
  }
  if (request.acceptedPrivacyPolicy !== undefined) {
    user.acceptedPrivacyPolicy = request.acceptedPrivacyPolicy;
  }

  // ✅ APPROCHE GÉNÉRIQUE : Utiliser les métadonnées TypeORM pour mettre à jour
  // tous les champs étendus sans les connaître à l'avance
  const metadata = this.userRepository.metadata;
  const columns = metadata.columns.map(col => col.propertyName);
  
  // Liste des champs de base (déjà traités ci-dessus)
  const baseFields = [
    'email', 'username', 'firstName', 'lastName', 'phone',
    'emailValidated', 'enabled', 'profilePicture',
    'acceptedTerms', 'acceptedPrivacyPolicy',
  ];
  
  // ✅ Appliquer tous les autres champs (champs étendus) automatiquement
  for (const key in request) {
    // Ne traiter que les colonnes qui ne sont pas déjà traitées
    if (
      columns.includes(key) &&
      !baseFields.includes(key) &&
      request[key as keyof UpdateUserRequest] !== undefined
    ) {
      // ✅ Assigner le champ étendu (preferredLanguage, timezone, customField, etc.)
      (user as any)[key] = request[key as keyof UpdateUserRequest];
    }
  }

  // ✅ TypeORM détecte automatiquement tous les champs modifiés
  // et les sauvegarde lors de save()
  user = await this.userRepository.save(user);

  return user;
}
```

### Gestion des relations personnalisées

**Problème : Les relations personnalisées ne peuvent pas être gérées automatiquement**

Les relations TypeORM nécessitent une logique spécifique (chargement, validation, sauvegarde). La bibliothèque ne peut pas les gérer automatiquement car elle ne les connaît pas.

**Solution : Utiliser des hooks/callbacks ou gérer dans votre application**

**Option 1 : Hooks/Callbacks (RECOMMANDÉ)**

```typescript
// src/auth/services/user.service.ts
export interface UserServiceHooks<T extends UserEntity = UserEntity> {
  /**
   * Hook appelé après la création de l'entité, avant la sauvegarde
   * Permet de gérer les relations personnalisées
   */
  beforeSave?: (user: T, request: CreateUserRequest) => Promise<void> | void;
  
  /**
   * Hook appelé après la sauvegarde de l'entité
   * Permet de gérer les relations personnalisées qui nécessitent l'ID
   */
  afterSave?: (user: T, request: CreateUserRequest) => Promise<void> | void;
}

@Injectable()
export class UserService<T extends UserEntity = UserEntity> {
  private hooks?: UserServiceHooks<T>;

  /**
   * Définir les hooks pour gérer les relations personnalisées
   */
  public setHooks(hooks: UserServiceHooks<T>): void {
    this.hooks = hooks;
  }

  public async create(request: CreateUserRequest): Promise<T> {
    // ... création de l'entité comme avant ...

    // ✅ Appeler le hook beforeSave (pour relations personnalisées)
    if (this.hooks?.beforeSave) {
      await this.hooks.beforeSave(user, request);
    }

    // Sauvegarder
    user = await this.userRepository.save(user);

    // ✅ Appeler le hook afterSave (pour relations personnalisées nécessitant l'ID)
    if (this.hooks?.afterSave) {
      await this.hooks.afterSave(user, request);
    }

    return user;
  }
}
```

**Dans votre application :**

```typescript
// src/services/extended-user.service.ts
import { UserService } from '@devlab-io/nest-auth';
import { ExtendedUserEntity } from '../entities/user.entity';

@Injectable()
export class ExtendedUserService {
  public constructor(
    private readonly userService: UserService<ExtendedUserEntity>,
  ) {
    // ✅ Définir les hooks pour gérer les relations personnalisées
    this.userService.setHooks({
      afterSave: async (user: ExtendedUserEntity, request: CreateUserRequest) => {
        // Gérer votre relation personnalisée (ex: user.preferences)
        if (request.preferences) {
          // Logique pour créer/sauvegarder les préférences
          // ...
        }
      },
    });
  }
}
```

**Option 2 : Service étendu (plus simple mais moins flexible)**

```typescript
// src/services/extended-user.service.ts
import { Injectable } from '@nestjs/common';
import { UserService, CreateUserRequest } from '@devlab-io/nest-auth';
import { ExtendedUserEntity } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ExtendedUserService {
  public constructor(
    private readonly userService: UserService<ExtendedUserEntity>,
    @InjectRepository(ExtendedUserEntity)
    private readonly userRepository: Repository<ExtendedUserEntity>,
    // ✅ Injecter vos repositories personnalisés
    @InjectRepository(PreferenceEntity)
    private readonly preferenceRepository: Repository<PreferenceEntity>,
  ) {}

  public async create(request: CreateUserRequest & { preferences?: any[] }): Promise<ExtendedUserEntity> {
    // Créer l'utilisateur via le service de base (gère les champs simples)
    const user = await this.userService.create(request);

    // ✅ Gérer les relations personnalisées ici
    if (request.preferences) {
      for (const pref of request.preferences) {
        await this.preferenceRepository.save({
          ...pref,
          user: user, // Relation personnalisée
        });
      }
    }

    return user;
  }
}
```

**Résumé : Comment ça fonctionne**

1. **Module augmentation** : Étend `CreateUserRequest` et `UpdateUserRequest` avec vos champs personnalisés (ex: `preferredLanguage`, `timezone`, `customField`)

2. **Repository typé** : Si configuré avec `Repository<ExtendedUserEntity>`, TypeORM connaît toutes les colonnes de `ExtendedUserEntity`

3. **Création (`create`)** :
   - Les champs étendus sont dans `request` (grâce au module augmentation)
   - `extractColumnProperties()` filtre automatiquement les colonnes du request (exclut les relations)
   - `repository.create({ ...baseFields, ...extendedFields })` inclut tous les champs (base + étendus)
   - TypeORM sauvegarde tous les champs présents dans l'entité
   - **Les relations personnalisées** sont gérées via hooks/callbacks ou dans un service étendu

4. **Mise à jour (`update`)** :
   - Les champs étendus sont dans `request` (grâce au module augmentation)
   - Les métadonnées TypeORM identifient automatiquement les colonnes étendues
   - Les champs sont assignés automatiquement sans les connaître à l'avance
   - TypeORM détecte les changements et sauvegarde tous les champs modifiés

**Avantages de cette approche :**
- ✅ **Générique** : Fonctionne avec n'importe quels champs étendus (colonnes simples)
- ✅ **Automatique** : Utilise les métadonnées TypeORM pour filtrer les colonnes
- ✅ **Flexible** : Permet de gérer les relations personnalisées via hooks

**Limitations :**
- ⚠️ **Relations personnalisées** : Ne peuvent pas être gérées automatiquement, nécessitent hooks ou service étendu
- ⚠️ **Transformations** : Les champs de base nécessitent des transformations explicites (email.toLowerCase(), etc.)

**Exemple concret complet :**

```typescript
// Dans votre application
const user = await userService.create({
  email: 'user@example.com',
  acceptedTerms: true,
  acceptedPrivacyPolicy: true,
  enabled: true,
  firstName: 'John',
  lastName: 'Doe',
  // ✅ Champs étendus (acceptés grâce au module augmentation)
  preferredLanguage: 'en',
  timezone: 'America/New_York',
  customField: 'Custom data',
});

// ✅ user.preferredLanguage, user.timezone, user.customField sont disponibles
console.log(user.preferredLanguage); // 'en'
console.log(user.timezone); // 'America/New_York'
console.log(user.customField); // 'Custom data'
```

### Option A : Modifier les services pour accepter des génériques

**Exemple : UserService générique**

```typescript
// src/auth/services/user.service.ts (VERSION MODIFIÉE avec génériques)
import { Repository } from 'typeorm';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entities';
import {
  UserQueryParams,
  UpdateUserRequest,
  UserPage,
  GenerateUsernameRequest,
  CreateUserRequest,
  PatchUserRequest,
} from '../types';
import { CredentialService } from './credential.service';
import { ActionService } from './action.service';
import { UserConfig, UserConfigToken } from '../config/user.config';
import { capitalize, normalize } from '../utils';
import { ActionType, CreateActionRequest } from '../types';

@Injectable()
export class UserService<T extends UserEntity = UserEntity> {
  private readonly logger: Logger = new Logger(UserService.name);

  /**
   * Constructor - accepte un repository générique
   *
   * @param userConfig - The user configuration
   * @param userRepository - The user repository (générique)
   * @param credentialService - The credential service
   * @param actionService - The action service
   */
  public constructor(
    @Inject(UserConfigToken) private readonly userConfig: UserConfig,
    @InjectRepository(UserEntity) // Type de base pour l'injection
    private readonly userRepository: Repository<T>, // Repository générique
    @Inject() private readonly credentialService: CredentialService,
    @Inject() private readonly actionService: ActionService,
  ) {}

  /**
   * Create a new user - retourne le type générique
   *
   * @param request - The create user request
   * @returns The created user (type générique)
   */
  public async create(request: CreateUserRequest): Promise<T> {
    // ... logique existante pour créer l'utilisateur ...
    
    // Créer l'utilisateur avec les champs de base
    let user: T = this.userRepository.create({
      email: request.email.toLowerCase(),
      emailValidated: false,
      username: username,
      firstName: request.firstName ? capitalize(request.firstName) : undefined,
      lastName: request.lastName?.toUpperCase(),
      phone: request.phone?.toUpperCase(),
      profilePicture: request.profilePicture,
      acceptedTerms: request.acceptedTerms,
      acceptedPrivacyPolicy: request.acceptedPrivacyPolicy,
      enabled: true,
      // ✅ Les champs étendus sont automatiquement inclus si présents dans request
      // (via l'extension d'interface)
    } as any); // Cast temporaire pour inclure les champs étendus

    // Sauvegarder
    user = await this.userRepository.save(user);

    // Gérer les credentials et actions...
    
    // Retourner le type générique
    return user;
  }

  /**
   * Get user by ID - retourne le type générique
   */
  public async getById(id: string): Promise<T> {
    const user: T | null = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  /**
   * Find user by ID - retourne le type générique
   */
  public async findById(id: string): Promise<T | null> {
    return await this.userRepository.findOne({
      where: { id },
      relations: ['credentials', 'actions', 'userAccounts'],
    });
  }

  // ... autres méthodes retournant T au lieu de UserEntity ...
}
```

**Problème avec cette approche :** L'injection de dépendances NestJS nécessite un token spécifique pour le repository, donc on ne peut pas facilement injecter un `Repository<ExtendedUserEntity>` dans un service qui attend `Repository<UserEntity>`.

### Option B : Service Factory (RECOMMANDÉE)

**Créer un service factory qui instancie les services avec les bons types**

```typescript
// src/auth/services/user.service.ts (VERSION AVEC FACTORY)
import { Repository } from 'typeorm';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entities';
import {
  UserQueryParams,
  UpdateUserRequest,
  UserPage,
  GenerateUsernameRequest,
  CreateUserRequest,
  PatchUserRequest,
} from '../types';
import { CredentialService } from './credential.service';
import { ActionService } from './action.service';
import { UserConfig, UserConfigToken } from '../config/user.config';
import { capitalize, normalize } from '../utils';
import { ActionType, CreateActionRequest } from '../types';

/**
 * Classe de base abstraite pour UserService
 * Peut être étendue ou utilisée directement
 */
@Injectable()
export class UserService<T extends UserEntity = UserEntity> {
  private readonly logger: Logger = new Logger(UserService.name);

  /**
   * Constructor
   * 
   * Note: Le repository doit être fourni via setRepository ou via une factory
   */
  protected userRepository?: Repository<T>;

  public constructor(
    @Inject(UserConfigToken) protected readonly userConfig: UserConfig,
    @Inject() protected readonly credentialService: CredentialService,
    @Inject() protected readonly actionService: ActionService,
  ) {}

  /**
   * Méthode pour définir le repository (utilisée par la factory)
   */
  public setRepository(repository: Repository<T>): void {
    this.userRepository = repository;
  }

  /**
   * Create a new user
   * 
   * IMPORTANT: Les champs personnalisés sont automatiquement inclus grâce à :
   * 1. Le module augmentation qui étend CreateUserRequest
   * 2. Le repository typé avec Repository<T> où T extends UserEntity
   * 3. TypeORM qui accepte tous les champs présents dans l'entité
   */
  public async create(request: CreateUserRequest): Promise<T> {
    if (!this.userRepository) {
      throw new Error('Repository not set. Use UserServiceFactory to create service.');
    }

    // Générer le username si nécessaire
    const username: string = await this.generateUsername(request);

    // ✅ Créer l'entité avec TOUS les champs (base + étendus)
    // TypeORM accepte automatiquement tous les champs présents dans l'entité T
    // Si T = ExtendedUserEntity, alors preferredLanguage, timezone, customField sont acceptés
    let user: T = this.userRepository.create({
      // Champs de base (toujours présents)
      email: request.email.toLowerCase(),
      emailValidated: false,
      username: username,
      firstName: request.firstName ? capitalize(request.firstName) : undefined,
      lastName: request.lastName?.toUpperCase(),
      phone: request.phone?.toUpperCase(),
      profilePicture: request.profilePicture,
      acceptedTerms: request.acceptedTerms,
      acceptedPrivacyPolicy: request.acceptedPrivacyPolicy,
      enabled: true,
      
      // ✅ Champs étendus (ajoutés via module augmentation dans CreateUserRequest)
      // Ces champs sont automatiquement inclus si :
      // 1. Le repository est typé avec Repository<ExtendedUserEntity>
      // 2. L'entité ExtendedUserEntity contient ces colonnes
      // 3. CreateUserRequest a été étendu via module augmentation
      preferredLanguage: request.preferredLanguage, // ✅ Champ étendu
      timezone: request.timezone, // ✅ Champ étendu
      customField: request.customField, // ✅ Champ étendu
    } as Partial<T>); // Cast vers Partial<T> pour accepter tous les champs de T

    // Sauvegarder l'utilisateur
    // TypeORM sauvegarde automatiquement tous les champs présents dans l'entité
    user = await this.userRepository.save(user);

    // Gérer les credentials si fournis
    if (request.credentials && request.credentials.length > 0) {
      for (const credential of request.credentials) {
        if (credential.type === 'password' && credential.password) {
          await this.credentialService.createPasswordCredential(
            user.id,
            credential.password,
          );
        } else if (credential.type === 'google' && credential.googleId) {
          await this.credentialService.createGoogleCredential(
            user.id,
            credential.googleId,
          );
        }
      }
    }

    // Gérer les actions si fournies
    if (request.actions && request.actions.length > 0) {
      for (const action of request.actions) {
        await this.actionService.create({
          type: action.type,
          user: user,
          expiresIn: action.expiresIn,
          roles: action.roles,
        });
      }
    }

    // Retourner l'entité complète (incluant les champs étendus)
    return user;
  }

  /**
   * Update a user
   * 
   * IMPORTANT: Les champs personnalisés sont automatiquement mis à jour grâce à :
   * 1. Le module augmentation qui étend UpdateUserRequest
   * 2. L'assignment direct des propriétés sur l'entité T
   * 3. TypeORM qui sauvegarde tous les champs modifiés
   */
  public async update(id: string, request: UpdateUserRequest): Promise<T> {
    if (!this.userRepository) {
      throw new Error('Repository not set. Use UserServiceFactory to create service.');
    }

    // Récupérer l'utilisateur existant
    let user: T = await this.getById(id);

    // ✅ Mettre à jour les champs de base
    if (request.email !== undefined) {
      user.email = request.email.toLowerCase();
    }
    if (request.username !== undefined) {
      user.username = await this.generateUsername({
        ...user,
        ...request,
      });
    }
    if (request.firstName !== undefined) {
      user.firstName = capitalize(request.firstName);
    }
    if (request.lastName !== undefined) {
      user.lastName = request.lastName.toUpperCase();
    }
    if (request.phone !== undefined) {
      user.phone = request.phone.toUpperCase();
    }
    if (request.profilePicture !== undefined) {
      user.profilePicture = request.profilePicture;
    }
    if (request.emailValidated !== undefined) {
      user.emailValidated = request.emailValidated;
    }
    if (request.enabled !== undefined) {
      user.enabled = request.enabled;
    }
    if (request.acceptedTerms !== undefined) {
      user.acceptedTerms = request.acceptedTerms;
    }
    if (request.acceptedPrivacyPolicy !== undefined) {
      user.acceptedPrivacyPolicy = request.acceptedPrivacyPolicy;
    }

    // ✅ Mettre à jour les champs étendus (ajoutés via module augmentation)
    // TypeScript accepte ces assignments car :
    // 1. UpdateUserRequest a été étendu via module augmentation
    // 2. user est de type T (ExtendedUserEntity) qui contient ces propriétés
    // 3. L'assignment est type-safe
    if (request.preferredLanguage !== undefined) {
      // ✅ TypeScript sait que user a cette propriété si T = ExtendedUserEntity
      (user as any).preferredLanguage = request.preferredLanguage;
    }
    if (request.timezone !== undefined) {
      (user as any).timezone = request.timezone;
    }
    if (request.customField !== undefined) {
      (user as any).customField = request.customField;
    }

    // Alternative plus propre : utiliser Object.assign pour copier tous les champs étendus
    // Object.assign(user, {
    //   preferredLanguage: request.preferredLanguage,
    //   timezone: request.timezone,
    //   customField: request.customField,
    // });

    // Sauvegarder l'utilisateur
    // TypeORM détecte automatiquement tous les champs modifiés et les sauvegarde
    user = await this.userRepository.save(user);

    return user;
  }

  // ... autres méthodes ...
}
```

**Factory pour créer des services typés**

```typescript
// src/auth/services/user-service.factory.ts
import { Repository } from 'typeorm';
import { UserEntity } from '../entities';
import { UserService } from './user.service';
import { UserConfig, UserConfigToken } from '../config/user.config';
import { CredentialService } from './credential.service';
import { ActionService } from './action.service';

/**
 * Factory pour créer des instances de UserService avec des types spécifiques
 */
export class UserServiceFactory {
  /**
   * Créer un UserService avec un repository typé
   */
  public static create<T extends UserEntity>(
    repository: Repository<T>,
    userConfig: UserConfig,
    credentialService: CredentialService,
    actionService: ActionService,
  ): UserService<T> {
    const service = new UserService<T>(
      userConfig,
      credentialService,
      actionService,
    );
    service.setRepository(repository);
    return service;
  }
}
```

### Option C : Module générique (SOLUTION RECOMMANDÉE)

**Modifier AuthModule pour accepter des entités personnalisées**

```typescript
// src/auth/auth.module.ts (VERSION MODIFIÉE)
import { DynamicModule, Global, Module, Provider, Type } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// ... autres imports ...

export interface AuthModuleOptions<TUser extends UserEntity = UserEntity> {
  // Optionnel : permettre de fournir des entités personnalisées
  entities?: {
    UserEntity?: Type<TUser>;
    // Autres entités peuvent aussi être étendues...
  };
  // Configuration existante...
}

@Global()
@Module({})
export class AuthModule {
  /**
   * Create a dynamic authentication module
   *
   * @param config - Authentication module configuration
   * @param options - Options pour les entités personnalisées
   * @returns Dynamic authentication module
   */
  static forRoot<TUser extends UserEntity = UserEntity>(
    config?: AuthConfig,
    options?: AuthModuleOptions<TUser>,
  ): DynamicModule {
    // Utiliser l'entité personnalisée si fournie, sinon utiliser celle par défaut
    const UserEntityClass = (options?.entities?.UserEntity || UserEntity) as Type<TUser>;

    const actionConfigProvider: Provider = provideActionConfig();
    const jwtConfigProvider: Provider = provideJwtConfig();
    const adminConfigProvider: Provider = provideAdminConfig();
    const userConfigProvider: Provider = provideUserConfig();
    const googleAuthConfigProvider: Provider = provideGoogleAuthConfig();
    const authConfigProvider: Provider = provideAuthConfig(config);

    // Provider pour le repository typé
    const userRepositoryProvider: Provider = {
      provide: getRepositoryToken(UserEntity), // Token de base pour compatibilité
      useFactory: (dataSource: DataSource) => dataSource.getRepository(UserEntityClass),
      inject: [DataSource],
    };

    // Provider pour UserService typé
    const userServiceProvider: Provider = {
      provide: UserService,
      useFactory: (
        userConfig: UserConfig,
        userRepository: Repository<TUser>,
        credentialService: CredentialService,
        actionService: ActionService,
      ) => {
        const service = new UserService<TUser>(
          userConfig,
          credentialService,
          actionService,
        );
        service.setRepository(userRepository);
        return service;
      },
      inject: [
        UserConfigToken,
        getRepositoryToken(UserEntity),
        CredentialService,
        ActionService,
      ],
    };

    return {
      module: AuthModule,
      imports: [
        TypeOrmModule.forFeature([
          UserEntityClass, // ✅ Utiliser l'entité personnalisée
          RoleEntity,
          ActionEntity,
          SessionEntity,
          OrganisationEntity,
          EstablishmentEntity,
          CredentialEntity,
          UserAccountEntity,
        ]),
      ],
      providers: [
        actionConfigProvider,
        jwtConfigProvider,
        adminConfigProvider,
        userConfigProvider,
        googleAuthConfigProvider,
        authConfigProvider,
        userRepositoryProvider, // ✅ Repository typé
        userServiceProvider, // ✅ Service typé
        AuthService,
        ActionService,
        RoleService,
        JwtService,
        SessionService,
        NotificationService,
        OrganisationService,
        EstablishmentService,
        UserAccountService,
        CredentialService,
        JwtAuthGuard,
        FrontendUrlGuard,
      ],
      exports: [
        // ... exports existants ...
        UserService, // ✅ Export du service typé
      ],
      controllers: [
        AuthController,
        UserController,
        SessionController,
        OrganisationController,
        EstablishmentController,
      ],
    };
  }
}
```

---

## 6. Configuration du module avec génériques

### Configuration dans AppModule

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@devlab-io/nest-auth';
import { ExtendedUserEntity } from './entities/user.entity';

@Module({
  imports: [
    // Configuration TypeORM (DataSource gère les entités)
    TypeOrmModule.forRoot({
      // ... configuration DataSource
      // Les entités sont chargées via DataSource
    }),

    // Importer le module Auth avec votre entité étendue
    AuthModule.forRoot(
      {
        // Configuration auth si nécessaire
      },
      {
        // ✅ Optionnel : Fournir votre entité étendue
        entities: {
          UserEntity: ExtendedUserEntity, // ✅ Utiliser votre entité étendue
        },
      },
    ),

    // Vos autres modules...
  ],
  providers: [
    // Les services de nest-auth sont automatiquement typés avec ExtendedUserEntity
  ],
  controllers: [
    // Vos contrôleurs...
  ],
})
export class AppModule {}
```

**Important :** 
- ✅ Si vous utilisez `AuthModule.forRoot()` avec `entities.UserEntity`, le service `UserService` sera automatiquement typé avec `ExtendedUserEntity`
- ✅ Tous les services qui dépendent de `UserService` recevront le bon type
- ✅ Vous n'avez pas besoin d'hériter des services

---

## 7. Utilisation dans l'application

### Exemple : Utiliser UserService directement

Si `AuthModule` a été configuré avec `ExtendedUserEntity`, le service est automatiquement typé :

```typescript
// src/controllers/user.controller.ts
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { UserService } from '@devlab-io/nest-auth';
import { CreateUserRequest } from '@devlab-io/nest-auth';
import { ExtendedUserEntity } from '../entities/user.entity';

@Controller('users')
export class UserController {
  public constructor(
    // ✅ UserService est automatiquement typé avec ExtendedUserEntity
    private readonly userService: UserService<ExtendedUserEntity>,
  ) {}

  /**
   * Créer un utilisateur avec des champs étendus
   */
  @Post()
  public async create(@Body() request: CreateUserRequest) {
    // ✅ Le type CreateUserRequest inclut vos champs étendus
    // grâce au module augmentation
    const user = await this.userService.create({
      email: 'user@example.com',
      acceptedTerms: true,
      acceptedPrivacyPolicy: true,
      enabled: true,
      // Champs de base
      firstName: 'John',
      lastName: 'Doe',
      // ✅ Champs étendus (via module augmentation)
      preferredLanguage: 'en',
      timezone: 'America/New_York',
      customField: 'Some custom data',
    });

    // ✅ user est de type ExtendedUserEntity
    // user.preferredLanguage, user.timezone, user.customField sont disponibles
    return user;
  }

  /**
   * Récupérer un utilisateur
   */
  @Get(':id')
  public async findById(@Param('id') id: string) {
    // ✅ Retourne ExtendedUserEntity avec tous les champs
    const user = await this.userService.getById(id);
    
    // ✅ Les champs étendus sont disponibles
    return {
      ...user,
      preferredLanguage: user.preferredLanguage, // ✅ Type-safe
      timezone: user.timezone,
      customField: user.customField,
    };
  }

  /**
   * Rechercher avec des filtres étendus
   */
  @Get('search/by-language/:language')
  public async findByLanguage(@Param('language') language: string) {
    // Créer une méthode dans votre service ou utiliser search
    // Note: Vous devrez peut-être étendre UserService pour ajouter cette méthode
    const users = await this.userService.search({
      preferredLanguage: language, // ✅ Filtre étendu disponible
    });

    return users;
  }
}
```

### Exemple : Utiliser avec AuthService

```typescript
// src/controllers/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService, SignUpRequest } from '@devlab-io/nest-auth';
import { ExtendedUserEntity } from '../entities/user.entity';

@Controller('auth')
export class AuthController {
  public constructor(
    // ✅ AuthService est automatiquement typé si configuré avec ExtendedUserEntity
    private readonly authService: AuthService, // Peut être typé avec génériques aussi
  ) {}

  /**
   * Inscription avec champs étendus
   */
  @Post('signup')
  public async signUp(@Body() request: SignUpRequest) {
    // ✅ SignUpRequest inclut vos champs étendus via module augmentation
    await this.authService.signUp({
      email: 'user@example.com',
      acceptedTerms: true,
      acceptedPrivacyPolicy: true,
      // Champs étendus
      preferredLanguage: 'en',
      timezone: 'America/New_York',
      customField: 'Custom data',
      credentials: [
        { type: 'password', password: 'password123' },
      ],
    });

    // Récupérer l'utilisateur créé pour retourner les champs étendus
    // Note: AuthService.signUp ne retourne rien, vous devrez peut-être
    // l'étendre ou récupérer l'utilisateur après
  }
}
```

### Exemple : Service personnalisé qui utilise UserService

```typescript
// src/services/extended-user.service.ts
import { Injectable } from '@nestjs/common';
import { UserService, CreateUserRequest } from '@devlab-io/nest-auth';
import { ExtendedUserEntity } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ExtendedUserService {
  public constructor(
    // ✅ UserService est typé avec ExtendedUserEntity
    private readonly userService: UserService<ExtendedUserEntity>,
    // ✅ Repository typé avec ExtendedUserEntity
    @InjectRepository(ExtendedUserEntity)
    private readonly userRepository: Repository<ExtendedUserEntity>,
  ) {}

  /**
   * Créer un utilisateur avec gestion des champs étendus
   */
  public async create(request: CreateUserRequest): Promise<ExtendedUserEntity> {
    // Créer via le service de base
    // ✅ Les champs étendus sont automatiquement gérés si le repository
    // est configuré avec ExtendedUserEntity
    const user = await this.userService.create(request);
    
    // ✅ user est déjà de type ExtendedUserEntity avec tous les champs
    // Si le service de base gère bien les champs étendus via le repository
    
    // Optionnel : Vérifier et compléter les champs étendus si nécessaire
    if (request.preferredLanguage && !user.preferredLanguage) {
      user.preferredLanguage = request.preferredLanguage;
      return await this.userRepository.save(user);
    }
    
    return user;
  }

  /**
   * Rechercher par langue préférée
   */
  public async findByPreferredLanguage(
    language: string,
  ): Promise<ExtendedUserEntity[]> {
    // ✅ Utiliser directement le repository typé
    return await this.userRepository.find({
      where: { preferredLanguage: language },
      relations: ['credentials', 'actions', 'userAccounts'],
    });
  }

  /**
   * Rechercher avec des filtres étendus
   */
  public async searchExtended(
    params: UserQueryParams,
    page: number = 1,
    limit: number = 10,
  ) {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.credentials', 'credentials')
      .leftJoinAndSelect('user.actions', 'actions')
      .leftJoinAndSelect('user.userAccounts', 'userAccounts');

    // Filtres de base
    if (params.email) {
      queryBuilder.andWhere('user.email ILIKE :email', {
        email: `%${params.email}%`,
      });
    }

    // ✅ Filtres étendus
    if (params.preferredLanguage) {
      queryBuilder.andWhere('user.preferredLanguage = :preferredLanguage', {
        preferredLanguage: params.preferredLanguage,
      });
    }

    if (params.timezone) {
      queryBuilder.andWhere('user.timezone = :timezone', {
        timezone: params.timezone,
      });
    }

    if (params.customField) {
      queryBuilder.andWhere('user.customField ILIKE :customField', {
        customField: `%${params.customField}%`,
      });
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }
}
```

---

## 8. Exemple complet

### Structure de fichiers

```
src/
├── database/
│   └── migrations/
│       └── 1700000001000-AddCustomUserFields.ts
├── entities/
│   └── user.entity.ts (ExtendedUserEntity)
├── services/
│   └── extended-user.service.ts (optionnel)
├── controllers/
│   └── user.controller.ts
├── types/
│   └── nest-auth-extensions.d.ts
├── app.module.ts
└── datasource.ts
```

### Fichier complet : app.module.ts

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@devlab-io/nest-auth';
import { ExtendedUserEntity } from './entities/user.entity';
import { ExtendedUserService } from './services/extended-user.service';
import { UserController } from './controllers/user.controller';

@Module({
  imports: [
    // Configuration TypeORM
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      // Les entités sont chargées via DataSource
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
    }),

    // ✅ Importer AuthModule avec votre entité étendue
    AuthModule.forRoot(
      {
        // Configuration auth...
      },
      {
        // ✅ Fournir votre entité étendue
        entities: {
          UserEntity: ExtendedUserEntity,
        },
      },
    ),

    // Importer l'entité étendue dans TypeORM
    TypeOrmModule.forFeature([ExtendedUserEntity]),
  ],
  providers: [
    // ✅ ExtendedUserService (optionnel, pour des méthodes supplémentaires)
    ExtendedUserService,
  ],
  controllers: [
    // ✅ Votre contrôleur
    UserController,
  ],
  exports: [
    ExtendedUserService,
  ],
})
export class AppModule {}
```

### Fichier complet : user.controller.ts

```typescript
// src/controllers/user.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Put,
  Delete,
} from '@nestjs/common';
import {
  UserService,
  CreateUserRequest,
  UpdateUserRequest,
  UserQueryParams,
} from '@devlab-io/nest-auth';
import { ExtendedUserEntity } from '../entities/user.entity';
import { ExtendedUserService } from '../services/extended-user.service';

@Controller('users')
export class UserController {
  public constructor(
    // ✅ UserService typé avec ExtendedUserEntity
    private readonly userService: UserService<ExtendedUserEntity>,
    // ✅ Service étendu pour méthodes supplémentaires
    private readonly extendedUserService: ExtendedUserService,
  ) {}

  /**
   * Créer un utilisateur
   */
  @Post()
  public async create(@Body() request: CreateUserRequest) {
    // ✅ Les champs étendus sont dans le type CreateUserRequest
    const user = await this.userService.create({
      email: request.email,
      acceptedTerms: request.acceptedTerms,
      acceptedPrivacyPolicy: request.acceptedPrivacyPolicy,
      enabled: true,
      firstName: request.firstName,
      lastName: request.lastName,
      // ✅ Champs étendus
      preferredLanguage: request.preferredLanguage,
      timezone: request.timezone,
      customField: request.customField,
    });

    return user; // ✅ ExtendedUserEntity avec tous les champs
  }

  /**
   * Récupérer un utilisateur par ID
   */
  @Get(':id')
  public async findById(@Param('id') id: string) {
    // ✅ Retourne ExtendedUserEntity
    const user = await this.userService.getById(id);
    return user;
  }

  /**
   * Rechercher des utilisateurs
   */
  @Get()
  public async search(@Query() params: UserQueryParams) {
    // ✅ Recherche avec filtres étendus si implémentés
    return await this.userService.search(params);
  }

  /**
   * Rechercher par langue préférée (méthode personnalisée)
   */
  @Get('by-language/:language')
  public async findByLanguage(@Param('language') language: string) {
    // ✅ Utiliser le service étendu
    return await this.extendedUserService.findByPreferredLanguage(language);
  }

  /**
   * Mettre à jour un utilisateur
   */
  @Put(':id')
  public async update(
    @Param('id') id: string,
    @Body() request: UpdateUserRequest,
  ) {
    // ✅ UpdateUserRequest inclut les champs étendus
    const user = await this.userService.update(id, {
      ...request,
      // Les champs étendus sont automatiquement gérés
      preferredLanguage: request.preferredLanguage,
      timezone: request.timezone,
      customField: request.customField,
    });

    return user; // ✅ ExtendedUserEntity mis à jour
  }

  /**
   * Supprimer un utilisateur
   */
  @Delete(':id')
  public async delete(@Param('id') id: string) {
    await this.userService.delete(id);
    return { message: 'User deleted successfully' };
  }
}
```

### Fichier complet : Utilisation avec AuthService

```typescript
// src/controllers/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService, SignUpRequest, SignInRequest } from '@devlab-io/nest-auth';
import { ExtendedUserEntity } from '../entities/user.entity';
import { UserService } from '@devlab-io/nest-auth';

@Controller('auth')
export class AuthController {
  public constructor(
    private readonly authService: AuthService,
    // ✅ UserService typé pour récupérer les utilisateurs avec champs étendus
    private readonly userService: UserService<ExtendedUserEntity>,
  ) {}

  /**
   * Inscription
   */
  @Post('signup')
  public async signUp(@Body() request: SignUpRequest) {
    // ✅ SignUpRequest inclut les champs étendus via module augmentation
    await this.authService.signUp(request);

    // Récupérer l'utilisateur créé pour retourner les champs étendus
    const user = await this.userService.findByEmail(request.email);
    
    return {
      message: 'User created successfully',
      user: {
        id: user?.id,
        email: user?.email,
        preferredLanguage: user?.preferredLanguage, // ✅ Champ étendu
        timezone: user?.timezone, // ✅ Champ étendu
      },
    };
  }

  /**
   * Connexion
   */
  @Post('signin')
  public async signIn(@Body() request: SignInRequest) {
    // ✅ AuthService retourne l'utilisateur avec les champs étendus
    // (si configuré correctement)
    const response = await this.authService.signIn(request);
    
    return {
      jwt: response.jwt,
      user: {
        ...response.user,
        preferredLanguage: (response.user as ExtendedUserEntity).preferredLanguage,
        timezone: (response.user as ExtendedUserEntity).timezone,
        customField: (response.user as ExtendedUserEntity).customField,
      },
      userAccount: response.userAccount,
    };
  }
}
```

---

## Comparaison avec l'approche par héritage

| Aspect | Héritage de services | Services génériques |
|--------|---------------------|---------------------|
| **Complexité** | Moyenne | Plus complexe à implémenter |
| **Flexibilité** | Limitée | Maximale |
| **Type-safety** | ✅ Bon | ✅ Excellent |
| **Refactoring nécessaire** | Minimal | Plus important |
| **Réutilisabilité** | Moyenne | Excellente |
| **Maintenance** | Plus facile | Plus complexe |

---

## Avantages de l'approche générique

1. ✅ **Pas d'héritage de services** : Utilisez directement les services de `nest-auth`
2. ✅ **Type-safe** : TypeScript garantit que les types sont corrects
3. ✅ **Flexibilité maximale** : Peut étendre n'importe quelle entité
4. ✅ **Réutilisabilité** : Les services peuvent être utilisés avec différentes entités étendues

---

## Inconvénients de l'approche générique

1. ⚠️ **Modifications nécessaires dans nest-auth** : Les services doivent être refactorés
2. ⚠️ **Complexité accrue** : Plus complexe à comprendre et maintenir
3. ⚠️ **Configuration plus complexe** : Le module doit accepter des options génériques
4. ⚠️ **Migration nécessaire** : Requiert une mise à jour de la bibliothèque

---

## Recommandation

**Si vous pouvez modifier nest-auth** : Utilisez l'approche générique (Option C avec module générique).

**Si vous ne pouvez pas modifier nest-auth** : Utilisez l'approche par héritage (document `EXTENDING_ENTITIES.md`).

L'approche générique est plus puissante mais nécessite des modifications dans la bibliothèque elle-même.

---

## Résumé des étapes

1. ✅ **Migration** : Créer une migration pour ajouter les colonnes
2. ✅ **Types** : Module augmentation pour les interfaces
3. ✅ **Entité** : Créer `ExtendedUserEntity` qui hérite de `BaseUserEntity`
4. ✅ **Module** : Configurer `AuthModule.forRoot()` avec `entities.UserEntity: ExtendedUserEntity`
5. ✅ **Utilisation** : Les services sont automatiquement typés avec `ExtendedUserEntity`

---

Fin du guide.

