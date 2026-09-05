# app/routers/users.py
from fastapi import APIRouter, Depends, HTTPException
from app.models.user import UserPublic
from app.deps import get_current_user
from app.database import users_collection
from app.utils.serializers import doc_to_model
from bson import ObjectId


router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("/me", response_model=UserPublic)
async def get_current_user_profile(current_user_id: str = Depends(get_current_user)):
    """Get the signed-in user's profile."""
    doc = await users_collection.find_one({"_id": ObjectId(current_user_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return doc_to_model(doc, UserPublic)