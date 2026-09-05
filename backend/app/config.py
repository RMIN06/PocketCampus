# app/config.py
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "pocketcampus"
    JWT_SECRET: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 24 * 7
    # Google OAuth — the audience (client ID) that Google ID tokens must be issued for.
    # Leave empty while Google Sign-In is not configured.
    GOOGLE_CLIENT_ID: str = ""
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001,https://pocketcampus.app"

    class Config:
        env_file = ".env"


settings = Settings()


def cors_origins() -> list[str]:
    return [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
