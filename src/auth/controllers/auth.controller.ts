import { Body, Controller, Post, Query } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
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

@Controller('auth')
export class AuthController {
  /**
   * Constructor
   *
   * @param authService - The auth service
   */
  constructor(private readonly authService: AuthService) {}

  @Post('invite')
  async invite(@Body() inviteRequest: InviteRequest): Promise<void> {
    return await this.authService.sendInvitation(inviteRequest);
  }

  @Post('accept-invitation')
  async acceptInvitation(
    @Body() acceptInvitationRequest: AcceptInvitationRequest,
  ): Promise<AuthResponse> {
    return await this.authService.acceptInvitation(acceptInvitationRequest);
  }

  @Post('sign-up')
  async signUp(@Body() signUpRequest: SignUpRequest): Promise<void> {
    return await this.authService.signUp(signUpRequest);
  }

  @Post('sign-in')
  async signIn(@Body() signInRequest: SignInRequest): Promise<AuthResponse> {
    return await this.authService.signIn(signInRequest);
  }

  @Post('sign-out')
  async signOut(): Promise<void> {
    return await this.authService.signOut();
  }

  @Post('send-email-validation')
  async sendEmailValidation(@Query('id') id: string): Promise<void> {
    return await this.authService.sendEmailValidation(id);
  }

  @Post('accept-email-validation')
  async acceptEmailValidation(
    @Body() validateEmailRequest: ValidateEmailRequest,
  ): Promise<void> {
    return await this.authService.acceptEmailValidation(validateEmailRequest);
  }

  @Post('send-create-password')
  async sendCreatePassword(@Query('id') id: string): Promise<void> {
    return await this.authService.sendCreatePassword(id);
  }

  @Post('accept-create-password')
  async acceptCreatePassword(
    @Body() createPasswordRequest: CreatePasswordRequest,
  ): Promise<void> {
    return await this.authService.acceptCreatePassword(createPasswordRequest);
  }

  @Post('send-reset-password')
  async sendResetPassword(@Query('email') email: string): Promise<void> {
    return await this.authService.sendResetPassword(email);
  }

  @Post('accept-reset-password')
  async acceptResetPassword(
    @Body() resetPasswordRequest: ResetPasswordRequest,
  ): Promise<void> {
    return await this.authService.acceptResetPassword(resetPasswordRequest);
  }

  @Post('add-accept-terms')
  async addAcceptTerms(@Query('id') id: string): Promise<void> {
    return await this.authService.addAcceptTerms(id);
  }

  @Post('accept-terms')
  async acceptTerms(
    @Body() acceptTermsRequest: AcceptTermsRequest,
  ): Promise<void> {
    return await this.authService.acceptTerms(acceptTermsRequest);
  }

  @Post('add-accept-privacy-policy')
  async addAcceptPrivacyPolicy(@Query('id') id: string): Promise<void> {
    return await this.authService.addAcceptPrivacyPolicy(id);
  }

  @Post('accept-privacy-policy')
  async acceptPrivacyPolicy(
    @Body() acceptPrivacyPolicyRequest: AcceptPrivacyPolicyRequest,
  ): Promise<void> {
    return await this.authService.acceptPrivacyPolicy(
      acceptPrivacyPolicyRequest,
    );
  }
}
