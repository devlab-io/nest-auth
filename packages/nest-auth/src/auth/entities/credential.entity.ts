import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Credential } from '@devlab-io/nest-auth-types';
import { UserEntity } from './user.entity';

@Entity({ name: 'credentials' })
export class CredentialEntity implements Credential {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'type', type: 'varchar' })
  type: 'password' | 'google';

  @Column({ name: 'password', nullable: true })
  password?: string;

  @Column({ name: 'google_id', nullable: true })
  googleId?: string;

  @ManyToOne(() => UserEntity, (user) => user.credentials, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
