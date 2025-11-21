import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
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
}
