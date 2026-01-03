'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../providers/AuthProvider';
import { AuthClient } from '@devlab-io/nest-auth-client';
import { CreateUserAccountRequest, User, Organisation, Establishment, Role } from '@devlab-io/nest-auth-types';
import { UserCog, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function CreateUserAccountPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [userId, setUserId] = useState('');
  const [organisationId, setOrganisationId] = useState('');
  const [establishmentId, setEstablishmentId] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  // Options data
  const [users, setUsers] = useState<User[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadOptions();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Load establishments when organisation changes
    if (organisationId) {
      loadEstablishments(organisationId);
    } else {
      setEstablishments([]);
      setEstablishmentId('');
    }
  }, [organisationId]);

  const loadOptions = async () => {
    try {
      setIsLoadingOptions(true);
      const [usersRes, orgsRes, rolesRes] = await Promise.all([
        AuthClient.users.search({}, 1, 100),
        AuthClient.organisations.search({}, 1, 100),
        AuthClient.roles.getAll(),
      ]);

      setUsers(usersRes.contents);
      setOrganisations(orgsRes.contents);
      setRoles(rolesRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load options');
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const loadEstablishments = async (orgId: string) => {
    try {
      const response = await AuthClient.establishments.search({ organisationId: orgId }, 1, 100);
      setEstablishments(response.contents);
    } catch (err: any) {
      console.error('Failed to load establishments:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const createRequest: CreateUserAccountRequest = {
        userId,
        ...(organisationId && { organisationId }),
        ...(establishmentId && { establishmentId }),
        ...(selectedRoles.length > 0 && { roles: selectedRoles }),
      };

      const newUserAccount = await AuthClient.userAccounts.create(createRequest);
      router.push(`/user-accounts/${newUserAccount.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create user account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleRole = (roleName: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleName)
        ? prev.filter((r) => r !== roleName)
        : [...prev, roleName]
    );
  };

  const isFormValid = userId.trim() !== '';

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
          href="/user-accounts"
          className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Back to User Accounts</span>
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <UserCog size={32} className="text-[var(--color-accent)]" />
          <h1 className="text-3xl font-semibold">Create User Account</h1>
        </div>
      </div>

      {error && (
        <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[var(--color-error)] px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">User Account Information</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="userId" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                User <span className="text-[var(--color-error)]">*</span>
              </label>
              {isLoadingOptions ? (
                <div className="w-full px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)]">
                  Loading users...
                </div>
              ) : (
                <select
                  id="userId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                >
                  <option value="">Select a user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.email} {user.username && `(${user.username})`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label htmlFor="organisationId" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Organisation
              </label>
              {isLoadingOptions ? (
                <div className="w-full px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)]">
                  Loading organisations...
                </div>
              ) : (
                <select
                  id="organisationId"
                  value={organisationId}
                  onChange={(e) => setOrganisationId(e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                >
                  <option value="">No organisation</option>
                  {organisations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label htmlFor="establishmentId" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Establishment
              </label>
              {!organisationId ? (
                <div className="w-full px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] opacity-50">
                  Select an organisation first
                </div>
              ) : isLoadingOptions ? (
                <div className="w-full px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)]">
                  Loading establishments...
                </div>
              ) : (
                <select
                  id="establishmentId"
                  value={establishmentId}
                  onChange={(e) => setEstablishmentId(e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                >
                  <option value="">No establishment</option>
                  {establishments.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Roles</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            Select the roles to assign to this user account.
          </p>
          {isLoadingOptions ? (
            <div className="text-[var(--color-text-secondary)]">Loading roles...</div>
          ) : roles.length === 0 ? (
            <div className="text-[var(--color-text-secondary)]">No roles available</div>
          ) : (
            <div className="space-y-2">
              {roles.map((role) => (
                <label
                  key={role.name}
                  className="flex items-center gap-3 p-3 bg-[var(--color-bg-secondary)] rounded-lg cursor-pointer hover:bg-[rgba(99,102,241,0.1)] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.name)}
                    onChange={() => toggleRole(role.name)}
                    className="w-4 h-4 text-[var(--color-accent)] bg-[var(--color-bg-secondary)] border-[var(--color-border)] rounded focus:ring-[var(--color-accent)] focus:ring-2"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-[var(--color-text-primary)]">{role.name}</div>
                    {role.description && (
                      <div className="text-sm text-[var(--color-text-secondary)]">{role.description}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            <span>{isSubmitting ? 'Creating...' : 'Create User Account'}</span>
          </button>
          <button
            type="button"
            onClick={() => router.push('/user-accounts')}
            className="px-6 py-3 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-bg-card)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
