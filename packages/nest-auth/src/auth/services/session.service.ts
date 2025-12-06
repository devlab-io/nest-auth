import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  Injectable,
  NotFoundException,
  Inject,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SessionEntity } from '../entities';
import {
  SessionQueryParams,
  SESSIONS,
  AuthScope,
} from '@devlab-io/nest-auth-types';
import { JwtConfig, JwtConfigToken } from '../config/jwt.config';
import { ScopeService } from './scope.service';

@Injectable()
export class SessionService implements OnModuleInit {
  private readonly logger: Logger = new Logger(SessionService.name);

  public constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepository: Repository<SessionEntity>,
    @Inject(JwtConfigToken) private readonly jwtConfig: JwtConfig,
    private readonly scopeService: ScopeService,
  ) {}

  /**
   * Apply scope filters to a query builder for sessions
   *
   * @param queryBuilder - The query builder
   */
  private applyScopeFilters(
    queryBuilder: SelectQueryBuilder<SessionEntity>,
  ): void {
    const authScope: AuthScope | null = this.scopeService.getScopeFromRequest();

    if (!authScope || authScope.resource !== SESSIONS) {
      return;
    }

    // If OWN scope, filter by user ID
    if (authScope.userId) {
      queryBuilder.andWhere('user.id = :userId', {
        userId: authScope.userId,
      });
      return;
    }

    // If ORGANISATION scope, filter by organisation
    if (authScope.organisationId) {
      queryBuilder.andWhere('organisation.id = :organisationId', {
        organisationId: authScope.organisationId,
      });
      return;
    }

    // If ESTABLISHMENT scope, filter by establishment
    if (authScope.establishmentId) {
      queryBuilder.andWhere('establishment.id = :establishmentId', {
        establishmentId: authScope.establishmentId,
      });
      return;
    }

    // If ANY scope, no constraints needed
  }

  /**
   * Called when the module is initialized
   * Deletes all expired sessions on application startup
   */
  public async onModuleInit(): Promise<void> {
    const deletedCount = await this.deleteExpired();
    if (deletedCount > 0) {
      this.logger.log(
        `Cleaned up ${deletedCount} expired session(s) on startup`,
      );
    }
  }

  /**
   * Create a new session
   * Deletes all other sessions for the user account before creating a new one
   *
   * @param token - The JWT token
   * @param userAccountId - The user account ID
   * @returns The created session
   */
  public async create(
    token: string,
    userAccountId: string,
  ): Promise<SessionEntity> {
    // Delete all other sessions for this user account
    const deletedCount = await this.deleteAllByUserAccountId(userAccountId);
    if (deletedCount > 0) {
      this.logger.debug(
        `Deleted ${deletedCount} existing session(s) for user account ${userAccountId}`,
      );
    }

    // Calculate expiration date from expiresIn (already parsed in config, in milliseconds)
    const expirationDate = new Date(Date.now() + this.jwtConfig.jwt.expiresIn);

    // Create session
    let session: SessionEntity = this.sessionRepository.create({
      token,
      userAccountId,
      loginDate: new Date(),
      expirationDate,
    });

    // Save session
    session = await this.sessionRepository.save(session);

    // Done
    return session;
  }

  /**
   * Find a session by token
   * Applies scope filters to ensure sessions outside the current scope are not found.
   *
   * @param token - The JWT token
   * @returns The session or null if not found or out of scope
   */
  public async findByToken(token: string): Promise<SessionEntity | null> {
    const queryBuilder = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.userAccount', 'userAccount')
      .leftJoinAndSelect('userAccount.user', 'user')
      .leftJoinAndSelect('userAccount.organisation', 'organisation')
      .leftJoinAndSelect('userAccount.establishment', 'establishment')
      .leftJoinAndSelect('userAccount.roles', 'roles')
      .where('session.token = :token', { token });

    this.applyScopeFilters(queryBuilder);

    return await queryBuilder.getOne();
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
  }

  /**
   * Find all sessions for a user account
   * Applies scope filters to ensure sessions outside the current scope are not found.
   *
   * @param userAccountId - The user account ID
   * @returns Array of sessions within scope
   */
  public async findByUserAccountId(
    userAccountId: string,
  ): Promise<SessionEntity[]> {
    const queryBuilder = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.userAccount', 'userAccount')
      .leftJoinAndSelect('userAccount.user', 'user')
      .leftJoinAndSelect('userAccount.organisation', 'organisation')
      .leftJoinAndSelect('userAccount.establishment', 'establishment')
      .leftJoinAndSelect('userAccount.roles', 'roles')
      .where('session.userAccountId = :userAccountId', { userAccountId })
      .orderBy('session.loginDate', 'DESC');

    this.applyScopeFilters(queryBuilder);

    return await queryBuilder.getMany();
  }

  /**
   * Find all active sessions for a user account (not expired)
   * Applies scope filters to ensure sessions outside the current scope are not found.
   *
   * @param userAccountId - The user account ID
   * @returns Array of active sessions within scope
   */
  public async findActiveByUserAccountId(
    userAccountId: string,
  ): Promise<SessionEntity[]> {
    const now = new Date();
    const queryBuilder = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.userAccount', 'userAccount')
      .leftJoinAndSelect('userAccount.user', 'user')
      .leftJoinAndSelect('userAccount.organisation', 'organisation')
      .leftJoinAndSelect('userAccount.establishment', 'establishment')
      .leftJoinAndSelect('userAccount.roles', 'roles')
      .where('session.userAccountId = :userAccountId', { userAccountId })
      .andWhere('session.expirationDate > :now', { now })
      .orderBy('session.loginDate', 'DESC');

    this.applyScopeFilters(queryBuilder);

    return await queryBuilder.getMany();
  }

  /**
   * Find all sessions for a user (by user ID, for backward compatibility)
   * Applies scope filters to ensure sessions outside the current scope are not found.
   * Note: This method searches all user accounts for the given user ID
   *
   * @param userId - The user ID
   * @returns Array of sessions within scope
   */
  public async findByUserId(userId: string): Promise<SessionEntity[]> {
    const queryBuilder = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.userAccount', 'userAccount')
      .leftJoinAndSelect('userAccount.user', 'user')
      .leftJoinAndSelect('userAccount.organisation', 'organisation')
      .leftJoinAndSelect('userAccount.establishment', 'establishment')
      .leftJoinAndSelect('userAccount.roles', 'roles')
      .where('user.id = :userId', { userId })
      .orderBy('session.loginDate', 'DESC');

    this.applyScopeFilters(queryBuilder);

    return await queryBuilder.getMany();
  }

  /**
   * Find all active sessions for a user (by user ID, not expired, for backward compatibility)
   * Applies scope filters to ensure sessions outside the current scope are not found.
   * Note: This method searches all user accounts for the given user ID
   *
   * @param userId - The user ID
   * @returns Array of active sessions within scope
   */
  public async findActiveByUserId(userId: string): Promise<SessionEntity[]> {
    const now = new Date();
    const queryBuilder = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.userAccount', 'userAccount')
      .leftJoinAndSelect('userAccount.user', 'user')
      .leftJoinAndSelect('userAccount.organisation', 'organisation')
      .leftJoinAndSelect('userAccount.establishment', 'establishment')
      .leftJoinAndSelect('userAccount.roles', 'roles')
      .where('user.id = :userId', { userId })
      .andWhere('session.expirationDate > :now', { now })
      .orderBy('session.loginDate', 'DESC');

    this.applyScopeFilters(queryBuilder);

    return await queryBuilder.getMany();
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
      .leftJoinAndSelect('session.userAccount', 'userAccount')
      .leftJoinAndSelect('userAccount.user', 'user')
      .leftJoinAndSelect('userAccount.organisation', 'organisation')
      .leftJoinAndSelect('userAccount.establishment', 'establishment')
      .leftJoinAndSelect('userAccount.roles', 'roles');

    if (params.userAccountId) {
      queryBuilder.andWhere('session.userAccountId = :userAccountId', {
        userAccountId: params.userAccountId,
      });
    }

    // For backward compatibility: search by userId (userAccount.user.id)
    if (params.userId) {
      queryBuilder.andWhere('userAccount.user.id = :userId', {
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

    // Apply scope filters
    this.applyScopeFilters(queryBuilder);

    queryBuilder.orderBy('session.loginDate', 'DESC');

    return await queryBuilder.getMany();
  }

  /**
   * Get all active sessions (not expired)
   * Applies scope filters to ensure sessions outside the current scope are not found.
   *
   * @returns Array of active sessions within scope
   */
  public async findAllActive(): Promise<SessionEntity[]> {
    const now = new Date();
    const queryBuilder = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.userAccount', 'userAccount')
      .leftJoinAndSelect('userAccount.user', 'user')
      .leftJoinAndSelect('userAccount.organisation', 'organisation')
      .leftJoinAndSelect('userAccount.establishment', 'establishment')
      .leftJoinAndSelect('userAccount.roles', 'roles')
      .where('session.expirationDate > :now', { now })
      .orderBy('session.loginDate', 'DESC');

    this.applyScopeFilters(queryBuilder);

    return await queryBuilder.getMany();
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
   * Delete all sessions for a user account
   *
   * @param userAccountId - The user account ID
   * @returns Number of deleted sessions
   */
  public async deleteAllByUserAccountId(
    userAccountId: string,
  ): Promise<number> {
    const result = await this.sessionRepository
      .createQueryBuilder()
      .delete()
      .from(SessionEntity)
      .where('userAccountId = :userAccountId', { userAccountId })
      .execute();

    const count = result.affected || 0;
    if (count > 0) {
      this.logger.debug(
        `Deleted ${count} sessions for user account ${userAccountId}`,
      );
    }

    return count;
  }

  /**
   * Delete all sessions for a user (by user ID, for backward compatibility)
   * Note: This method deletes all sessions for all user accounts of the given user ID
   *
   * @param userId - The user ID
   * @returns Number of deleted sessions
   */
  public async deleteAllByUserId(userId: string): Promise<number> {
    // First, find all sessions for this user
    const sessions = await this.findByUserId(userId);

    if (sessions.length === 0) {
      return 0;
    }

    // Delete all found sessions
    await this.sessionRepository.remove(sessions);

    const count = sessions.length;
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
}
