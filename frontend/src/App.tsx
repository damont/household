import { AuthProvider, useAuth } from './context/AuthContext';
import { useRouter } from './hooks/useRouter';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardView } from './components/dashboard/DashboardView';
import { AgentView } from './components/agent/AgentView';
import { SettingsView } from './components/settings/SettingsView';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const { path, navigate } = useRouter();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-main)' }}>
        <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (path === '/register') {
      return <Register onSwitchToLogin={() => navigate('/login')} onSuccess={() => navigate('/dashboard')} />;
    }
    return <Login onSwitchToRegister={() => navigate('/register')} onSuccess={() => navigate('/dashboard')} />;
  }

  // Redirect root to dashboard
  if (path === '/' || path === '/login' || path === '/register') {
    navigate('/dashboard');
  }

  const activeTab = path.startsWith('/agent') ? 'agent'
    : path.startsWith('/settings') ? 'settings'
    : 'dashboard';

  return (
    <AppLayout activeTab={activeTab} onNavigate={navigate}>
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'agent' && <AgentView />}
      {activeTab === 'settings' && <SettingsView />}
    </AppLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
