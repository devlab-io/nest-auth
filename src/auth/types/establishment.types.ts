import { Organisation } from './organisation.types';
import { UserAccount } from './user-account.types';

export interface Establishment {
  id: string;
  name: string;
  organisation: Organisation;
  accounts: UserAccount[];
  createdAt: Date;
  updatedAt: Date;
  enabled: boolean;
}

export interface CreateEstablishmentRequest {
  name: string;
  organisationId: string;
}

export interface UpdateEstablishmentRequest {
  name?: string;
  organisationId?: string;
}

export interface EstablishmentQueryParams {
  id?: string;
  name?: string;
  organisationId?: string;
}

export interface EstablishmentPage {
  data: Establishment[];
  total: number;
  page: number;
  limit: number;
}
