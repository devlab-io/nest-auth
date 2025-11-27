import { Type, Provider } from '@nestjs/common';
import {
  EstablishmentService,
  OrganisationService,
  UserService,
  DefaultUserService,
  DefaultOrganisationService,
  DefaultEstablishmentService,
} from '../services';
import {
  EstablishmentEntity,
  OrganisationEntity,
  UserEntity,
} from '../entities';
import { DeepPartial } from 'typeorm';

/**
 * Configuration for extended services and entities
 */
export interface ExtentedConfig {
  /**
   * Extended entities
   */
  entities: {
    /**
     * Extended UserEntity class.
     */
    UserEntity: Type<UserEntity>;

    /**
     * Extended OrganisationEntity class.
     */
    OrganisationEntity: Type<OrganisationEntity>;

    /**
     * Extended EstablishmentEntity class.
     */
    EstablishmentEntity: Type<EstablishmentEntity>;
  };

  /**
   * Extended servicies
   */
  services: {
    /**
     * Extended UserService class.
     * Must extend the base UserService and implement IUserService.
     * If not provided, the base UserService is used.
     */
    UserService: Type<UserService>;

    /**
     * Extended OrganisationService class.
     * Must extend the base OrganisationService and implement IOrganisationService.
     * If not provided, the base OrganisationService is used.
     */
    OrganisationService: Type<OrganisationService>;

    /**
     * Extended EstablishmentService class.
     * Must extend the base EstablishmentService and implement IEstablishmentService.
     * If not provided, the base EstablishmentService is used.
     */
    EstablishmentService: Type<EstablishmentService>;
  };
}

/**
 * Token used to inject the ExtendedConfig.
 */
export const ExtendedConfigToken: symbol = Symbol('ExtendedConfig');

/**
 * Provide the extended configuration
 *
 * @param config - Optional extended configuration
 * @returns Provider for ExtendedConfig
 */
export function provideExtendedConfig(
  config?: DeepPartial<ExtentedConfig>,
): Provider {
  return {
    provide: ExtendedConfigToken,
    useFactory: (): ExtentedConfig => {
      const configEntities = config?.entities;
      const configServices = config?.services;

      const result: ExtentedConfig = {
        entities: {
          // by default entities are not extended
          UserEntity:
            (configEntities?.UserEntity as typeof UserEntity) || UserEntity,
          OrganisationEntity:
            (configEntities?.OrganisationEntity as typeof OrganisationEntity) ||
            OrganisationEntity,
          EstablishmentEntity:
            (configEntities?.EstablishmentEntity as typeof EstablishmentEntity) ||
            EstablishmentEntity,
        },
        services: {
          // by default services are not extended
          UserService:
            (configServices?.UserService as typeof DefaultUserService) ||
            DefaultUserService,
          OrganisationService:
            (configServices?.OrganisationService as typeof DefaultOrganisationService) ||
            DefaultOrganisationService,
          EstablishmentService:
            (configServices?.EstablishmentService as typeof DefaultEstablishmentService) ||
            DefaultEstablishmentService,
        },
      };
      return result;
    },
  };
}
