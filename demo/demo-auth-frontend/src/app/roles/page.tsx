'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../providers/AuthProvider';
import { AuthClient } from '@devlab-io/nest-auth-client';
import { Role } from '@devlab-io/nest-auth-types';
import { UserCog, Plus, Trash2 } from 'lucide-react';

export default function RolesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadRoles();
    }
  }, [isAuthenticated]);

  const loadRoles = async () => {
    try {
      const response = await AuthClient.roles.getAll();
      setRoles(response);
    } catch (err: any) {
      setError(err.message || 'Failed to load roles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, roleName: string) => {
    e.stopPropagation(); // Prevent row click
    if (!confirm(`Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await AuthClient.roles.delete(roleName);
      // Reload roles after deletion
      await loadRoles();
    } catch (err: any) {
      setError(err.message || 'Failed to delete role');
    }
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Roles</h1>
          <p className="text-[var(--color-text-secondary)]">Manage roles in your system</p>
        </div>
        <button
          onClick={() => router.push('/roles/new')}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={18} />
          <span>Create</span>
        </button>
      </div>

      {error && (
        <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[var(--color-error)] px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-16">
          <div className="w-10 h-10 border-3 border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin"></div>
        </div>
      ) : roles.length === 0 ? (
        <div className="text-center py-16 px-8 text-[var(--color-text-secondary)]">
          <div className="text-5xl mb-4 opacity-50">
            <UserCog size={48} className="mx-auto" />
          </div>
          <p>No roles found</p>
        </div>
      ) : (
        <table className="w-full border-collapse bg-[var(--color-bg-card)] rounded-xl overflow-hidden border border-[var(--color-border)]">
          <thead>
            <tr>
              <th className="px-4 py-4 text-left border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] font-semibold text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
                Name
              </th>
              <th className="px-4 py-4 text-left border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] font-semibold text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
                Description
              </th>
              <th className="px-4 py-4 text-left border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] font-semibold text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
                Claims Count
              </th>
              <th className="px-4 py-4 text-center border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] font-semibold text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr
                key={role.id}
                className="hover:bg-[rgba(99,102,241,0.05)] cursor-pointer"
                onClick={() => router.push(`/roles/${role.name}`)}
              >
                <td className="px-4 py-4 text-left border-b border-[var(--color-border)] font-medium">
                  {role.name}
                </td>
                <td className="px-4 py-4 text-left border-b border-[var(--color-border)] text-[var(--color-text-secondary)]">
                  {role.description || '-'}
                </td>
                <td className="px-4 py-4 text-left border-b border-[var(--color-border)]">
                  <span className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-[rgba(99,102,241,0.15)] text-[var(--color-accent)]">
                    {role.claims?.length || 0}
                  </span>
                </td>
                <td className="px-4 py-4 text-center border-b border-[var(--color-border)]">
                  <button
                    onClick={(e) => handleDelete(e, role.name)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--color-error)] hover:bg-[rgba(239,68,68,0.1)] rounded-lg transition-colors"
                    title="Delete role"
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
