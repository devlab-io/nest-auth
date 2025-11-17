import { Body, Controller, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../services';
import {
  AcceptInvitationRequest,
  AcceptPrivacyPolicyRequest,
  AcceptTermsRequest,
  AuthResponse,
  CreatePasswordRequest,
  InviteRequest,
  ResetPasswordRequest,
  SignInRequest,
  SignUpRequest,
  ValidateEmailRequest,
} from '../types';

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

  @Post('invite')
  @ApiOperation({ summary: 'Send an invitation to a user' })
  @ApiResponse({ status: 200, description: 'Invitation sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async invite(@Body() inviteRequest: InviteRequest): Promise<void> {
    return await this.authService.sendInvitation(inviteRequest);
  }

  @Post('accept-invitation')
  @ApiOperation({ summary: 'Accept an invitation and create an account' })
  @ApiResponse({ status: 200, description: 'Invitation accepted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Invalid or expired token' })
  async acceptInvitation(
    @Body() acceptInvitationRequest: AcceptInvitationRequest,
  ): Promise<AuthResponse> {
    return await this.authService.acceptInvitation(acceptInvitationRequest);
  }

  @Post('sign-up')
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ status: 200, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async signUp(@Body() signUpRequest: SignUpRequest): Promise<void> {
    return await this.authService.signUp(signUpRequest);
  }

  @Post('sign-in')
  @ApiOperation({ summary: 'Sign in and authenticate a user' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async signIn(@Body() signInRequest: SignInRequest): Promise<AuthResponse> {
    return await this.authService.signIn(signInRequest);
  }

  @Post('sign-out')
  @ApiOperation({ summary: 'Sign out and invalidate the current session' })
  @ApiResponse({ status: 200, description: 'Signed out successfully' })
  async signOut(): Promise<void> {
    return await this.authService.signOut();
  }

  @Post('send-email-validation')
  @ApiOperation({ summary: 'Send an email validation token' })
  @ApiQuery({ name: 'id', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Email validation token sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async sendEmailValidation(@Query('id') id: string): Promise<void> {
    return await this.authService.sendEmailValidation(id);
  }

  @Post('accept-email-validation')
  @ApiOperation({ summary: 'Validate an email address using a token' })
  @ApiResponse({ status: 200, description: 'Email validated successfully' })
  @ApiResponse({ status: 403, description: 'Invalid or expired token' })
  async acceptEmailValidation(
    @Body() validateEmailRequest: ValidateEmailRequest,
  ): Promise<void> {
    return await this.authService.acceptEmailValidation(validateEmailRequest);
  }

  @Post('send-create-password')
  @ApiOperation({ summary: 'Send a create password token' })
  @ApiQuery({ name: 'id', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Create password token sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async sendCreatePassword(@Query('id') id: string): Promise<void> {
    return await this.authService.sendCreatePassword(id);
  }

  @Post('accept-create-password')
  @ApiOperation({ summary: 'Create a password using a token' })
  @ApiResponse({ status: 200, description: 'Password created successfully' })
  @ApiResponse({ status: 403, description: 'Invalid or expired token' })
  async acceptCreatePassword(
    @Body() createPasswordRequest: CreatePasswordRequest,
  ): Promise<void> {
    return await this.authService.acceptCreatePassword(createPasswordRequest);
  }

  @Post('send-reset-password')
  @ApiOperation({ summary: 'Send a password reset token' })
  @ApiQuery({ name: 'email', type: String, description: 'User email' })
  @ApiResponse({ status: 200, description: 'Password reset token sent' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async sendResetPassword(@Query('email') email: string): Promise<void> {
    return await this.authService.sendResetPassword(email);
  }

  @Post('accept-reset-password')
  @ApiOperation({ summary: 'Reset password using a token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 403, description: 'Invalid or expired token' })
  async acceptResetPassword(
    @Body() resetPasswordRequest: ResetPasswordRequest,
  ): Promise<void> {
    return await this.authService.acceptResetPassword(resetPasswordRequest);
  }

  @Post('add-accept-terms')
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
    @Body() acceptTermsRequest: AcceptTermsRequest,
  ): Promise<void> {
    return await this.authService.acceptTerms(acceptTermsRequest);
  }

  @Post('add-accept-privacy-policy')
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
    @Body() acceptPrivacyPolicyRequest: AcceptPrivacyPolicyRequest,
  ): Promise<void> {
    return await this.authService.acceptPrivacyPolicy(
      acceptPrivacyPolicyRequest,
    );
  }
}
