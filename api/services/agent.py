import json
import logging
from datetime import datetime, timezone

import anthropic

from api.config import get_settings
from api.schemas.orm.connection import ServiceConnection
from api.schemas.orm.chat import ChatSession, ChatMessage
from api.connectors.rest import RESTConnector
from api.utils.crypto import decrypt_value

logger = logging.getLogger(__name__)


def _build_tools(connections: list[ServiceConnection]) -> list[dict]:
    tools = []
    for conn in connections:
        for endpoint in conn.endpoints:
            tool_name = f"{conn.service_type}_{endpoint.name}"
            # Sanitize tool name to only allow alphanumeric and underscores
            tool_name = "".join(c if c.isalnum() or c == "_" else "_" for c in tool_name)
            tools.append({
                "name": tool_name,
                "description": f"Fetch {endpoint.dashboard_label or endpoint.name} from {conn.display_name} ({conn.service_type} service). Endpoint: {endpoint.method} {endpoint.path}",
                "input_schema": {
                    "type": "object",
                    "properties": {},
                    "required": [],
                },
                "_connection_id": str(conn.id),
                "_endpoint_name": endpoint.name,
            })
    return tools


async def _execute_tool(
    tool_name: str,
    tools: list[dict],
    connections: list[ServiceConnection],
) -> str:
    # Find the tool definition
    tool_def = None
    for t in tools:
        if t["name"] == tool_name:
            tool_def = t
            break

    if not tool_def:
        return json.dumps({"error": f"Unknown tool: {tool_name}"})

    conn_id = tool_def["_connection_id"]
    endpoint_name = tool_def["_endpoint_name"]

    # Find the connection
    conn = None
    for c in connections:
        if str(c.id) == conn_id:
            conn = c
            break

    if not conn:
        return json.dumps({"error": "Connection not found"})

    # Find the endpoint
    endpoint = None
    for e in conn.endpoints:
        if e.name == endpoint_name:
            endpoint = e
            break

    if not endpoint:
        return json.dumps({"error": "Endpoint not found"})

    connector = RESTConnector()
    try:
        creds = json.loads(decrypt_value(conn.encrypted_credentials))
        token = await connector.authenticate(conn.base_url, conn.auth_type, creds)
        result = await connector.fetch_endpoint(conn.base_url, token, endpoint)
        return json.dumps(result.get("data", {}), default=str)
    except Exception as e:
        return json.dumps({"error": str(e)})


async def chat_with_agent(user_id: str, message: str, session_id: str | None = None) -> tuple[str, str]:
    settings = get_settings()

    if not settings.anthropic_api_key:
        return "AI agent is not configured. Please set ANTHROPIC_API_KEY in your environment.", session_id or ""

    # Load or create session
    if session_id:
        from beanie import PydanticObjectId
        session = await ChatSession.get(PydanticObjectId(session_id))
        if not session or session.user_id != user_id:
            session = None

    if not session_id or not session:
        session = ChatSession(user_id=user_id, title=message[:50])
        await session.insert()

    # Add user message
    user_msg = ChatMessage(role="user", content=message)
    session.messages.append(user_msg)

    # Load connections and build tools
    connections = await ServiceConnection.find(
        ServiceConnection.user_id == user_id,
        ServiceConnection.enabled == True,
    ).to_list()

    tools = _build_tools(connections)

    # Build messages for API
    api_messages = [
        {"role": m.role, "content": m.content}
        for m in session.messages
    ]

    # Clean tool definitions (remove internal fields)
    api_tools = [
        {
            "name": t["name"],
            "description": t["description"],
            "input_schema": t["input_schema"],
        }
        for t in tools
    ] if tools else []

    system_prompt = (
        "You are a helpful household management assistant. You have access to the user's "
        "connected services and can fetch data from them using tools. Be concise and helpful. "
        "When presenting data, format it clearly. If no services are connected, let the user "
        "know they can add connections in Settings."
    )

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    try:
        # Tool-use loop
        tool_calls_log = []

        while True:
            kwargs = {
                "model": "claude-sonnet-4-5-20250929",
                "max_tokens": 2048,
                "system": system_prompt,
                "messages": api_messages,
            }
            if api_tools:
                kwargs["tools"] = api_tools

            response = client.messages.create(**kwargs)

            if response.stop_reason == "tool_use":
                # Process tool calls
                assistant_content = response.content
                api_messages.append({"role": "assistant", "content": assistant_content})

                tool_results = []
                for block in assistant_content:
                    if block.type == "tool_use":
                        tool_calls_log.append({
                            "tool": block.name,
                            "input": block.input,
                        })
                        result = await _execute_tool(block.name, tools, connections)
                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": result,
                        })

                api_messages.append({"role": "user", "content": tool_results})
            else:
                # Extract text response
                text_parts = [b.text for b in response.content if hasattr(b, "text")]
                assistant_text = "\n".join(text_parts) if text_parts else "I couldn't generate a response."

                assistant_msg = ChatMessage(
                    role="assistant",
                    content=assistant_text,
                    tool_calls=tool_calls_log if tool_calls_log else None,
                )
                session.messages.append(assistant_msg)
                session.updated_at = datetime.now(timezone.utc)
                await session.save()

                return assistant_text, str(session.id)

    except Exception as e:
        logger.error(f"Agent error: {e}")
        error_msg = f"Sorry, I encountered an error: {str(e)}"
        assistant_msg = ChatMessage(role="assistant", content=error_msg)
        session.messages.append(assistant_msg)
        session.updated_at = datetime.now(timezone.utc)
        await session.save()
        return error_msg, str(session.id)
