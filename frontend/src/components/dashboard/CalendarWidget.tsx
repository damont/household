import { WidgetData } from '../../types';

interface EventItem {
  id?: string;
  title?: string;
  name?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  time?: string;
  all_day?: boolean;
}

export function CalendarWidget({ widget }: { widget: WidgetData }) {
  if (widget.error) {
    return (
      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>{widget.label}</h3>
        <p className="text-sm" style={{ color: 'var(--error)' }}>{widget.error}</p>
      </div>
    );
  }

  const events = (Array.isArray(widget.data) ? widget.data : []) as EventItem[];

  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{widget.label}</h3>
        {widget.frontend_url && (
          <a
            href={widget.frontend_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs"
            style={{ color: 'var(--accent)' }}
          >
            Open
          </a>
        )}
      </div>
      {events.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No events</p>
      ) : (
        <ul className="space-y-2">
          {events.slice(0, 10).map((event, i) => (
            <li key={event.id || i} className="text-sm">
              <div className="flex items-center gap-2">
                <span className="flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
                  {event.title || event.name || 'Untitled'}
                </span>
                {(event.start_time || event.time) && (
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {event.start_time || event.time}
                    {event.end_time ? ` - ${event.end_time}` : ''}
                  </span>
                )}
                {event.all_day && (
                  <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>All day</span>
                )}
              </div>
              {event.date && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{event.date}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
