'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthClient } from '@devlab-io/nest-auth-client';

export function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await AuthClient.auth.signIn({
        email,
        password,
      });

      if (response?.userAccount) {
        // Redirection après connexion réussie
        router.push('/dashboard');
      } else {
        setError('Échec de la connexion');
      }
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      setError(
        error?.message || 'Une erreur est survenue lors de la connexion',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sign-in-page">
      <h1>Connexion</h1>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="votre@email.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={isLoading} className="button-primary">
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
        </div>

        <div className="form-links">
          <a href="/auth/sign-up">Créer un compte</a>
          <a href="/auth/reset-password">Mot de passe oublié ?</a>
        </div>
      </form>
    </div>
  );
}

