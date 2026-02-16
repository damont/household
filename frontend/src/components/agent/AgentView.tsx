import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../api/client';
import { ChatMessage, ChatSession } from '../../types';
import { ChatMessageBubble } from './ChatMessage';

export function AgentView() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchSessions = useCallback(async () => {
    const data = await api.get<ChatSession[]>('/api/agent/sessions');
    setSessions(data);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const loadSession = async (sessionId: string) => {
    const detail = await api.get<{ id: string; messages: ChatMessage[] }>(`/api/agent/sessions/${sessionId}`);
    setActiveSessionId(detail.id);
    setMessages(detail.messages);
    setShowSessions(false);
  };

  const startNewChat = () => {
    setActiveSessionId(null);
    setMessages([]);
    setShowSessions(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post<{ session_id: string; message: ChatMessage }>('/api/agent/chat', {
        message: userMessage.content,
        session_id: activeSessionId,
      });
      setActiveSessionId(response.session_id);
      setMessages(prev => [...prev, response.message]);
      fetchSessions();
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${err instanceof Error ? err.message : 'Failed to send message'}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const deleteSession = async (sessionId: string) => {
    await api.delete(`/api/agent/sessions/${sessionId}`);
    if (activeSessionId === sessionId) {
      startNewChat();
    }
    fetchSessions();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-73px)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>AI Agent</h2>
        <div className="flex gap-2">
          <button
            onClick={startNewChat}
            className="px-3 py-1.5 rounded text-sm cursor-pointer border-none"
            style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-secondary)' }}
          >
            New Chat
          </button>
          <button
            onClick={() => setShowSessions(!showSessions)}
            className="px-3 py-1.5 rounded text-sm cursor-pointer border-none"
            style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-secondary)' }}
          >
            History
          </button>
        </div>
      </div>

      {showSessions && (
        <div className="mb-4 rounded-lg p-3" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
          <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Chat History</h3>
          {sessions.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No previous chats</p>
          ) : (
            <ul className="space-y-1">
              {sessions.map(session => (
                <li key={session.id} className="flex items-center justify-between">
                  <button
                    onClick={() => loadSession(session.id)}
                    className="text-sm text-left truncate flex-1 py-1 cursor-pointer bg-transparent border-none"
                    style={{ color: session.id === activeSessionId ? 'var(--accent)' : 'var(--text-primary)' }}
                  >
                    {session.title}
                    <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      ({session.message_count} msgs)
                    </span>
                  </button>
                  <button
                    onClick={() => deleteSession(session.id)}
                    className="text-xs px-2 py-1 cursor-pointer bg-transparent border-none"
                    style={{ color: 'var(--error)' }}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto mb-4 rounded-lg p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}>
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Ask me anything about your household services. I can check your tasks, calendar, and more.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <ChatMessageBubble key={i} message={msg} />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-3">
                <div className="px-4 py-2.5 rounded-lg text-sm" style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-muted)' }}>
                  Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your tasks, calendar, or anything else..."
          rows={1}
          className="flex-1 px-4 py-2.5 rounded-lg text-sm outline-none resize-none"
          style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="px-4 py-2.5 rounded-lg text-sm font-medium cursor-pointer border-none"
          style={{
            backgroundColor: input.trim() ? 'var(--accent)' : 'var(--bg-raised)',
            color: input.trim() ? '#fff' : 'var(--text-muted)',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
