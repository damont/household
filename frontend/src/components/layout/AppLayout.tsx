import { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';

interface AppLayoutProps {
  children: ReactNode;
  activeTab: string;
  onNavigate: (path: string) => void;
}

export function AppLayout({ children, activeTab, onNavigate }: AppLayoutProps) {
  const { user, logout } = useAuth();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { id: 'agent', label: 'Agent', path: '/agent' },
    { id: 'settings', label: 'Settings', path: '/settings' },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-main)' }}>
      <header
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ backgroundColor: 'var(--header-bg)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Household</span>
          <nav className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.path)}
                className="px-3 py-1.5 rounded text-sm cursor-pointer border-none"
                style={{
                  backgroundColor: activeTab === tab.id ? 'var(--selected-bg)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {user?.display_name || user?.username}
          </span>
          <button
            onClick={logout}
            className="px-3 py-1 rounded text-sm cursor-pointer border-none"
            style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-secondary)' }}
          >
            Logout
          </button>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
