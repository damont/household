export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  is_active: boolean;
}

export interface EndpointConfig {
  name: string;
  path: string;
  method: string;
  dashboard_label: string | null;
}

export interface Connection {
  id: string;
  service_type: string;
  display_name: string;
  base_url: string;
  frontend_url: string | null;
  auth_type: string;
  endpoints: EndpointConfig[];
  enabled: boolean;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_sync_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface WidgetData {
  service_type: string;
  service_name: string;
  frontend_url: string | null;
  endpoint_name: string;
  label: string;
  data: unknown;
  error: string | null;
}

export interface DashboardData {
  widgets: WidgetData[];
  last_refreshed_at: string | null;
  refresh_errors: string[];
}

export interface ChatMessage {
  role: string;
  content: string;
  timestamp: string;
  tool_calls?: Record<string, unknown>[] | null;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ChatSessionDetail {
  id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}
