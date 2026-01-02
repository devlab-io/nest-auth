'use client';

import { useEffect, useState } from 'react';
import { AuthClient } from '@devlab-io/nest-auth-client';
import { Claim, ClaimsUtils } from '@devlab-io/nest-auth-types';

// HashMap: resource -> scope -> action -> Claim
type ClaimsMap = Map<string, Map<string, Map<string, Claim>>>;

// HashMap: resource -> scope -> action -> boolean (selected)
type SelectedClaimsMap = Map<string, Map<string, Map<string, boolean>>>;

interface ClaimSelectorProps {
  initialClaims?: Claim[];
  onSelectionChange?: (claims: string[]) => void;
  error?: string;
}

export default function ClaimSelector({
  initialClaims = [],
  onSelectionChange,
  error,
}: ClaimSelectorProps) {
  const [claimsMap, setClaimsMap] = useState<ClaimsMap>(new Map());
  const [selectedClaimsMap, setSelectedClaimsMap] = useState<SelectedClaimsMap>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    loadClaims();
  }, []);

  useEffect(() => {
    // Initialize selected claims from initialClaims
    if (initialClaims.length > 0 && claimsMap.size > 0) {
      const newSelectedClaimsMap: SelectedClaimsMap = new Map();
      claimsMap.forEach((resourceMap, resource) => {
        newSelectedClaimsMap.set(resource, new Map());
        resourceMap.forEach((scopeMap, scope) => {
          newSelectedClaimsMap.get(resource)!.set(scope, new Map());
          scopeMap.forEach((_, action) => {
            const exists = initialClaims.some(
              (c) => c.resource === resource && c.scope === scope && c.action === action
            );
            newSelectedClaimsMap.get(resource)!.get(scope)!.set(action, exists);
          });
        });
      });
      setSelectedClaimsMap(newSelectedClaimsMap);
    }
  }, [initialClaims, claimsMap]);

  useEffect(() => {
    // Notify parent of selection changes
    if (onSelectionChange && claimsMap.size > 0) {
      const claims: string[] = [];
      selectedClaimsMap.forEach((resourceMap, resource) => {
        resourceMap.forEach((scopeMap, scope) => {
          scopeMap.forEach((isSelected, action) => {
            if (isSelected && hasClaim(resource, scope, action)) {
              const claim = claimsMap.get(resource)?.get(scope)?.get(action);
              if (claim) {
                claims.push(ClaimsUtils.serialize(claim));
              }
            }
          });
        });
      });
      onSelectionChange(claims);
    }
  }, [selectedClaimsMap, claimsMap, onSelectionChange]);

  const loadClaims = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const claims = await AuthClient.claims.getAll();
      
      // Build claims map: resource -> scope -> action -> Claim
      const newClaimsMap: ClaimsMap = new Map();
      
      (claims as any[]).forEach((claim: any) => {
        const resource = claim.resource as string;
        const scope = claim.scope as string;
        const action = claim.action as string;
        
        if (!newClaimsMap.has(resource)) {
          newClaimsMap.set(resource, new Map());
        }
        const resourceMap = newClaimsMap.get(resource)!;
        
        if (!resourceMap.has(scope)) {
          resourceMap.set(scope, new Map());
        }
        const scopeMap = resourceMap.get(scope)!;
        
        scopeMap.set(action, claim as Claim);
      });
      
      setClaimsMap(newClaimsMap);
      
      // Initialize selected claims map
      const newSelectedClaimsMap: SelectedClaimsMap = new Map();
      newClaimsMap.forEach((resourceMap, resource) => {
        newSelectedClaimsMap.set(resource, new Map());
        resourceMap.forEach((scopeMap, scope) => {
          newSelectedClaimsMap.get(resource)!.set(scope, new Map());
          scopeMap.forEach((_, action) => {
            newSelectedClaimsMap.get(resource)!.get(scope)!.set(action, false);
          });
        });
      });
      
      setSelectedClaimsMap(newSelectedClaimsMap);
    } catch (err: any) {
      setLoadError(err.message || 'Failed to load claims');
    } finally {
      setIsLoading(false);
    }
  };

  const getResources = (): string[] => {
    return Array.from(claimsMap.keys()).sort();
  };

  const getScopes = (resource: string): string[] => {
    const resourceMap = claimsMap.get(resource);
    if (!resourceMap) return [];
    return Array.from(resourceMap.keys()).sort();
  };

  const getActions = (): string[] => {
    return ['read', 'create', 'update', 'enable', 'disable', 'delete', 'admin'];
  };

  const hasClaim = (resource: string, scope: string, action: string): boolean => {
    const resourceMap = claimsMap.get(resource);
    if (!resourceMap) return false;
    const scopeMap = resourceMap.get(scope);
    if (!scopeMap) return false;
    return scopeMap.has(action);
  };

  const isSelected = (resource: string, scope: string, action: string): boolean => {
    const resourceMap = selectedClaimsMap.get(resource);
    if (!resourceMap) return false;
    const scopeMap = resourceMap.get(scope);
    if (!scopeMap) return false;
    return scopeMap.get(action) || false;
  };

  const isRowAdminSelected = (resource: string, scope: string): boolean => {
    if (resource === 'admin') {
      return false;
    }
    
    const actions = getActions();
    const resourceMap = claimsMap.get(resource);
    if (!resourceMap) return false;
    const scopeMap = resourceMap.get(scope);
    if (!scopeMap) return false;
    
    const availableActions = actions.filter((action) => scopeMap.has(action));
    if (availableActions.length === 0) return false;
    
    return availableActions.every((action) => isSelected(resource, scope, action));
  };

  const toggleRowAdmin = (resource: string, scope: string) => {
    if (resource === 'admin') {
      return;
    }
    
    const newSelectedClaimsMap = new Map(selectedClaimsMap);
    
    if (!newSelectedClaimsMap.has(resource)) {
      newSelectedClaimsMap.set(resource, new Map());
    }
    const resourceMap = newSelectedClaimsMap.get(resource)!;
    
    if (!resourceMap.has(scope)) {
      resourceMap.set(scope, new Map());
    }
    const scopeMap = resourceMap.get(scope)!;
    
    const actions = getActions();
    const claimsResourceMap = claimsMap.get(resource);
    if (!claimsResourceMap) return;
    const claimsScopeMap = claimsResourceMap.get(scope);
    if (!claimsScopeMap) return;
    
    const isAllSelected = isRowAdminSelected(resource, scope);
    const newValue = !isAllSelected;
    
    actions.forEach((action) => {
      if (claimsScopeMap.has(action)) {
        scopeMap.set(action, newValue);
      }
    });
    
    setSelectedClaimsMap(newSelectedClaimsMap);
  };

  const toggleClaim = (resource: string, scope: string, action: string) => {
    const newSelectedClaimsMap = new Map(selectedClaimsMap);
    
    if (!newSelectedClaimsMap.has(resource)) {
      newSelectedClaimsMap.set(resource, new Map());
    }
    const resourceMap = newSelectedClaimsMap.get(resource)!;
    
    if (!resourceMap.has(scope)) {
      resourceMap.set(scope, new Map());
    }
    const scopeMap = resourceMap.get(scope)!;
    
    const currentValue = scopeMap.get(action) || false;
    scopeMap.set(action, !currentValue);
    
    setSelectedClaimsMap(newSelectedClaimsMap);
  };


  const displayError = error || loadError;

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4">Claims</h2>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6">
        Select the claims to assign to this role. Check the boxes to grant permissions.
      </p>

      {displayError && (
        <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[var(--color-error)] px-4 py-3 rounded-lg mb-4 text-sm">
          {displayError}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-16">
          <div className="w-10 h-10 border-[3px] border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {getResources().map((resource) => {
            const scopes = getScopes(resource);
            const actions = getActions();

            return (
              <div key={resource} className="border border-[var(--color-border)] rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                  <h3 className="text-lg font-semibold capitalize">{resource}</h3>
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
                        {resource !== 'admin' && (
                          <th className="px-4 py-3 text-center border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] font-semibold text-xs uppercase tracking-wider text-[var(--color-text-secondary)] min-w-[100px]">
                            Admin
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {scopes.map((scope) => (
                        <tr key={scope} className="hover:bg-[rgba(99,102,241,0.05)]">
                          <td className="px-4 py-3 text-left border-b border-[var(--color-border)] font-medium capitalize sticky left-0 bg-[var(--color-bg-card)] z-10">
                            {scope}
                          </td>
                          {actions.map((action) => {
                            const claimExists = hasClaim(resource, scope, action);
                            const isSelectedValue = isSelected(resource, scope, action);

                            return (
                              <td
                                key={`${scope}-${action}`}
                                className="px-4 py-3 text-center border-b border-[var(--color-border)]"
                              >
                                {claimExists ? (
                                  <input
                                    type="checkbox"
                                    checked={isSelectedValue}
                                    onChange={() => toggleClaim(resource, scope, action)}
                                    className="w-5 h-5 accent-[var(--color-accent)] cursor-pointer"
                                  />
                                ) : (
                                  <span className="text-[var(--color-text-secondary)] opacity-30">-</span>
                                )}
                              </td>
                            );
                          })}
                          {resource !== 'admin' && (
                            <td className="px-4 py-3 text-center border-b border-[var(--color-border)]">
                              <input
                                type="checkbox"
                                checked={isRowAdminSelected(resource, scope)}
                                onChange={() => toggleRowAdmin(resource, scope)}
                                className="w-5 h-5 accent-[var(--color-accent)] cursor-pointer"
                              />
                            </td>
                          )}
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
