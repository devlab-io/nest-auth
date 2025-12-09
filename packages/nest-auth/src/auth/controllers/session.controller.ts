import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SessionService } from '../services';
import { SessionQueryParams } from '@devlab-io/nest-auth-types';
import { SessionDto, DeleteSessionsResponseDto } from '../dtos';
import {
  READ_ANY_SESSIONS,
  READ_ORG_SESSIONS,
  READ_EST_SESSIONS,
  READ_OWN_SESSIONS,
  DELETE_ANY_SESSIONS,
  DELETE_ORG_SESSIONS,
  DELETE_EST_SESSIONS,
  DELETE_OWN_SESSIONS,
  SESSIONS,
} from '@devlab-io/nest-auth-types/constants';
import { Claims } from '../decorators/claims';
import { AuthGuard } from '../guards';

/**
 * Session controller
 * Provides endpoints to manage and query user sessions
 */
@ApiTags(SESSIONS)
@Controller(SESSIONS)
export class SessionController {
  /**
   * Constructor
   *
   * @param sessionService - The session service
   */
  constructor(private readonly sessionService: SessionService) {}

  /**
   * Search sessions with filters
   *
   * @param query - The query parameters
   * @returns Array of sessions
   */
  @Get()
  @UseGuards(AuthGuard)
  @Claims(
    READ_ANY_SESSIONS,
    READ_ORG_SESSIONS,
    READ_EST_SESSIONS,
    READ_OWN_SESSIONS,
  )
  @ApiOperation({ summary: 'Search sessions with filters' })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'loginDate', required: false, type: Date })
  @ApiQuery({ name: 'expirationDate', required: false, type: Date })
  @ApiQuery({
    name: 'active',
    required: false,
    type: Boolean,
    description: 'Only active (not expired) sessions',
  })
  @ApiResponse({ status: 200, type: [SessionDto] })
  async search(@Query() query: SessionQueryParams): Promise<SessionDto[]> {
    return await this.sessionService.search(query);
  }

  /**
   * Get all active sessions (not expired)
   *
   * @returns Array of active sessions
   */
  @Get('active')
  @UseGuards(AuthGuard)
  @Claims(
    READ_ANY_SESSIONS,
    READ_ORG_SESSIONS,
    READ_EST_SESSIONS,
    READ_OWN_SESSIONS,
  )
  @ApiOperation({ summary: 'Get all active sessions' })
  @ApiResponse({ status: 200, type: [SessionDto] })
  async findAllActive(): Promise<SessionDto[]> {
    return await this.sessionService.findAllActive();
  }

  /**
   * Get a session by token
   *
   * @param token - The JWT token
   * @returns The session
   */
  @Get(':token')
  @UseGuards(AuthGuard)
  @Claims(
    READ_ANY_SESSIONS,
    READ_ORG_SESSIONS,
    READ_EST_SESSIONS,
    READ_OWN_SESSIONS,
  )
  @ApiOperation({ summary: 'Get a session by token' })
  @ApiParam({ name: 'token', type: String })
  @ApiResponse({ status: 200, type: SessionDto })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getByToken(@Param('token') token: string): Promise<SessionDto> {
    return await this.sessionService.getByToken(token);
  }

  /**
   * Delete a session by token
   *
   * @param token - The JWT token
   */
  @Delete(':token')
  @UseGuards(AuthGuard)
  @Claims(
    DELETE_ANY_SESSIONS,
    DELETE_ORG_SESSIONS,
    DELETE_EST_SESSIONS,
    DELETE_OWN_SESSIONS,
  )
  @ApiOperation({ summary: 'Delete a session by token' })
  @ApiParam({ name: 'token', type: String })
  @ApiResponse({ status: 200, description: 'Session deleted' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async deleteByToken(@Param('token') token: string): Promise<void> {
    return await this.sessionService.deleteByToken(token);
  }

  /**
   * Delete all expired sessions
   *
   * @returns Number of deleted sessions
   */
  @Delete('expired')
  @UseGuards(AuthGuard)
  @Claims(
    DELETE_ANY_SESSIONS,
    DELETE_ORG_SESSIONS,
    DELETE_EST_SESSIONS,
    DELETE_OWN_SESSIONS,
  )
  @ApiOperation({ summary: 'Delete all expired sessions' })
  @ApiResponse({
    status: 200,
    description: 'Number of deleted sessions',
    type: DeleteSessionsResponseDto,
  })
  async deleteExpired(): Promise<DeleteSessionsResponseDto> {
    const count = await this.sessionService.deleteExpired();
    return { count };
  }
}
