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
import { TestOrganisationEntity } from './test-organisation.entity';
import { TestUserAccountEntity } from './test-user-account.entity';

/**
 * Entité de test pour EstablishmentEntity qui référence TestUserAccountEntity
 * au lieu de UserAccountEntity pour la compatibilité SQLite
 */
@Entity({ name: 'establishments' })
export class TestEstablishmentEntity implements Establishment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @ManyToOne(
    () => TestOrganisationEntity,
    (organisation) => organisation.establishments,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'organisation_id' })
  organisation: TestOrganisationEntity;

  @OneToMany(
    () => TestUserAccountEntity,
    (userAccount) => userAccount.establishment,
    {
      cascade: false,
    },
  )
  accounts: TestUserAccountEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'enabled', default: true })
  enabled: boolean;
}
