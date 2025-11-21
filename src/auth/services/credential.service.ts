import { Repository } from 'typeorm';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CredentialEntity } from '../entities';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class CredentialService {
  private readonly logger: Logger = new Logger(CredentialService.name);

  /**
   * Constructor
   *
   * @param credentialRepository - The credential repository
   */
  public constructor(
    @InjectRepository(CredentialEntity)
    private readonly credentialRepository: Repository<CredentialEntity>,
  ) {}

  /**
   * Hash a password using bcrypt
   *
   * @param password - The plain text password to hash
   * @returns The hashed password
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds: number = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Create a password credential for a user
   *
   * @param userId - The ID of the user
   * @param password - The plain text password
   * @returns The created credential
   */
  public async createPasswordCredential(
    userId: string,
    password: string,
  ): Promise<CredentialEntity> {
    // Check if a password credential already exists for this user
    const existing = await this.findPasswordCredential(userId);
    if (existing) {
      throw new BadRequestException(
        'A password credential already exists for this user',
      );
    }

    // Hash the password
    const hashedPassword = await this.hashPassword(password);

    // Create the credential
    const credential = this.credentialRepository.create({
      type: 'password',
      password: hashedPassword,
      user: { id: userId } as any,
    });

    // Save and return
    const saved = await this.credentialRepository.save(credential);
    this.logger.debug(`Password credential created for user ${userId}`);
    return saved;
  }

  /**
   * Update a password credential for a user
   *
   * @param userId - The ID of the user
   * @param password - The new plain text password
   * @returns The updated credential
   * @throws NotFoundException if no password credential exists
   */
  public async updatePasswordCredential(
    userId: string,
    password: string,
  ): Promise<CredentialEntity> {
    const credential = await this.findPasswordCredential(userId);
    if (!credential) {
      throw new NotFoundException('No password credential found for this user');
    }

    // Hash the new password
    const hashedPassword = await this.hashPassword(password);

    // Update the credential
    credential.password = hashedPassword;
    const updated = await this.credentialRepository.save(credential);
    this.logger.debug(`Password credential updated for user ${userId}`);
    return updated;
  }

  /**
   * Create or update a password credential for a user
   *
   * @param userId - The ID of the user
   * @param password - The plain text password
   * @returns The created or updated credential
   */
  public async setPasswordCredential(
    userId: string,
    password: string,
  ): Promise<CredentialEntity> {
    const existing = await this.findPasswordCredential(userId);
    if (existing) {
      return await this.updatePasswordCredential(userId, password);
    } else {
      return await this.createPasswordCredential(userId, password);
    }
  }

  /**
   * Verify a password for a user
   *
   * @param userId - The ID of the user
   * @param password - The plain text password to verify
   * @returns True if the password is valid, false otherwise
   */
  public async verifyPassword(
    userId: string,
    password: string,
  ): Promise<boolean> {
    const credential = await this.findPasswordCredential(userId);
    if (!credential || !credential.password) {
      return false;
    }

    return await bcrypt.compare(password, credential.password);
  }

  /**
   * Create a Google credential for a user
   *
   * @param userId - The ID of the user
   * @param googleId - The Google OAuth ID
   * @returns The created credential
   */
  public async createGoogleCredential(
    userId: string,
    googleId: string,
  ): Promise<CredentialEntity> {
    // Check if a Google credential already exists for this user
    const existing = await this.findGoogleCredential(userId);
    if (existing) {
      throw new BadRequestException(
        'A Google credential already exists for this user',
      );
    }

    // Check if this Google ID is already used by another user
    const existingGoogleCredential = await this.credentialRepository.findOne({
      where: { type: 'google', googleId },
    });
    if (existingGoogleCredential) {
      throw new BadRequestException(
        'This Google account is already linked to another user',
      );
    }

    // Create the credential
    const credential = this.credentialRepository.create({
      type: 'google',
      googleId,
      user: { id: userId } as any,
    });

    // Save and return
    const saved = await this.credentialRepository.save(credential);
    this.logger.debug(`Google credential created for user ${userId}`);
    return saved;
  }

  /**
   * Find a password credential for a user
   *
   * @param userId - The ID of the user
   * @returns The credential or null if not found
   */
  public async findPasswordCredential(
    userId: string,
  ): Promise<CredentialEntity | null> {
    return await this.credentialRepository.findOne({
      where: { user: { id: userId }, type: 'password' },
      relations: ['user'],
    });
  }

  /**
   * Find a Google credential for a user
   *
   * @param userId - The ID of the user
   * @returns The credential or null if not found
   */
  public async findGoogleCredential(
    userId: string,
  ): Promise<CredentialEntity | null> {
    return await this.credentialRepository.findOne({
      where: { user: { id: userId }, type: 'google' },
      relations: ['user'],
    });
  }

  /**
   * Find a Google credential by Google ID
   *
   * @param googleId - The Google OAuth ID
   * @returns The credential or null if not found
   */
  public async findGoogleCredentialByGoogleId(
    googleId: string,
  ): Promise<CredentialEntity | null> {
    return await this.credentialRepository.findOne({
      where: { type: 'google', googleId },
      relations: ['user'],
    });
  }

  /**
   * Get all credentials for a user
   *
   * @param userId - The ID of the user
   * @returns Array of credentials
   */
  public async findByUserId(userId: string): Promise<CredentialEntity[]> {
    return await this.credentialRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  /**
   * Delete a credential
   *
   * @param credentialId - The ID of the credential
   * @throws NotFoundException if the credential is not found
   */
  public async delete(credentialId: string): Promise<void> {
    const credential = await this.credentialRepository.findOne({
      where: { id: credentialId },
    });
    if (!credential) {
      throw new NotFoundException(
        `Credential with ID ${credentialId} not found`,
      );
    }

    await this.credentialRepository.remove(credential);
    this.logger.debug(`Credential ${credentialId} deleted`);
  }

  /**
   * Delete a password credential for a user
   *
   * @param userId - The ID of the user
   */
  public async deletePasswordCredential(userId: string): Promise<void> {
    const credential = await this.findPasswordCredential(userId);
    if (credential) {
      await this.credentialRepository.remove(credential);
      this.logger.debug(`Password credential deleted for user ${userId}`);
    }
  }

  /**
   * Delete a Google credential for a user
   *
   * @param userId - The ID of the user
   */
  public async deleteGoogleCredential(userId: string): Promise<void> {
    const credential = await this.findGoogleCredential(userId);
    if (credential) {
      await this.credentialRepository.remove(credential);
      this.logger.debug(`Google credential deleted for user ${userId}`);
    }
  }

  /**
   * Check if a user has a password credential
   *
   * @param userId - The ID of the user
   * @returns True if the user has a password credential, false otherwise
   */
  public async hasPasswordCredential(userId: string): Promise<boolean> {
    const count = await this.credentialRepository.count({
      where: { user: { id: userId }, type: 'password' },
    });
    return count > 0;
  }

  /**
   * Check if a user has a Google credential
   *
   * @param userId - The ID of the user
   * @returns True if the user has a Google credential, false otherwise
   */
  public async hasGoogleCredential(userId: string): Promise<boolean> {
    const count = await this.credentialRepository.count({
      where: { user: { id: userId }, type: 'google' },
    });
    return count > 0;
  }
}
