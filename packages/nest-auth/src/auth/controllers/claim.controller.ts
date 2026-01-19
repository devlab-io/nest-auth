import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClaimService } from '../services';
import { ClaimDto } from '../dtos';
import { AuthGuard } from '../guards';
import { Claims } from '../decorators';
import { CLAIMS, READ_ANY_CLAIMS } from '@devlab-io/nest-auth-types/constants';

/**
 * Claim controller
 * Provides operations for claims
 */
@ApiTags(CLAIMS)
@Controller(CLAIMS)
export class ClaimController {
  /**
   * Constructor
   *
   * @param claimService - The claim service
   */
  constructor(private readonly claimService: ClaimService) {}

  /**
   * Get all claims
   *
   * @returns All claims
   */
  @Get()
  @UseGuards(AuthGuard)
  @Claims(READ_ANY_CLAIMS)
  @ApiOperation({ summary: 'Get all claims' })
  @ApiResponse({
    status: 200,
    description: 'Claims retrieved successfully',
    type: [ClaimDto],
  })
  async getAll(): Promise<ClaimDto[]> {
    return await this.claimService.getAll();
  }

  /**
   * Get a claim by its representation (string, Claim object, or tuple)
   *
   * @param claim - Claim as string (format: "action:scope:resource")
   * @returns The claim entity
   */
  @Get(':claim')
  @UseGuards(AuthGuard)
  @Claims(READ_ANY_CLAIMS)
  @ApiOperation({ summary: 'Get a claim by its string representation' })
  @ApiParam({
    name: 'claim',
    description:
      'Claim string in format "action:scope:resource" (e.g., "read:any:users")',
    example: 'read:any:users',
  })
  @ApiResponse({
    status: 200,
    description: 'Claim retrieved successfully',
    type: ClaimDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Claim not found',
  })
  async getByClaim(@Param('claim') claim: string): Promise<ClaimDto> {
    return await this.claimService.getByClaim(claim);
  }
}
