import { ApiProperty } from '@nestjs/swagger';
import { Claim, ClaimAction, ClaimScope } from '@devlab-io/nest-auth-types';

export class ClaimDto implements Claim {
  @ApiProperty({
    example: ClaimAction.READ,
    description: 'Action type (create, read, update, execute, delete)',
    enum: ClaimAction,
  })
  action: ClaimAction;

  @ApiProperty({
    example: ClaimScope.ANY,
    description: 'Scope of the claim (all, organisation, establishment, user)',
    enum: ClaimScope,
  })
  scope: ClaimScope;

  @ApiProperty({
    example: 'users',
    description: 'Resource name that the claim applies to',
  })
  resource: string;
}
