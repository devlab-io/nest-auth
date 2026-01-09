'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../providers/AuthProvider';
import { AuthClient, AuthState } from '@devlab-io/nest-auth-client';
import { Shield, Check, X } from 'lucide-react';

interface Claim {
  id: string;
  action: string;
  scope: string;
  resource: string;
}

export default function ClaimsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadClaims();
    }
  }, [isAuthenticated]);

  const loadClaims = async () => {
    try {
      const baseURL = AuthState.baseURL || 'http://localhost:4001';
      const token = AuthState.token;

      const response = await fetch(`${baseURL}/claims`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to load claims');
      }

      const data = await response.json();
      setClaims(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load claims');
    } finally {
      setIsLoading(false);
    }
  };

  // Organize claims by resource
  const claimsByResource = claims.reduce(
    (acc, claim) => {
      if (!acc[claim.resource]) {
        acc[claim.resource] = [];
      }
      acc[claim.resource].push(claim);
      return acc;
    },
    {} as Record<string, Claim[]>,
  );

  // Get all unique resources (if no claims, we still want to show tables for common resources)
  const allResources =
    Object.keys(claimsByResource).length > 0
      ? Object.keys(claimsByResource)
      : [
          'users',
          'organisations',
          'establishments',
          'roles',
          'claims',
          'sessions',
          'user-accounts',
        ];

  // Get all unique scopes for a resource (always include admin scope)
  const getScopes = (resourceClaims: Claim[]): string[] => {
    const scopes = new Set(resourceClaims.map((c) => c.scope));
    const scopeOrder = ['admin', 'any', 'organisation', 'establishment', 'own'];
    // Always include admin scope even if no claims exist for it
    return [
      'admin',
      ...scopeOrder.filter((s) => scopes.has(s) && s !== 'admin'),
    ];
  };

  // Always return the same actions in the same order
  const getActions = (): string[] => {
    return ['read', 'create', 'update', 'enable', 'disable', 'delete', 'admin'];
  };

  const hasClaim = (
    resource: string,
    scope: string,
    action: string,
  ): boolean => {
    // If scope is admin, all actions are checked (virtual admin scope)
    if (scope === 'admin') {
      return true;
    }

    // Check if admin action exists for this resource and scope
    const hasAdminAction = claims.some(
      (c) =>
        c.resource === resource && c.scope === scope && c.action === 'admin',
    );

    // If admin action exists, all other actions are also checked
    if (hasAdminAction && action !== 'admin') {
      return true;
    }

    // If action is admin, return whether admin claim exists
    if (action === 'admin') {
      return hasAdminAction;
    }

    // For other actions, check if the claim exists
    return claims.some(
      (c) =>
        c.resource === resource && c.scope === scope && c.action === action,
    );
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="w-10 h-10 border-[3px] border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">Claims</h1>
        <p className="text-[var(--color-text-secondary)]">
          View all available claims in the system
        </p>
      </div>

      {error && (
        <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[var(--color-error)] px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-16">
          <div className="w-10 h-10 border-[3px] border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {allResources.map((resource) => {
            const resourceClaims = claimsByResource[resource] || [];
            const scopes = getScopes(resourceClaims);
            const actions = getActions();

            return (
              <div
                key={resource}
                className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                  <h2 className="text-xl font-semibold capitalize">
                    {resource}
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] font-semibold text-xs uppercase tracking-wider text-[var(--color-text-secondary)] sticky left-0 bg-[var(--color-bg-secondary)] z-10">
                          Scope / Action
                        </th>
                        {actions.map((action) => (
                          <th
                            key={action}
                            className="px-4 py-3 text-center border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] font-semibold text-xs uppercase tracking-wider text-[var(--color-text-secondary)] min-w-[100px]"
                          >
                            {action}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {scopes.map((scope) => (
                        <tr
                          key={scope}
                          className="hover:bg-[rgba(99,102,241,0.05)]"
                        >
                          <td className="px-4 py-3 text-left border-b border-[var(--color-border)] font-medium capitalize sticky left-0 bg-[var(--color-bg-card)] z-10">
                            {scope}
                          </td>
                          {actions.map((action) => {
                            const hasClaimValue = hasClaim(
                              resource,
                              scope,
                              action,
                            );
                            return (
                              <td
                                key={`${scope}-${action}`}
                                className="px-4 py-3 text-center border-b border-[var(--color-border)]"
                              >
                                {hasClaimValue ? (
                                  <Check
                                    size={20}
                                    className="mx-auto text-[var(--color-success)]"
                                  />
                                ) : (
                                  <X
                                    size={20}
                                    className="mx-auto text-[var(--color-text-secondary)] opacity-50"
                                  />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
