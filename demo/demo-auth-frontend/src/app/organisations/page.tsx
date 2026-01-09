'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../providers/AuthProvider';
import { AuthClient } from '@devlab-io/nest-auth-client';
import { Organisation } from '@devlab-io/nest-auth-types';
import { Building2 } from 'lucide-react';

export default function OrganisationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadOrganisations();
    }
  }, [isAuthenticated]);

  const loadOrganisations = async () => {
    try {
      const response = await AuthClient.organisations.search({}, 1, 50);
      setOrganisations(response.contents);
    } catch (err: any) {
      setError(err.message || 'Failed to load organisations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    setIsCreating(true);
    setError('');

    try {
      await AuthClient.organisations.create({ name: newOrgName });
      setNewOrgName('');
      loadOrganisations();
    } catch (err: any) {
      setError(err.message || 'Failed to create organisation');
    } finally {
      setIsCreating(false);
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
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">Organisations</h1>
        <p className="text-[var(--color-text-secondary)]">
          Manage organisations in your system
        </p>
      </div>

      {error && (
        <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[var(--color-error)] px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="mb-8">
        <form onSubmit={handleCreate} className="flex gap-4 max-w-[500px]">
          <input
            type="text"
            className="flex-1 px-4 py-3.5 text-base bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] transition-all placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
            placeholder="New organisation name..."
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center px-6 py-3.5 text-base font-medium rounded-lg bg-gradient-to-r from-[var(--color-accent)] to-[#8b5cf6] text-white border-none cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(99,102,241,0.4)] disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Organisation'}
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-16">
          <div className="w-10 h-10 border-3 border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin"></div>
        </div>
      ) : organisations.length === 0 ? (
        <div className="text-center py-16 px-8 text-[var(--color-text-secondary)]">
          <div className="text-5xl mb-4 opacity-50">
            <Building2 size={48} className="mx-auto" />
          </div>
          <p>No organisations found</p>
        </div>
      ) : (
        <table className="w-full border-collapse bg-[var(--color-bg-card)] rounded-xl overflow-hidden border border-[var(--color-border)]">
          <thead>
            <tr>
              <th className="px-4 py-4 text-left border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] font-semibold text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
                Name
              </th>
              <th className="px-4 py-4 text-left border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] font-semibold text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
                Establishments
              </th>
              <th className="px-4 py-4 text-left border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] font-semibold text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
                Enabled
              </th>
              <th className="px-4 py-4 text-left border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] font-semibold text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
                Created At
              </th>
            </tr>
          </thead>
          <tbody>
            {organisations.map((org) => (
              <tr key={org.id} className="hover:bg-[rgba(99,102,241,0.05)]">
                <td className="px-4 py-4 text-left border-b border-[var(--color-border)]">
                  {org.name}
                </td>
                <td className="px-4 py-4 text-left border-b border-[var(--color-border)]">
                  {org.establishments?.length || 0}
                </td>
                <td className="px-4 py-4 text-left border-b border-[var(--color-border)]">
                  <span
                    className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
                      org.enabled
                        ? 'bg-[rgba(16,185,129,0.15)] text-[var(--color-success)]'
                        : 'bg-[rgba(239,68,68,0.15)] text-[var(--color-error)]'
                    }`}
                  >
                    {org.enabled ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-4 text-left border-b border-[var(--color-border)]">
                  {new Date(org.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
