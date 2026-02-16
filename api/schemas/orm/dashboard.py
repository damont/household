from datetime import datetime, timezone
from typing import Optional

from beanie import Document, Indexed
from pydantic import Field


class DashboardSnapshot(Document):
    user_id: Indexed(str, unique=True)
    widgets: list[dict] = Field(default_factory=list)
    last_refreshed_at: Optional[datetime] = None
    refresh_errors: list[str] = Field(default_factory=list)

    class Settings:
        name = "dashboard_snapshots"
