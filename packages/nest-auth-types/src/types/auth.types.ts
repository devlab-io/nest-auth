import { UserAccount } from './user-account.types';
import { User } from './user.types';

export interface SignInRequest {
  email: string;
  password: string;
}

export interface JwtToken {
  accessToken: string;
  expiresIn: number; // Expiration time in milliseconds
}

export interface JwtPayload {
  sub: string; // userAccount id
  userId: string; // user id
  email: string;
  username: string;
  roles: string[];
  organisationId?: string;
  establishmentId?: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  jwt: JwtToken;
  userAccount: UserAccount;
  user: User; // For backward compatibility
}

export interface SignUpRequest {
  username?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  profilePicture?: string;
  acceptedTerms: boolean;
  acceptedPrivacyPolicy: boolean;
  credentials?: Array<{
    type: 'password' | 'google';
    password?: string;
    googleId?: string;
  }>;
  roles?: string[];
}

export interface InviteRequest {
  email: string;
  organisation?: string; // Organisation to create user account in
  establishment?: string; // Establishment to create user account in
  expiresIn?: number; // hours
  message?: string;
  roles?: string[];
}
