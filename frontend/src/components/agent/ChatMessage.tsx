import { ChatMessage as ChatMessageType } from '../../types';

export function ChatMessageBubble({ message }: { message: ChatMessageType }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className="max-w-[80%] px-4 py-2.5 rounded-lg text-sm whitespace-pre-wrap"
        style={{
          backgroundColor: isUser ? 'var(--accent)' : 'var(--bg-raised)',
          color: isUser ? '#fff' : 'var(--text-primary)',
        }}
      >
        {message.content}
      </div>
    </div>
  );
}
