import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Establishment } from '../types';
import { OrganisationEntity } from './organisation.entity';
import { UserAccountEntity } from './user-account.entity';

@Entity({ name: 'establishments' })
export class EstablishmentEntity implements Establishment {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique identifier of the establishment',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    example: 'Restaurant Downtown',
    description: 'Name of the establishment',
  })
  @Column()
  name: string;

  @ApiProperty({
    description: 'Organisation that owns this establishment',
    type: () => OrganisationEntity,
  })
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

  @ApiProperty({
    description: 'User accounts associated with this establishment',
    type: () => [UserAccountEntity],
  })
  @OneToMany(
    () => UserAccountEntity,
    (userAccount) => userAccount.establishment,
    {
      cascade: false,
    },
  )
  accounts: UserAccountEntity[];
}
