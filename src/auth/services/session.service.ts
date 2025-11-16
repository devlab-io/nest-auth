import { Repository } from 'typeorm';
import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SessionEntity } from '../entities';
import { SessionQueryParams } from '../types';
import { JwtConfig, JwtConfigToken } from '../config/jwt.config';

@Injectable()
export class SessionService {
  private readonly logger: Logger = new Logger(SessionService.name);

  public constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
    @Inject(JwtConfigToken) private readonly jwtConfig: JwtConfig,
  ) {}

  /**
   * Create a new session
   *
   * @param token - The JWT token
   * @param userId - The user ID
   * @returns The created session
   */
  public async create(token: string, userId: string): Promise<SessionEntity> {
    // Calculate expiration date from expiresIn
    const expirationDate = this.calculateExpirationDate(
      this.jwtConfig.jwt.expiresIn,
    );

    // Create session
    let session: SessionEntity = this.sessionRepository.create({
      token,
      userId,
      loginDate: new Date(),
      expirationDate,
    });

    // Save session
    session = await this.sessionRepository.save(session);

    // Log
    this.logger.debug(`Session created for user ${userId}`);

    // Done
    return session;
  }

  /**
   * Find a session by token
   *
   * @param token - The JWT token
   * @returns The session or null if not found
   */
  public async findByToken(token: string): Promise<SessionEntity | null> {
    return await this.sessionRepository.findOne({
      where: { token },
      relations: ['user'],
    });
  }

  /**
   * Get a session by token
   *
   * @param token - The JWT token
   * @returns The session
   * @throws NotFoundException if the session is not found
   */
  public async getByToken(token: string): Promise<SessionEntity> {
    const session = await this.findByToken(token);
    if (!session) {
      throw new NotFoundException(`Session with token not found`);
    }
    return session;
  }

  /**
   * Delete a session by token
   *
   * @param token - The JWT token
   * @throws NotFoundException if the session is not found
   */
  public async deleteByToken(token: string): Promise<void> {
    const session = await this.getByToken(token);
    await this.sessionRepository.remove(session);
    this.logger.debug(`Session deleted for token`);
  }

  /**
   * Find all sessions for a user
   *
   * @param userId - The user ID
   * @returns Array of sessions
   */
  public async findByUserId(userId: string): Promise<SessionEntity[]> {
    return await this.sessionRepository.find({
      where: { userId },
      relations: ['user'],
      order: { loginDate: 'DESC' },
    });
  }

  /**
   * Find all active sessions for a user (not expired)
   *
   * @param userId - The user ID
   * @returns Array of active sessions
   */
  public async findActiveByUserId(userId: string): Promise<SessionEntity[]> {
    const now = new Date();
    return await this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.user', 'user')
      .where('session.userId = :userId', { userId })
      .andWhere('session.expirationDate > :now', { now })
      .orderBy('session.loginDate', 'DESC')
      .getMany();
  }

  /**
   * Search sessions with filters
   *
   * @param params - The query parameters
   * @returns Array of sessions
   */
  public async search(params: SessionQueryParams): Promise<SessionEntity[]> {
    const queryBuilder = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.user', 'user');

    if (params.userId) {
      queryBuilder.andWhere('session.userId = :userId', {
        userId: params.userId,
      });
    }

    if (params.loginDate) {
      queryBuilder.andWhere('session.loginDate >= :loginDate', {
        loginDate: params.loginDate,
      });
    }

    if (params.expirationDate) {
      queryBuilder.andWhere('session.expirationDate <= :expirationDate', {
        expirationDate: params.expirationDate,
      });
    }

    if (params.active === true) {
      const now = new Date();
      queryBuilder.andWhere('session.expirationDate > :now', { now });
    }

    queryBuilder.orderBy('session.loginDate', 'DESC');

    return await queryBuilder.getMany();
  }

  /**
   * Get all active sessions (not expired)
   *
   * @returns Array of active sessions
   */
  public async findAllActive(): Promise<SessionEntity[]> {
    const now = new Date();
    return await this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.user', 'user')
      .where('session.expirationDate > :now', { now })
      .orderBy('session.loginDate', 'DESC')
      .getMany();
  }

  /**
   * Delete all expired sessions
   *
   * @returns Number of deleted sessions
   */
  public async deleteExpired(): Promise<number> {
    const now = new Date();
    const result = await this.sessionRepository
      .createQueryBuilder()
      .delete()
      .from(SessionEntity)
      .where('expirationDate < :now', { now })
      .execute();

    const count = result.affected || 0;
    if (count > 0) {
      this.logger.debug(`Deleted ${count} expired sessions`);
    }

    return count;
  }

  /**
   * Delete all sessions for a user
   *
   * @param userId - The user ID
   * @returns Number of deleted sessions
   */
  public async deleteAllByUserId(userId: string): Promise<number> {
    const result = await this.sessionRepository
      .createQueryBuilder()
      .delete()
      .from(SessionEntity)
      .where('userId = :userId', { userId })
      .execute();

    const count = result.affected || 0;
    if (count > 0) {
      this.logger.debug(`Deleted ${count} sessions for user ${userId}`);
    }

    return count;
  }

  /**
   * Check if a session is active (not expired)
   *
   * @param session - The session to check
   * @returns True if the session is active, false otherwise
   */
  public isActive(session: SessionEntity): boolean {
    const now = new Date();
    return session.expirationDate > now;
  }

  /**
   * Calculate expiration date from expiresIn string
   *
   * @param expiresIn - Expiration string (e.g., "1h", "30m", "7d")
   * @returns Expiration date
   */
  private calculateExpirationDate(expiresIn: string): Date {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      // Default to 1 hour if parsing fails
      return new Date(Date.now() + 60 * 60 * 1000);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];
    let milliseconds = 0;

    switch (unit) {
      case 's':
        milliseconds = value * 1000;
        break;
      case 'm':
        milliseconds = value * 60 * 1000;
        break;
      case 'h':
        milliseconds = value * 60 * 60 * 1000;
        break;
      case 'd':
        milliseconds = value * 24 * 60 * 60 * 1000;
        break;
      default:
        milliseconds = 60 * 60 * 1000; // Default to 1 hour
    }

    return new Date(Date.now() + milliseconds);
  }
}
