import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ClaimEntity } from '../entities';
import { ClaimLike, ClaimsUtils } from '@devlab-io/nest-auth-types';

/**
 * Service for managing claims
 */
@Injectable()
export class ClaimService {
  constructor(
    @InjectRepository(ClaimEntity)
    private readonly claimRepository: Repository<ClaimEntity>,
  ) {}

  /**
   * Get all claims
   *
   * @returns All claims
   */
  async getAll(): Promise<ClaimEntity[]> {
    return await this.claimRepository.find({
      order: { claim: 'ASC' },
    });
  }

  /**
   * Find claims by their representation (string, Claim object, or tuple)
   *
   * @param inputs - Array of claims as strings, Claim objects, or tuples [action, scope, resource]
   * @returns Array of ClaimEntity matching the provided claims
   * @throws NotFoundException if one or more claims are not found
   */
  async getClaims(inputs: ClaimLike[]): Promise<ClaimEntity[]> {
    if (!inputs || inputs.length === 0) {
      return [];
    }

    // Convert all inputs to strings
    // First parse ClaimLike to Claim, then serialize to string
    const strings: string[] = inputs.map(ClaimsUtils.serialize);

    // Find claims by their string representation
    const claims: ClaimEntity[] = await this.claimRepository.find({
      where: {
        claim: In(strings),
      },
    });

    // Check if all claims were found
    if (claims.length !== inputs.length) {
      const found: string[] = claims.map((c: ClaimEntity) => c.claim);
      const missing: string[] = strings.filter(
        (claimString: string) => !found.includes(claimString),
      );
      throw new NotFoundException(
        `One or more claims not found: ${missing.join(', ')}`,
      );
    }

    return claims;
  }

  /**
   * Get a claim by its representation (string, Claim object, or tuple)
   *
   * @param claimInput - Claim as string, Claim object, or tuple [action, scope, resource]
   * @returns The claim entity
   * @throws NotFoundException if the claim is not found
   */
  async getByClaim(claimInput: ClaimLike): Promise<ClaimEntity> {
    const claimString = ClaimsUtils.serialize(claimInput);
    const claimEntity = await this.claimRepository.findOne({
      where: { claim: claimString },
    });

    if (!claimEntity) {
      throw new NotFoundException(`Claim "${claimString}" not found`);
    }

    return claimEntity;
  }

  /**
   * Check if a claim exists
   *
   * @param claim - Claim string in format "action:scope:resource"
   * @returns True if the claim exists, false otherwise
   */
  async exists(claim: ClaimLike): Promise<boolean> {
    const count = await this.claimRepository.count({
      where: { claim: ClaimsUtils.serialize(claim) },
    });
    return count > 0;
  }
}
