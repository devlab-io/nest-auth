import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../types';
import { UserEntity } from './user.entity';
import { ActionTokenEntity } from './action-token.entity';

@Entity({ name: 'roles' })
export class RoleEntity implements Role {
  @ApiProperty({ example: 1, description: 'Unique identifier of the role' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'admin', description: 'Name of the role' })
  @Column({ unique: true })
  name: string;

  @ApiProperty({
    example: "Donne accès à toute l'application",
    description: 'Description du role',
  })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({
    description: 'Users that have this this role',
    type: () => [UserEntity],
  })
  @ManyToMany(() => UserEntity, (user) => user.roles)
  users: UserEntity[];

  @ManyToMany(() => ActionTokenEntity, (token) => token.roles, {
    cascade: false,
  })
  actionTokens: ActionTokenEntity[];
}
