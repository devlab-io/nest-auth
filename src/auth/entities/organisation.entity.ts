import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Organisation } from '../types';
import { EstablishmentEntity } from './establishment.entity';

@Entity({ name: 'organisations' })
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
  @Column()
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
  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @ApiProperty({
    example: '2024-02-20T10:00:00.000Z',
    description: 'Date when the organisation was last updated',
  })
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @ApiProperty({
    example: true,
    description: 'Indicates if the organisation is enabled',
  })
  @Column({ name: 'enabled', default: true })
  enabled: boolean;
}
