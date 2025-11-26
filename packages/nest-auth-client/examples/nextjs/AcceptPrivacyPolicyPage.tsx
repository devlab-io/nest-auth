'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AuthClient } from '@devlab-io/nest-auth-client';

export function AcceptPrivacyPolicyPage() {
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
      await AuthClient.auth.acceptPrivacyPolicy({
        token,
        email,
      });

      setSuccess(true);
      // Rediriger vers le dashboard après 3 secondes
      setTimeout(() => {
        router.push('/dashboard?privacy-policy-accepted=true');
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
      <div className="accept-privacy-policy-page">
        <h1>Acceptation de la politique de confidentialité</h1>
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
      <div className="accept-privacy-policy-page">
        <h1>Politique acceptée</h1>
        <div className="success-message">
          Vous avez accepté la politique de confidentialité. Vous allez être
          redirigé...
        </div>
      </div>
    );
  }

  return (
    <div className="accept-privacy-policy-page">
      <h1>Politique de confidentialité</h1>

      <div className="privacy-policy-content">
        <h2>Politique de Confidentialité</h2>
        <p>
          Cette politique décrit comment nous collectons, utilisons et
          protégeons vos données personnelles...
        </p>
        {/* Contenu complet de la politique */}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="form-actions">
        <button
          onClick={handleAccept}
          disabled={isLoading}
          className="button-primary"
        >
          {isLoading ? 'Acceptation...' : "J'accepte la politique"}
        </button>
        <a href="/auth/sign-in" className="button-secondary">
          Refuser et retourner
        </a>
      </div>
    </div>
  );
}

