import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ClaimEntity, RoleEntity } from '../entities';
import {
  CreateRoleRequest,
  UpdateRoleRequest,
} from '@devlab-io/nest-auth-types';
import { ClaimService } from './claim.service';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
    private readonly claimService: ClaimService,
  ) {}

  /**
   * Create a new role
   *
   * @param request - The role creation request
   * @returns The created role with claims
   */
  async create(request: CreateRoleRequest): Promise<RoleEntity> {
    // Normalize the name to lowercase
    request.name = request.name.toLowerCase();

    // Look for the role with the same name
    const exists: boolean = await this.exists(request.name);
    if (exists) {
      throw new BadRequestException(
        `Role with name ${request.name} already exists`,
      );
    }

    // Find claim entities (claims must already exist, created during migration)
    const claims: ClaimEntity[] = await this.claimService.getClaims(
      request.claims || [],
    );

    // Create the role
    const role: RoleEntity = this.roleRepository.create({
      name: request.name,
      description: request.description,
      claims: claims,
    });

    return await this.roleRepository.save(role);
  }

  /**
   * Check if a role exists by its name
   *
   * @param name Name of the role
   * @returns True if the role exists, false otherwise
   */
  async exists(name: string): Promise<boolean> {
    const count = await this.roleRepository.count({
      where: { name },
    });
    return count > 0;
  }

  /**
   * Get a role by its name
   *
   * @param name - The name of the role
   * @returns The role with claims loaded
   * @throws NotFoundException if the role is not found
   */
  async getByName(name: string): Promise<RoleEntity> {
    // Look for the role with the given name and load claims
    const role: RoleEntity | null = await this.roleRepository.findOne({
      where: { name },
      relations: ['claims'],
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
   * @returns The roles with claims loaded
   * @throws NotFoundException if one or more roles are not found
   */
  async getByNames(names: string[]): Promise<RoleEntity[]> {
    // If no names are provided, return an empty array
    if (names.length === 0) {
      return [];
    }

    // Look for the roles with the given names and load claims
    const roles: RoleEntity[] = await this.roleRepository.find({
      where: { name: In(names) },
      relations: ['claims'],
    });

    // Check if all roles were found
    if (roles.length !== names.length) {
      const found: string[] = roles.map((r: RoleEntity) => r.name);
      const missing: string[] = names.filter(
        (name: string) => !found.includes(name),
      );
      throw new NotFoundException(
        `One or more roles not found: ${missing.join(', ')}`,
      );
    }

    // Return the roles
    return roles;
  }

  /**
   * Get all roles
   *
   * @returns All roles with claims loaded
   */
  async getAll(): Promise<RoleEntity[]> {
    return await this.roleRepository.find({
      relations: ['claims'],
      order: { name: 'ASC' },
    });
  }

  /**
   * Update a role
   *
   * @param name - The name of the role to update
   * @param request - The update request
   * @returns The updated role with claims loaded
   * @throws NotFoundException if the role is not found
   * @throws BadRequestException if the new name already exists (when renaming)
   */
  async update(name: string, request: UpdateRoleRequest): Promise<RoleEntity> {
    // Look for the role with the given name and load claims
    const role: RoleEntity | null = await this.getByName(name);

    // Check if renaming to a name that already exists
    if (request.name && request.name !== name) {
      const exists: boolean = await this.exists(request.name);
      if (exists) {
        throw new BadRequestException(
          `Role with name ${request.name} already exists`,
        );
      }
      role.name = request.name;
    }

    // Update description if provided
    if (request.description !== undefined) {
      role.description = request.description;
    }

    // Update claims if provided
    if (request.claims !== undefined) {
      role.claims = await this.claimService.getClaims(request.claims);
    }

    return await this.roleRepository.save(role);
  }

  /**
   * Delete a role by its name
   *
   * @param name - The name of the role
   * @throws NotFoundException if the role is not found
   */
  async delete(name: string): Promise<void> {
    // Look for the role with the given name
    const role: RoleEntity | null = await this.getByName(name);

    // Delete the role
    await this.roleRepository.remove(role);
  }
}
