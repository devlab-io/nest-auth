import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserAccount } from '@devlab-io/nest-auth-types';
import { TestOrganisationEntity } from './test-organisation.entity';
import { TestEstablishmentEntity } from './test-establishment.entity';
import { TestUserEntity } from './test-user.entity';
import { TestRoleEntity } from './test-role.entity';

/**
 * Entité de test pour UserAccountEntity qui référence TestUserEntity et TestRoleEntity
 * au lieu de UserEntity et RoleEntity pour la compatibilité SQLite
 */
@Entity({ name: 'user_accounts' })
export class TestUserAccountEntity implements UserAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TestOrganisationEntity, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organisation_id' })
  organisation?: TestOrganisationEntity;

  @ManyToOne(() => TestEstablishmentEntity, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'establishment_id' })
  establishment?: TestEstablishmentEntity;

  @ManyToOne(() => TestUserEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: TestUserEntity;

  @ManyToMany(() => TestRoleEntity, { eager: true })
  @JoinTable({
    name: 'user_account_roles',
    joinColumn: {
      name: 'user_account_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'role_id',
      referencedColumnName: 'id',
    },
  })
  roles: TestRoleEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'enabled', default: true })
  enabled: boolean;
}
