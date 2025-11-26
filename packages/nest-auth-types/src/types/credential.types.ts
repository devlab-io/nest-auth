import { User } from './user.types';

export interface Credential {
  id: string;
  type: 'password' | 'google';
  password?: string;
  googleId?: string;
  user: User;
}
