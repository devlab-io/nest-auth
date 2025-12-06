export enum ClaimAction {
  ADMIN = 'admin',
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  ENABLE = 'enable',
  DISABLE = 'disable',
  EXECUTE = 'execute',
  DELETE = 'delete',
}

export enum ClaimScope {
  ADMIN = 'admin',
  ANY = 'any',
  ORGANISATION = 'organisation',
  ESTABLISHMENT = 'establishment',
  OWN = 'own',
}

export interface Claim {
  action: ClaimAction;
  scope: ClaimScope;
  resource: string;
}

export type ClaimLike = string | Claim | [ClaimAction, ClaimScope, string];
