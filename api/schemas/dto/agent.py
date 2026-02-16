from typing import Optional
from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatMessageDTO(BaseModel):
    role: str
    content: str
    timestamp: str
    tool_calls: Optional[list[dict]] = None


class ChatResponse(BaseModel):
    session_id: str
    message: ChatMessageDTO


class ChatSessionSummary(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int


class ChatSessionDetail(BaseModel):
    id: str
    title: str
    messages: list[ChatMessageDTO]
    created_at: str
    updated_at: str
