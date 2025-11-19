import { Provider } from '@nestjs/common';
import { z } from 'zod';
import { route } from '../utils';

export interface UnitActionConfig {
  validity: number; // hours
  route: string; // Frontend route suffix (e.g., 'auth/reset-password')
}

export interface ActionConfig {
  invite: UnitActionConfig;
  validateEmail: UnitActionConfig;
  acceptTerms: UnitActionConfig;
  acceptPrivacyPolicy: UnitActionConfig;
  createPassword: UnitActionConfig;
  resetPassword: UnitActionConfig;
  changeEmail: UnitActionConfig;
}

export const ActionConfigToken: symbol = Symbol('ActionConfig');

const actionConfigSchema = z.object({
  AUTH_ACTION_INVITE: z.coerce.number().default(24),
  AUTH_ACTION_INVITE_ROUTE: z.string().default('auth/accept-invitation'),
  AUTH_ACTION_VALIDATE_EMAIL: z.coerce.number().default(24),
  AUTH_ACTION_VALIDATE_EMAIL_ROUTE: z.string().default('auth/validate-email'),
  AUTH_ACTION_ACCEPT_TERMS: z.coerce.number().default(24),
  AUTH_ACTION_ACCEPT_TERMS_ROUTE: z.string().default('auth/accept-terms'),
  AUTH_ACTION_ACCEPT_PRIVACY_POLICY: z.coerce.number().default(24),
  AUTH_ACTION_ACCEPT_PRIVACY_POLICY_ROUTE: z.string().default('auth/accept-privacy-policy'),
  AUTH_ACTION_CREATE_PASSWORD: z.coerce.number().default(24),
  AUTH_ACTION_CREATE_PASSWORD_ROUTE: z.string().default('auth/create-password'),
  AUTH_ACTION_RESET_PASSWORD: z.coerce.number().default(24),
  AUTH_ACTION_RESET_PASSWORD_ROUTE: z.string().default('auth/reset-password'),
  AUTH_ACTION_CHANGE_EMAIL: z.coerce.number().default(24),
  AUTH_ACTION_CHANGE_EMAIL_ROUTE: z.string().default('auth/change-email'),
});

function parseActionConfig(env: NodeJS.ProcessEnv): ActionConfig {
  const config = actionConfigSchema.parse(env);
  return {
    invite: {
      validity: config.AUTH_ACTION_INVITE,
      route: route(config.AUTH_ACTION_INVITE_ROUTE),
    },
    validateEmail: {
      validity: config.AUTH_ACTION_VALIDATE_EMAIL,
      route: route(config.AUTH_ACTION_VALIDATE_EMAIL_ROUTE),
    },
    acceptTerms: {
      validity: config.AUTH_ACTION_ACCEPT_TERMS,
      route: route(config.AUTH_ACTION_ACCEPT_TERMS_ROUTE),
    },
    acceptPrivacyPolicy: {
      validity: config.AUTH_ACTION_ACCEPT_PRIVACY_POLICY,
      route: route(config.AUTH_ACTION_ACCEPT_PRIVACY_POLICY_ROUTE),
    },
    createPassword: {
      validity: config.AUTH_ACTION_CREATE_PASSWORD,
      route: route(config.AUTH_ACTION_CREATE_PASSWORD_ROUTE),
    },
    resetPassword: {
      validity: config.AUTH_ACTION_RESET_PASSWORD,
      route: route(config.AUTH_ACTION_RESET_PASSWORD_ROUTE),
    },
    changeEmail: {
      validity: config.AUTH_ACTION_CHANGE_EMAIL,
      route: route(config.AUTH_ACTION_CHANGE_EMAIL_ROUTE),
    },
  };
}

export function provideActionConfig(): Provider {
  return {
    provide: ActionConfigToken,
    useFactory: (): ActionConfig => {
      return parseActionConfig(process.env);
    },
  };
}
