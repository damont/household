import { useState } from 'react';
import { api } from '../../api/client';

interface ConnectionFormProps {
  onCreated: () => void;
  onCancel: () => void;
}

export function ConnectionForm({ onCreated, onCancel }: ConnectionFormProps) {
  const [serviceType, setServiceType] = useState('track');
  const [displayName, setDisplayName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [frontendUrl, setFrontendUrl] = useState('');
  const [authType, setAuthType] = useState('jwt_password');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const credentials: Record<string, string> =
        authType === 'api_key'
          ? { api_key: apiKey }
          : { username, password };

      await api.post('/api/connections', {
        service_type: serviceType,
        display_name: displayName,
        base_url: baseUrl,
        frontend_url: frontendUrl || undefined,
        auth_type: authType,
        credentials,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create connection');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
      <h3 className="text-base font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Add Connection</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-sm p-3 rounded" style={{ backgroundColor: 'rgba(248, 113, 113, 0.1)', color: 'var(--error)' }}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Service Type</label>
            <select
              value={serviceType}
              onChange={e => setServiceType(e.target.value)}
              className="w-full px-3 py-2 rounded text-sm outline-none"
              style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            >
              <option value="track">Task Tracker</option>
              <option value="calendar">Calendar</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              required
              placeholder="e.g. My Task Tracker"
              className="w-full px-3 py-2 rounded text-sm outline-none"
              style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>API Base URL</label>
            <input
              type="url"
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              required
              placeholder="http://localhost:8010"
              className="w-full px-3 py-2 rounded text-sm outline-none"
              style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Frontend URL (optional)</label>
            <input
              type="url"
              value={frontendUrl}
              onChange={e => setFrontendUrl(e.target.value)}
              placeholder="http://localhost:8090"
              className="w-full px-3 py-2 rounded text-sm outline-none"
              style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Auth Type</label>
          <select
            value={authType}
            onChange={e => setAuthType(e.target.value)}
            className="w-full px-3 py-2 rounded text-sm outline-none"
            style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
          >
            <option value="jwt_password">JWT (Username/Password)</option>
            <option value="jwt_json">JWT (JSON Login)</option>
            <option value="api_key">API Key</option>
          </select>
        </div>

        {authType !== 'api_key' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="w-full px-3 py-2 rounded text-sm outline-none"
                style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 rounded text-sm outline-none"
                style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              required
              className="w-full px-3 py-2 rounded text-sm outline-none"
              style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded text-sm cursor-pointer border-none"
            style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 rounded text-sm font-medium cursor-pointer border-none"
            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
          >
            {isSubmitting ? 'Adding...' : 'Add Connection'}
          </button>
        </div>
      </form>
    </div>
  );
}
