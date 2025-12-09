'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';
import { AuthClient } from '@devlab-io/nest-auth-client';

export default function DashboardPage() {
  const router = useRouter();
  const { userAccount, isAuthenticated, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    users: 0,
    organisations: 0,
    establishments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated]);

  const loadStats = async () => {
    try {
      const [usersRes, orgsRes, estsRes] = await Promise.allSettled([
        AuthClient.users.search({}, 1, 1),
        AuthClient.organisations.search({}, 1, 1),
        AuthClient.establishments.search({}, 1, 1),
      ]);

      setStats({
        users: usersRes.status === 'fulfilled' ? usersRes.value.total : 0,
        organisations: orgsRes.status === 'fulfilled' ? orgsRes.value.total : 0,
        establishments:
          estsRes.status === 'fulfilled' ? estsRes.value.total : 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">
          Welcome back, {userAccount?.user.username}!
        </p>
      </div>

      <div className="card-grid">
        <div className="stat-card">
          <div className="stat-icon">👤</div>
          <div className="stat-content">
            <div className="stat-value">{isLoading ? '...' : stats.users}</div>
            <div className="stat-label">Users</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <div className="stat-value">
              {isLoading ? '...' : stats.organisations}
            </div>
            <div className="stat-label">Organisations</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏬</div>
          <div className="stat-content">
            <div className="stat-value">
              {isLoading ? '...' : stats.establishments}
            </div>
            <div className="stat-label">Establishments</div>
          </div>
        </div>
      </div>

      <div className="section">
        <h2>Your Account</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Email</span>
            <span className="info-value">{userAccount?.user.email}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Username</span>
            <span className="info-value">{userAccount?.user.username}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Organisation</span>
            <span className="info-value">
              {userAccount?.organisation?.name || 'None'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Establishment</span>
            <span className="info-value">
              {userAccount?.establishment?.name || 'None'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Roles</span>
            <span className="info-value">
              {userAccount?.roles.map((r) => r.name).join(', ') || 'None'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Email Verified</span>
            <span
              className={`badge ${userAccount?.user.emailValidated ? 'badge-success' : 'badge-error'}`}
            >
              {userAccount?.user.emailValidated ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .stat-card {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-icon {
          font-size: 2.5rem;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 12px;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .section {
          margin-top: 3rem;
        }

        .section h2 {
          margin-bottom: 1.5rem;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
        }

        .info-item {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .info-label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-secondary);
        }

        .info-value {
          font-size: 1rem;
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}
