import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { Connection } from '../../types';
import { ConnectionForm } from './ConnectionForm';

export function SettingsView() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    try {
      const data = await api.get<Connection[]>('/api/connections');
      setConnections(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleTest = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const result = await api.post<{ success: boolean; message: string }>(`/api/connections/${id}/test`);
      setTestResult({ id, ...result });
    } catch (err) {
      setTestResult({ id, success: false, message: err instanceof Error ? err.message : 'Test failed' });
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.delete(`/api/connections/${id}`);
      await fetchConnections();
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (conn: Connection) => {
    await api.put(`/api/connections/${conn.id}`, { enabled: !conn.enabled });
    await fetchConnections();
  };

  if (isLoading) {
    return <div style={{ color: 'var(--text-muted)' }}>Loading settings...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded text-sm font-medium cursor-pointer border-none"
            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
          >
            Add Connection
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-6">
          <ConnectionForm
            onCreated={() => {
              setShowForm(false);
              fetchConnections();
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="space-y-3">
        {connections.length === 0 && !showForm && (
          <div className="text-center py-10">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No connections yet. Add a service connection to get started.
            </p>
          </div>
        )}

        {connections.map(conn => (
          <div
            key={conn.id}
            className="rounded-lg p-4"
            style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', opacity: conn.enabled ? 1 : 0.6 }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{conn.display_name}</h3>
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-muted)' }}
                  >
                    {conn.service_type}
                  </span>
                  {!conn.enabled && (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Disabled</span>
                  )}
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{conn.base_url}</p>
                {conn.last_sync_at && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Last sync: {new Date(conn.last_sync_at).toLocaleString()}
                    {conn.last_sync_status && (
                      <span
                        className="ml-2"
                        style={{ color: conn.last_sync_status === 'success' ? 'var(--success)' : 'var(--error)' }}
                      >
                        {conn.last_sync_status}
                      </span>
                    )}
                  </p>
                )}
                {conn.last_sync_error && (
                  <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{conn.last_sync_error}</p>
                )}
                {testResult?.id === conn.id && (
                  <p
                    className="text-xs mt-1"
                    style={{ color: testResult.success ? 'var(--success)' : 'var(--error)' }}
                  >
                    {testResult.message}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggle(conn)}
                  className="px-3 py-1 rounded text-xs cursor-pointer border-none"
                  style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-secondary)' }}
                >
                  {conn.enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => handleTest(conn.id)}
                  disabled={testingId === conn.id}
                  className="px-3 py-1 rounded text-xs cursor-pointer border-none"
                  style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-secondary)' }}
                >
                  {testingId === conn.id ? 'Testing...' : 'Test'}
                </button>
                <button
                  onClick={() => {
                    if (confirm('Delete this connection?')) {
                      handleDelete(conn.id);
                    }
                  }}
                  disabled={deletingId === conn.id}
                  className="px-3 py-1 rounded text-xs cursor-pointer border-none"
                  style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--error)' }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
