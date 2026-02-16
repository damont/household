import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import { DashboardData, Connection, WidgetData } from '../../types';
import { TasksWidget } from './TasksWidget';
import { CalendarWidget } from './CalendarWidget';
import { QuickActions } from './QuickActions';

function GenericWidget({ widget }: { widget: WidgetData }) {
  if (widget.error) {
    return (
      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>{widget.label}</h3>
        <p className="text-sm" style={{ color: 'var(--error)' }}>{widget.error}</p>
      </div>
    );
  }

  const data = widget.data;
  const items = Array.isArray(data) ? data : null;

  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{widget.label}</h3>
        {widget.frontend_url && (
          <a href={widget.frontend_url} target="_blank" rel="noopener noreferrer" className="text-xs" style={{ color: 'var(--accent)' }}>
            Open
          </a>
        )}
      </div>
      {items ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{items.length} items</p>
      ) : data ? (
        <pre className="text-xs overflow-auto max-h-40" style={{ color: 'var(--text-secondary)' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No data</p>
      )}
    </div>
  );
}

export function DashboardView() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [dash, conns] = await Promise.all([
        api.get<DashboardData>('/api/dashboard'),
        api.get<Connection[]>('/api/connections'),
      ]);
      setDashboard(dash);
      setConnections(conns);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await api.post('/api/dashboard/refresh');
      await fetchData();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return <div style={{ color: 'var(--text-muted)' }}>Loading dashboard...</div>;
  }

  const hasConnections = connections.length > 0;
  const widgets = dashboard?.widgets || [];

  if (!hasConnections) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Welcome to Household</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Connect your services to see your dashboard.
        </p>
        <button
          onClick={() => {
            window.history.pushState({}, '', '/settings');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          className="px-4 py-2 rounded text-sm font-medium cursor-pointer border-none"
          style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
        >
          Add a Connection
        </button>
      </div>
    );
  }

  const renderWidget = (widget: WidgetData, index: number) => {
    if (widget.service_type === 'track') {
      return <TasksWidget key={index} widget={widget} />;
    }
    if (widget.service_type === 'calendar') {
      return <CalendarWidget key={index} widget={widget} />;
    }
    return <GenericWidget key={index} widget={widget} />;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h2>
        <div className="flex items-center gap-3">
          {dashboard?.last_refreshed_at && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Updated {new Date(dashboard.last_refreshed_at).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 rounded text-sm cursor-pointer border-none"
            style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-secondary)' }}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {dashboard?.refresh_errors && dashboard.refresh_errors.length > 0 && (
        <div className="mb-4 p-3 rounded text-sm" style={{ backgroundColor: 'rgba(248, 113, 113, 0.1)', color: 'var(--error)' }}>
          {dashboard.refresh_errors.map((err, i) => (
            <p key={i}>{err}</p>
          ))}
        </div>
      )}

      <QuickActions connections={connections} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {widgets.map((widget, i) => renderWidget(widget, i))}
      </div>

      {widgets.length === 0 && hasConnections && (
        <div className="text-center py-10">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No data yet. Try refreshing to fetch data from your connected services.
          </p>
        </div>
      )}
    </div>
  );
}
