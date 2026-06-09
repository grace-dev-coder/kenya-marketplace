from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt, JWTError
import os

from app.database import get_db
from app.models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def verify_password(plain_password, password_hash):
    return pwd_context.verify(plain_password, password_hash)

def create_access_token(data: dict, expires_delta=None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        return False
    return user

@router.post("/login")
async def login(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    email = body.get("email")
    password = body.get("password")
    
    if not email or not password:
        raise HTTPException(status_code=422, detail="Email and password required")
    
    user = authenticate_user(db, email, password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # Explicitly convert to Python bool then to int for JSON
    is_admin_value = bool(user.is_admin)
    
    access_token = create_access_token(data={"sub": user.email, "is_admin": is_admin_value})
    refresh_token = create_access_token(data={"sub": user.email, "type": "refresh"}, expires_delta=timedelta(days=7))
    
    response_data = {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "is_admin": is_admin_value,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name
        }
    }
    
    print("Login response:", response_data)
    return response_data
