import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organisation } from '@devlab-io/nest-auth-types';
import { EstablishmentEntity } from './establishment.entity';

/**
 * Name of the organisation table.
 */
export const ORGANISATIONS = 'organisations';

/**
 * Base OrganisationEntity implementation.
 *
 * This entity can be extended by users to add custom fields and relations.
 * Extended entities must use the same table name ('organisations') and should
 * inherit from this class.
 *
 * @example
 * ```typescript
 * @Entity({ name: 'organisations' })
 * export class ExtendedOrganisationEntity extends OrganisationEntity {
 *   @Column({ name: 'custom_field' })
 *   customField: string;
 *
 *   @OneToMany(() => CustomEntity, (custom) => custom.organisation)
 *   customRelations: CustomEntity[];
 * }
 * ```
 *
 * Note: When extending this entity, ensure that:
 * - The table name remains 'organisations'
 * - All base fields and relations are preserved
 * - Custom migrations are created to add new columns/relations
 */
@Entity({ name: ORGANISATIONS })
export class OrganisationEntity implements Organisation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @OneToMany(
    () => EstablishmentEntity,
    (establishment) => establishment.organisation,
    {
      cascade: false,
    },
  )
  establishments: EstablishmentEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'enabled', default: true })
  enabled: boolean;
}
