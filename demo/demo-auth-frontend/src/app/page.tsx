'use client';

import { useAuth } from '../providers/AuthProvider';
import Link from 'next/link';
import {
  Lock,
  Users,
  Building2,
  Store,
  BookOpen,
  Database,
  Mail,
  Shield,
  ShieldUser,
  UserCog,
} from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-screen h-screen">
        <div className="w-10 h-10 border-[3px] border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center py-16">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-br from-[var(--color-text-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">
          Welcome to Demo Auth
        </h1>
        <p className="text-xl text-[var(--color-text-secondary)] mb-8">
          Test your authentication flows and explore the API
        </p>

        <div className="flex gap-4 justify-center">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center px-6 py-3.5 text-base font-medium rounded-lg bg-gradient-to-r from-[var(--color-accent)] to-[#8b5cf6] text-white no-underline transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(99,102,241,0.4)] min-w-[140px]"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="inline-flex items-center justify-center px-6 py-3.5 text-base font-medium rounded-lg bg-gradient-to-r from-[var(--color-accent)] to-[#8b5cf6] text-white no-underline transition-all hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(99,102,241,0.4)] min-w-[140px]"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center px-6 py-3.5 text-base font-medium rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)] no-underline transition-all hover:bg-[var(--color-bg-card)] hover:border-[var(--color-accent)] min-w-[140px]"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-3xl font-semibold mb-6">Features</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6 transition-all hover:border-[var(--color-accent)] hover:-translate-y-0.5">
            <div className="flex items-center gap-2 text-lg font-semibold mb-2">
              <Shield size={20} />
              Claims
            </div>
            <div className="text-[var(--color-text-secondary)] text-sm">
              Manage permissions and access control claims
            </div>
          </div>
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6 transition-all hover:border-[var(--color-accent)] hover:-translate-y-0.5">
            <div className="flex items-center gap-2 text-lg font-semibold mb-2">
              <ShieldUser size={20} />
              Roles
            </div>
            <div className="text-[var(--color-text-secondary)] text-sm">
              Define and manage user roles with custom permissions
            </div>
          </div>
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6 transition-all hover:border-[var(--color-accent)] hover:-translate-y-0.5">
            <div className="flex items-center gap-2 text-lg font-semibold mb-2">
              <Lock size={20} />
              Authentication
            </div>
            <div className="text-[var(--color-text-secondary)] text-sm">
              Sign in, sign up, password reset, email validation
            </div>
          </div>
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6 transition-all hover:border-[var(--color-accent)] hover:-translate-y-0.5">
            <div className="flex items-center gap-2 text-lg font-semibold mb-2">
              <Users size={20} />
              Users
            </div>
            <div className="text-[var(--color-text-secondary)] text-sm">
              User management with roles and permissions
            </div>
          </div>
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6 transition-all hover:border-[var(--color-accent)] hover:-translate-y-0.5">
            <div className="flex items-center gap-2 text-lg font-semibold mb-2">
              <UserCog size={20} />
              User Accounts
            </div>
            <div className="text-[var(--color-text-secondary)] text-sm">
              Manage user accounts with organisations and establishments
            </div>
          </div>
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6 transition-all hover:border-[var(--color-accent)] hover:-translate-y-0.5">
            <div className="flex items-center gap-2 text-lg font-semibold mb-2">
              <Building2 size={20} />
              Organisations
            </div>
            <div className="text-[var(--color-text-secondary)] text-sm">
              Multi-tenant organisation management
            </div>
          </div>
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6 transition-all hover:border-[var(--color-accent)] hover:-translate-y-0.5">
            <div className="flex items-center gap-2 text-lg font-semibold mb-2">
              <Store size={20} />
              Establishments
            </div>
            <div className="text-[var(--color-text-secondary)] text-sm">
              Establishment management within organisations
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-3xl font-semibold mb-6">Services</h2>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
          <a
            href="http://localhost:4001/api"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6 transition-all hover:border-[var(--color-accent)] hover:-translate-y-0.5 flex items-center gap-3 text-[var(--color-text-primary)] no-underline"
          >
            <BookOpen size={24} />
            <div>
              <div className="text-lg font-semibold mb-1">Swagger API</div>
              <div className="text-[var(--color-text-secondary)] text-sm">API Documentation</div>
            </div>
          </a>
          <a
            href="http://localhost:8080"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6 transition-all hover:border-[var(--color-accent)] hover:-translate-y-0.5 flex items-center gap-3 text-[var(--color-text-primary)] no-underline"
          >
            <Database size={24} />
            <div>
              <div className="text-lg font-semibold mb-1">Adminer (DB)</div>
              <div className="text-[var(--color-text-secondary)] text-sm">Database Management</div>
            </div>
          </a>
          <a
            href="http://localhost:9000"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl p-6 transition-all hover:border-[var(--color-accent)] hover:-translate-y-0.5 flex items-center gap-3 text-[var(--color-text-primary)] no-underline"
          >
            <Mail size={24} />
            <div>
              <div className="text-lg font-semibold mb-1">Inbucket (Mail)</div>
              <div className="text-[var(--color-text-secondary)] text-sm">Email Testing</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
