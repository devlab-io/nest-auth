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
import { OrganisationEntity } from './organisation.entity';
import { EstablishmentEntity } from './establishment.entity';
import { UserEntity } from './user.entity';
import { RoleEntity } from './role.entity';

@Entity({ name: 'user_accounts' })
export class UserAccountEntity implements UserAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => OrganisationEntity, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organisation_id' })
  organisation?: OrganisationEntity;

  @ManyToOne(() => EstablishmentEntity, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'establishment_id' })
  establishment?: EstablishmentEntity;

  @ManyToOne(() => UserEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToMany(() => RoleEntity, { eager: true })
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
  roles: RoleEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'enabled', default: true })
  enabled: boolean;
}
