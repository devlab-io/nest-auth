import { Type, Provider } from '@nestjs/common';
import {
  EstablishmentEntity,
  OrganisationEntity,
  UserEntity,
} from '../entities';
import { DeepPartial } from 'typeorm';

/**
 * Configuration for extended entities
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
      };
      return result;
    },
  };
}
