import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Establishment } from '@devlab-io/nest-auth-types';
import { OrganisationEntity } from './organisation.entity';
import { UserAccountEntity } from './user-account.entity';

/**
 * Name of the establishment table.
 */
export const ESTABLISHMENTS = 'establishments';

/**
 * Base EstablishmentEntity implementation.
 *
 * This entity can be extended by users to add custom fields and relations.
 * Extended entities must use the same table name ('establishments') and should
 * inherit from this class.
 *
 * @example
 * ```typescript
 * @Entity({ name: 'establishments' })
 * export class ExtendedEstablishmentEntity extends EstablishmentEntity {
 *   @Column({ name: 'custom_field' })
 *   customField: string;
 *
 *   @OneToMany(() => CustomEntity, (custom) => custom.establishment)
 *   customRelations: CustomEntity[];
 * }
 * ```
 *
 * Note: When extending this entity, ensure that:
 * - The table name remains 'establishments'
 * - All base fields and relations are preserved
 * - Custom migrations are created to add new columns/relations
 */
@Entity({ name: ESTABLISHMENTS })
export class EstablishmentEntity implements Establishment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @ManyToOne(
    () => OrganisationEntity,
    (organisation) => organisation.establishments,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'organisation_id' })
  organisation: OrganisationEntity;

  @OneToMany(
    () => UserAccountEntity,
    (userAccount) => userAccount.establishment,
    {
      cascade: false,
    },
  )
  accounts: UserAccountEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'enabled', default: true })
  enabled: boolean;
}
