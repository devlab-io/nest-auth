'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../providers/AuthProvider';
import { AuthClient } from '@devlab-io/nest-auth-client';
import { UserAccount } from '@devlab-io/nest-auth-types';
import { UserCog, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function UserAccountDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userAccountId = params.id as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadUserAccount = useCallback(async () => {
    try {
      const loadedUserAccount = await AuthClient.userAccounts.getById(userAccountId);
      setUserAccount(loadedUserAccount);
    } catch (err: any) {
      setError(err.message || 'Failed to load user account');
    } finally {
      setIsLoading(false);
    }
  }, [userAccountId]);

  useEffect(() => {
    if (isAuthenticated && userAccountId) {
      loadUserAccount();
    }
  }, [isAuthenticated, userAccountId, loadUserAccount]);

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
          <h1 className="text-3xl font-semibold">User Account Details</h1>
        </div>
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
      ) : !userAccount ? (
        <div className="text-center py-16 px-8 text-[var(--color-text-secondary)]">
          <div className="text-5xl mb-4 opacity-50">
            <UserCog size={48} className="mx-auto" />
          </div>
          <p>User account not found</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  ID
                </label>
                <p className="text-[var(--color-text-primary)]">{userAccount.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Enabled
                </label>
                <span
                  className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
                    userAccount.enabled
                      ? 'bg-[rgba(16,185,129,0.15)] text-[var(--color-success)]'
                      : 'bg-[rgba(239,68,68,0.15)] text-[var(--color-error)]'
                  }`}
                >
                  {userAccount.enabled ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">User</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  ID
                </label>
                <Link
                  href={`/users/${userAccount.user.id}`}
                  className="text-[var(--color-accent)] hover:underline"
                >
                  {userAccount.user.id}
                </Link>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Email
                </label>
                <p className="text-[var(--color-text-primary)]">{userAccount.user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Username
                </label>
                <p className="text-[var(--color-text-primary)]">{userAccount.user.username}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Full Name
                </label>
                <p className="text-[var(--color-text-primary)]">
                  {userAccount.user.firstName || userAccount.user.lastName
                    ? `${userAccount.user.firstName || ''} ${userAccount.user.lastName || ''}`.trim()
                    : '-'}
                </p>
              </div>
            </div>
          </div>

          {userAccount.organisation && (
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Organisation</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    ID
                  </label>
                  <Link
                    href={`/organisations/${userAccount.organisation.id}`}
                    className="text-[var(--color-accent)] hover:underline"
                  >
                    {userAccount.organisation.id}
                  </Link>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Name
                  </label>
                  <p className="text-[var(--color-text-primary)]">{userAccount.organisation.name}</p>
                </div>
              </div>
            </div>
          )}

          {userAccount.establishment && (
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Establishment</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    ID
                  </label>
                  <Link
                    href={`/establishments/${userAccount.establishment.id}`}
                    className="text-[var(--color-accent)] hover:underline"
                  >
                    {userAccount.establishment.id}
                  </Link>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                    Name
                  </label>
                  <p className="text-[var(--color-text-primary)]">{userAccount.establishment.name}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Roles ({userAccount.roles.length})</h2>
            {userAccount.roles && userAccount.roles.length > 0 ? (
              <div className="space-y-2">
                {userAccount.roles.map((role) => (
                  <Link
                    key={role.name}
                    href={`/roles/${role.name}`}
                    className="block p-3 bg-[var(--color-bg-secondary)] rounded-lg hover:bg-[rgba(99,102,241,0.1)] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                          {role.name}
                        </p>
                        {role.description && (
                          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                            {role.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-[var(--color-text-secondary)]">No roles assigned</p>
            )}
          </div>

          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Dates</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Created At
                </label>
                <p className="text-[var(--color-text-primary)]">
                  {new Date(userAccount.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Updated At
                </label>
                <p className="text-[var(--color-text-primary)]">
                  {new Date(userAccount.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
