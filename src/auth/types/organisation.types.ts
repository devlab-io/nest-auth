import { Establishment } from './establishment.types';

export interface Organisation {
  id: string;
  name: string;
  establishments: Establishment[];
}

export interface CreateOrganisationRequest {
  name: string;
}

export interface UpdateOrganisationRequest {
  name?: string;
}

export interface OrganisationQueryParams {
  id?: string;
  name?: string;
}

export interface OrganisationPage {
  data: Organisation[];
  total: number;
  page: number;
  limit: number;
}
