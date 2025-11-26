'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AuthClient } from '@devlab-io/nest-auth-client';

export function AcceptInvitationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    username: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setError('Token ou email manquant dans l\'URL');
    }
  }, [token, email]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token || !email) {
      setError('Token ou email manquant');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setIsLoading(true);

    try {
      const response = await AuthClient.auth.acceptInvitation({
        token,
        email,
        password: formData.password,
        username: formData.username || undefined,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
      });

      if (response?.userAccount) {
        // Redirection vers le dashboard après acceptation réussie
        router.push('/dashboard');
      } else {
        setError('Échec de l\'acceptation de l\'invitation');
      }
    } catch (error: any) {
      console.error('Erreur d\'acceptation:', error);
      setError(
        error?.message ||
          'Le token est invalide ou a expiré. Veuillez contacter l\'administrateur.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="accept-invitation-page">
        <h1>Acceptation d'invitation</h1>
        <div className="error-message">
          Lien invalide. Veuillez contacter l'administrateur pour obtenir une
          nouvelle invitation.
        </div>
      </div>
    );
  }

  return (
    <div className="accept-invitation-page">
      <h1>Acceptation d'invitation</h1>
      <p>Vous avez été invité à rejoindre l'application avec l'email :</p>
      <p className="email-display">{email}</p>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Nom d'utilisateur</label>
          <input
            id="username"
            name="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            autoComplete="username"
            placeholder="johndoe"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName">Prénom</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleChange}
              autoComplete="given-name"
              placeholder="John"
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Nom</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleChange}
              autoComplete="family-name"
              placeholder="Doe"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="password">Mot de passe *</label>
          <input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
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
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            autoComplete="new-password"
            placeholder="••••••••"
            minLength={8}
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={isLoading} className="button-primary">
            {isLoading ? 'Acceptation...' : 'Accepter l\'invitation'}
          </button>
        </div>
      </form>
    </div>
  );
}

