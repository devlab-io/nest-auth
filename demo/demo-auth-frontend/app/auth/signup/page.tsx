'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthClient } from '@devlab-io/nest-auth-client';
import { useAuth } from '../../providers/AuthProvider';

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
    <div className="form-container">
      <h1 className="form-title">Create account</h1>
      <p className="form-subtitle">Get started with Demo Auth</p>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="form-input"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            className="form-input"
            placeholder="johndoe"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="form-input"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={8}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="confirmPassword">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            className="form-input"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="acceptedTerms"
              checked={formData.acceptedTerms}
              onChange={handleChange}
            />
            <span>I accept the Terms of Service</span>
          </label>
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="acceptedPrivacyPolicy"
              checked={formData.acceptedPrivacyPolicy}
              onChange={handleChange}
            />
            <span>I accept the Privacy Policy</span>
          </label>
        </div>

        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <p
        style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          color: 'var(--text-secondary)',
        }}
      >
        Already have an account?{' '}
        <Link href="/auth/signin" className="link">
          Sign in
        </Link>
      </p>

      <style jsx>{`
        .checkbox-group {
          margin-bottom: 1rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .checkbox-label input {
          width: 18px;
          height: 18px;
          accent-color: var(--accent);
        }
      `}</style>
    </div>
  );
}
