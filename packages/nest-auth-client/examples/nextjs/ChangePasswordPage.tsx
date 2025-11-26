'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AuthClient } from '@devlab-io/nest-auth-client';

export function ChangePasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setError('Token ou email manquant dans l\'URL');
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token || !email) {
      setError('Token ou email manquant');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setIsLoading(true);

    try {
      await AuthClient.auth.acceptChangePassword({
        token,
        email,
        newPassword: password,
      });

      setSuccess(true);
      // Rediriger vers le dashboard après 3 secondes
      setTimeout(() => {
        router.push('/dashboard?password-changed=true');
      }, 3000);
    } catch (error: any) {
      console.error('Erreur de changement:', error);
      setError(
        error?.message ||
          'Le token est invalide ou a expiré. Veuillez demander un nouveau lien.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="change-password-page">
        <h1>Changement de mot de passe</h1>
        <div className="error-message">
          Lien invalide. Veuillez demander un nouveau lien de changement de mot
          de passe.
        </div>
        <a href="/auth/sign-in" className="button-primary">
          Retour à la connexion
        </a>
      </div>
    );
  }

  if (success) {
    return (
      <div className="change-password-page">
        <h1>Mot de passe changé</h1>
        <div className="success-message">
          Votre mot de passe a été changé avec succès. Vous allez être redirigé...
        </div>
      </div>
    );
  }

  return (
    <div className="change-password-page">
      <h1>Changement de mot de passe</h1>
      <p>Changement de mot de passe pour : {email}</p>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="password">Nouveau mot de passe *</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="••••••••"
            minLength={8}
          />
          <small>Au moins 8 caractères</small>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirmer le mot de passe *</label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="••••••••"
            minLength={8}
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={isLoading} className="button-primary">
            {isLoading ? 'Changement...' : 'Changer le mot de passe'}
          </button>
        </div>
      </form>
    </div>
  );
}

