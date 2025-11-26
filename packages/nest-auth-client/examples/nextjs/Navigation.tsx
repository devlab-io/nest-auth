'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from './AuthProvider';
import { AuthClient } from '@devlab-io/nest-auth-client';
import { UserAccount } from '@devlab-io/nest-auth-types';

export function Navigation() {
  const { userAccount, isLoading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu si on clique à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Charger tous les comptes de l'utilisateur
  useEffect(() => {
    if (userAccount?.user?.accounts) {
      setUserAccounts(userAccount.user.accounts);
    }
  }, [userAccount]);

  const handleSignOut = async () => {
    try {
      await AuthClient.auth.signOut();
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const getDisplayName = (account: UserAccount | null): string => {
    if (!account) return 'Invité';
    const user = account.user;
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username || user.email;
  };

  const getInitials = (account: UserAccount | null): string => {
    if (!account) return '?';
    const user = account.user;
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return (user.username || user.email || '?')[0].toUpperCase();
  };

  if (isLoading) {
    return (
      <nav className="navbar">
        <div className="navbar-content">
          <Link href="/">Mon App</Link>
          <div className="navbar-loading">Chargement...</div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link href="/">Mon App</Link>
        
        {userAccount ? (
          <div className="navbar-profile" ref={menuRef}>
            <button
              className="profile-button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menu profil"
            >
              {userAccount.user.profilePicture ? (
                <img
                  src={userAccount.user.profilePicture}
                  alt={getDisplayName(userAccount)}
                  className="profile-picture"
                />
              ) : (
                <div className="profile-initials">
                  {getInitials(userAccount)}
                </div>
              )}
              <span className="profile-name">
                {getDisplayName(userAccount)}
              </span>
              <svg
                className={`dropdown-arrow ${isMenuOpen ? 'open' : ''}`}
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
              >
                <path
                  d="M2 4L6 8L10 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {isMenuOpen && (
              <div className="profile-menu">
                {/* Compte actuel */}
                <div className="menu-section">
                  <div className="menu-header">Compte actuel</div>
                  <div className="current-account">
                    <div className="account-info">
                      <div className="account-name">
                        {userAccount.organisation.name}
                      </div>
                      <div className="account-details">
                        {userAccount.establishment.name}
                      </div>
                      <div className="account-roles">
                        {userAccount.roles.map((role) => role.name).join(', ')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Autres comptes */}
                {userAccounts.length > 1 && (
                  <div className="menu-section">
                    <div className="menu-header">Autres comptes</div>
                    {userAccounts
                      .filter((account) => account.id !== userAccount.id)
                      .map((account) => (
                        <button
                          key={account.id}
                          className="account-item"
                          onClick={async () => {
                            // TODO: Implémenter le changement de compte
                            // Cela nécessitera probablement une API pour changer le compte actif
                            setIsMenuOpen(false);
                          }}
                        >
                          <div className="account-info">
                            <div className="account-name">
                              {account.organisation.name}
                            </div>
                            <div className="account-details">
                              {account.establishment.name}
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                )}

                {/* Actions */}
                <div className="menu-section">
                  <Link
                    href="/profile"
                    className="menu-item"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z"
                        fill="currentColor"
                      />
                      <path
                        d="M8 10C3.58172 10 0 11.7909 0 14V16H16V14C16 11.7909 12.4183 10 8 10Z"
                        fill="currentColor"
                      />
                    </svg>
                    Mon profil
                  </Link>
                  <button className="menu-item" onClick={handleSignOut}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M6 14H3C2.46957 14 1.96086 13.7893 1.58579 13.4142C1.21071 13.0391 1 12.5304 1 12V4C1 3.46957 1.21071 2.96086 1.58579 2.58579C1.96086 2.21071 2.46957 2 3 2H6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M10 11L15 8L10 5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M15 8H6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="navbar-actions">
            <Link href="/sign-in" className="button-secondary">
              Connexion
            </Link>
            <Link href="/sign-up" className="button-primary">
              Inscription
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

