'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';
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
} from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { userAccount, isAuthenticated, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/signin');
  };

  const navItems = isAuthenticated
    ? [
        { href: '/dashboard', label: 'Dashboard', icon: Home },
        { href: '/claims', label: 'Claims', icon: Shield },
        { href: '/roles', label: 'Roles', icon: ShieldUser },
        { href: '/users', label: 'Users', icon: Users },
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
          <Lock size={24}/>
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
