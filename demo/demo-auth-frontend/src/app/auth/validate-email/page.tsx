'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthClient } from '@devlab-io/nest-auth-client';
import { useAuth } from '../../../providers/AuthProvider';
import { Mail, CheckCircle, XCircle } from 'lucide-react';

export default function ValidateEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Récupérer le token et l'email depuis les query params si présents
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');
    if (tokenParam) setToken(tokenParam);
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    try {
      await AuthClient.auth.acceptEmailValidation({
        token,
        email,
      });
      setSuccess(true);
      setTimeout(() => router.push('/auth/signin'), 3000);
    } catch (err: any) {
      setError(err.message || 'Email validation failed. Please check your token and email.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated) {
    return null;
  }

  if (success) {
    return (
      <div className="max-w-[500px] mx-auto my-16 p-10 bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(16,185,129,0.15)] mb-4">
            <CheckCircle size={32} className="text-[var(--color-success)]" />
          </div>
          <h1 className="text-3xl font-semibold mb-2 bg-gradient-to-br from-[var(--color-text-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
            Email Verified!
          </h1>
          <p className="text-[var(--color-text-secondary)] mb-6">
            Your email address has been successfully verified.
          </p>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Redirecting to sign in page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[500px] mx-auto my-16 p-10 bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(99,102,241,0.15)] mb-4">
          <Mail size={32} className="text-[var(--color-accent)]" />
        </div>
        <h1 className="text-3xl font-semibold mb-2 bg-gradient-to-br from-[var(--color-text-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
          Verify Your Email
        </h1>
        <p className="text-[var(--color-text-secondary)]">
          Enter the verification token sent to your email address
        </p>
      </div>

      {error && (
        <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[var(--color-error)] px-4 py-3 rounded-lg mb-4 text-sm flex items-center gap-2">
          <XCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="w-full px-4 py-3.5 text-base bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] transition-all placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] autofill:bg-[var(--color-bg-secondary)]"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]" htmlFor="token">
            Verification Token
          </label>
          <input
            id="token"
            name="token"
            type="text"
            className="w-full px-4 py-3.5 text-base bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] transition-all placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] autofill:bg-[var(--color-bg-secondary)] font-mono text-sm"
            placeholder="Enter the token from your email"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
          <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
            Check your email inbox for the verification token. It may be in your spam folder.
          </p>
        </div>

        <button
          type="submit"
          className="w-full inline-flex items-center justify-center px-6 py-3.5 text-base font-medium rounded-lg bg-gradient-to-r from-[var(--color-accent)] to-[#8b5cf6] text-white border-none cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(99,102,241,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={isLoading || !token || !email}
        >
          {isLoading ? 'Verifying...' : 'Verify Email'}
        </button>
      </form>

      <div className="mt-6 space-y-3">
        <Link
          href="/auth/signin"
          className="block text-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
        >
          Back to Sign In
        </Link>
        <Link
          href="/"
          className="block text-center text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
