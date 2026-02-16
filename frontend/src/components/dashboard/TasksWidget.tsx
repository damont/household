import { WidgetData } from '../../types';

interface TaskItem {
  id?: string;
  name?: string;
  title?: string;
  status?: string;
  project_name?: string;
  project?: { name?: string };
}

export function TasksWidget({ widget }: { widget: WidgetData }) {
  if (widget.error) {
    return (
      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
        <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>{widget.label}</h3>
        <p className="text-sm" style={{ color: 'var(--error)' }}>{widget.error}</p>
      </div>
    );
  }

  const tasks = (Array.isArray(widget.data) ? widget.data : []) as TaskItem[];

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
      {tasks.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No tasks</p>
      ) : (
        <ul className="space-y-2">
          {tasks.slice(0, 10).map((task, i) => (
            <li key={task.id || i} className="flex items-center gap-2 text-sm">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: task.status === 'completed' ? 'var(--success)'
                    : task.status === 'in_progress' ? 'var(--accent)'
                    : 'var(--text-muted)',
                }}
              />
              <span className="flex-1 truncate" style={{ color: 'var(--text-primary)' }}>
                {task.name || task.title || 'Untitled'}
              </span>
              {(task.project_name || task.project?.name) && (
                <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                  {task.project_name || task.project?.name}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {tasks.length > 10 && (
        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          +{tasks.length - 10} more
        </p>
      )}
    </div>
  );
}
