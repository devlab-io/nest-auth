import { z } from 'zod';
import {
  SignInRequest,
  SignUpRequest,
  InviteRequest,
  AcceptInvitationRequest,
  ValidateEmailRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
  AcceptTermsRequest,
  AcceptPrivacyPolicyRequest,
} from '@devlab-io/nest-auth-types';

/**
 * Zod schema for SignInRequest
 */
export const signInRequestSchema = z.object({
  email: z.string().email('Email must be a valid email address'),
  password: z.string().min(1, 'Password is required'),
}) satisfies z.ZodType<SignInRequest>;

/**
 * Zod schema for SignUpRequest
 */
export const signUpRequestSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters long')
    .optional(),
  email: z.string().email('Email must be a valid email address'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  enabled: z.boolean(),
  profilePicture: z.string().optional(),
  acceptedTerms: z.boolean(),
  acceptedPrivacyPolicy: z.boolean(),
  credentials: z
    .array(
      z.object({
        type: z.enum(['password', 'google']),
        password: z.string().optional(),
        googleId: z.string().optional(),
      }),
    )
    .optional(),
  actions: z
    .array(
      z.object({
        type: z.number(),
        expiresIn: z.number().optional(),
        roles: z.array(z.string()).optional(),
      }),
    )
    .optional(),
}) satisfies z.ZodType<SignUpRequest>;

/**
 * Zod schema for InviteRequest
 */
export const inviteRequestSchema = z.object({
  email: z.string().email('Email must be a valid email address'),
  organisation: z.string().optional(),
  establishment: z.string().optional(),
  expiresIn: z
    .number()
    .min(1, 'ExpiresIn must be at least 1 hour')
    .max(8760, 'ExpiresIn must be at most 8760 hours (1 year)')
    .optional(),
  message: z.string().optional(),
  roles: z.array(z.string()).optional(),
}) satisfies z.ZodType<InviteRequest>;

/**
 * Zod schema for AcceptInvitationRequest
 */
export const acceptInvitationRequestSchema = signUpRequestSchema.extend({
  token: z.string().min(1, 'Token is required'),
  email: z.string().email('Email must be a valid email address'),
}) satisfies z.ZodType<AcceptInvitationRequest>;

/**
 * Zod schema for ValidateEmailRequest
 */
export const validateEmailRequestSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  email: z.string().email('Email must be a valid email address'),
}) satisfies z.ZodType<ValidateEmailRequest>;

/**
 * Zod schema for ChangePasswordRequest
 */
export const changePasswordRequestSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  email: z.string().email('Email must be a valid email address'),
  oldPassword: z
    .string()
    .min(8, 'Old password must be at least 8 characters long'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters long'),
}) satisfies z.ZodType<ChangePasswordRequest>;

/**
 * Zod schema for ResetPasswordRequest
 */
export const resetPasswordRequestSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  email: z.string().email('Email must be a valid email address'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long'),
}) satisfies z.ZodType<ResetPasswordRequest>;

/**
 * Zod schema for AcceptTermsRequest
 */
export const acceptTermsRequestSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  email: z.string().email('Email must be a valid email address'),
  acceptedTerms: z.boolean(),
}) satisfies z.ZodType<AcceptTermsRequest>;

/**
 * Zod schema for AcceptPrivacyPolicyRequest
 */
export const acceptPrivacyPolicyRequestSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  email: z.string().email('Email must be a valid email address'),
  acceptedPrivacyPolicy: z.boolean(),
}) satisfies z.ZodType<AcceptPrivacyPolicyRequest>;
