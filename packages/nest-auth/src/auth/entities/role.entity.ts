import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from '@devlab-io/nest-auth-types';
import { ActionEntity } from './action-token.entity';
import { ClaimEntity } from './claim.entity';

@Entity({ name: 'roles' })
export class RoleEntity implements Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', unique: true })
  name: string;

  @Column({ name: 'description', nullable: true })
  description?: string;

  @ManyToMany(() => ActionEntity, (token) => token.roles, {
    cascade: false,
  })
  actionTokens: ActionEntity[];

  @ManyToMany(() => ClaimEntity, (claim) => claim.roles, {
    cascade: false,
  })
  @JoinTable({
    name: 'role_claims',
    joinColumn: {
      name: 'role_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'claim',
      referencedColumnName: 'claim',
    },
  })
  claims: ClaimEntity[];
}
