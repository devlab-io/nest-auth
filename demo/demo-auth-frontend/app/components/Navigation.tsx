'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';

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
        { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
        { href: '/users', label: 'Users', icon: '👤' },
        { href: '/organisations', label: 'Organisations', icon: '🏢' },
        { href: '/establishments', label: 'Establishments', icon: '🏬' },
      ]
    : [
        { href: '/auth/signin', label: 'Sign In', icon: '🔑' },
        { href: '/auth/signup', label: 'Sign Up', icon: '📝' },
      ];

  return (
    <nav className="navigation">
      <div className="nav-header">
        <Link href="/" className="nav-logo">
          <span className="logo-icon">🔐</span>
          <span className="logo-text">Demo Auth</span>
        </Link>
      </div>

      <div className="nav-section">
        <div className="nav-section-title">Menu</div>
        <ul className="nav-list">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`nav-link ${pathname === item.href ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {isAuthenticated && userAccount && (
        <div className="nav-footer">
          <div className="user-info">
            <div className="user-avatar">
              {userAccount.user.email[0].toUpperCase()}
            </div>
            <div className="user-details">
              <div className="user-name">{userAccount.user.username}</div>
              <div className="user-email">{userAccount.user.email}</div>
            </div>
          </div>
          <button onClick={handleSignOut} className="btn-signout">
            Sign Out
          </button>
        </div>
      )}

      <style jsx>{`
        .navigation {
          position: fixed;
          left: 0;
          top: 0;
          width: 260px;
          height: 100vh;
          background: var(--bg-secondary);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: 1.5rem 0;
        }

        .nav-header {
          padding: 0 1.5rem 1.5rem;
          border-bottom: 1px solid var(--border);
        }

        .nav-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          color: var(--text-primary);
        }

        .logo-icon {
          font-size: 1.5rem;
        }

        .logo-text {
          font-size: 1.25rem;
          font-weight: 700;
          background: linear-gradient(135deg, var(--accent), #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .nav-section {
          flex: 1;
          padding: 1.5rem;
        }

        .nav-section-title {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-secondary);
          margin-bottom: 0.75rem;
        }

        .nav-list {
          list-style: none;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          color: var(--text-secondary);
          text-decoration: none;
          transition: all 0.2s ease;
          margin-bottom: 0.25rem;
        }

        .nav-link:hover {
          background: rgba(99, 102, 241, 0.1);
          color: var(--text-primary);
        }

        .nav-link.active {
          background: linear-gradient(135deg, var(--accent), #8b5cf6);
          color: white;
        }

        .nav-icon {
          font-size: 1.125rem;
        }

        .nav-footer {
          padding: 1.5rem;
          border-top: 1px solid var(--border);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: white;
        }

        .user-details {
          flex: 1;
          min-width: 0;
        }

        .user-name {
          font-weight: 500;
          font-size: 0.875rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-email {
          font-size: 0.75rem;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .btn-signout {
          width: 100%;
          padding: 0.625rem;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text-secondary);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-signout:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: var(--error);
          color: var(--error);
        }
      `}</style>
    </nav>
  );
}
