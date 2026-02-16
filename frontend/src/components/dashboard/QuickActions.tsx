import { Connection } from '../../types';

export function QuickActions({ connections }: { connections: Connection[] }) {
  const withUrls = connections.filter(c => c.frontend_url && c.enabled);

  if (withUrls.length === 0) return null;

  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
      <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>Quick Links</h3>
      <div className="flex flex-wrap gap-2">
        {withUrls.map(conn => (
          <a
            key={conn.id}
            href={conn.frontend_url!}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded text-sm no-underline"
            style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--accent)', border: '1px solid var(--border-color)' }}
          >
            {conn.display_name}
          </a>
        ))}
      </div>
    </div>
  );
}
