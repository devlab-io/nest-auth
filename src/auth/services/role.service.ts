import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { RoleEntity } from '../entities';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}

  /**
   * Create a new role
   *
   * @param name - The name of the role
   * @param description - The description of the role
   * @returns The role
   */
  async create(name: string, description?: string): Promise<RoleEntity> {
    // Look for the role with the same name
    let role: RoleEntity | null = await this.roleRepository.findOne({
      where: { name },
    });
    if (role) {
      throw new BadRequestException(`Role with name ${name} already exists`);
    }

    // Create the role
    role = this.roleRepository.create({ name, description });
    return await this.roleRepository.save(role);
  }

  /**
   * Get a role by its name
   *
   * @param name - The name of the role
   * @returns The role
   * @throws NotFoundException if the role is not found
   */
  async getByName(name: string): Promise<RoleEntity> {
    // Look for the role with the given name
    const role: RoleEntity | null = await this.roleRepository.findOne({
      where: { name },
    });

    // If the role is not found, throw an error
    if (!role) {
      throw new NotFoundException(`Role with name ${name} not found`);
    }

    // Return the role
    return role;
  }

  /**
   * Get all roles by their names
   *
   * @param names - The names of the roles
   * @returns The roles
   * @throws NotFoundException if one or more roles are not found
   */
  async getAllByNames(names: string[]): Promise<RoleEntity[]> {
    // If no names are provided, return an empty array
    if (names.length === 0) {
      return [];
    }

    // Look for the roles with the given names
    const roles: RoleEntity[] = await this.roleRepository.find({
      where: { name: In(names) },
    });

    // Check if all roles were found
    if (roles.length !== names.length) {
      throw new NotFoundException(`One or more roles not found`);
    }

    // Return the roles
    return roles;
  }

  /**
   * Delete a role by its name
   *
   * @param name - The name of the role
   * @throws NotFoundException if the role is not found
   */
  async delete(name: string): Promise<void> {
    // Look for the role with the given name
    const role: RoleEntity | null = await this.roleRepository.findOne({
      where: { name },
    });

    // If the role is not found, throw an error
    if (!role) {
      throw new NotFoundException(`Role with name ${name} not found`);
    }

    // Delete the role
    await this.roleRepository.remove(role);
  }
}
