'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthClient } from '@devlab-io/nest-auth-client';
import { useAuth } from '../../../providers/AuthProvider';

export default function SignUpPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false,
    acceptedPrivacyPolicy: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push('/dashboard');
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.acceptedTerms || !formData.acceptedPrivacyPolicy) {
      setError('You must accept the terms and privacy policy');
      return;
    }

    setIsLoading(true);

    try {
      await AuthClient.auth.signUp({
        email: formData.email,
        username: formData.username,
        credentials: [{ type: 'password', password: formData.password }],
        acceptedTerms: formData.acceptedTerms,
        acceptedPrivacyPolicy: formData.acceptedPrivacyPolicy,
        enabled: true,
      });
      setSuccess('Account created successfully! You can now sign in.');
      setTimeout(() => router.push('/auth/signin'), 2000);
    } catch (err: any) {
      setError(err.message || 'Sign up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[420px] mx-auto my-16 p-10 bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
      <h1 className="text-3xl font-semibold mb-2 bg-gradient-to-br from-[var(--color-text-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
        Create account
      </h1>
      <p className="text-[var(--color-text-secondary)] mb-8">Get started with Demo Auth</p>

      {error && (
        <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[var(--color-error)] px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.3)] text-[var(--color-success)] px-4 py-3 rounded-lg mb-4 text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-5">
          <label className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="w-full px-4 py-3.5 text-base bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] transition-all placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] autofill:bg-[var(--color-bg-secondary)]"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            className="w-full px-4 py-3.5 text-base bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] transition-all placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] autofill:bg-[var(--color-bg-secondary)]"
            placeholder="johndoe"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="w-full px-4 py-3.5 text-base bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] transition-all placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] autofill:bg-[var(--color-bg-secondary)]"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={8}
          />
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            className="w-full px-4 py-3.5 text-base bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] transition-all placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] autofill:bg-[var(--color-bg-secondary)]"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-text-secondary)]">
            <input
              type="checkbox"
              name="acceptedTerms"
              checked={formData.acceptedTerms}
              onChange={handleChange}
              className="w-[18px] h-[18px] accent-[var(--color-accent)]"
            />
            <span>I accept the Terms of Service</span>
          </label>
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--color-text-secondary)]">
            <input
              type="checkbox"
              name="acceptedPrivacyPolicy"
              checked={formData.acceptedPrivacyPolicy}
              onChange={handleChange}
              className="w-[18px] h-[18px] accent-[var(--color-accent)]"
            />
            <span>I accept the Privacy Policy</span>
          </label>
        </div>

        <button
          type="submit"
          className="w-full inline-flex items-center justify-center px-6 py-3.5 text-base font-medium rounded-lg bg-gradient-to-r from-[var(--color-accent)] to-[#8b5cf6] text-white border-none cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(99,102,241,0.4)] disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <p className="mt-6 text-center text-[var(--color-text-secondary)]">
        Already have an account?{' '}
        <Link href="/auth/signin" className="text-[var(--color-accent)] no-underline transition-colors hover:text-[var(--color-accent-hover)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
