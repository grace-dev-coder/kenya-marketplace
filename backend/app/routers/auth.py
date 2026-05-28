from fastapi import APIRouter, HTTPException, status
from datetime import timedelta
from ..models import UserCreate, UserLogin, Token, User
from ..auth import get_password_hash, verify_password, create_access_token
from ..database import execute_query
from ..config import get_settings

router = APIRouter()
settings = get_settings()

@router.post("/register", response_model=Token)
async def register(user: UserCreate):
    # Check if user exists
    existing = execute_query("SELECT id FROM users WHERE email = ?", (user.email,), fetch=True)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if phone exists
    existing_phone = execute_query("SELECT id FROM users WHERE phone = ?", (user.phone,), fetch=True)
    if existing_phone:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    hashed_password = get_password_hash(user.password)
    
    user_id = execute_query(
        """INSERT INTO users (email, full_name, phone, password_hash, role) 
           VALUES (?, ?, ?, ?, ?)""",
        (user.email, user.full_name, user.phone, hashed_password, user.role.value)
    )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone,
            "role": user.role,
            "is_active": True,
            "created_at": execute_query("SELECT created_at FROM users WHERE id = ?", (user_id,), fetch=True)[0]["created_at"]
        }
    }

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    user = execute_query(
        "SELECT * FROM users WHERE email = ?", (credentials.email,), fetch=True
    )
    if not user or not verify_password(credentials.password, user[0]["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not user[0]["is_active"]:
        raise HTTPException(status_code=400, detail="Account is deactivated")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user[0]["email"]}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user[0]["id"],
            "email": user[0]["email"],
            "full_name": user[0]["full_name"],
            "phone": user[0]["phone"],
            "role": user[0]["role"],
            "is_active": user[0]["is_active"],
            "created_at": user[0]["created_at"]
        }
    }
