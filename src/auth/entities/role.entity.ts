import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../types';
import { ActionEntity } from './action-token.entity';

@Entity({ name: 'roles' })
export class RoleEntity implements Role {
  @ApiProperty({ example: 1, description: 'Unique identifier of the role' })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'admin', description: 'Name of the role' })
  @Column({ name: 'name', unique: true })
  name: string;

  @ApiProperty({
    example: "Donne accès à toute l'application",
    description: 'Description du role',
  })
  @Column({ name: 'description', nullable: true })
  description?: string;

  @ManyToMany(() => ActionEntity, (token) => token.roles, {
    cascade: false,
  })
  actionTokens: ActionEntity[];
}
