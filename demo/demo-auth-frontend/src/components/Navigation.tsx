'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';
import { AuthClient } from '@devlab-io/nest-auth-client';
import { UserAccount } from '@devlab-io/nest-auth-types';
import {
  Lock,
  Home,
  Users,
  Building2,
  Store,
  Key,
  UserPlus,
  Shield,
  ShieldUser,
  UserCog,
  ChevronDown,
} from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { userAccount, isAuthenticated, signOut } = useAuth();
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [showAccountsList, setShowAccountsList] = useState(false);

  const loadUserAccounts = useCallback(async () => {
    if (!userAccount) return;
    try {
      setIsLoadingAccounts(true);
      const response = await AuthClient.userAccounts.search(
        { userId: userAccount.user.id },
        1,
        100,
      );
      setUserAccounts(response.contents);
    } catch (error) {
      console.error('Failed to load user accounts:', error);
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [userAccount]);

  useEffect(() => {
    if (isAuthenticated && userAccount) {
      loadUserAccounts();
    }
  }, [isAuthenticated, userAccount, loadUserAccounts]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/signin');
  };

  const getAccountLabel = (account: UserAccount) => {
    const parts: string[] = [];
    if (account.organisation) {
      parts.push(account.organisation.name);
    }
    if (account.establishment) {
      parts.push(account.establishment.name);
    }
    if (parts.length === 0) {
      return 'No organisation';
    }
    return parts.join(' / ');
  };

  const navItems = isAuthenticated
    ? [
        { href: '/dashboard', label: 'Dashboard', icon: Home },
        { href: '/claims', label: 'Claims', icon: Shield },
        { href: '/roles', label: 'Roles', icon: ShieldUser },
        { href: '/users', label: 'Users', icon: Users },
        { href: '/user-accounts', label: 'User Accounts', icon: UserCog },
        { href: '/organisations', label: 'Organisations', icon: Building2 },
        { href: '/establishments', label: 'Establishments', icon: Store },
      ]
    : [
        { href: '/auth/signin', label: 'Sign In', icon: Key },
        { href: '/auth/signup', label: 'Sign Up', icon: UserPlus },
      ];

  return (
    <nav className="sticky top-0 h-screen w-64 bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] flex flex-col py-6 shrink-0">
      <div className="px-6 pb-6 border-b border-[var(--color-border)]">
        <Link
          href="/"
          className="flex items-center gap-3 no-underline text-[var(--color-text-primary)]"
        >
          <Lock size={24} />
          <span className="text-xl font-bold bg-gradient-to-br from-[var(--color-accent)] to-[#8b5cf6] bg-clip-text text-transparent">
            Demo Auth
          </span>
        </Link>
      </div>

      <div className="flex-1 px-6 overflow-y-auto">
        <div className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mt-3 mb-3">
          Menu
        </div>
        <ul className="list-none">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg no-underline transition-all mb-1 ${
                    isActive
                      ? 'bg-gradient-to-r from-[var(--color-accent)] to-[#8b5cf6] text-white'
                      : 'text-[var(--color-text-secondary)] hover:bg-[rgba(99,102,241,0.1)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  <IconComponent size={18} className="shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {isAuthenticated && userAccount && (
        <div className="px-6 pt-6 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-accent)] to-[#8b5cf6] flex items-center justify-center font-semibold text-white">
              {userAccount.user.email[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                {userAccount.user.username}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] whitespace-nowrap overflow-hidden text-ellipsis">
                {userAccount.user.email}
              </div>
            </div>
          </div>

          {userAccounts.length > 1 && (
            <div className="mb-4 relative">
              <button
                onClick={() => setShowAccountsList(!showAccountsList)}
                className="w-full flex items-center justify-between px-3 py-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
              >
                <span className="text-xs text-[var(--color-text-secondary)] truncate">
                  {getAccountLabel(userAccount)}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-[var(--color-text-secondary)] transition-transform ${
                    showAccountsList ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {showAccountsList && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                  {isLoadingAccounts ? (
                    <div className="px-3 py-2 text-xs text-[var(--color-text-secondary)]">
                      Loading...
                    </div>
                  ) : (
                    userAccounts.map((account) => (
                      <Link
                        key={account.id}
                        href={`/user-accounts/${account.id}`}
                        onClick={() => setShowAccountsList(false)}
                        className={`block px-3 py-2 text-xs hover:bg-[var(--color-bg-secondary)] transition-colors ${
                          account.id === userAccount.id
                            ? 'bg-[rgba(99,102,241,0.1)] text-[var(--color-accent)] font-medium'
                            : 'text-[var(--color-text-primary)]'
                        }`}
                      >
                        <div className="truncate">
                          {getAccountLabel(account)}
                        </div>
                        {account.roles && account.roles.length > 0 && (
                          <div className="text-[var(--color-text-secondary)] mt-1 truncate">
                            {account.roles.map((r) => r.name).join(', ')}
                          </div>
                        )}
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {userAccounts.length === 1 && (
            <div className="mb-4 px-3 py-2 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg">
              <div className="text-xs text-[var(--color-text-secondary)] truncate">
                {getAccountLabel(userAccount)}
              </div>
            </div>
          )}

          <button
            onClick={handleSignOut}
            className="w-full px-2.5 py-2.5 bg-transparent border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] text-sm cursor-pointer transition-all hover:bg-[rgba(239,68,68,0.1)] hover:border-[var(--color-error)] hover:text-[var(--color-error)]"
          >
            Sign Out
          </button>
        </div>
      )}
    </nav>
  );
}
