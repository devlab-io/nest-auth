import { UserAccount } from './user-account.types';

export interface Session {
  token: string;
  userAccountId: string;
  loginDate: Date;
  expirationDate: Date;
  userAccount: UserAccount;
}

export interface SessionQueryParams {
  userAccountId?: string;
  userId?: string; // For backward compatibility, maps to userAccount.user.id
  loginDate?: Date;
  expirationDate?: Date;
  active?: boolean; // Only active (not expired) sessions
}
