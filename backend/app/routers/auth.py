from fastapi import APIRouter, HTTPException, Depends, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt, JWTError
import os

from app.database import get_db, execute_query

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Dependency to get current user from token
async def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/register")
def register(user: dict, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = execute_query(
        "SELECT id FROM users WHERE email = :email",
        {"email": user.get("email")},
        fetch=True
    )
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered. Please login.")
    
    # Hash password and create user
    hashed = get_password_hash(user.get("password"))
    execute_query(
        """INSERT INTO users (email, password_hash, full_name, phone, is_vendor, is_admin) 
           VALUES (:email, :password_hash, :full_name, :phone, FALSE, FALSE)""",
        {
            "email": user.get("email"),
            "password_hash": hashed,
            "full_name": user.get("full_name", ""),
            "phone": user.get("phone", "")
        }
    )
    
    return {"message": "Registration successful! Please login."}

@router.post("/login")
def login(credentials: dict, db: Session = Depends(get_db)):
    email = credentials.get("email")
    password = credentials.get("password")
    
    # MUST check if user exists first
    user = execute_query(
        "SELECT id, email, password_hash, full_name, is_vendor, is_admin FROM users WHERE email = :email",
        {"email": email},
        fetch=True
    )
    
    # CRITICAL: If user doesn't exist, force them to register first
    if not user:
        raise HTTPException(
            status_code=404, 
            detail="User not found. Please register first before logging in."
        )
    
    user = user[0]  # Get first result
    
    # Verify password
    if not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect password")
    
    # Create token
    token = create_access_token({"sub": user["email"], "user_id": user["id"]})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "is_vendor": user["is_vendor"],
            "is_admin": user["is_admin"]
        }
    }

@router.get("/me")
def get_current_user_info(current_user: str = Depends(get_current_user)):
    return {"email": current_user}

@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}
