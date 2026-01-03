'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthClient } from '@devlab-io/nest-auth-client';
import { useAuth } from '../../../providers/AuthProvider';
import { Eye, EyeOff } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    profilePicture: '',
    acceptedTerms: false,
    acceptedPrivacyPolicy: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
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
        acceptedTerms: formData.acceptedTerms,
        acceptedPrivacyPolicy: formData.acceptedPrivacyPolicy,
        ...(formData.username && { username: formData.username }),
        ...(formData.firstName && { firstName: formData.firstName }),
        ...(formData.lastName && { lastName: formData.lastName }),
        ...(formData.phone && { phone: formData.phone }),
        ...(formData.profilePicture && { profilePicture: formData.profilePicture }),
        ...(formData.password && {
          credentials: [{ type: 'password', password: formData.password }],
        }),
      });
      router.push('/auth/signup/done');
    } catch (err: any) {
      setError(err.message || 'Sign up failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[600px] mx-auto my-16 p-10 bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
      <h1 className="text-3xl font-semibold mb-2 bg-gradient-to-br from-[var(--color-text-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
        Create account
      </h1>
      <p className="text-[var(--color-text-secondary)] mb-8">Get started with Demo Auth</p>

      {error && (
        <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[var(--color-error)] px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
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
            minLength={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]" htmlFor="firstName">
              First Name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              className="w-full px-4 py-3.5 text-base bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] transition-all placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] autofill:bg-[var(--color-bg-secondary)]"
              placeholder="John"
              value={formData.firstName}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]" htmlFor="lastName">
              Last Name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              className="w-full px-4 py-3.5 text-base bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] transition-all placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] autofill:bg-[var(--color-bg-secondary)]"
              placeholder="Doe"
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className="w-full px-4 py-3.5 text-base bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] transition-all placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] autofill:bg-[var(--color-bg-secondary)]"
            placeholder="+689123456789"
            value={formData.phone}
            onChange={handleChange}
          />
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              className="w-full px-4 py-3.5 pr-10 text-base bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] transition-all placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] autofill:bg-[var(--color-bg-secondary)]"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              className={`w-full px-4 py-3.5 pr-10 text-base bg-[var(--color-bg-secondary)] border rounded-lg text-[var(--color-text-primary)] transition-all placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] autofill:bg-[var(--color-bg-secondary)] ${
                formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword
                  ? 'border-[rgba(239,68,68,0.5)] focus:border-[var(--color-error)]'
                  : 'border-[var(--color-border)] focus:border-[var(--color-accent)]'
              }`}
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
          {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <p className="mt-1 text-xs text-[var(--color-error)]">Passwords do not match</p>
          )}
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium mb-2 text-[var(--color-text-secondary)]" htmlFor="profilePicture">
            Profile Picture URL
          </label>
          <input
            id="profilePicture"
            name="profilePicture"
            type="url"
            className="w-full px-4 py-3.5 text-base bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] transition-all placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:border-[var(--color-accent)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.2)] autofill:bg-[var(--color-bg-secondary)]"
            placeholder="https://example.com/profile.jpg"
            value={formData.profilePicture}
            onChange={handleChange}
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
