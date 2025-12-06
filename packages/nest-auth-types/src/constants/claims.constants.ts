import { claim } from '../utils/claims.utils';
import { Claim, ClaimAction, ClaimScope } from '../types';
import {
  USER_ACCOUNTS,
  ANY,
  ESTABLISHMENTS,
  ORGANISATIONS,
  ROLES,
  SESSIONS,
  USERS,
} from './resources.constants';
// ADMIN
export const ADMIN: Claim = claim(ClaimAction.ADMIN, ClaimScope.ADMIN, ANY);

// ESTABLISHMENTS
export const CREATE_ANY_ESTABLISHMENTS: Claim = claim(
  ClaimAction.CREATE,
  ClaimScope.ANY,
  ESTABLISHMENTS,
);
export const READ_ANY_ESTABLISHMENTS: Claim = claim(
  ClaimAction.READ,
  ClaimScope.ANY,
  ESTABLISHMENTS,
);
export const READ_ORG_ESTABLISHMENTS: Claim = claim(
  ClaimAction.READ,
  ClaimScope.ORGANISATION,
  ESTABLISHMENTS,
);
export const READ_OWN_ESTABLISHMENTS: Claim = claim(
  ClaimAction.READ,
  ClaimScope.OWN,
  ESTABLISHMENTS,
);
export const UPDATE_ANY_ESTABLISHMENTS: Claim = claim(
  ClaimAction.UPDATE,
  ClaimScope.ANY,
  ESTABLISHMENTS,
);
export const UPDATE_ORG_ESTABLISHMENTS: Claim = claim(
  ClaimAction.UPDATE,
  ClaimScope.ORGANISATION,
  ESTABLISHMENTS,
);
export const UPDATE_OWN_ESTABLISHMENTS: Claim = claim(
  ClaimAction.UPDATE,
  ClaimScope.OWN,
  ESTABLISHMENTS,
);
export const ENABLE_ANY_ESTABLISHMENTS: Claim = claim(
  ClaimAction.ENABLE,
  ClaimScope.ANY,
  ESTABLISHMENTS,
);
export const ENABLE_ORG_ESTABLISHMENTS: Claim = claim(
  ClaimAction.ENABLE,
  ClaimScope.ORGANISATION,
  ESTABLISHMENTS,
);
export const ENABLE_OWN_ESTABLISHMENTS: Claim = claim(
  ClaimAction.ENABLE,
  ClaimScope.OWN,
  ESTABLISHMENTS,
);
export const DISABLE_ANY_ESTABLISHMENTS: Claim = claim(
  ClaimAction.DISABLE,
  ClaimScope.ANY,
  ESTABLISHMENTS,
);
export const DISABLE_ORG_ESTABLISHMENTS: Claim = claim(
  ClaimAction.DISABLE,
  ClaimScope.ORGANISATION,
  ESTABLISHMENTS,
);
export const DISABLE_OWN_ESTABLISHMENTS: Claim = claim(
  ClaimAction.DISABLE,
  ClaimScope.OWN,
  ESTABLISHMENTS,
);
export const DELETE_ANY_ESTABLISHMENTS: Claim = claim(
  ClaimAction.DELETE,
  ClaimScope.ANY,
  ESTABLISHMENTS,
);
export const DELETE_ORG_ESTABLISHMENTS: Claim = claim(
  ClaimAction.DELETE,
  ClaimScope.ORGANISATION,
  ESTABLISHMENTS,
);
export const DELETE_OWN_ESTABLISHMENTS: Claim = claim(
  ClaimAction.DELETE,
  ClaimScope.OWN,
  ESTABLISHMENTS,
);

// ORGANISATIONS
export const CREATE_ANY_ORGANISATIONS: Claim = claim(
  ClaimAction.CREATE,
  ClaimScope.ANY,
  ORGANISATIONS,
);
export const READ_ANY_ORGANISATIONS: Claim = claim(
  ClaimAction.READ,
  ClaimScope.ANY,
  ORGANISATIONS,
);
export const READ_OWN_ORGANISATIONS: Claim = claim(
  ClaimAction.READ,
  ClaimScope.OWN,
  ORGANISATIONS,
);
export const UPDATE_ANY_ORGANISATIONS: Claim = claim(
  ClaimAction.UPDATE,
  ClaimScope.ANY,
  ORGANISATIONS,
);
export const UPDATE_OWN_ORGANISATIONS: Claim = claim(
  ClaimAction.UPDATE,
  ClaimScope.OWN,
  ORGANISATIONS,
);
export const ENABLE_ANY_ORGANISATIONS: Claim = claim(
  ClaimAction.ENABLE,
  ClaimScope.ANY,
  ORGANISATIONS,
);
export const ENABLE_OWN_ORGANISATIONS: Claim = claim(
  ClaimAction.ENABLE,
  ClaimScope.OWN,
  ORGANISATIONS,
);
export const DISABLE_ANY_ORGANISATIONS: Claim = claim(
  ClaimAction.DISABLE,
  ClaimScope.ANY,
  ORGANISATIONS,
);
export const DISABLE_OWN_ORGANISATIONS: Claim = claim(
  ClaimAction.DISABLE,
  ClaimScope.OWN,
  ORGANISATIONS,
);
export const DELETE_ANY_ORGANISATIONS: Claim = claim(
  ClaimAction.DELETE,
  ClaimScope.ANY,
  ORGANISATIONS,
);
export const DELETE_OWN_ORGANISATIONS: Claim = claim(
  ClaimAction.DELETE,
  ClaimScope.OWN,
  ORGANISATIONS,
);

// ROLES
export const CREATE_ANY_ROLES: Claim = claim(
  ClaimAction.CREATE,
  ClaimScope.ANY,
  ROLES,
);
export const READ_ANY_ROLES: Claim = claim(
  ClaimAction.READ,
  ClaimScope.ANY,
  ROLES,
);
export const UPDATE_ANY_ROLES: Claim = claim(
  ClaimAction.UPDATE,
  ClaimScope.ANY,
  ROLES,
);
export const DELETE_ANY_ROLES: Claim = claim(
  ClaimAction.DELETE,
  ClaimScope.ANY,
  ROLES,
);

// SESSIONS
export const READ_ANY_SESSIONS: Claim = claim(
  ClaimAction.READ,
  ClaimScope.ANY,
  SESSIONS,
);
export const READ_ORG_SESSIONS: Claim = claim(
  ClaimAction.READ,
  ClaimScope.ORGANISATION,
  SESSIONS,
);
export const READ_EST_SESSIONS: Claim = claim(
  ClaimAction.READ,
  ClaimScope.ESTABLISHMENT,
  SESSIONS,
);
export const READ_OWN_SESSIONS: Claim = claim(
  ClaimAction.READ,
  ClaimScope.OWN,
  SESSIONS,
);
export const DELETE_ANY_SESSIONS: Claim = claim(
  ClaimAction.DELETE,
  ClaimScope.ANY,
  SESSIONS,
);
export const DELETE_ORG_SESSIONS: Claim = claim(
  ClaimAction.DELETE,
  ClaimScope.ORGANISATION,
  SESSIONS,
);
export const DELETE_EST_SESSIONS: Claim = claim(
  ClaimAction.DELETE,
  ClaimScope.ESTABLISHMENT,
  SESSIONS,
);
export const DELETE_OWN_SESSIONS: Claim = claim(
  ClaimAction.DELETE,
  ClaimScope.OWN,
  SESSIONS,
);

// USER ACCOUNTS
export const CREATE_ANY_USER_ACCOUNTS: Claim = claim(
  ClaimAction.CREATE,
  ClaimScope.ANY,
  USER_ACCOUNTS,
);
export const CREATE_ORG_USER_ACCOUNTS: Claim = claim(
  ClaimAction.CREATE,
  ClaimScope.ORGANISATION,
  USER_ACCOUNTS,
);
export const CREATE_EST_USER_ACCOUNTS: Claim = claim(
  ClaimAction.CREATE,
  ClaimScope.ESTABLISHMENT,
  USER_ACCOUNTS,
);
export const READ_ANY_USER_ACCOUNTS: Claim = claim(
  ClaimAction.READ,
  ClaimScope.ANY,
  USER_ACCOUNTS,
);
export const READ_ORG_USER_ACCOUNTS: Claim = claim(
  ClaimAction.READ,
  ClaimScope.ORGANISATION,
  USER_ACCOUNTS,
);
export const READ_EST_USER_ACCOUNTS: Claim = claim(
  ClaimAction.READ,
  ClaimScope.ESTABLISHMENT,
  USER_ACCOUNTS,
);
export const READ_OWN_USER_ACCOUNTS: Claim = claim(
  ClaimAction.READ,
  ClaimScope.OWN,
  USER_ACCOUNTS,
);
export const UPDATE_ANY_USER_ACCOUNTS: Claim = claim(
  ClaimAction.UPDATE,
  ClaimScope.ANY,
  USER_ACCOUNTS,
);
export const UPDATE_ORG_USER_ACCOUNTS: Claim = claim(
  ClaimAction.UPDATE,
  ClaimScope.ORGANISATION,
  USER_ACCOUNTS,
);
export const UPDATE_EST_USER_ACCOUNTS: Claim = claim(
  ClaimAction.UPDATE,
  ClaimScope.ESTABLISHMENT,
  USER_ACCOUNTS,
);
export const UPDATE_OWN_USER_ACCOUNTS: Claim = claim(
  ClaimAction.UPDATE,
  ClaimScope.OWN,
  USER_ACCOUNTS,
);
export const ENABLE_ANY_USER_ACCOUNTS: Claim = claim(
  ClaimAction.ENABLE,
  ClaimScope.ANY,
  USER_ACCOUNTS,
);
export const ENABLE_ORG_USER_ACCOUNTS: Claim = claim(
  ClaimAction.ENABLE,
  ClaimScope.ORGANISATION,
  USER_ACCOUNTS,
);
export const ENABLE_EST_USER_ACCOUNTS: Claim = claim(
  ClaimAction.ENABLE,
  ClaimScope.ESTABLISHMENT,
  USER_ACCOUNTS,
);
export const ENABLE_OWN_USER_ACCOUNTS: Claim = claim(
  ClaimAction.ENABLE,
  ClaimScope.OWN,
  USER_ACCOUNTS,
);
export const DISABLE_ANY_USER_ACCOUNTS: Claim = claim(
  ClaimAction.DISABLE,
  ClaimScope.ANY,
  USER_ACCOUNTS,
);
export const DISABLE_ORG_USER_ACCOUNTS: Claim = claim(
  ClaimAction.DISABLE,
  ClaimScope.ORGANISATION,
  USER_ACCOUNTS,
);
export const DISABLE_EST_USER_ACCOUNTS: Claim = claim(
  ClaimAction.DISABLE,
  ClaimScope.ESTABLISHMENT,
  USER_ACCOUNTS,
);
export const DISABLE_OWN_USER_ACCOUNTS: Claim = claim(
  ClaimAction.DISABLE,
  ClaimScope.OWN,
  USER_ACCOUNTS,
);
export const DELETE_ANY_USER_ACCOUNTS: Claim = claim(
  ClaimAction.DELETE,
  ClaimScope.ANY,
  USER_ACCOUNTS,
);
export const DELETE_ORG_USER_ACCOUNTS: Claim = claim(
  ClaimAction.DELETE,
  ClaimScope.ORGANISATION,
  USER_ACCOUNTS,
);
export const DELETE_EST_USER_ACCOUNTS: Claim = claim(
  ClaimAction.DELETE,
  ClaimScope.ESTABLISHMENT,
  USER_ACCOUNTS,
);
export const DELETE_OWN_USER_ACCOUNTS: Claim = claim(
  ClaimAction.DELETE,
  ClaimScope.OWN,
  USER_ACCOUNTS,
);

// USERS
export const CREATE_ANY_USERS: Claim = claim(
  ClaimAction.CREATE,
  ClaimScope.ANY,
  USERS,
);
export const READ_ANY_USERS: Claim = claim(
  ClaimAction.READ,
  ClaimScope.ANY,
  USERS,
);
export const READ_ORG_USERS: Claim = claim(
  ClaimAction.READ,
  ClaimScope.ORGANISATION,
  USERS,
);
export const READ_EST_USERS: Claim = claim(
  ClaimAction.READ,
  ClaimScope.ESTABLISHMENT,
  USERS,
);
export const READ_OWN_USERS: Claim = claim(
  ClaimAction.READ,
  ClaimScope.OWN,
  USERS,
);
export const UPDATE_ANY_USERS: Claim = claim(
  ClaimAction.UPDATE,
  ClaimScope.ANY,
  USERS,
);
export const UPDATE_ORG_USERS: Claim = claim(
  ClaimAction.UPDATE,
  ClaimScope.ORGANISATION,
  USERS,
);
export const UPDATE_EST_USERS: Claim = claim(
  ClaimAction.UPDATE,
  ClaimScope.ESTABLISHMENT,
  USERS,
);
export const UPDATE_OWN_USERS: Claim = claim(
  ClaimAction.UPDATE,
  ClaimScope.OWN,
  USERS,
);
export const ENABLE_ANY_USERS: Claim = claim(
  ClaimAction.ENABLE,
  ClaimScope.ANY,
  USERS,
);
export const ENABLE_ORG_USERS: Claim = claim(
  ClaimAction.ENABLE,
  ClaimScope.ORGANISATION,
  USERS,
);
export const ENABLE_EST_USERS: Claim = claim(
  ClaimAction.ENABLE,
  ClaimScope.ESTABLISHMENT,
  USERS,
);
export const ENABLE_OWN_USERS: Claim = claim(
  ClaimAction.ENABLE,
  ClaimScope.OWN,
  USERS,
);
export const DISABLE_ANY_USERS: Claim = claim(
  ClaimAction.DISABLE,
  ClaimScope.ANY,
  USERS,
);
export const DISABLE_ORG_USERS: Claim = claim(
  ClaimAction.DISABLE,
  ClaimScope.ORGANISATION,
  USERS,
);
export const DISABLE_EST_USERS: Claim = claim(
  ClaimAction.DISABLE,
  ClaimScope.ESTABLISHMENT,
  USERS,
);
export const DISABLE_OWN_USERS: Claim = claim(
  ClaimAction.DISABLE,
  ClaimScope.OWN,
  USERS,
);
export const DELETE_ANY_USERS: Claim = claim(
  ClaimAction.DELETE,
  ClaimScope.ANY,
  USERS,
);
export const DELETE_ORG_USERS: Claim = claim(
  ClaimAction.DELETE,
  ClaimScope.ORGANISATION,
  USERS,
);
export const DELETE_EST_USERS: Claim = claim(
  ClaimAction.DELETE,
  ClaimScope.ESTABLISHMENT,
  USERS,
);
export const DELETE_OWN_USERS: Claim = claim(
  ClaimAction.DELETE,
  ClaimScope.OWN,
  USERS,
);
