import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique identifier of the organisation',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'Restaurant Group Inc.',
    description: 'Name of the organisation',
  })
  @Column({ name: 'name' })
  name: string;

  @ApiProperty({
    description: 'Establishments belonging to this organisation',
    type: () => [EstablishmentEntity],
  })
  @OneToMany(
    () => EstablishmentEntity,
    (establishment) => establishment.organisation,
    {
      cascade: false,
    },
  )
  establishments: EstablishmentEntity[];

  @ApiProperty({
    example: '2024-02-20T10:00:00.000Z',
    description: 'Date when the organisation was created',
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({
    example: '2024-02-20T10:00:00.000Z',
    description: 'Date when the organisation was last updated',
  })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ApiProperty({
    example: true,
    description: 'Indicates if the organisation is enabled',
  })
  @Column({ name: 'enabled', default: true })
  enabled: boolean;
}
