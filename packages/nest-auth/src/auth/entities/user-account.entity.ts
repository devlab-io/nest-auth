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
import { ApiProperty } from '@nestjs/swagger';
import { UserAccount } from '@devlab-io/nest-auth-types';
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
    required: false,
  })
  @ManyToOne(() => OrganisationEntity, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organisation_id' })
  organisation?: OrganisationEntity;

  @ApiProperty({
    description: 'Establishment this user account belongs to',
    type: () => EstablishmentEntity,
    required: false,
  })
  @ManyToOne(() => EstablishmentEntity, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'establishment_id' })
  establishment?: EstablishmentEntity;

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
      name: 'user_account_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'role_id',
      referencedColumnName: 'id',
    },
  })
  roles: RoleEntity[];

  @ApiProperty({
    example: '2024-02-20T10:00:00.000Z',
    description: 'Date when the user account was created',
  })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({
    example: '2024-02-20T10:00:00.000Z',
    description: 'Date when the user account was last updated',
  })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ApiProperty({
    example: true,
    description: 'Indicates if the user account is enabled',
  })
  @Column({ name: 'enabled', default: true })
  enabled: boolean;
}
