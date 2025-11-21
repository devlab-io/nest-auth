import { Credential } from './credential.types';
import { Action } from './action-token.types';
import { UserAccount } from './user-account.types';

export interface User {
  id: string;
  username: string;
  email: string;
  emailValidated: boolean;
  firstName?: string;
  lastName?: string;
  phone?: string;
  enabled: boolean;
  profilePicture?: string;
  acceptedTerms: boolean;
  acceptedPrivacyPolicy: boolean;
  createdAt: Date;
  updatedAt: Date;
  credentials: Credential[];
  actions: Action[];
  accounts: UserAccount[];
}

export interface CreateUserRequest {
  username?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  enabled: boolean;
  profilePicture?: string;
  acceptedTerms: boolean;
  acceptedPrivacyPolicy: boolean;
  credentials?: Array<{
    type: 'password' | 'google';
    password?: string;
    googleId?: string;
  }>;
  actions?: Array<{
    type: number; // ActionType bit mask
    expiresIn?: number; // hours
    roles?: string[];
  }>;
}

export interface PatchUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  profilePicture?: string;
}

export interface UpdateUserRequest extends PatchUserRequest {
  email?: string;
  emailValidated?: boolean;
  username?: string;
  enabled?: boolean;
  acceptedTerms?: boolean;
  acceptedPrivacyPolicy?: boolean;
  credentials?: Array<{
    type: 'password' | 'google';
    password?: string;
    googleId?: string;
  }>;
}

export interface UserQueryParams {
  id?: string;
  username?: string;
  email?: string;
  emailValidated?: boolean;
  firstName?: string;
  lastName?: string;
  phone?: string;
  enabled?: boolean;
  acceptedTerms?: boolean;
  acceptedPrivacyPolicy?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  actions?: number; // bit masks or single ActionType values
}

export interface UserPage {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

export interface GenerateUsernameRequest {
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}
