from datetime import datetime, timezone
from typing import Optional

from beanie import Document, Indexed
from pydantic import EmailStr


class User(Document):
    email: Indexed(EmailStr, unique=True)
    username: Indexed(str, unique=True)
    hashed_password: str
    display_name: Optional[str] = None
    created_at: datetime = datetime.now(timezone.utc)
    is_active: bool = True

    class Settings:
        name = "users"
