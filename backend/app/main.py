from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .routers import api_router
from .database import init_db
import os

app = FastAPI(
    title="Kenya Marketplace API",
    description="E-commerce platform for Kenya with M-Pesa integration",
    version="1.0.0"
)

init_db()

# CORS - Allow ALL origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("assets/products", exist_ok=True)
app.mount("/assets", StaticFiles(directory="assets"), name="assets")
app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Kenya Marketplace API", "version": "1.0.0", "docs": "/docs"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/api/messages/recent")
async def messages_recent_stub(since_id: int = 0):
    """Stub endpoint to prevent 404 errors from frontend polling"""
    return {"messages": [], "last_id": since_id, "unread_count": 0}

@app.get("/api/debug/auth")
async def debug_auth(request: Request):
    auth = request.headers.get("authorization", "NONE")
    result = {"received": auth[:50] + "..." if len(auth) > 50 else auth}
    if auth.startswith("Bearer "):
        token = auth[7:]
        from .auth import verify_token
        email = verify_token(token)
        result["decoded_email"] = email
        from .database import execute_query
        user = execute_query("SELECT id, email FROM users WHERE email = ?", (email,), fetch=True)
        result["user_found"] = len(user) > 0
        if user:
            result["user_id"] = user[0]["id"]
    return result
