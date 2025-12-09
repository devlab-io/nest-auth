import { ClaimLike, ClaimsUtils, Claim } from '@devlab-io/nest-auth-types';
import { SetMetadata } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';

/**
 *
 */
export const CLAIMS_KEY = 'claims';

/**
 * Decorator to set the claims for a controller method
 * All claims must have the same action and resource (only scope can differ)
 *
 * @param claims - The claims to set
 * @throws BadRequestException if claims have different actions or resources
 * @example
 * ```typescript
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * @Claims(READ_OWN_USERS)
 * async getProfile(@CurrentUser() user: UserEntity) {
 *   return user;
 * }
 * ```
 */
export function Claims(...claims: ClaimLike[]) {
  const parsedClaims: Claim[] = claims.map(ClaimsUtils.parse);

  if (parsedClaims.length === 0) {
    throw new BadRequestException('At least one claim must be provided');
  }

  // Verify that all claims have the same action and resource
  const firstClaim: Claim = parsedClaims[0];
  for (let i = 1; i < parsedClaims.length; i++) {
    const claim: Claim = parsedClaims[i];
    if (claim.action !== firstClaim.action) {
      throw new BadRequestException(
        `All claims must have the same action. Found ${firstClaim.action} and ${claim.action}`,
      );
    }
    if (claim.resource !== firstClaim.resource) {
      throw new BadRequestException(
        `All claims must have the same resource. Found ${firstClaim.resource} and ${claim.resource}`,
      );
    }
  }

  return SetMetadata(CLAIMS_KEY, parsedClaims);
}
