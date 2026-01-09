'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../providers/AuthProvider';
import { AuthClient } from '@devlab-io/nest-auth-client';
import { Users, Building2, Store, Shield, ShieldUser, UserCog } from 'lucide-react';
import DashboardCard from '../../components/DashboardCard';

export default function DashboardPage() {
  const router = useRouter();
  const { userAccount, isAuthenticated, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    users: 0,
    userAccounts: 0,
    organisations: 0,
    establishments: 0,
    claims: 0,
    roles: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated]);

  const loadStats = async () => {
    try {
      const [usersRes, userAccountsRes, orgsRes, estsRes, claimsRes, rolesRes] = await Promise.allSettled([
        AuthClient.users.search({}, 1, 1),
        AuthClient.userAccounts.search({}, 1, 1),
        AuthClient.organisations.search({}, 1, 1),
        AuthClient.establishments.search({}, 1, 1),
        AuthClient.claims.getAll(),
        AuthClient.roles.getAll(),
      ]);

      setStats({
        users: usersRes.status === 'fulfilled' ? usersRes.value.total : 0,
        userAccounts: userAccountsRes.status === 'fulfilled' ? userAccountsRes.value.total : 0,
        organisations: orgsRes.status === 'fulfilled' ? orgsRes.value.total : 0,
        establishments:
          estsRes.status === 'fulfilled' ? estsRes.value.total : 0,
        claims: claimsRes.status === 'fulfilled' ? claimsRes.value.length : 0,
        roles: rolesRes.status === 'fulfilled' ? rolesRes.value.length : 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
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
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">Dashboard</h1>
      </div>

      <div className="flex flex-col gap-6">
        <DashboardCard
          icon={Shield}
          value={stats.claims}
          label="Claims"
          href="/claims"
          isLoading={isLoading}
        />

        <DashboardCard
          icon={ShieldUser}
          value={stats.roles}
          label="Roles"
          href="/roles"
          isLoading={isLoading}
        />

        <DashboardCard
          icon={Users}
          value={stats.users}
          label="Users"
          href="/users"
          isLoading={isLoading}
        />

        <DashboardCard
          icon={UserCog}
          value={stats.userAccounts}
          label="User Accounts"
          href="/user-accounts"
          isLoading={isLoading}
        />

        <DashboardCard
          icon={Building2}
          value={stats.organisations}
          label="Organisations"
          href="/organisations"
          isLoading={isLoading}
        />

        <DashboardCard
          icon={Store}
          value={stats.establishments}
          label="Establishments"
          href="/establishments"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
