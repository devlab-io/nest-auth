'use client';

import { useAuth } from './providers/AuthProvider';
import Link from 'next/link';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="hero">
        <h1 className="hero-title">Welcome to Demo Auth</h1>
        <p className="hero-subtitle">
          Test your authentication flows and explore the API
        </p>

        <div className="hero-actions">
          {isAuthenticated ? (
            <Link href="/dashboard" className="btn btn-primary">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/auth/signin" className="btn btn-primary">
                Sign In
              </Link>
              <Link href="/auth/signup" className="btn btn-secondary">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="features">
        <h2>Features</h2>
        <div className="card-grid">
          <div className="card">
            <div className="card-title">🔐 Authentication</div>
            <div className="card-content">
              Sign in, sign up, password reset, email validation
            </div>
          </div>
          <div className="card">
            <div className="card-title">👤 Users</div>
            <div className="card-content">
              User management with roles and permissions
            </div>
          </div>
          <div className="card">
            <div className="card-title">🏢 Organisations</div>
            <div className="card-content">
              Multi-tenant organisation management
            </div>
          </div>
          <div className="card">
            <div className="card-title">🏬 Establishments</div>
            <div className="card-content">
              Establishment management within organisations
            </div>
          </div>
        </div>
      </div>

      <div className="admin-info">
        <h3>Default Admin Account</h3>
        <p>
          Email: <code>admin@demo.com</code>
        </p>
        <p>
          Password: <code>Admin123!</code>
        </p>
      </div>

      <div className="services-info">
        <h3>Services</h3>
        <div className="services-grid">
          <a
            href="http://localhost:4001/api"
            target="_blank"
            rel="noopener noreferrer"
            className="service-link"
          >
            <span>📚</span> Swagger API
          </a>
          <a
            href="http://localhost:8080"
            target="_blank"
            rel="noopener noreferrer"
            className="service-link"
          >
            <span>🗄️</span> Adminer (DB)
          </a>
          <a
            href="http://localhost:9000"
            target="_blank"
            rel="noopener noreferrer"
            className="service-link"
          >
            <span>📧</span> Inbucket (Mail)
          </a>
        </div>
      </div>

      <style jsx>{`
        .home-page {
          max-width: 900px;
          margin: 0 auto;
        }

        .hero {
          text-align: center;
          padding: 4rem 0;
        }

        .hero-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          background: linear-gradient(
            135deg,
            var(--text-primary),
            var(--accent)
          );
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: var(--text-secondary);
          margin-bottom: 2rem;
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .hero-actions .btn {
          min-width: 140px;
        }

        .features {
          margin-top: 4rem;
        }

        .features h2 {
          margin-bottom: 1.5rem;
        }

        .admin-info,
        .services-info {
          margin-top: 3rem;
          padding: 1.5rem;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
        }

        .admin-info h3,
        .services-info h3 {
          margin-bottom: 1rem;
          color: var(--accent);
        }

        .admin-info p {
          margin-bottom: 0.5rem;
          color: var(--text-secondary);
        }

        .admin-info code {
          background: var(--bg-secondary);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-family: monospace;
          color: var(--text-primary);
        }

        .services-grid {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .service-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 8px;
          color: var(--text-primary);
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .service-link:hover {
          border-color: var(--accent);
          background: rgba(99, 102, 241, 0.1);
        }
      `}</style>
    </div>
  );
}
