import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleService } from '../services';
import { RoleDto } from '../dtos';

/**
 * Role controller
 * Provides operations for roles
 */
@ApiTags('roles')
@Controller('roles')
export class RoleController {
  /**
   * Constructor
   *
   * @param roleService - The role service
   */
  constructor(private readonly roleService: RoleService) {}

  /**
   * Get all roles
   *
   * @returns All roles
   */
  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({
    status: 200,
    description: 'Roles retrieved successfully',
    type: [RoleDto],
  })
  async getAll(): Promise<RoleDto[]> {
    return await this.roleService.getAll();
  }
}
