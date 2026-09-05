# app/database.py
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client = AsyncIOMotorClient(settings.MONGO_URI)
db = client[settings.MONGO_DB_NAME]

users_collection = db["users"]
expenses_collection = db["expenses"]


async def init_indexes():
    await users_collection.create_index("email", unique=True)
    await users_collection.create_index("google_sub", unique=True, sparse=True)
    await expenses_collection.create_index([("user_id", 1), ("created_at", -1)])