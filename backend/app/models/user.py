# app/models/user.py
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime, timezone
from .py_object_id import PyObjectId


class UserPublic(BaseModel):
    """Safe user representation returned by the API."""
    id: PyObjectId = Field(alias="_id")
    full_name: str
    email: EmailStr
    avatar_color: str = "#2D4F1E"
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"populate_by_name": True}


class GoogleAuthRequest(BaseModel):
    """The ID token produced by Google Identity Services on the client."""
    credential: str