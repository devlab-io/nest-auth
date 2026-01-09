'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../providers/AuthProvider';
import { AuthClient } from '@devlab-io/nest-auth-client';
import { Role, Claim } from '@devlab-io/nest-auth-types';
import {
  UserCog,
  Check,
  X,
  ArrowLeft,
  Edit2,
  Save,
  X as XIcon,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import ClaimSelector from '../../../components/ClaimSelector';

export default function RoleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const roleName = params.name as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit mode states
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [selectedClaims, setSelectedClaims] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadRole = useCallback(async () => {
    try {
      const loadedRole = await AuthClient.roles.getByName(roleName);
      setRole(loadedRole);
      // Initialize edit fields
      setEditName(loadedRole.name);
      setEditDescription(loadedRole.description || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load role');
    } finally {
      setIsLoading(false);
    }
  }, [roleName]);

  useEffect(() => {
    if (isAuthenticated && roleName) {
      loadRole();
    }
  }, [isAuthenticated, roleName, loadRole]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    // Reset to original values
    if (role) {
      setEditName(role.name);
      setEditDescription(role.description || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const updatedRole = await AuthClient.roles.update(roleName, {
        name: editName !== roleName ? editName : undefined,
        description:
          editDescription !== (role?.description || '')
            ? editDescription
            : undefined,
        claims: selectedClaims,
      });

      setRole(updatedRole);
      setIsEditing(false);

      // If name changed, redirect to new URL
      if (editName !== roleName) {
        router.push(`/roles/${encodeURIComponent(editName)}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await AuthClient.roles.delete(roleName);
      // Redirect to roles list after deletion
      router.push('/roles');
    } catch (err: any) {
      setError(err.message || 'Failed to delete role');
    }
  };

  // View mode: display claims
  const claimsByResource = (role?.claims || []).reduce(
    (acc, claim) => {
      if (!acc[claim.resource]) {
        acc[claim.resource] = [];
      }
      acc[claim.resource].push(claim);
      return acc;
    },
    {} as Record<string, Claim[]>,
  );

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

  const getActions = (): string[] => {
    return ['read', 'create', 'update', 'enable', 'disable', 'delete', 'admin'];
  };

  const getScopesView = (resourceClaims: Claim[]): string[] => {
    const scopes = new Set(resourceClaims.map((c) => c.scope));
    const scopeOrder = ['admin', 'any', 'organisation', 'establishment', 'own'];
    return [
      'admin',
      ...scopeOrder.filter((s) => scopes.has(s as any) && s !== 'admin'),
    ];
  };

  const hasClaimView = (
    resource: string,
    scope: string,
    action: string,
  ): boolean => {
    const claims = role?.claims || [];

    if (scope === 'admin') {
      return true;
    }

    const hasAdminAction = claims.some(
      (c) =>
        c.resource === resource && c.scope === scope && c.action === 'admin',
    );

    if (hasAdminAction && action !== 'admin') {
      return true;
    }

    if (action === 'admin') {
      return hasAdminAction;
    }

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
        <Link
          href="/roles"
          className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Back to Roles</span>
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mb-2">
            <UserCog size={32} className="text-[var(--color-accent)]" />
            <h1 className="text-3xl font-semibold">{roleName}</h1>
          </div>
          {!isEditing && role && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleEdit}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <Edit2 size={18} />
                <span>Edit</span>
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-error)] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <Trash2 size={18} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
        {role?.description && !isEditing && (
          <p className="text-[var(--color-text-secondary)] mt-2">
            {role.description}
          </p>
        )}
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
      ) : !role ? (
        <div className="text-center py-16 px-8 text-[var(--color-text-secondary)]">
          <div className="text-5xl mb-4 opacity-50">
            <UserCog size={48} className="mx-auto" />
          </div>
          <p>Role not found</p>
        </div>
      ) : isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Role Information</h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium mb-2"
                >
                  Name <span className="text-[var(--color-error)]">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  placeholder="Enter role name"
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] resize-none"
                  placeholder="Enter role description (optional)"
                />
              </div>
            </div>
          </div>

          <ClaimSelector
            initialClaims={role?.claims}
            onSelectionChange={setSelectedClaims}
            error={error}
          />

          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors inline-flex items-center gap-2"
            >
              <XIcon size={18} />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !editName.trim()}
              className="px-6 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <Save size={18} />
              <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-8">
          {allResources.map((resource) => {
            const resourceClaims = claimsByResource[resource] || [];
            const scopes = getScopesView(resourceClaims);
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
                        {actions.map((action: string) => (
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
                          {actions.map((action: string) => {
                            const hasClaimValue = hasClaimView(
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
