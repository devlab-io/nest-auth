export enum ActionTokenType {
  Invite = 'invite',
  AcceptTerms = 'accept-terms',
  AcceptPrivacyPolicy = 'accept-privacy-policy',
  ChangeEmail = 'change-email',
  ValidateEmail = 'validate-email',
  CreatePassword = 'create-password',
  ResetPassword = 'reset-password',
}

export interface ActionToken {
  token: string;
  type: ActionTokenType;
  email: string;
  createdAt: Date;
  expiresAt?: Date;
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
  email?: string; // If user is not provided, email is required
  expiresIn?: number; // hours
  user?: User;
  roles?: string[];
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
  emailValidated: boolean;
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
  emailValidated?: boolean;
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

export interface GenerateUsernameRequest {
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export interface InviteRequest {
  email: string;
  expiresIn?: number; // hours
  message?: string;
  roles?: string[];
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

export interface ActionRequest {
  token: string;
  email: string;
}

export interface AcceptInvitationRequest extends SignUpRequest, ActionRequest {}

export interface ChangeEmailRequest extends ActionRequest {
  email: string;
}

export interface ValidateEmailRequest extends ActionRequest {
  email: string;
}

export interface CreatePasswordRequest extends ActionRequest {
  password: string;
}

export interface ResetPasswordRequest extends ActionRequest {
  password: string;
}

export interface AcceptTermsRequest extends ActionRequest {
  acceptedTerms: boolean;
}

export interface AcceptPrivacyPolicyRequest extends ActionRequest {
  acceptedPrivacyPolicy: boolean;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
