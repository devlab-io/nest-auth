/**
 * Action Token Type as bit mask
 * Each action is represented by a unique bit position
 */
export enum ActionTokenType {
  Invite = 1 << 0, // 1 (00000001)
  ValidateEmail = 1 << 1, // 2 (00000010)
  AcceptTerms = 1 << 2, // 4 (00000100)
  AcceptPrivacyPolicy = 1 << 3, // 8 (00001000)
  CreatePassword = 1 << 4, // 16 (00010000)
  ResetPassword = 1 << 5, // 32 (00100000)
  ChangeEmail = 1 << 6, // 64 (01000000)
}

export interface ActionToken {
  token: string;
  type: number; // Bit mask of ActionTokenType values
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
  type?: number; // Bit mask of ActionTokenType values
  createdAt?: Date;
  expiresAt?: Date;
  email?: string;
  username?: string;
  roles?: string[];
}

export interface CreateActionTokenRequest {
  type: number; // Bit mask of ActionTokenType values
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

export interface CreateUserRequest {
  username?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  password: string;
  enabled: boolean;
  profilePicture?: string;
  acceptedTerms: boolean;
  acceptedPrivacyPolicy: boolean;
  roles?: string[];
}

export interface PatchUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  profilePicture?: string;
  roles?: string[];
}

export interface UpdateUserRequest extends PatchUserRequest {
  email?: string;
  emailValidated?: boolean;
  username?: string;
  password?: string;
  enabled?: boolean;
  acceptedTerms?: boolean;
  acceptedPrivacyPolicy?: boolean;
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
  actions?: number[]; // Array of bit masks or single ActionTokenType values
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

export interface SignUpRequest extends CreateUserRequest {}

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

export type AnyActionRequest =
  | AcceptInvitationRequest
  | ChangeEmailRequest
  | ValidateEmailRequest
  | CreatePasswordRequest
  | ResetPasswordRequest
  | AcceptTermsRequest
  | AcceptPrivacyPolicyRequest;

export interface SignInRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
