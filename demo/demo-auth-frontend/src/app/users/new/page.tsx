'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../providers/AuthProvider';
import { AuthClient } from '@devlab-io/nest-auth-client';
import { CreateUserRequest } from '@devlab-io/nest-auth-types';
import { Users, ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function CreateUserPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [emailValidated, setEmailValidated] = useState(false);
  const [profilePicture, setProfilePicture] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacyPolicy, setAcceptedPrivacyPolicy] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [usePassword, setUsePassword] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password confirmation
    if (usePassword && password && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    try {
      const createRequest: CreateUserRequest = {
        email,
        emailValidated,
        enabled,
        acceptedTerms,
        acceptedPrivacyPolicy,
        ...(username && { username }),
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone }),
        ...(profilePicture && { profilePicture }),
        ...(usePassword && password && {
          credentials: [{
            type: 'password',
            password,
          }],
        }),
      };

      const newUser = await AuthClient.users.create(createRequest);
      router.push(`/users`);
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordsMatch = !usePassword || !password || password === confirmPassword;
  const isFormValid = email.trim() && (!usePassword || passwordsMatch);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="w-10 h-10 border-[3px] border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/users"
          className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>Back to Users</span>
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Users size={32} className="text-[var(--color-accent)]" />
          <h1 className="text-3xl font-semibold">Create User</h1>
        </div>
      </div>

      {error && (
        <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-[var(--color-error)] px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email <span className="text-[var(--color-error)]">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                placeholder="username"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  placeholder="John"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-2">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label htmlFor="profilePicture" className="block text-sm font-medium mb-2">
                Profile Picture URL
              </label>
              <input
                type="url"
                id="profilePicture"
                value={profilePicture}
                onChange={(e) => setProfilePicture(e.target.value)}
                className="w-full px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="enabled"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-5 h-5 accent-[var(--color-accent)] cursor-pointer"
              />
              <label htmlFor="enabled" className="text-sm font-medium cursor-pointer">
                Account Enabled
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="emailValidated"
                checked={emailValidated}
                onChange={(e) => setEmailValidated(e.target.checked)}
                className="w-5 h-5 accent-[var(--color-accent)] cursor-pointer"
              />
              <label htmlFor="emailValidated" className="text-sm font-medium cursor-pointer">
                Email Validated
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="acceptedTerms"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="w-5 h-5 accent-[var(--color-accent)] cursor-pointer"
              />
              <label htmlFor="acceptedTerms" className="text-sm font-medium cursor-pointer">
                Accepted Terms
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="acceptedPrivacyPolicy"
                checked={acceptedPrivacyPolicy}
                onChange={(e) => setAcceptedPrivacyPolicy(e.target.checked)}
                className="w-5 h-5 accent-[var(--color-accent)] cursor-pointer"
              />
              <label htmlFor="acceptedPrivacyPolicy" className="text-sm font-medium cursor-pointer">
                Accepted Privacy Policy
              </label>
            </div>
          </div>
        </div>

        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Credentials</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="usePassword"
                checked={usePassword}
                onChange={(e) => setUsePassword(e.target.checked)}
                className="w-5 h-5 accent-[var(--color-accent)] cursor-pointer"
              />
              <label htmlFor="usePassword" className="text-sm font-medium cursor-pointer">
                Set Password
              </label>
            </div>

            {usePassword && (
              <>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2 pr-10 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                      placeholder="Enter password"
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
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full px-4 py-2 pr-10 bg-[var(--color-bg-secondary)] border rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] ${
                        password && confirmPassword && password !== confirmPassword
                          ? 'border-[var(--color-error)]'
                          : 'border-[var(--color-border)]'
                      }`}
                      placeholder="Confirm password"
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
                  {password && confirmPassword && password !== confirmPassword && (
                    <p className="mt-1 text-sm text-[var(--color-error)]">
                      Passwords do not match
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          <Link
            href="/users"
            className="px-6 py-2 border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !isFormValid}
            className="px-6 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            <Save size={18} />
            <span>{isSubmitting ? 'Creating...' : 'Create User'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
