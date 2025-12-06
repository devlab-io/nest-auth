import { Claim, ClaimLike } from './claim.types';

export interface CreateRoleRequest {
  name: string;
  description?: string;
  claims: ClaimLike[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  claims?: ClaimLike[];
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  claims: Claim[];
}
