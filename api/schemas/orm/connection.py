from datetime import datetime, timezone
from typing import Optional

from beanie import Document, Indexed
from pydantic import BaseModel, Field


class EndpointConfig(BaseModel):
    name: str
    path: str
    method: str = "GET"
    dashboard_label: Optional[str] = None


class ServiceConnection(Document):
    user_id: Indexed(str)
    service_type: str  # "track", "calendar", or any future type
    display_name: str
    base_url: str
    frontend_url: Optional[str] = None
    auth_type: str = "jwt_password"  # "jwt_password", "jwt_json", "api_key"
    encrypted_credentials: str = ""  # Fernet-encrypted JSON string
    endpoints: list[EndpointConfig] = Field(default_factory=list)
    enabled: bool = True
    last_sync_at: Optional[datetime] = None
    last_sync_status: Optional[str] = None
    last_sync_error: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "connections"
