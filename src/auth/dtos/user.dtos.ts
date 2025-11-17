import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  MinLength,
} from 'class-validator';
import {
  CreateUserRequest,
  PatchUserRequest,
  UpdateUserRequest,
  User,
  UserPage,
  Role,
} from '../types';

export class RoleDto implements Role {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier of the role',
  })
  id: number;

  @ApiProperty({
    example: 'admin',
    description: 'Name of the role',
  })
  name: string;

  @ApiPropertyOptional({
    example: "Donne accès à toute l'application",
    description: 'Description of the role',
  })
  description?: string;
}

export class UserDto implements User {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique identifier of the user',
  })
  id: string;

  @ApiProperty({
    example: 'johndoe',
    description: 'Username of the user',
  })
  username: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address of the user',
  })
  email: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if the user email is validated',
  })
  emailValidated: boolean;

  @ApiPropertyOptional({
    example: 'John',
    description: 'First name of the user',
  })
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Doe',
    description: 'Last name of the user',
  })
  lastName?: string;

  @ApiPropertyOptional({
    example: '+689123456789',
    description: 'Phone number of the user',
  })
  phone?: string;

  @ApiPropertyOptional({
    example: 'hashedPassword123',
    description: 'Hashed password of the user',
    writeOnly: true,
  })
  password?: string;

  @ApiPropertyOptional({
    example: '123456789',
    description: 'Google ID of the user if signed in with Google',
  })
  googleId?: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if the user account is enabled',
  })
  enabled: boolean;

  @ApiPropertyOptional({
    example: 'https://example.com/profile.jpg',
    description: "URL of the user's profile picture",
  })
  profilePicture?: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if the user accepted the terms of service',
  })
  acceptedTerms: boolean;

  @ApiProperty({
    example: true,
    description: 'Indicates if the user accepted the privacy policy',
  })
  acceptedPrivacyPolicy: boolean;

  @ApiProperty({
    example: '2024-02-20T10:00:00.000Z',
    description: 'Date when the user account was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-02-20T10:00:00.000Z',
    description: 'Date when the user account was last updated',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Roles assigned to the user',
    type: [RoleDto],
  })
  roles: RoleDto[];

  @ApiProperty({
    description: 'Action tokens associated with the user',
    type: Array,
  })
  actionsTokens: any[];
}

export class CreateUserRequestDto implements CreateUserRequest {
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

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'Password of the user',
    minLength: 8,
  })
  @IsString({ message: 'password must be a string' })
  @MinLength(8, { message: 'password must be at least 8 characters long' })
  password: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if the user account is enabled',
  })
  @IsBoolean({ message: 'enabled must be a boolean' })
  enabled: boolean;

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

  @ApiPropertyOptional({
    example: ['user'],
    description: 'Array of role names to assign to the user',
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'roles must be an array' })
  @IsString({ each: true, message: 'Each role must be a string' })
  roles?: string[];
}

export class PatchUserRequestDto implements PatchUserRequest {
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
    example: 'https://example.com/profile.jpg',
    description: "URL of the user's profile picture",
  })
  @IsOptional()
  @IsString({ message: 'profilePicture must be a string' })
  profilePicture?: string;

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

export class UpdateUserRequestDto
  extends PatchUserRequestDto
  implements UpdateUserRequest
{
  @ApiPropertyOptional({
    example: 'john.doe@example.com',
    description: 'Email address of the user',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Indicates if the user email is validated',
  })
  @IsOptional()
  @IsBoolean({ message: 'emailValidated must be a boolean' })
  emailValidated?: boolean;

  @ApiPropertyOptional({
    example: 'johndoe',
    description: 'Username of the user',
  })
  @IsOptional()
  @IsString({ message: 'username must be a string' })
  @MinLength(3, { message: 'username must be at least 3 characters long' })
  username?: string;

  @ApiPropertyOptional({
    example: 'SecurePassword123!',
    description: 'Password of the user',
    minLength: 8,
  })
  @IsOptional()
  @IsString({ message: 'password must be a string' })
  @MinLength(8, { message: 'password must be at least 8 characters long' })
  password?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Indicates if the user account is enabled',
  })
  @IsOptional()
  @IsBoolean({ message: 'enabled must be a boolean' })
  enabled?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Indicates if the user accepted the terms of service',
  })
  @IsOptional()
  @IsBoolean({ message: 'acceptedTerms must be a boolean' })
  acceptedTerms?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Indicates if the user accepted the privacy policy',
  })
  @IsOptional()
  @IsBoolean({ message: 'acceptedPrivacyPolicy must be a boolean' })
  acceptedPrivacyPolicy?: boolean;
}

export class UserPageDto implements UserPage {
  @ApiProperty({
    description: 'Array of users',
    type: [UserDto],
  })
  data: UserDto[];

  @ApiProperty({
    example: 100,
    description: 'Total number of users',
  })
  total: number;

  @ApiProperty({
    example: 1,
    description: 'Current page number',
  })
  page: number;

  @ApiProperty({
    example: 10,
    description: 'Number of users per page',
  })
  limit: number;
}
