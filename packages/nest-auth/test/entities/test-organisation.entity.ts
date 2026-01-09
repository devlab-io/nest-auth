import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organisation } from '@devlab-io/nest-auth-types';
import { TestEstablishmentEntity } from './test-establishment.entity';

/**
 * Entité de test pour OrganisationEntity qui référence TestEstablishmentEntity
 * au lieu de EstablishmentEntity pour la compatibilité SQLite
 */
@Entity({ name: 'organisations' })
export class TestOrganisationEntity implements Organisation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name' })
  name: string;

  @OneToMany(
    () => TestEstablishmentEntity,
    (establishment) => establishment.organisation,
    {
      cascade: false,
    },
  )
  establishments: TestEstablishmentEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'enabled', default: true })
  enabled: boolean;
}
