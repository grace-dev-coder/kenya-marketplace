from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
import os

from app.database import get_db, execute_query

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"

security = HTTPBearer(auto_error=False)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        is_admin = payload.get("is_admin", False)

        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")

        # Look up user id from database
        user = execute_query(
            "SELECT id, email, full_name, is_admin FROM users WHERE email = :email",
            {"email": email},
            fetch=True
        )
        
        if user and len(user) > 0:
            return {
                "id": user[0]["id"],
                "email": user[0]["email"],
                "full_name": user[0]["full_name"],
                "is_admin": user[0]["is_admin"]
            }

        return {"email": email, "is_admin": is_admin}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    user = await get_current_user(credentials, db)
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user