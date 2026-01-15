import { Provider } from '@nestjs/common';
import { z } from 'zod';
import { DeepPartial } from 'typeorm';
import { route } from '../utils';

export interface UnitActionConfig {
  validity: number; // hours
  route: string; // Frontend route suffix (e.g., 'auth/reset-password')
}

export interface InviteActionConfig extends UnitActionConfig {
  organisation?: string;
  establishment?: string;
}

export interface ActionConfig {
  invite: InviteActionConfig;
  validateEmail: UnitActionConfig;
  acceptTerms: UnitActionConfig;
  acceptPrivacyPolicy: UnitActionConfig;
  changePassword: UnitActionConfig;
  resetPassword: UnitActionConfig;
  changeEmail: UnitActionConfig;
}

export const ActionConfigToken: symbol = Symbol('ActionConfig');

const actionConfigSchema = z.object({
  AUTH_ACTION_CLIENT_URL: z.string().default('http://localhost:3000'), // TODO Use that ?
  AUTH_ACTION_INVITE: z.coerce.number().default(24),
  AUTH_ACTION_INVITE_ROUTE: z.string().default('auth/accept-invitation'),
  AUTH_ACTION_INVITE_ORGANISATION: z.string().optional(),
  AUTH_ACTION_INVITE_ESTABLISHMENT: z.string().optional(),
  AUTH_ACTION_VALIDATE_EMAIL: z.coerce.number().default(24),
  AUTH_ACTION_VALIDATE_EMAIL_ROUTE: z.string().default('auth/validate-email'),
  AUTH_ACTION_ACCEPT_TERMS: z.coerce.number().default(24),
  AUTH_ACTION_ACCEPT_TERMS_ROUTE: z.string().default('auth/accept-terms'),
  AUTH_ACTION_ACCEPT_PRIVACY_POLICY: z.coerce.number().default(24),
  AUTH_ACTION_ACCEPT_PRIVACY_POLICY_ROUTE: z
    .string()
    .default('auth/accept-privacy-policy'),
  AUTH_ACTION_RESET_PASSWORD: z.coerce.number().default(24),
  AUTH_ACTION_RESET_PASSWORD_ROUTE: z.string().default('auth/reset-password'),
  AUTH_ACTION_CHANGE_PASSWORD: z.coerce.number().default(24),
  AUTH_ACTION_CHANGE_PASSWORD_ROUTE: z.string().default('auth/change-password'),
  AUTH_ACTION_CHANGE_EMAIL: z.coerce.number().default(24),
  AUTH_ACTION_CHANGE_EMAIL_ROUTE: z.string().default('auth/change-email'),
});

function parseActionConfig(env: NodeJS.ProcessEnv): ActionConfig {
  const config = actionConfigSchema.parse(env);
  return {
    invite: {
      validity: config.AUTH_ACTION_INVITE,
      route: route(config.AUTH_ACTION_INVITE_ROUTE),
      organisation: config.AUTH_ACTION_INVITE_ORGANISATION,
      establishment: config.AUTH_ACTION_INVITE_ESTABLISHMENT,
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
    resetPassword: {
      validity: config.AUTH_ACTION_RESET_PASSWORD,
      route: route(config.AUTH_ACTION_RESET_PASSWORD_ROUTE),
    },
    changePassword: {
      validity: config.AUTH_ACTION_CHANGE_EMAIL,
      route: route(config.AUTH_ACTION_CHANGE_PASSWORD_ROUTE),
    },
    changeEmail: {
      validity: config.AUTH_ACTION_CHANGE_EMAIL,
      route: route(config.AUTH_ACTION_CHANGE_EMAIL_ROUTE),
    },
  };
}

export function provideActionConfig(
  config?: DeepPartial<{ invite: ActionConfig['invite'] } & ActionConfig>,
): Provider {
  return {
    provide: ActionConfigToken,
    useFactory: (): ActionConfig => {
      // Priority: config passed > environment variable > default zod
      const envConfig = parseActionConfig(process.env);
      return {
        invite: {
          validity: config?.invite?.validity ?? envConfig.invite.validity,
          route: config?.invite?.route ?? envConfig.invite.route,
          organisation:
            config?.invite?.organisation ?? envConfig.invite.organisation,
          establishment:
            config?.invite?.establishment ?? envConfig.invite.establishment,
        },
        validateEmail: {
          validity:
            config?.validateEmail?.validity ?? envConfig.validateEmail.validity,
          route: config?.validateEmail?.route ?? envConfig.validateEmail.route,
        },
        acceptTerms: {
          validity:
            config?.acceptTerms?.validity ?? envConfig.acceptTerms.validity,
          route: config?.acceptTerms?.route ?? envConfig.acceptTerms.route,
        },
        acceptPrivacyPolicy: {
          validity:
            config?.acceptPrivacyPolicy?.validity ??
            envConfig.acceptPrivacyPolicy.validity,
          route:
            config?.acceptPrivacyPolicy?.route ??
            envConfig.acceptPrivacyPolicy.route,
        },
        resetPassword: {
          validity:
            config?.resetPassword?.validity ?? envConfig.resetPassword.validity,
          route: config?.resetPassword?.route ?? envConfig.resetPassword.route,
        },
        changePassword: {
          validity:
            config?.changePassword?.validity ??
            envConfig.changePassword.validity,
          route:
            config?.changePassword?.route ?? envConfig.changePassword.route,
        },
        changeEmail: {
          validity:
            config?.changeEmail?.validity ?? envConfig.changeEmail.validity,
          route: config?.changeEmail?.route ?? envConfig.changeEmail.route,
        },
      };
    },
  };
}
