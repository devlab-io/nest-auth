import { Organisation } from './organisation.types';
import { Establishment } from './establishment.types';
import { User } from './user.types';
import { Role } from './role.types';

export interface UserAccount {
  id: string;
  organisation?: Organisation;
  establishment?: Establishment;
  user: User;
  roles: Role[];
  createdAt: Date;
  updatedAt: Date;
  enabled: boolean;
}

export interface CreateUserAccountRequest {
  userId: string;
  organisationId?: string;
  establishmentId?: string;
  roles?: string[];
}

export interface UpdateUserAccountRequest {
  organisationId?: string;
  establishmentId?: string;
  roles?: string[];
}

export interface UserAccountQueryParams {
  id?: string;
  userId?: string;
  organisationId?: string;
  establishmentId?: string;
  roles?: string[];
}
