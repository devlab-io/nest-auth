import { Type } from '@nestjs/common';
import {
  EstablishmentService,
  OrganisationService,
  UserService,
} from '../services';
import {
  EstablishmentEntity,
  OrganisationEntity,
  UserEntity,
} from '../entities';

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
    UserEntity?: Type<UserEntity>;

    /**
     * Extended OrganisationEntity class.
     */
    OrganisationEntity?: Type<OrganisationEntity>;

    /**
     * Extended EstablishmentEntity class.
     */
    EstablishmentEntity?: Type<EstablishmentEntity>;
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
    UserService?: Type<UserService>;

    /**
     * Extended OrganisationService class.
     * Must extend the base OrganisationService and implement IOrganisationService.
     * If not provided, the base OrganisationService is used.
     */
    OrganisationService?: Type<OrganisationService>;

    /**
     * Extended EstablishmentService class.
     * Must extend the base EstablishmentService and implement IEstablishmentService.
     * If not provided, the base EstablishmentService is used.
     */
    EstablishmentService?: Type<EstablishmentService>;
  };
}
