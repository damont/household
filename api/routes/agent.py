from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Depends
from beanie import PydanticObjectId

from api.schemas.orm.user import User
from api.schemas.orm.chat import ChatSession
from api.schemas.dto.agent import (
    ChatRequest,
    ChatResponse,
    ChatMessageDTO,
    ChatSessionSummary,
    ChatSessionDetail,
)
from api.services.agent import chat_with_agent
from api.utils.auth import get_current_user

router = APIRouter(prefix="/api/agent", tags=["agent"])


@router.post("/chat", response_model=ChatResponse)
async def chat(data: ChatRequest, current_user: User = Depends(get_current_user)):
    response_text, session_id = await chat_with_agent(
        user_id=str(current_user.id),
        message=data.message,
        session_id=data.session_id,
    )
    return ChatResponse(
        session_id=session_id,
        message=ChatMessageDTO(
            role="assistant",
            content=response_text,
            timestamp=datetime.now(timezone.utc).isoformat(),
        ),
    )


@router.get("/sessions", response_model=list[ChatSessionSummary])
async def list_sessions(current_user: User = Depends(get_current_user)):
    sessions = await ChatSession.find(
        ChatSession.user_id == str(current_user.id)
    ).sort(-ChatSession.updated_at).to_list()

    return [
        ChatSessionSummary(
            id=str(s.id),
            title=s.title,
            created_at=s.created_at.isoformat(),
            updated_at=s.updated_at.isoformat(),
            message_count=len(s.messages),
        )
        for s in sessions
    ]


@router.get("/sessions/{session_id}", response_model=ChatSessionDetail)
async def get_session(session_id: str, current_user: User = Depends(get_current_user)):
    session = await ChatSession.get(PydanticObjectId(session_id))
    if not session or session.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Session not found")

    return ChatSessionDetail(
        id=str(session.id),
        title=session.title,
        messages=[
            ChatMessageDTO(
                role=m.role,
                content=m.content,
                timestamp=m.timestamp.isoformat(),
                tool_calls=m.tool_calls,
            )
            for m in session.messages
        ],
        created_at=session.created_at.isoformat(),
        updated_at=session.updated_at.isoformat(),
    )


@router.delete("/sessions/{session_id}", status_code=204)
async def delete_session(session_id: str, current_user: User = Depends(get_current_user)):
    session = await ChatSession.get(PydanticObjectId(session_id))
    if not session or session.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Session not found")
    await session.delete()
