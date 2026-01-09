'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../providers/AuthProvider';
import { AuthClient } from '@devlab-io/nest-auth-client';
import { User } from '@devlab-io/nest-auth-types';
import { Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadUser = useCallback(async () => {
    try {
      const loadedUser = await AuthClient.users.getById(userId);
      setUser(loadedUser);
    } catch (err: any) {
      setError(err.message || 'Failed to load user');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isAuthenticated && userId) {
      loadUser();
    }
  }, [isAuthenticated, userId, loadUser]);

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
          href="/users"
          className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Back to Users</span>
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Users size={32} className="text-[var(--color-accent)]" />
          <h1 className="text-3xl font-semibold">User Details</h1>
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
      ) : !user ? (
        <div className="text-center py-16 px-8 text-[var(--color-text-secondary)]">
          <div className="text-5xl mb-4 opacity-50">
            <Users size={48} className="mx-auto" />
          </div>
          <p>User not found</p>
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
                <p className="text-[var(--color-text-primary)]">{user.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Email
                </label>
                <p className="text-[var(--color-text-primary)]">{user.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Username
                </label>
                <p className="text-[var(--color-text-primary)]">
                  {user.username}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  First Name
                </label>
                <p className="text-[var(--color-text-primary)]">
                  {user.firstName || '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Last Name
                </label>
                <p className="text-[var(--color-text-primary)]">
                  {user.lastName || '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Phone
                </label>
                <p className="text-[var(--color-text-primary)]">
                  {user.phone || '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Profile Picture
                </label>
                {user.profilePicture ? (
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-[var(--color-border)]">
                    <Image
                      src={user.profilePicture}
                      alt="Profile Picture"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[var(--color-bg-secondary)] border-2 border-[var(--color-border)] flex items-center justify-center">
                    <Users
                      size={32}
                      className="text-[var(--color-text-secondary)]"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Status</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Enabled
                </label>
                <span
                  className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
                    user.enabled
                      ? 'bg-[rgba(16,185,129,0.15)] text-[var(--color-success)]'
                      : 'bg-[rgba(239,68,68,0.15)] text-[var(--color-error)]'
                  }`}
                >
                  {user.enabled ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Email Validated
                </label>
                <span
                  className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
                    user.emailValidated
                      ? 'bg-[rgba(16,185,129,0.15)] text-[var(--color-success)]'
                      : 'bg-[rgba(239,68,68,0.15)] text-[var(--color-error)]'
                  }`}
                >
                  {user.emailValidated ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Accepted Terms
                </label>
                <span
                  className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
                    user.acceptedTerms
                      ? 'bg-[rgba(16,185,129,0.15)] text-[var(--color-success)]'
                      : 'bg-[rgba(239,68,68,0.15)] text-[var(--color-error)]'
                  }`}
                >
                  {user.acceptedTerms ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Accepted Privacy Policy
                </label>
                <span
                  className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${
                    user.acceptedPrivacyPolicy
                      ? 'bg-[rgba(16,185,129,0.15)] text-[var(--color-success)]'
                      : 'bg-[rgba(239,68,68,0.15)] text-[var(--color-error)]'
                  }`}
                >
                  {user.acceptedPrivacyPolicy ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Dates</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Created At
                </label>
                <p className="text-[var(--color-text-primary)]">
                  {new Date(user.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Updated At
                </label>
                <p className="text-[var(--color-text-primary)]">
                  {new Date(user.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {user.credentials && user.credentials.length > 0 && (
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Credentials</h2>
              <div className="space-y-2">
                {user.credentials.map((credential, index) => (
                  <div
                    key={index}
                    className="p-3 bg-[var(--color-bg-secondary)] rounded-lg"
                  >
                    <p className="text-sm text-[var(--color-text-primary)]">
                      <span className="font-medium">Type:</span>{' '}
                      {credential.type}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {user.accounts && user.accounts.length > 0 && (
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">
                User Accounts ({user.accounts.length})
              </h2>
              <div className="space-y-2">
                {user.accounts.map((account) => (
                  <div
                    key={account.id}
                    className="p-3 bg-[var(--color-bg-secondary)] rounded-lg"
                  >
                    <p className="text-sm text-[var(--color-text-primary)]">
                      <span className="font-medium">ID:</span> {account.id}
                    </p>
                    {account.organisation && (
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        <span className="font-medium">Organisation:</span>{' '}
                        {account.organisation?.name}
                      </p>
                    )}
                    {account.establishment && (
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        <span className="font-medium">Establishment:</span>{' '}
                        {account.establishment?.name}
                      </p>
                    )}
                    {account.roles && account.roles.length > 0 && (
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        <span className="font-medium">Roles:</span>{' '}
                        {account.roles.map((r) => r.name).join(', ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
