'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../providers/AuthProvider';
import { AuthClient } from '@devlab-io/nest-auth-client';
import { UserAccount } from '@devlab-io/nest-auth-types';
import { UserCog, Plus } from 'lucide-react';

export default function UserAccountsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserAccounts();
    }
  }, [isAuthenticated]);

  const loadUserAccounts = async () => {
    try {
      const response = await AuthClient.userAccounts.search({}, 1, 50);
      setUserAccounts(response.contents);
    } catch (err: any) {
      setError(err.message || 'Failed to load user accounts');
    } finally {
      setIsLoading(false);
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
          <h1 className="text-3xl font-semibold mb-2">User Accounts</h1>
          <p className="text-[var(--color-text-secondary)]">
            Manage user accounts in your system
          </p>
        </div>
        <button
          onClick={() => router.push('/user-accounts/new')}
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
          <div className="w-10 h-10 border-[3px] border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin"></div>
        </div>
      ) : userAccounts.length === 0 ? (
        <div className="text-center py-16 px-8 text-[var(--color-text-secondary)]">
          <div className="text-5xl mb-4 opacity-50">
            <UserCog size={48} className="mx-auto" />
          </div>
          <p>No user accounts found</p>
        </div>
      ) : (
        <table className="w-full border-collapse bg-[var(--color-bg-card)] rounded-xl overflow-hidden border border-[var(--color-border)]">
          <thead>
            <tr>
              <th className="px-4 py-4 text-left border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] font-semibold text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
                User
              </th>
              <th className="px-4 py-4 text-left border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] font-semibold text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
                Organisation
              </th>
              <th className="px-4 py-4 text-left border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] font-semibold text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
                Establishment
              </th>
              <th className="px-4 py-4 text-left border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] font-semibold text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
                Roles
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
            {userAccounts.map((account) => (
              <tr
                key={account.id}
                className="hover:bg-[rgba(99,102,241,0.05)] cursor-pointer"
                onClick={() => router.push(`/user-accounts/${account.id}`)}
              >
                <td className="px-4 py-4 text-left border-b border-[var(--color-border)]">
                  <div>
                    <div className="font-medium">{account.user.email}</div>
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      {account.user.username}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-left border-b border-[var(--color-border)]">
                  {account.organisation?.name || '-'}
                </td>
                <td className="px-4 py-4 text-left border-b border-[var(--color-border)]">
                  {account.establishment?.name || '-'}
                </td>
                <td className="px-4 py-4 text-left border-b border-[var(--color-border)]">
                  {account.roles && account.roles.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {account.roles.map((role) => (
                        <span
                          key={role.name}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-[rgba(99,102,241,0.15)] text-[var(--color-accent)]"
                        >
                          {role.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-4 py-4 text-left border-b border-[var(--color-border)]">
                  <span
                    className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
                      account.enabled
                        ? 'bg-[rgba(16,185,129,0.15)] text-[var(--color-success)]'
                        : 'bg-[rgba(239,68,68,0.15)] text-[var(--color-error)]'
                    }`}
                  >
                    {account.enabled ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-4 text-left border-b border-[var(--color-border)]">
                  {new Date(account.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
