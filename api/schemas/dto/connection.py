from typing import Optional
from pydantic import BaseModel


class EndpointConfigDTO(BaseModel):
    name: str
    path: str
    method: str = "GET"
    dashboard_label: Optional[str] = None


class ConnectionCreate(BaseModel):
    service_type: str
    display_name: str
    base_url: str
    frontend_url: Optional[str] = None
    auth_type: str = "jwt_password"
    credentials: dict  # plaintext credentials, will be encrypted before storing
    endpoints: list[EndpointConfigDTO] = []


class ConnectionUpdate(BaseModel):
    display_name: Optional[str] = None
    base_url: Optional[str] = None
    frontend_url: Optional[str] = None
    auth_type: Optional[str] = None
    credentials: Optional[dict] = None
    endpoints: Optional[list[EndpointConfigDTO]] = None
    enabled: Optional[bool] = None


class ConnectionResponse(BaseModel):
    id: str
    service_type: str
    display_name: str
    base_url: str
    frontend_url: Optional[str]
    auth_type: str
    endpoints: list[EndpointConfigDTO]
    enabled: bool
    last_sync_at: Optional[str]
    last_sync_status: Optional[str]
    last_sync_error: Optional[str]
    created_at: str
    updated_at: str


class ConnectionTestResponse(BaseModel):
    success: bool
    message: str
