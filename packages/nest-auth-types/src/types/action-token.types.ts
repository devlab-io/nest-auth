import { User } from './user.types';
import { Role } from './role.types';
import { SignUpRequest } from './auth.types';

/**
 * Action Type as bit mask
 * Each action is represented by a unique bit position
 */
export enum ActionType {
  Invite = 1 << 0, // 1 (00000001)
  ValidateEmail = 1 << 1, // 2 (00000010)
  AcceptTerms = 1 << 2, // 4 (00000100)
  AcceptPrivacyPolicy = 1 << 3, // 8 (00001000)
  ResetPassword = 1 << 4, // 16 (00010000)
  ChangePassword = 1 << 5, // 32 (00100000)
  ChangeEmail = 1 << 6, // 64 (01000000)
}

export interface Action {
  token: string;
  type: number; // Bit mask of ActionType values
  email: string;
  createdAt: Date;
  expiresAt?: Date;
  user?: User;
  roles: Role[];
  organisationId?: string; // For Invite action: organisation to create user account in
  establishmentId?: string; // For Invite action: establishment to create user account in
}

export interface ActionQueryParams {
  type?: number; // Bit mask of ActionType values
  createdAt?: Date;
  expiresAt?: Date;
  email?: string;
  username?: string;
  roles?: string[];
}

export interface CreateActionRequest {
  type: number; // Bit mask of ActionType values
  email?: string; // If user is not provided, email is required
  expiresIn?: number; // hours
  user?: User;
  roles?: string[];
  organisationId?: string; // For Invite action: organisation to create user account in
  establishmentId?: string; // For Invite action: establishment to create user account in
}

// Action Request interfaces
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

export interface ChangePasswordRequest extends ActionRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest extends ActionRequest {
  newPassword: string;
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
  | ChangePasswordRequest
  | ResetPasswordRequest
  | AcceptTermsRequest
  | AcceptPrivacyPolicyRequest;
