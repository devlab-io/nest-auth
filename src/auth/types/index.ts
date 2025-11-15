export enum ActionTokenType {
  Invite = 'invite',
  ResetPassword = 'reset-password',
  AcceptTerms = 'accept-terms',
  AcceptConditions = 'accept-conditions',
  ValidateEmail = 'validate-email',
  CreatePassword = 'create-password',
  AcceptPrivacyPolicy = 'accept-privacy-policy',
}

export interface ActionToken {
  token: string;
  type: ActionTokenType;
  createdAt: Date;
  expiresAt?: Date;
  email?: string;
  user?: User;
  roles?: Role[];
}

export interface ActionTokenPage {
  data: ActionToken[];
  total: number;
  page: number;
  limit: number;
}

export interface ActionTokenQueryParams {
  type?: ActionTokenType;
  createdAt?: Date;
  expiresAt?: Date;
  email?: string;
  username?: string;
  roles?: string[];
}

export interface CreateActionTokenRequest {
  type: ActionTokenType;
  expiresIn?: number; // hours
  email?: string;
  user?: string;
  roles: string[];
}

export interface Role {
  id: number;
  name: string;
  description?: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  password?: string;
  googleId?: string;
  enabled: boolean;
  profilePicture?: string;
  acceptedTerms: boolean;
  acceptedPrivacyPolicy: boolean;
  createdAt: Date;
  updatedAt: Date;
  roles: Role[];
  actionsTokens: ActionToken[];
}

export interface UserQueryParams {
  id?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  enabled?: boolean;
  acceptedTerms?: boolean;
  acceptedPrivacyPolicy?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  roles?: string[];
  actions?: ActionTokenType[];
}

export interface UserUpdateRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  profilePicture?: string;
  roles?: string[];
}

export interface UserPage {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

export interface InviteRequest {
  email: string;
  expiresIn?: number; // hours
  message?: string;
  roles?: string[];
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  acceptedTerms: boolean;
  acceptedPrivacyPolicy: boolean;
  username?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  profilePicture?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
