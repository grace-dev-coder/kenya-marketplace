from app.database import SessionLocal
from app.models import User
from passlib.context import CryptContext
import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

db = SessionLocal()

# Check existing admin
admin = db.query(User).filter(User.role == "admin").first()
if admin:
    print(f"Admin already exists: {admin.email}")
    print("Password is whatever you set it to.")
else:
    # Create admin
    admin = User(
        email="admin@kenyamarket.com",
        full_name="System Admin",
        password_hash=pwd_context.hash("admin123"),
        role="admin",
        phone="+254700000000",
        is_active=True,
        created_at=datetime.datetime.utcnow()
    )
    db.add(admin)
    db.commit()
    print("✅ Admin created!")
    print("Email: admin@kenyamarket.com")
    print("Password: admin123")

db.close()