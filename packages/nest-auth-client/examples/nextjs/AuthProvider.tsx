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
          baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
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

