'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../providers/AuthProvider';
import { Mail, CheckCircle } from 'lucide-react';

export default function SignUpDonePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-[500px] mx-auto my-16 p-10 bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[rgba(16,185,129,0.15)] mb-4">
          <CheckCircle size={32} className="text-[var(--color-success)]" />
        </div>
        <h1 className="text-3xl font-semibold mb-2 bg-gradient-to-br from-[var(--color-text-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
          Account Created!
        </h1>
        <p className="text-[var(--color-text-secondary)]">
          Your account has been successfully created.
        </p>
      </div>

      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <Mail size={24} className="text-[var(--color-accent)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2 text-[var(--color-text-primary)]">
              Verify Your Email Address
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              We&apos;ve sent a verification email to your inbox. Please check
              your email and click on the verification link to activate your
              account.
            </p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              If you don&apos;t see the email, please check your spam folder.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Link
          href="/auth/signin"
          className="w-full inline-flex items-center justify-center px-6 py-3.5 text-base font-medium rounded-lg bg-gradient-to-r from-[var(--color-accent)] to-[#8b5cf6] text-white border-none cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(99,102,241,0.4)] no-underline"
        >
          Go to Sign In
        </Link>
        <Link
          href="/"
          className="w-full inline-flex items-center justify-center px-6 py-3.5 text-base font-medium rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)] cursor-pointer transition-all hover:bg-[var(--color-bg-card)] hover:border-[var(--color-accent)] no-underline"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
