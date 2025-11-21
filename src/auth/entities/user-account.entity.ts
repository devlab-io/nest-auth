import {
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserAccount } from '../types';
import { OrganisationEntity } from './organisation.entity';
import { EstablishmentEntity } from './establishment.entity';
import { UserEntity } from './user.entity';
import { RoleEntity } from './role.entity';

@Entity({ name: 'user_accounts' })
export class UserAccountEntity implements UserAccount {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique identifier of the user account',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Organisation this user account belongs to',
    type: () => OrganisationEntity,
  })
  @ManyToOne(() => OrganisationEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organisation_id' })
  organisation: OrganisationEntity;

  @ApiProperty({
    description: 'Establishment this user account belongs to',
    type: () => EstablishmentEntity,
  })
  @ManyToOne(() => EstablishmentEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'establishment_id' })
  establishment: EstablishmentEntity;

  @ApiProperty({
    description: 'User associated with this account',
    type: () => UserEntity,
  })
  @ManyToOne(() => UserEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ApiProperty({
    description: 'Roles assigned to this user account',
    type: () => [RoleEntity],
  })
  @ManyToMany(() => RoleEntity, { eager: true })
  @JoinTable({
    name: 'user_account_roles',
    joinColumn: {
      name: 'userAccountId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'roleId',
      referencedColumnName: 'id',
    },
  })
  roles: RoleEntity[];
}
