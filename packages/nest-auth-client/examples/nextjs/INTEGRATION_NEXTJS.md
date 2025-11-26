# Guide d'intégration Next.js

## Vue d'ensemble

Ce guide explique comment intégrer `@devlab-io/nest-auth-client` dans un projet Next.js pour :

- Initialiser le client une seule fois au démarrage
- Utiliser l'état d'authentification dans toute l'application
- Afficher le profil utilisateur dans la navigation
- Gérer les multiples comptes utilisateur

## Architecture recommandée

### 1. Provider d'authentification (Client Component)

Créez un provider qui initialise le `AuthClient` et expose l'état via React Context.

```typescript
// app/providers/auth-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthClient, AuthState } from '@devlab-io/nest-auth-client';
import { UserAccount } from '@devlab-io/nest-auth-types';

interface AuthContextType {
  userAccount: UserAccount | null;
  isLoading: boolean;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialisation unique du client
    const initializeAuth = async () => {
      try {
        setIsLoading(true);

        // Initialiser le client avec la configuration
        const account = await AuthClient.initialize({
          baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001',
          timeout: 30000,
          cookieName: 'access_token',
          // localStorage sera utilisé par défaut en browser
        });

        setUserAccount(account);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setIsInitialized(true);
      } finally {
        setIsLoading(false);
      }
    };

    // S'abonner aux changements de userAccount
    const unsubscribe = AuthState.onUserAccountChange((account) => {
      setUserAccount(account);
    });

    initializeAuth();

    // Nettoyer l'abonnement au démontage
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ userAccount, isLoading, isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### 2. Intégration dans le Layout

Intégrez le provider dans votre layout racine.

```typescript
// app/layout.tsx
import { AuthProvider } from './providers/auth-provider';
import { Navigation } from './components/navigation';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <Navigation />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 3. Composant de Navigation avec Profil

Créez un composant de navigation qui affiche le profil utilisateur.

```typescript
// app/components/navigation.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../providers/auth-provider';
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
```

### 4. Styles CSS (exemple)

```css
/* app/globals.css */
.navbar {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 2rem;
}

.navbar-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-profile {
  position: relative;
}

.profile-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.profile-button:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.profile-picture {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-initials {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.profile-name {
  font-weight: 500;
  color: #111827;
}

.dropdown-arrow {
  transition: transform 0.2s;
  color: #6b7280;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.profile-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 280px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 50;
  overflow: hidden;
}

.menu-section {
  border-bottom: 1px solid #e5e7eb;
}

.menu-section:last-child {
  border-bottom: none;
}

.menu-header {
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #6b7280;
  letter-spacing: 0.05em;
}

.current-account {
  padding: 1rem;
  background: #f9fafb;
}

.account-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.account-name {
  font-weight: 600;
  color: #111827;
}

.account-details {
  font-size: 0.875rem;
  color: #6b7280;
}

.account-roles {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

.account-item {
  width: 100%;
  padding: 0.75rem 1rem;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.account-item:hover {
  background: #f9fafb;
}

.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: #111827;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 0.875rem;
}

.menu-item:hover {
  background: #f9fafb;
}

.navbar-actions {
  display: flex;
  gap: 0.75rem;
}

.button-primary,
.button-secondary {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
}

.button-primary {
  background: #3b82f6;
  color: white;
}

.button-primary:hover {
  background: #2563eb;
}

.button-secondary {
  background: transparent;
  color: #3b82f6;
  border: 1px solid #3b82f6;
}

.button-secondary:hover {
  background: #eff6ff;
}
```

### 5. Page de profil

```typescript
// app/profile/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../providers/auth-provider';
import { AuthClient } from '@devlab-io/nest-auth-client';
import { User } from '@devlab-io/nest-auth-types';

export default function ProfilePage() {
  const { userAccount } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  useEffect(() => {
    if (userAccount?.user) {
      const userData = userAccount.user;
      setUser(userData);
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phone: userData.phone || '',
      });
    }
  }, [userAccount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await AuthClient.users.patch(user.id, formData);
      // Le userAccount sera automatiquement mis à jour via AuthState
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  if (!userAccount || !user) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="profile-page">
      <h1>Mon profil</h1>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input type="email" value={user.email} disabled />
        </div>

        <div className="form-group">
          <label>Prénom</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
            />
          ) : (
            <div>{user.firstName || 'Non renseigné'}</div>
          )}
        </div>

        <div className="form-group">
          <label>Nom</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
            />
          ) : (
            <div>{user.lastName || 'Non renseigné'}</div>
          )}
        </div>

        <div className="form-group">
          <label>Téléphone</label>
          {isEditing ? (
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          ) : (
            <div>{user.phone || 'Non renseigné'}</div>
          )}
        </div>

        <div className="form-actions">
          {isEditing ? (
            <>
              <button type="submit" className="button-primary">
                Enregistrer
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={() => setIsEditing(false)}
              >
                Annuler
              </button>
            </>
          ) : (
            <button
              type="button"
              className="button-primary"
              onClick={() => setIsEditing(true)}
            >
              Modifier
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
```

## Points importants

### Initialisation unique

- Le `AuthClient.initialize()` est appelé une seule fois dans le `useEffect` du `AuthProvider`
- L'initialisation vérifie automatiquement s'il existe un token valide et restaure la session

### Synchronisation de l'état

- `AuthState.onUserAccountChange()` permet de réagir aux changements d'authentification
- Les changements sont automatiquement propagés à tous les composants via React Context

### Gestion des comptes multiples

- Un `User` peut avoir plusieurs `UserAccount` (dans différentes organisations/établissements)
- Le menu affiche le compte actuel et les autres comptes disponibles
- Note: Le changement de compte actif nécessitera probablement une API dédiée

### Stockage du token

- Le token est stocké dans les cookies ET localStorage par défaut
- `AuthState.setToken()` synchronise automatiquement les deux sources

## Variables d'environnement

Créez un fichier `.env.local` :

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Prochaines étapes

1. Implémenter l'API de changement de compte actif (si nécessaire)
2. Ajouter la gestion des rôles et permissions
3. Implémenter la protection des routes avec des guards
4. Ajouter la gestion des erreurs et des états de chargement
