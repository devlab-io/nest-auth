'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../providers/AuthProvider';

export default function SignInPage() {
  const router = useRouter();
  const { signIn, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/dashboard');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Sign in failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[420px] mx-auto my-16 p-10 bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
      <h1 className="text-3xl font-semibold mb-2 bg-gradient-to-br from-[var(--color-text-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
        Welcome back
      </h1>
      <p className="text-[var(--color-text-secondary)] mb-8">
        Sign in to your account
      </p>

      {error && (
        <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[var(--color-error)] px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <label
            className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]"
            htmlFor="email"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            className="w-full px-4 py-3.5 text-base bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] transition-all placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] autofill:bg-[var(--color-bg-secondary)]"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-5">
          <label
            className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]"
            htmlFor="password"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            className="w-full px-4 py-3.5 text-base bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] transition-all placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] autofill:bg-[var(--color-bg-secondary)]"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full inline-flex items-center justify-center px-6 py-3.5 text-base font-medium rounded-lg bg-gradient-to-r from-[var(--color-accent)] to-[#8b5cf6] text-white border-none cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(99,102,241,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6">
        <h3 className="mb-4 text-sm font-semibold text-[var(--color-text-secondary)]">
          Default Admin Account
        </h3>
        <p className="mb-2 text-sm text-[var(--color-text-secondary)]">
          Email:{' '}
          <code className="bg-[var(--color-bg-card)] px-2 py-1 rounded font-mono text-[var(--color-text-primary)] text-xs">
            admin@demo.com
          </code>
        </p>
        <p className="mb-0 text-sm text-[var(--color-text-secondary)]">
          Password:{' '}
          <code className="bg-[var(--color-bg-card)] px-2 py-1 rounded font-mono text-[var(--color-text-primary)] text-xs">
            ChangeMe1234*
          </code>
        </p>
      </div>

      <p className="mt-6 text-center text-[var(--color-text-secondary)]">
        Don&apos;t have an account?{' '}
        <Link
          href="/auth/signup"
          className="text-[var(--color-accent)] no-underline transition-colors hover:text-[var(--color-accent-hover)] hover:underline"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
