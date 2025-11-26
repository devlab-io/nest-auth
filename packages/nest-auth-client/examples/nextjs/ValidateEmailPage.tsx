'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AuthClient } from '@devlab-io/nest-auth-client';

export function ValidateEmailPage() {
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

  useEffect(() => {
    // Auto-validation si token et email sont présents
    if (token && email && !success && !error) {
      handleValidate();
    }
  }, [token, email]);

  const handleValidate = async () => {
    if (!token || !email) {
      setError('Token ou email manquant');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await AuthClient.auth.acceptEmailValidation({
        token,
        email,
      });

      setSuccess(true);
      // Rediriger vers le dashboard après 3 secondes
      setTimeout(() => {
        router.push('/dashboard?email-validated=true');
      }, 3000);
    } catch (error: any) {
      console.error('Erreur de validation:', error);
      setError(
        error?.message ||
          'Le token est invalide ou a expiré. Veuillez demander un nouveau lien de validation.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="validate-email-page">
        <h1>Validation d'email</h1>
        <div className="error-message">
          Lien invalide. Veuillez demander un nouveau lien de validation.
        </div>
        <a href="/auth/sign-in" className="button-primary">
          Retour à la connexion
        </a>
      </div>
    );
  }

  if (success) {
    return (
      <div className="validate-email-page">
        <h1>Email validé</h1>
        <div className="success-message">
          Votre adresse email a été validée avec succès. Vous allez être
          redirigé...
        </div>
      </div>
    );
  }

  return (
    <div className="validate-email-page">
      <h1>Validation d'email</h1>
      <p>Validation de l'adresse email : {email}</p>

      {error && <div className="error-message">{error}</div>}

      {isLoading ? (
        <div className="loading">Validation en cours...</div>
      ) : (
        <button onClick={handleValidate} className="button-primary">
          Valider mon email
        </button>
      )}
    </div>
  );
}

