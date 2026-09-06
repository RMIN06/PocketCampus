# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import users, expenses, auth
from app.config import cors_origins


app = FastAPI(title="PocketCampus API", version="0.2.0")


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
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
