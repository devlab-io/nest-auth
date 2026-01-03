import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../services';
import {
  InviteRequestDto,
  SignUpRequestDto,
  SignInRequestDto,
  AcceptInvitationRequestDto,
  ValidateEmailRequestDto,
  ChangePasswordRequestDto,
  ResetPasswordRequestDto,
  AcceptTermsRequestDto,
  AcceptPrivacyPolicyRequestDto,
  AuthResponseDto,
  UserAccountDto,
} from '../dtos';
import { FrontendUrl } from '../decorators';
import { FrontendUrlGuard, AuthGuard } from '../guards';
import { Claims } from '../decorators/claims';
import {
  ClaimAction,
  ClaimScope,
  CREATE_ANY_USER_ACCOUNTS,
  CREATE_EST_USER_ACCOUNTS,
  CREATE_ORG_USER_ACCOUNTS,
  READ_OWN_USER_ACCOUNTS,
} from '@devlab-io/nest-auth-types';

/**
 * Authentication controller
 * Provides endpoints for user authentication, registration, and account management
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  /**
   * Constructor
   *
   * @param authService - The auth service
   */
  constructor(private readonly authService: AuthService) {}

  @Get('account')
  @UseGuards(AuthGuard, FrontendUrlGuard)
  @Claims(READ_OWN_USER_ACCOUNTS)
  @ApiOperation({ summary: 'Get the current user account' })
  @ApiResponse({
    status: 200,
    description: 'User account retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAccount(): Promise<UserAccountDto | null> {
    return await this.authService.getAccount();
  }

  @Post('invite')
  @UseGuards(AuthGuard, FrontendUrlGuard)
  @Claims(
    CREATE_ANY_USER_ACCOUNTS,
    CREATE_ORG_USER_ACCOUNTS,
    CREATE_EST_USER_ACCOUNTS,
  )
  @ApiOperation({ summary: 'Send an invitation to a user' })
  @ApiResponse({ status: 200, description: 'Invitation sent successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Frontend URL required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Request origin not allowed',
  })
  async invite(
    @Body() inviteRequest: InviteRequestDto,
    @FrontendUrl() frontendUrl: string,
  ): Promise<void> {
    return await this.authService.sendInvitation(inviteRequest, frontendUrl);
  }

  @Post('accept-invitation')
  @ApiOperation({ summary: 'Accept an invitation and create an account' })
  @ApiResponse({
    status: 200,
    description: 'Invitation accepted successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Invalid or expired token' })
  async acceptInvitation(
    @Body() acceptInvitationRequest: AcceptInvitationRequestDto,
  ): Promise<AuthResponseDto> {
    return await this.authService.acceptInvitation(acceptInvitationRequest);
  }

  @Post('sign-up')
  @UseGuards(FrontendUrlGuard)
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 200, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async signUp(
    @Body() signUpRequest: SignUpRequestDto,
    @FrontendUrl() frontendUrl: string,
  ): Promise<void> {
    return await this.authService.signUp(signUpRequest, frontendUrl);
  }

  @Post('sign-in')
  @ApiOperation({ summary: 'Sign in and authenticate a user' })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async signIn(
    @Body() signInRequest: SignInRequestDto,
  ): Promise<AuthResponseDto> {
    return await this.authService.signIn(signInRequest);
  }

  @Post('sign-out')
  @ApiOperation({ summary: 'Sign out and invalidate the current session' })
  @ApiResponse({ status: 200, description: 'Signed out successfully' })
  @UseGuards(AuthGuard)
  async signOut(): Promise<void> {
    return await this.authService.signOut();
  }

  @Post('send-email-validation')
  @UseGuards(AuthGuard, FrontendUrlGuard)
  @Claims([ClaimAction.CREATE, ClaimScope.ANY, 'actions'])
  @ApiOperation({ summary: 'Send an email validation token' })
  @ApiQuery({ name: 'id', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Email validation token sent' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Frontend URL required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Request origin not allowed',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async sendEmailValidation(
    @Query('id') id: string,
    @FrontendUrl() frontendUrl: string,
  ): Promise<void> {
    return await this.authService.sendEmailValidation(id, frontendUrl);
  }

  @Post('accept-email-validation')
  @ApiOperation({ summary: 'Validate an email address using a token' })
  @ApiResponse({ status: 200, description: 'Email validated successfully' })
  @ApiResponse({ status: 403, description: 'Invalid or expired token' })
  async acceptEmailValidation(
    @Body() validateEmailRequest: ValidateEmailRequestDto,
  ): Promise<void> {
    return await this.authService.acceptEmailValidation(validateEmailRequest);
  }

  @Post('send-change-password')
  @UseGuards(AuthGuard, FrontendUrlGuard)
  @Claims([ClaimAction.CREATE, ClaimScope.ANY, 'actions'])
  @ApiOperation({ summary: 'Send a change password token' })
  @ApiQuery({ name: 'id', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Change password token sent' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Frontend URL required',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Request origin not allowed',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async sendChangePassword(
    @Query('id') id: string,
    @FrontendUrl() frontendUrl: string,
  ): Promise<void> {
    return await this.authService.sendChangePassword(id, frontendUrl);
  }

  @Post('accept-change-password')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Change a password using a token' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 403, description: 'Invalid or expired token' })
  async acceptChangePassword(
    @Body() changePasswordRequest: ChangePasswordRequestDto,
  ): Promise<void> {
    return await this.authService.acceptChangePassword(changePasswordRequest);
  }

  @Post('send-reset-password')
  @UseGuards(AuthGuard, FrontendUrlGuard)
  @Claims([ClaimAction.CREATE, ClaimScope.ANY, 'actions'])
  @ApiOperation({ summary: 'Send a password reset token' })
  @ApiQuery({ name: 'email', type: String, description: 'User email' })
  @ApiResponse({ status: 200, description: 'Password reset token sent' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Frontend URL required or route not configured',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Request origin not allowed',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async sendResetPassword(
    @FrontendUrl() frontendUrl: string,
    @Query('email') email: string,
  ): Promise<void> {
    return await this.authService.sendResetPassword(email, frontendUrl);
  }

  @Post('accept-reset-password')
  @ApiOperation({ summary: 'Reset password using a token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 403, description: 'Invalid or expired token' })
  async acceptResetPassword(
    @Body() resetPasswordRequest: ResetPasswordRequestDto,
  ): Promise<void> {
    return await this.authService.acceptResetPassword(resetPasswordRequest);
  }

  @Post('add-accept-terms')
  @UseGuards(AuthGuard, FrontendUrlGuard)
  @Claims([ClaimAction.CREATE, ClaimScope.ANY, 'actions'])
  @ApiOperation({ summary: 'Send an accept terms token' })
  @ApiQuery({ name: 'id', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Accept terms token sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async addAcceptTerms(@Query('id') id: string): Promise<void> {
    return await this.authService.addAcceptTerms(id);
  }

  @Post('accept-terms')
  @ApiOperation({ summary: 'Accept terms of service using a token' })
  @ApiResponse({ status: 200, description: 'Terms accepted successfully' })
  @ApiResponse({ status: 403, description: 'Invalid or expired token' })
  async acceptTerms(
    @Body() acceptTermsRequest: AcceptTermsRequestDto,
  ): Promise<void> {
    return await this.authService.acceptTerms(acceptTermsRequest);
  }

  @Post('add-accept-privacy-policy')
  @UseGuards(AuthGuard, FrontendUrlGuard)
  @Claims([ClaimAction.CREATE, ClaimScope.ANY, 'actions'])
  @ApiOperation({ summary: 'Send an accept privacy policy token' })
  @ApiQuery({ name: 'id', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Accept privacy policy token sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async addAcceptPrivacyPolicy(@Query('id') id: string): Promise<void> {
    return await this.authService.addAcceptPrivacyPolicy(id);
  }

  @Post('accept-privacy-policy')
  @ApiOperation({ summary: 'Accept privacy policy using a token' })
  @ApiResponse({
    status: 200,
    description: 'Privacy policy accepted successfully',
  })
  @ApiResponse({ status: 403, description: 'Invalid or expired token' })
  async acceptPrivacyPolicy(
    @Body() acceptPrivacyPolicyRequest: AcceptPrivacyPolicyRequestDto,
  ): Promise<void> {
    return await this.authService.acceptPrivacyPolicy(
      acceptPrivacyPolicyRequest,
    );
  }
}
