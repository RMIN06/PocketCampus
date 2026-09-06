# app/routers/auth.py
import jwt as pyjwt
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from app.config import settings
from app.database import users_collection
from app.models.user import GoogleAuthRequest, UserPublic
from app.utils.serializers import doc_to_model


router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/google")
async def google_auth(payload: GoogleAuthRequest):
    """
    Exchange a Google ID token (from Google Identity Services) for a
    PocketCampus JWT. Creates the user on first sign-in.
    """
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=503,
            detail="Google Sign-In is not configured. Set GOOGLE_CLIENT_ID in backend/.env",
        )

    try:
        info = id_token.verify_oauth2_token(
            payload.credential, google_requests.Request(), settings.GOOGLE_CLIENT_ID
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {e}")

    google_sub = info["sub"]
    email = info.get("email")
    full_name = info.get("name") or (email.split("@")[0] if email else "User")
    picture = info.get("picture")

    if not email or not info.get("email_verified"):
        raise HTTPException(status_code=400, detail="A verified Google account email is required")

    # Upsert the user by google_sub (fall back to email lookup for legacy rows)
    doc = await users_collection.find_one({"google_sub": google_sub}) or \
        await users_collection.find_one({"email": email})

    now = datetime.now(timezone.utc)
    if doc:
        await users_collection.update_one(
            {"_id": doc["_id"]},
            {"$set": {"full_name": full_name, "email": email, "picture": picture,
                      "google_sub": google_sub}},
        )
        doc = await users_collection.find_one({"_id": doc["_id"]})
    else:
        result = await users_collection.insert_one({
            "google_sub": google_sub,
            "full_name": full_name,
            "email": email,
            "picture": picture,
            "avatar_color": "#2D4F1E",
            "created_at": now,
        })
        doc = await users_collection.find_one({"_id": result.inserted_id})

    user = doc_to_model(doc, UserPublic)

    token = pyjwt.encode(
        {
            "sub": str(user.id),
            "email": user.email,
            "exp": datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRE_HOURS),
            "iat": now,
        },
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user.model_dump(mode="json"),
    }
