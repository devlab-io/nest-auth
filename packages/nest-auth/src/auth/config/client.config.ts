import { Provider } from '@nestjs/common';

/**
 * Configuration d'une action pour un client spécifique.
 * Chaque client peut avoir des routes et des durées de validité différentes.
 */
export interface ClientActionConfig {
  route?: string; // Route pour cette action (ex: 'auth/reset-password')
  validity: number; // Durée de validité en heures
}

/**
 * Configuration de toutes les actions possibles pour un client.
 */
export interface ClientActionsConfig {
  invite?: ClientActionConfig;
  validateEmail?: ClientActionConfig;
  resetPassword?: ClientActionConfig;
  changePassword?: ClientActionConfig;
  changeEmail?: ClientActionConfig;
  acceptTerms?: ClientActionConfig;
  acceptPrivacyPolicy?: ClientActionConfig;
}

/**
 * Configuration complète d'un client.
 */
export interface ClientConfig {
  id: string;
  uri: string | null; // null = code seul (pas de lien)
  actions: ClientActionsConfig;
}

/**
 * Configuration de tous les clients.
 */
export interface ClientsConfig {
  clients: Map<string, ClientConfig>;
}

export const ClientsConfigToken: symbol = Symbol('ClientsConfig');

/**
 * Valeurs par défaut pour la validité des actions (en heures).
 */
const DEFAULT_VALIDITY: Record<keyof ClientActionsConfig, number> = {
  invite: 48,
  validateEmail: 24,
  resetPassword: 1,
  changePassword: 1,
  changeEmail: 24,
  acceptTerms: 168, // 7 jours
  acceptPrivacyPolicy: 168,
};

/**
 * Parse les variables d'environnement indexées pour construire la configuration des clients.
 *
 * Format des variables :
 * - AUTH_CLIENT_0_ID=local
 * - AUTH_CLIENT_0_URI=http://localhost:3000
 * - AUTH_CLIENT_0_ACTION_INVITE_ROUTE=auth/accepter-invitation
 * - AUTH_CLIENT_0_ACTION_INVITE_VALIDITY=48
 * - AUTH_CLIENT_1_ID=mobile
 * - AUTH_CLIENT_1_URI=myapp://
 * - etc.
 */
function parseClientsFromEnv(
  env: NodeJS.ProcessEnv,
): Map<string, ClientConfig> {
  const clients = new Map<string, ClientConfig>();
  let index = 0;

  while (env[`AUTH_CLIENT_${index}_ID`]) {
    const prefix = `AUTH_CLIENT_${index}_`;
    const id = env[`${prefix}ID`]!;
    const uri = env[`${prefix}URI`];

    const parseAction = (
      actionName: string,
      defaultValidityKey: keyof ClientActionsConfig,
    ): ClientActionConfig | undefined => {
      const routeKey = `${prefix}ACTION_${actionName}_ROUTE`;
      const validityKey = `${prefix}ACTION_${actionName}_VALIDITY`;

      const route = env[routeKey];
      const validityStr = env[validityKey];
      const validity = validityStr
        ? parseInt(validityStr, 10)
        : DEFAULT_VALIDITY[defaultValidityKey];

      // Si pas de route et URI=none, on garde quand même la validité
      if (!route && uri !== 'none') {
        return undefined;
      }

      return {
        route: route ? normalizeRoute(route) : undefined,
        validity,
      };
    };

    clients.set(id, {
      id,
      uri: uri === 'none' ? null : (uri ?? null),
      actions: {
        invite: parseAction('INVITE', 'invite'),
        validateEmail: parseAction('VALIDATE_EMAIL', 'validateEmail'),
        resetPassword: parseAction('RESET_PASSWORD', 'resetPassword'),
        changePassword: parseAction('CHANGE_PASSWORD', 'changePassword'),
        changeEmail: parseAction('CHANGE_EMAIL', 'changeEmail'),
        acceptTerms: parseAction('ACCEPT_TERMS', 'acceptTerms'),
        acceptPrivacyPolicy: parseAction(
          'ACCEPT_PRIVACY_POLICY',
          'acceptPrivacyPolicy',
        ),
      },
    });

    index++;
  }

  return clients;
}

/**
 * Normalise une route (supprime les slashes en début et fin).
 */
function normalizeRoute(route: string): string {
  return route.replace(/^\/+|\/+$/g, '');
}

/**
 * Provider pour la configuration des clients.
 */
export function provideClientsConfig(): Provider {
  return {
    provide: ClientsConfigToken,
    useFactory: (): ClientsConfig => {
      const clients = parseClientsFromEnv(process.env);

      if (clients.size === 0) {
        console.warn(
          '[nest-auth] Aucun client configuré. Ajoutez AUTH_CLIENT_0_ID, AUTH_CLIENT_0_URI, etc.',
        );
      }

      return { clients };
    },
  };
}
