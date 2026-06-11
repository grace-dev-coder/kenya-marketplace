from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
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

@router.post("/register")
async def register(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    email = body.get("email")
    password = body.get("password")
    full_name = body.get("full_name")
    phone = body.get("phone", "")
    
    if not email or not password or not full_name:
        raise HTTPException(status_code=422, detail="Email, password, and full name required")
    
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = pwd_context.hash(password)
    new_user = User(
        email=email,
        password_hash=hashed_password,
        full_name=full_name,
        phone=phone
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.email, "is_admin": False})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name
        }
    }

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
    
    is_admin_value = bool(user.is_admin)
    
    access_token = create_access_token(data={"sub": user.email, "is_admin": is_admin_value})
    refresh_token = create_access_token(data={"sub": user.email, "type": "refresh"}, expires_delta=timedelta(days=7))
    
    return {
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