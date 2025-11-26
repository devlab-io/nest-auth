'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AuthClient } from '@devlab-io/nest-auth-client';

export function AcceptTermsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setError('Token ou email manquant dans l\'URL');
    }
  }, [token, email]);

  const handleAccept = async () => {
    if (!token || !email) {
      setError('Token ou email manquant');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await AuthClient.auth.acceptTerms({
        token,
        email,
      });

      setSuccess(true);
      // Rediriger vers le dashboard après 3 secondes
      setTimeout(() => {
        router.push('/dashboard?terms-accepted=true');
      }, 3000);
    } catch (error: any) {
      console.error('Erreur d\'acceptation:', error);
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
      <div className="accept-terms-page">
        <h1>Acceptation des conditions d'utilisation</h1>
        <div className="error-message">
          Lien invalide. Veuillez contacter l'administrateur.
        </div>
        <a href="/auth/sign-in" className="button-primary">
          Retour à la connexion
        </a>
      </div>
    );
  }

  if (success) {
    return (
      <div className="accept-terms-page">
        <h1>Conditions acceptées</h1>
        <div className="success-message">
          Vous avez accepté les conditions d'utilisation. Vous allez être
          redirigé...
        </div>
      </div>
    );
  }

  return (
    <div className="accept-terms-page">
      <h1>Conditions d'utilisation</h1>

      <div className="terms-content">
        <h2>Conditions Générales d'Utilisation</h2>
        <p>
          En utilisant ce service, vous acceptez les conditions suivantes...
        </p>
        {/* Contenu complet des CGU */}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="form-actions">
        <button
          onClick={handleAccept}
          disabled={isLoading}
          className="button-primary"
        >
          {isLoading ? 'Acceptation...' : "J'accepte les conditions"}
        </button>
        <a href="/auth/sign-in" className="button-secondary">
          Refuser et retourner
        </a>
      </div>
    </div>
  );
}

