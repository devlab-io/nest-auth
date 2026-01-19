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

/**
 * Type partiel pour la configuration des clients (utilisable en paramètre).
 * Utilise un objet au lieu d'une Map pour faciliter la configuration.
 */
export type PartialClientsConfig = {
  clients?: Record<string, Partial<Omit<ClientConfig, 'actions'> & {
    actions?: Partial<Record<keyof ClientActionsConfig, Partial<ClientActionConfig>>>;
  }>>;
};

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
 * Fusionne la configuration partielle avec celle des variables d'environnement.
 * Les valeurs du paramètre prévalent sur celles des variables d'environnement.
 */
function mergeClientsConfig(
  envClients: Map<string, ClientConfig>,
  partialConfig?: PartialClientsConfig,
): Map<string, ClientConfig> {
  if (!partialConfig?.clients) {
    return envClients;
  }

  const merged = new Map(envClients);

  for (const [clientId, partialClient] of Object.entries(partialConfig.clients)) {
    const existing = merged.get(clientId);

    if (existing) {
      // Fusionner avec le client existant
      const mergedActions: ClientActionsConfig = { ...existing.actions };

      if (partialClient.actions) {
        for (const [actionKey, actionValue] of Object.entries(partialClient.actions)) {
          const key = actionKey as keyof ClientActionsConfig;
          if (actionValue) {
            mergedActions[key] = {
              ...existing.actions[key],
              ...actionValue,
              validity: actionValue.validity ?? existing.actions[key]?.validity ?? DEFAULT_VALIDITY[key],
            };
          }
        }
      }

      merged.set(clientId, {
        id: partialClient.id ?? existing.id,
        uri: partialClient.uri !== undefined ? partialClient.uri : existing.uri,
        actions: mergedActions,
      });
    } else {
      // Nouveau client à partir de la config partielle
      const actions: ClientActionsConfig = {};

      if (partialClient.actions) {
        for (const [actionKey, actionValue] of Object.entries(partialClient.actions)) {
          const key = actionKey as keyof ClientActionsConfig;
          if (actionValue) {
            actions[key] = {
              route: actionValue.route,
              validity: actionValue.validity ?? DEFAULT_VALIDITY[key],
            };
          }
        }
      }

      merged.set(clientId, {
        id: partialClient.id ?? clientId,
        uri: partialClient.uri ?? null,
        actions,
      });
    }
  }

  return merged;
}

/**
 * Provider pour la configuration des clients.
 * Fusionne la configuration partielle avec les variables d'environnement.
 * Les valeurs du paramètre prévalent sur celles des variables d'environnement.
 */
export function provideClientsConfig(config?: PartialClientsConfig): Provider {
  return {
    provide: ClientsConfigToken,
    useFactory: (): ClientsConfig => {
      const envClients = parseClientsFromEnv(process.env);
      const clients = mergeClientsConfig(envClients, config);

      if (clients.size === 0) {
        console.warn(
          '[nest-auth] Aucun client configuré. Ajoutez AUTH_CLIENT_0_ID, AUTH_CLIENT_0_URI, etc.',
        );
      }

      return { clients };
    },
  };
}
