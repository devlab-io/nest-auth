'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  Context,
} from 'react';
import { AuthClient, AuthState } from '@devlab-io/nest-auth-client';
import { UserAccount } from '@devlab-io/nest-auth-types';

interface AuthContextType {
  userAccount: UserAccount | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext: Context<AuthContextType | undefined> = createContext<
  AuthContextType | undefined
>(undefined);

const API_URL: string =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
const CLIENT_ID: string = process.env.NEXT_PUBLIC_AUTH_CLIENT_ID || 'local';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const account: UserAccount | null = await AuthClient.initialize({
        baseURL: API_URL,
        clientId: CLIENT_ID,
      });
      setUserAccount(account);
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const response = await AuthClient.auth.signIn({ email, password });
    setUserAccount(response.userAccount);
  };

  const signOut = async () => {
    await AuthClient.auth.signOut();
    setUserAccount(null);
  };

  const refresh = async () => {
    const account: UserAccount | null = await AuthClient.auth.getAccount();
    setUserAccount(account);
  };

  return (
    <AuthContext.Provider
      value={{
        userAccount,
        isLoading,
        isAuthenticated: !!userAccount,
        signIn,
        signOut,
        refresh,
      }}
    >
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
