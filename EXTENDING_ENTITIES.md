# Guide d'Extension des Entités et Types dans nest-auth

Ce document explique comment étendre les entités et types fournis par `nest-auth` dans votre application.

## Table des matières

1. [Migration : Ajouter des colonnes aux tables](#1-migration-ajouter-des-colonnes-aux-tables)
2. [Extension des interfaces TypeScript](#2-extension-des-interfaces-typescript)
3. [Extension des entités TypeORM](#3-extension-des-entités-typeorm)
4. [Implémentation de services étendus](#4-implémentation-de-services-étendus)
5. [Configuration du module AuthModule](#5-configuration-du-module-authmodule)
6. [Utilisation dans l'application](#6-utilisation-dans-lapplication)

---

## 1. Migration : Ajouter des colonnes aux tables

### Exemple : Ajouter des colonnes à la table `users`

Créer une nouvelle migration après celle de `nest-auth` :

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

    // Ajouter une colonne pour le champ personnalisé
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'custom_field',
        type: 'text',
        isNullable: true,
      }),
    );

    // Ajouter un index sur preferred_language si nécessaire
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

### Ajout dans le DataSource

```typescript
// src/database/datasource.ts
import { DataSource } from 'typeorm';
import {
  // Entités de nest-auth
  ActionEntity,
  CredentialEntity,
  EstablishmentEntity,
  OrganisationEntity,
  RoleEntity,
  SessionEntity,
  UserAccountEntity,
  UserEntity,
  // Votre migration de base
  CreateAuthSchema1700000000000,
  // Votre migration d'extension
  AddCustomUserFields1700000001000,
} from '@devlab-io/nest-auth';
// Vos autres entités et migrations...

const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseConfig.url,
  synchronize: databaseConfig.synchronize,
  logging: databaseConfig.logging,
  entities: [
    // Entités de nest-auth
    ActionEntity,
    CredentialEntity,
    EstablishmentEntity,
    OrganisationEntity,
    RoleEntity,
    SessionEntity,
    UserAccountEntity,
    UserEntity,
    // Vos entités étendues (voir section 3)
    ExtendedUserEntity,
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

## 2. Extension des interfaces TypeScript

### Module Augmentation : Étendre les interfaces User

Créer un fichier de déclaration de types dans votre application :

```typescript
// src/types/nest-auth-extensions.d.ts
import '@devlab-io/nest-auth';

declare module '@devlab-io/nest-auth' {
  /**
   * Extension de l'interface User avec des champs personnalisés
   */
  interface User {
    preferredLanguage?: string;
    timezone?: string;
    customField?: string;
  }

  /**
   * Extension de CreateUserRequest pour inclure les nouveaux champs
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
   * Extension de UserQueryParams pour la recherche
   */
  interface UserQueryParams {
    preferredLanguage?: string;
    timezone?: string;
    customField?: string;
  }

  /**
   * Extension de UserDto (si vous utilisez les DTOs exportés)
   * Note: Les DTOs peuvent aussi être étendus via l'héritage de classe
   */
  interface UserDto {
    preferredLanguage?: string;
    timezone?: string;
    customField?: string;
  }
}
```

**Important :** 
- Le fichier doit avoir l'extension `.d.ts`
- Il doit être inclus dans votre `tsconfig.json` dans la section `include` ou `files`
- Il doit importer le module `@devlab-io/nest-auth` pour activer le declaration merging

---

## 3. Extension des entités TypeORM

### Créer une entité User étendue

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
 * Elle doit pointer vers la même table 'users' que l'entité de base.
 */
@Entity({ name: 'users' }) // Même nom de table que l'entité de base
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
- ✅ Utilisez le même nom de table (`@Entity({ name: 'users' })`)
- ✅ Héritez de `BaseUserEntity` (l'entité de nest-auth)
- ✅ Ajoutez seulement les nouvelles colonnes avec les décorateurs `@Column`
- ✅ Les relations et colonnes de base sont héritées automatiquement
- ✅ Utilisez cette entité étendue dans votre DataSource au lieu de `UserEntity`

---

## 4. Implémentation de services étendus

### Option A : Service qui étend UserService (Héritage)

```typescript
// src/services/user.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService as BaseUserService } from '@devlab-io/nest-auth';
import { ExtendedUserEntity } from '../entities/user.entity';
import { CreateUserRequest, UpdateUserRequest } from '@devlab-io/nest-auth';

@Injectable()
export class UserService extends BaseUserService {
  /**
   * Constructeur - doit injecter le repository de l'entité étendue
   */
  public constructor(
    @InjectRepository(ExtendedUserEntity)
    private readonly extendedUserRepository: Repository<ExtendedUserEntity>,
    // Injecter les autres dépendances nécessaires depuis le constructeur parent
    // Note: Vous devrez peut-être ajuster selon l'architecture exacte
  ) {
    // Appeler le constructeur parent si nécessaire
    // Note: Ceci peut nécessiter une refonte du BaseUserService pour supporter l'héritage
    super(/* dépendances du parent */);
  }

  /**
   * Méthode pour créer un utilisateur avec les champs étendus
   */
  public async createExtended(
    request: CreateUserRequest,
  ): Promise<ExtendedUserEntity> {
    // Créer l'utilisateur avec les champs de base via le service parent
    const baseUser = await super.create(request);

    // Ensuite, mettre à jour avec les champs étendus si fournis
    if (request.preferredLanguage || request.timezone || request.customField) {
      const extended = await this.extendedUserRepository.findOne({
        where: { id: baseUser.id },
      });

      if (extended) {
        if (request.preferredLanguage !== undefined) {
          extended.preferredLanguage = request.preferredLanguage;
        }
        if (request.timezone !== undefined) {
          extended.timezone = request.timezone;
        }
        if (request.customField !== undefined) {
          extended.customField = request.customField;
        }

        return await this.extendedUserRepository.save(extended);
      }
    }

    // Retourner l'entité étendue
    return this.extendedUserRepository.findOne({
      where: { id: baseUser.id },
    }) as Promise<ExtendedUserEntity>;
  }

  /**
   * Méthode pour rechercher par langue préférée
   */
  public async findByPreferredLanguage(
    language: string,
  ): Promise<ExtendedUserEntity[]> {
    return await this.extendedUserRepository.find({
      where: { preferredLanguage: language },
      relations: ['credentials', 'actions', 'userAccounts'],
    });
  }
}
```

### Option B : Service qui utilise directement le repository (Composition)

Cette approche est plus simple et ne nécessite pas d'héritage :

```typescript
// src/services/user.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService as BaseUserService } from '@devlab-io/nest-auth';
import { ExtendedUserEntity } from '../entities/user.entity';
import {
  CreateUserRequest,
  UpdateUserRequest,
  UserEntity,
} from '@devlab-io/nest-auth';

@Injectable()
export class ExtendedUserService {
  public constructor(
    private readonly baseUserService: BaseUserService, // Utiliser le service de base
    @InjectRepository(ExtendedUserEntity)
    private readonly userRepository: Repository<ExtendedUserEntity>,
  ) {}

  /**
   * Créer un utilisateur avec les champs étendus
   */
  public async create(
    request: CreateUserRequest,
  ): Promise<ExtendedUserEntity> {
    // Créer l'utilisateur via le service de base (gère username, validation, etc.)
    const baseUser = await this.baseUserService.create(request);

    // Récupérer l'entité étendue et mettre à jour avec les champs personnalisés
    const extended = await this.userRepository.findOne({
      where: { id: baseUser.id },
    });

    if (!extended) {
      throw new Error('Extended user entity not found');
    }

    // Mettre à jour avec les champs étendus
    if (request.preferredLanguage !== undefined) {
      extended.preferredLanguage = request.preferredLanguage;
    }
    if (request.timezone !== undefined) {
      extended.timezone = request.timezone;
    }
    if (request.customField !== undefined) {
      extended.customField = request.customField;
    }

    // Sauvegarder et retourner
    return await this.userRepository.save(extended);
  }

  /**
   * Mettre à jour un utilisateur avec les champs étendus
   */
  public async update(
    id: string,
    request: UpdateUserRequest,
  ): Promise<ExtendedUserEntity> {
    // Mettre à jour via le service de base
    const baseUser = await this.baseUserService.update(id, request);

    // Récupérer l'entité étendue
    const extended = await this.userRepository.findOne({
      where: { id },
    });

    if (!extended) {
      throw new Error('Extended user entity not found');
    }

    // Mettre à jour avec les champs étendus
    if (request.preferredLanguage !== undefined) {
      extended.preferredLanguage = request.preferredLanguage;
    }
    if (request.timezone !== undefined) {
      extended.timezone = request.timezone;
    }
    if (request.customField !== undefined) {
      extended.customField = request.customField;
    }

    return await this.userRepository.save(extended);
  }

  /**
   * Récupérer un utilisateur avec tous les champs étendus
   */
  public async findById(id: string): Promise<ExtendedUserEntity> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['credentials', 'actions', 'userAccounts'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Rechercher par langue préférée
   */
  public async findByPreferredLanguage(
    language: string,
  ): Promise<ExtendedUserEntity[]> {
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

    // Filtres de base (exemple)
    if (params.email) {
      queryBuilder.andWhere('user.email ILIKE :email', {
        email: `%${params.email}%`,
      });
    }

    // Filtres étendus
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

  /**
   * Déléguer les méthodes du service de base si nécessaire
   */
  public async findByEmail(email: string): Promise<ExtendedUserEntity | null> {
    const baseUser = await this.baseUserService.findByEmail(email);
    if (!baseUser) {
      return null;
    }

    return await this.userRepository.findOne({
      where: { id: baseUser.id },
      relations: ['credentials', 'actions', 'userAccounts'],
    });
  }

  // Vous pouvez exposer d'autres méthodes du baseUserService selon vos besoins
}
```

---

## 5. Configuration du module AuthModule

### Configuration dans AppModule

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@devlab-io/nest-auth';
import { ExtendedUserEntity } from './entities/user.entity';
import { ExtendedUserService } from './services/user.service';

@Module({
  imports: [
    // Configurer TypeORM avec vos entités étendues
    TypeOrmModule.forRoot({
      // ... votre configuration DataSource
      // Les entités sont chargées via le DataSource
    }),

    // Importer les entités étendues dans TypeORM
    TypeOrmModule.forFeature([
      ExtendedUserEntity, // Utiliser l'entité étendue au lieu de UserEntity
      // Vos autres entités...
    ]),

    // Importer le module AuthModule de nest-auth
    AuthModule.forRoot({
      // Configuration du module auth si nécessaire
    }),

    // Vos autres modules...
  ],
  providers: [
    // Fournir votre service étendu
    ExtendedUserService,
    // Vos autres providers...
  ],
  exports: [
    ExtendedUserService,
    // ...
  ],
  controllers: [
    // Vos contrôleurs...
  ],
})
export class AppModule {}
```

**Important :**
- ✅ `AuthModule.forRoot()` enregistre ses propres entités dans TypeORM
- ✅ Vous devez aussi enregistrer `ExtendedUserEntity` via `TypeOrmModule.forFeature()`
- ✅ TypeORM utilisera `ExtendedUserEntity` car elle est enregistrée en dernier (ou parce qu'elle étend la classe de base)
- ⚠️ Assurez-vous que les deux entités pointent vers la même table

### Alternative : Forcer l'utilisation de l'entité étendue

Si vous voulez vous assurer que toute l'application utilise `ExtendedUserEntity` :

```typescript
// src/app.module.ts
import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@devlab-io/nest-auth';
import { ExtendedUserEntity } from './entities/user.entity';
import { ExtendedUserService } from './services/user.service';

@Global() // Si vous voulez que le module soit global
@Module({
  imports: [
    AuthModule.forRoot({
      // Le module auth enregistre ses entités de base
    }),

    // Enregistrer l'entité étendue après le module auth
    // TypeORM utilisera l'entité étendue pour la table 'users'
    TypeOrmModule.forFeature([ExtendedUserEntity]),
  ],
  providers: [
    {
      // Remplacer UserService par votre service étendu
      provide: 'ExtendedUserService', // Ou utiliser un token symbolique
      useClass: ExtendedUserService,
    },
  ],
})
export class AppModule {}
```

---

## 6. Utilisation dans l'application

### Exemple : Créer un utilisateur avec des champs étendus

```typescript
// src/controllers/user.controller.ts
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ExtendedUserService } from '../services/user.service';
import { CreateUserRequest } from '@devlab-io/nest-auth';

@Controller('users')
export class UserController {
  public constructor(
    private readonly userService: ExtendedUserService,
  ) {}

  /**
   * Créer un utilisateur avec des champs étendus
   */
  @Post()
  public async create(@Body() request: CreateUserRequest) {
    // Le type CreateUserRequest inclut maintenant vos champs étendus
    // grâce au module augmentation (preferredLanguage, timezone, customField)
    
    const user = await this.userService.create({
      email: 'user@example.com',
      acceptedTerms: true,
      acceptedPrivacyPolicy: true,
      enabled: true,
      // Champs de base
      firstName: 'John',
      lastName: 'Doe',
      // Champs étendus
      preferredLanguage: 'en',
      timezone: 'America/New_York',
      customField: 'Some custom data',
    });

    return user; // Retourne ExtendedUserEntity avec tous les champs
  }

  /**
   * Récupérer un utilisateur
   */
  @Get(':id')
  public async findById(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    
    // user.preferredLanguage, user.timezone, user.customField sont disponibles
    return user;
  }

  /**
   * Rechercher par langue préférée
   */
  @Get('by-language/:language')
  public async findByLanguage(@Param('language') language: string) {
    return await this.userService.findByPreferredLanguage(language);
  }
}
```

### Exemple : Utiliser avec AuthService

Si vous voulez que `AuthService` retourne aussi les champs étendus :

```typescript
// src/services/auth-extension.service.ts
import { Injectable } from '@nestjs/common';
import { AuthService, SignUpRequest } from '@devlab-io/nest-auth';
import { ExtendedUserService } from './user.service';

@Injectable()
export class AuthExtensionService {
  public constructor(
    private readonly authService: AuthService,
    private readonly userService: ExtendedUserService,
  ) {}

  /**
   * Inscription avec champs étendus
   */
  public async signUp(request: SignUpRequest) {
    // Utiliser le service auth de base pour la logique métier
    await this.authService.signUp(request);

    // Récupérer l'utilisateur créé
    const user = await this.userService.findByEmail(request.email);
    
    if (user && (request.preferredLanguage || request.timezone)) {
      // Mettre à jour avec les champs étendus
      return await this.userService.update(user.id, {
        preferredLanguage: request.preferredLanguage,
        timezone: request.timezone,
        customField: (request as any).customField,
      });
    }

    return user;
  }
}
```

### Exemple : Validation avec class-validator

```typescript
// src/dto/create-user-extended.dto.ts
import { IsOptional, IsString, Length, IsIn } from 'class-validator';
import { CreateUserRequestDto } from '@devlab-io/nest-auth';

export class CreateUserExtendedDto extends CreateUserRequestDto {
  @IsOptional()
  @IsString()
  @Length(2, 10)
  @IsIn(['fr', 'en', 'es', 'de']) // Exemple de validation
  preferredLanguage?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  customField?: string;
}
```

---

## Résumé des étapes

1. ✅ **Migration** : Créer une migration pour ajouter les colonnes à la table `users`
2. ✅ **Types** : Créer un fichier `.d.ts` pour étendre les interfaces via module augmentation
3. ✅ **Entité** : Créer `ExtendedUserEntity` qui hérite de `UserEntity`
4. ✅ **Service** : Créer `ExtendedUserService` qui utilise le repository de l'entité étendue
5. ✅ **Module** : Configurer `AppModule` pour utiliser l'entité étendue
6. ✅ **Utilisation** : Utiliser le service étendu dans vos contrôleurs

---

## Points d'attention

### ✅ Bonnes pratiques

- Utilisez toujours le même nom de table dans `@Entity({ name: 'users' })`
- Ajoutez les migrations d'extension après la migration de base
- Utilisez le module augmentation pour les interfaces TypeScript
- Documentez vos extensions dans votre application

### ⚠️ Limitations actuelles

- Les services de `nest-auth` retournent `UserEntity`, pas `ExtendedUserEntity`
- Vous devrez mapper ou convertir si vous voulez les champs étendus partout
- Les relations TypeORM doivent être testées avec les entités étendues

### 🔮 Améliorations futures possibles

- Support natif des entités étendues dans `AuthModule.forRoot()`
- Services génériques qui acceptent des entités étendues
- Documentation automatique des extensions dans Swagger

---

## Exemple complet : Utilisation typique

```typescript
// src/main.ts (point d'entrée de l'application)
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@devlab-io/nest-auth';
import { ExtendedUserEntity } from './entities/user.entity';
import { ExtendedUserService } from './services/user.service';
import { UserController } from './controllers/user.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      // Configuration de votre DataSource
    }),
    TypeOrmModule.forFeature([ExtendedUserEntity]),
    AuthModule.forRoot(),
  ],
  providers: [ExtendedUserService],
  controllers: [UserController],
})
export class AppModule {}
```

Avec cette configuration, vous pouvez :
- ✅ Créer des utilisateurs avec des champs personnalisés
- ✅ Rechercher par champs personnalisés
- ✅ Utiliser tous les services de `nest-auth` pour l'authentification
- ✅ Étendre d'autres entités de la même manière

---

## Questions fréquentes

**Q: Puis-je étendre plusieurs entités ?**  
R: Oui, vous pouvez étendre `UserEntity`, `UserAccountEntity`, `OrganisationEntity`, etc. de la même manière.

**Q: Que se passe-t-il si je ne crée pas de migration ?**  
R: TypeORM en mode `synchronize: true` créera les colonnes, mais ce n'est pas recommandé en production.

**Q: Les relations fonctionnent-elles avec les entités étendues ?**  
R: Oui, les relations sont héritées et fonctionnent normalement.

**Q: Puis-je modifier les colonnes existantes ?**  
R: Oui, via une migration qui utilise `ALTER TABLE ... ALTER COLUMN ...`.

---

Fin du guide.

