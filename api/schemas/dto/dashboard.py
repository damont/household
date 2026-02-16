from typing import Optional
from pydantic import BaseModel


class WidgetData(BaseModel):
    service_type: str
    service_name: str
    frontend_url: Optional[str] = None
    endpoint_name: str
    label: str
    data: Optional[list | dict] = None
    error: Optional[str] = None


class DashboardResponse(BaseModel):
    widgets: list[WidgetData]
    last_refreshed_at: Optional[str]
    refresh_errors: list[str]


class RefreshResponse(BaseModel):
    success: bool
    message: str
    widgets_count: int
