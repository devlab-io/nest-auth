'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../providers/AuthProvider';
import { AuthClient } from '@devlab-io/nest-auth-client';
import { Establishment, Organisation } from '@devlab-io/nest-auth-types';
import { Store } from 'lucide-react';

export default function EstablishmentsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newEstName, setNewEstName] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      const [estsRes, orgsRes] = await Promise.all([
        AuthClient.establishments.search({}, 1, 50),
        AuthClient.organisations.search({}, 1, 50),
      ]);
      setEstablishments(estsRes.contents);
      setOrganisations(orgsRes.contents);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEstName.trim() || !selectedOrgId) return;

    setIsCreating(true);
    setError('');

    try {
      await AuthClient.establishments.create({
        name: newEstName,
        organisationId: selectedOrgId,
      });
      setNewEstName('');
      setSelectedOrgId('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create establishment');
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
        <h1 className="text-3xl font-semibold mb-2">Establishments</h1>
        <p className="text-[var(--color-text-secondary)]">
          Manage establishments within organisations
        </p>
      </div>

      {error && (
        <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[var(--color-error)] px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="mb-8">
        <form onSubmit={handleCreate} className="flex gap-4 max-w-[700px]">
          <select
            className="min-w-[200px] px-4 py-3.5 text-base bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] transition-all focus:outline-none focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            required
          >
            <option value="">Select organisation...</option>
            {organisations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            className="flex-1 px-4 py-3.5 text-base bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] transition-all placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]"
            placeholder="New establishment name..."
            value={newEstName}
            onChange={(e) => setNewEstName(e.target.value)}
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center px-6 py-3.5 text-base font-medium rounded-lg bg-gradient-to-r from-[var(--color-accent)] to-[#8b5cf6] text-white border-none cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(99,102,241,0.4)] disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Establishment'}
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-16">
          <div className="w-10 h-10 border-3 border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin"></div>
        </div>
      ) : establishments.length === 0 ? (
        <div className="text-center py-16 px-8 text-[var(--color-text-secondary)]">
          <div className="text-5xl mb-4 opacity-50">
            <Store size={48} className="mx-auto" />
          </div>
          <p>No establishments found</p>
        </div>
      ) : (
        <table className="w-full border-collapse bg-[var(--color-bg-card)] rounded-xl overflow-hidden border border-[var(--color-border)]">
          <thead>
            <tr>
              <th className="px-4 py-4 text-left border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] font-semibold text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
                Name
              </th>
              <th className="px-4 py-4 text-left border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] font-semibold text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
                Organisation
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
            {establishments.map((est) => (
              <tr key={est.id} className="hover:bg-[rgba(99,102,241,0.05)]">
                <td className="px-4 py-4 text-left border-b border-[var(--color-border)]">
                  {est.name}
                </td>
                <td className="px-4 py-4 text-left border-b border-[var(--color-border)]">
                  {est.organisation?.name || 'N/A'}
                </td>
                <td className="px-4 py-4 text-left border-b border-[var(--color-border)]">
                  <span
                    className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
                      est.enabled
                        ? 'bg-[rgba(16,185,129,0.15)] text-[var(--color-success)]'
                        : 'bg-[rgba(239,68,68,0.15)] text-[var(--color-error)]'
                    }`}
                  >
                    {est.enabled ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-4 text-left border-b border-[var(--color-border)]">
                  {new Date(est.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
