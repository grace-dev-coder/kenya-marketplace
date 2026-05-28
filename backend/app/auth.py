from datetime import datetime, timedelta
from jose import JWTError, jwt
import hashlib
import secrets

# Simple SHA256 hashing (for development - use bcrypt in production)
def verify_password(plain_password, hashed_password):
    return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password

def get_password_hash(password):
    return hashlib.sha256(password.encode()).hexdigest()

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    # Use a simple secret key for development
    SECRET_KEY = "your-secret-key-change-in-production-kenya-marketplace-2024"
    ALGORITHM = "HS256"
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        SECRET_KEY = "your-secret-key-change-in-production-kenya-marketplace-2024"
        ALGORITHM = "HS256"
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"DEBUG: Token payload: {payload}")
        email: str = payload.get("sub")
        if email is None:
            return None
        return email
    except JWTError:
        return None
