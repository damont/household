import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export function Login({ onSwitchToRegister, onSuccess }: { onSwitchToRegister: () => void; onSuccess: () => void }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(username, password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg-main)' }}>
      <div className="w-full max-w-sm rounded-lg p-8" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
        <h1 className="text-2xl font-bold mb-6 text-center" style={{ color: 'var(--text-primary)' }}>Household</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm p-3 rounded" style={{ backgroundColor: 'rgba(248, 113, 113, 0.1)', color: 'var(--error)' }}>
              {error}
            </div>
          )}
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
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 rounded text-sm font-medium cursor-pointer"
            style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="mt-4 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <button onClick={onSwitchToRegister} className="cursor-pointer bg-transparent border-none" style={{ color: 'var(--accent)' }}>
            Register
          </button>
        </p>
      </div>
    </div>
  );
}
