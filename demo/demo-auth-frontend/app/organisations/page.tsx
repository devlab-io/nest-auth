'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';
import { AuthClient } from '@devlab-io/nest-auth-client';
import { Organisation } from '@devlab-io/nest-auth-types';

export default function OrganisationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadOrganisations();
    }
  }, [isAuthenticated]);

  const loadOrganisations = async () => {
    try {
      const response = await AuthClient.organisations.search({}, 1, 50);
      setOrganisations(response.contents);
    } catch (err: any) {
      setError(err.message || 'Failed to load organisations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    setIsCreating(true);
    setError('');

    try {
      await AuthClient.organisations.create({ name: newOrgName });
      setNewOrgName('');
      loadOrganisations();
    } catch (err: any) {
      setError(err.message || 'Failed to create organisation');
    } finally {
      setIsCreating(false);
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
        <h1 className="page-title">Organisations</h1>
        <p className="page-description">Manage organisations in your system</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="create-form">
        <form onSubmit={handleCreate}>
          <input
            type="text"
            className="form-input"
            placeholder="New organisation name..."
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Organisation'}
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : organisations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏢</div>
          <p>No organisations found</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Establishments</th>
              <th>Enabled</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {organisations.map((org) => (
              <tr key={org.id}>
                <td>{org.name}</td>
                <td>{org.establishments?.length || 0}</td>
                <td>
                  <span
                    className={`badge ${org.enabled ? 'badge-success' : 'badge-error'}`}
                  >
                    {org.enabled ? 'Yes' : 'No'}
                  </span>
                </td>
                <td>{new Date(org.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <style jsx>{`
        .create-form {
          margin-bottom: 2rem;
        }

        .create-form form {
          display: flex;
          gap: 1rem;
          max-width: 500px;
        }

        .create-form .form-input {
          flex: 1;
        }

        .create-form .btn {
          width: auto;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
