import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleService } from '../services';
import { RoleDto, CreateRoleRequestDto, UpdateRoleRequestDto } from '../dtos';
import { AuthGuard } from '../guards';
import { Claims } from '../decorators';
import {
  CREATE_ANY_ROLES,
  DELETE_ANY_ROLES,
  READ_ANY_ROLES,
  UPDATE_ANY_ROLES,
  ROLES,
} from '@devlab-io/nest-auth-types/constants';

/**
 * Role controller
 * Provides operations for roles
 */
@ApiTags(ROLES)
@Controller(ROLES)
export class RoleController {
  /**
   * Constructor
   *
   * @param roleService - The role service
   */
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @UseGuards(AuthGuard)
  @Claims(CREATE_ANY_ROLES)
  public async create(
    @Body() createRoleRequest: CreateRoleRequestDto,
  ): Promise<RoleDto> {
    return await this.roleService.create(createRoleRequest);
  }

  /**
   * Get all roles
   *
   * @returns All roles
   */
  @Get()
  @UseGuards(AuthGuard)
  @Claims(READ_ANY_ROLES)
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({
    status: 200,
    description: 'Roles retrieved successfully',
    type: [RoleDto],
  })
  async getAll(): Promise<RoleDto[]> {
    return await this.roleService.getAll();
  }

  @Get(':name')
  @UseGuards(AuthGuard)
  @Claims(READ_ANY_ROLES)
  public async get(@Param('name') name: string): Promise<RoleDto> {
    return await this.roleService.getByName(name);
  }

  @Post(':name')
  @UseGuards(AuthGuard)
  @Claims(UPDATE_ANY_ROLES)
  public async update(
    @Param('name') name: string,
    @Body() updateRoleRequest: UpdateRoleRequestDto,
  ): Promise<RoleDto> {
    return await this.roleService.update(name, updateRoleRequest);
  }

  @Delete(':name')
  @UseGuards(AuthGuard)
  @Claims(DELETE_ANY_ROLES)
  public async delete(@Param('name') name: string): Promise<void> {
    return await this.roleService.delete(name);
  }
}
