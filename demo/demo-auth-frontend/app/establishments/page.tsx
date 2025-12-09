'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers/AuthProvider';
import { AuthClient } from '@devlab-io/nest-auth-client';
import { Establishment, Organisation } from '@devlab-io/nest-auth-types';

export default function EstablishmentsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newEstName, setNewEstName] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      const [estsRes, orgsRes] = await Promise.all([
        AuthClient.establishments.search({}, 1, 50),
        AuthClient.organisations.search({}, 1, 50),
      ]);
      setEstablishments(estsRes.contents);
      setOrganisations(orgsRes.contents);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEstName.trim() || !selectedOrgId) return;

    setIsCreating(true);
    setError('');

    try {
      await AuthClient.establishments.create({
        name: newEstName,
        organisationId: selectedOrgId,
      });
      setNewEstName('');
      setSelectedOrgId('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create establishment');
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
        <h1 className="page-title">Establishments</h1>
        <p className="page-description">
          Manage establishments within organisations
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="create-form">
        <form onSubmit={handleCreate}>
          <select
            className="form-input"
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            required
          >
            <option value="">Select organisation...</option>
            {organisations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            className="form-input"
            placeholder="New establishment name..."
            value={newEstName}
            onChange={(e) => setNewEstName(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Establishment'}
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : establishments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏬</div>
          <p>No establishments found</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Organisation</th>
              <th>Enabled</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {establishments.map((est) => (
              <tr key={est.id}>
                <td>{est.name}</td>
                <td>{est.organisation?.name || 'N/A'}</td>
                <td>
                  <span
                    className={`badge ${est.enabled ? 'badge-success' : 'badge-error'}`}
                  >
                    {est.enabled ? 'Yes' : 'No'}
                  </span>
                </td>
                <td>{new Date(est.createdAt).toLocaleDateString()}</td>
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
          max-width: 700px;
        }

        .create-form .form-input {
          flex: 1;
        }

        .create-form select.form-input {
          min-width: 200px;
        }

        .create-form .btn {
          width: auto;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
