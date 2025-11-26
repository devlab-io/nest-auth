'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthClient } from '@devlab-io/nest-auth-client';

export function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
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
      await AuthClient.auth.signUp({
        email: formData.email,
        password: formData.password,
        username: formData.username || undefined,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
      });

      // Redirection vers la page de connexion ou de validation email
      router.push('/auth/sign-in?registered=true');
    } catch (error: any) {
      console.error('Erreur d\'inscription:', error);
      setError(
        error?.message || 'Une erreur est survenue lors de l\'inscription',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sign-up-page">
      <h1>Inscription</h1>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
            placeholder="votre@email.com"
          />
        </div>

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
            {isLoading ? 'Inscription...' : 'S\'inscrire'}
          </button>
        </div>

        <div className="form-links">
          <a href="/auth/sign-in">Déjà un compte ? Se connecter</a>
        </div>
      </form>
    </div>
  );
}

