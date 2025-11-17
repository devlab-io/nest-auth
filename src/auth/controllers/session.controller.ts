import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SessionService } from '../services/session.service';
import { SessionEntity } from '../entities';
import { SessionQueryParams } from '../types';

/**
 * Session controller
 * Provides endpoints to manage and query user sessions
 */
@ApiTags('sessions')
@Controller('sessions')
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
  @ApiResponse({ status: 200, type: [SessionEntity] })
  async search(@Query() query: SessionQueryParams): Promise<SessionEntity[]> {
    return await this.sessionService.search(query);
  }

  /**
   * Get all active sessions (not expired)
   *
   * @returns Array of active sessions
   */
  @Get('active')
  @ApiOperation({ summary: 'Get all active sessions' })
  @ApiResponse({ status: 200, type: [SessionEntity] })
  async findAllActive(): Promise<SessionEntity[]> {
    return await this.sessionService.findAllActive();
  }

  /**
   * Get a session by token
   *
   * @param token - The JWT token
   * @returns The session
   */
  @Get(':token')
  @ApiOperation({ summary: 'Get a session by token' })
  @ApiParam({ name: 'token', type: String })
  @ApiResponse({ status: 200, type: SessionEntity })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getByToken(@Param('token') token: string): Promise<SessionEntity> {
    return await this.sessionService.getByToken(token);
  }

  /**
   * Delete a session by token
   *
   * @param token - The JWT token
   */
  @Delete(':token')
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
  @ApiOperation({ summary: 'Delete all expired sessions' })
  @ApiResponse({ status: 200, description: 'Number of deleted sessions' })
  async deleteExpired(): Promise<{ count: number }> {
    const count = await this.sessionService.deleteExpired();
    return { count };
  }
}
