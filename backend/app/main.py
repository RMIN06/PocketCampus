# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import init_indexes
from app.routers import users, expenses, auth
from app.config import cors_origins


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_indexes()
    yield


app = FastAPI(title="PocketCampus API", version="0.2.0", lifespan=lifespan)


app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(expenses.router)


@app.get("/health")
async def health_check():
    return {"status": "ok"}
