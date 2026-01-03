import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  MinLength,
  Min,
  Max,
} from 'class-validator';
import {
  InviteRequest,
  SignUpRequest,
  SignInRequest,
  AcceptInvitationRequest,
  ValidateEmailRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
  AcceptTermsRequest,
  AcceptPrivacyPolicyRequest,
  AuthResponse,
  JwtToken,
} from '@devlab-io/nest-auth-types';
import { UserDto } from './user.dtos';

export class InviteRequestDto implements InviteRequest {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address of the user',
  })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Name of the organisation to create user account in',
  })
  @IsString({ message: 'organisation must be a string' })
  @IsOptional()
  organisation?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Name of the establishment to create user account in',
  })
  @IsString({ message: 'establishment must be a string' })
  @IsOptional()
  establishment?: string;

  @ApiPropertyOptional({
    example: 24,
    description: 'Expiration time in hours',
  })
  @IsOptional()
  @IsNumber({}, { message: 'expiresIn must be a number' })
  @Min(1, { message: 'expiresIn must be at least 1 hour' })
  @Max(8760, { message: 'expiresIn must be at most 8760 hours (1 year)' })
  expiresIn?: number;

  @ApiPropertyOptional({
    example: 'Welcome to our platform!',
    description: 'Optional message to include in the invitation',
  })
  @IsOptional()
  @IsString({ message: 'message must be a string' })
  message?: string;

  @ApiPropertyOptional({
    example: ['user', 'admin'],
    description: 'Array of role names to assign to the user',
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'roles must be an array' })
  @IsString({ each: true, message: 'Each role must be a string' })
  roles?: string[];
}

export class SignUpRequestDto implements SignUpRequest {
  @ApiPropertyOptional({
    example: 'johndoe',
    description: 'Username of the user',
  })
  @IsOptional()
  @IsString({ message: 'username must be a string' })
  @MinLength(3, { message: 'username must be at least 3 characters long' })
  username?: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address of the user',
  })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @ApiPropertyOptional({
    example: 'John',
    description: 'First name of the user',
  })
  @IsOptional()
  @IsString({ message: 'firstName must be a string' })
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Doe',
    description: 'Last name of the user',
  })
  @IsOptional()
  @IsString({ message: 'lastName must be a string' })
  lastName?: string;

  @ApiPropertyOptional({
    example: '+689123456789',
    description: 'Phone number of the user',
  })
  @IsOptional()
  @IsString({ message: 'phone must be a string' })
  phone?: string;

  @ApiPropertyOptional({
    example: [{ type: 'password', password: 'SecurePassword123!' }],
    description: 'Credentials for the user',
    type: Array,
  })
  @IsOptional()
  @IsArray({ message: 'credentials must be an array' })
  credentials?: Array<{
    type: 'password' | 'google';
    password?: string;
    googleId?: string;
  }>;

  @ApiPropertyOptional({
    example: 'https://example.com/profile.jpg',
    description: "URL of the user's profile picture",
  })
  @IsOptional()
  @IsString({ message: 'profilePicture must be a string' })
  profilePicture?: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if the user accepted the terms of service',
  })
  @IsBoolean({ message: 'acceptedTerms must be a boolean' })
  acceptedTerms: boolean;

  @ApiProperty({
    example: true,
    description: 'Indicates if the user accepted the privacy policy',
  })
  @IsBoolean({ message: 'acceptedPrivacyPolicy must be a boolean' })
  acceptedPrivacyPolicy: boolean;
}

export class SignInRequestDto implements SignInRequest {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address of the user',
  })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'Password of the user',
  })
  @IsString({ message: 'password must be a string' })
  password: string;
}

export class ActionRequestDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Action token',
  })
  @IsString({ message: 'token must be a string' })
  token: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address',
  })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;
}

export class AcceptInvitationRequestDto
  extends SignUpRequestDto
  implements AcceptInvitationRequest
{
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Invitation token',
  })
  @IsString({ message: 'token must be a string' })
  token: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address',
  })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;
}

export class ValidateEmailRequestDto
  extends ActionRequestDto
  implements ValidateEmailRequest {}

export class ChangePasswordRequestDto
  extends ActionRequestDto
  implements ChangePasswordRequest
{
  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'Old password',
    minLength: 8,
  })
  @IsString({ message: 'Old password must be a string' })
  @MinLength(8, { message: 'Old password must be at least 8 characters long' })
  oldPassword: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'New password',
    minLength: 8,
  })
  @IsString({ message: 'New password must be a string' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword: string;
}

export class ResetPasswordRequestDto
  extends ActionRequestDto
  implements ResetPasswordRequest
{
  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'New password',
    minLength: 8,
  })
  @IsString({ message: 'password must be a string' })
  @MinLength(8, { message: 'password must be at least 8 characters long' })
  newPassword: string;
}

export class AcceptTermsRequestDto
  extends ActionRequestDto
  implements AcceptTermsRequest
{
  @ApiProperty({
    example: true,
    description: 'Indicates if the user accepts the terms of service',
  })
  @IsBoolean({ message: 'acceptedTerms must be a boolean' })
  acceptedTerms: boolean;
}

export class AcceptPrivacyPolicyRequestDto
  extends ActionRequestDto
  implements AcceptPrivacyPolicyRequest
{
  @ApiProperty({
    example: true,
    description: 'Indicates if the user accepts the privacy policy',
  })
  @IsBoolean({ message: 'acceptedPrivacyPolicy must be a boolean' })
  acceptedPrivacyPolicy: boolean;
}

export class JwtTokenDto implements JwtToken {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  accessToken: string;

  @ApiProperty({
    example: 3600000,
    description: 'Token expiration time in milliseconds',
  })
  expiresIn: number;
}

export class AuthResponseDto implements AuthResponse {
  @ApiProperty({
    type: JwtTokenDto,
    description: 'JWT token information',
  })
  jwt: JwtTokenDto;

  @ApiProperty({
    description: 'User account information',
    type: Object,
  })
  userAccount: any;

  @ApiProperty({
    type: UserDto,
    description: 'User information (for backward compatibility)',
  })
  user: UserDto;
}
