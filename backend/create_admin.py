import psycopg2
import bcrypt
import os

# Get connection string from environment or paste it here
DATABASE_URL = os.getenv("DATABASE_URL", "YOUR_NEON_CONNECTION_STRING_HERE")

def create_admin():
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Check if admin exists
    cursor.execute("SELECT * FROM users WHERE email = 'admin@kenyamarket.com'")
    if cursor.fetchone():
        print("Admin already exists: admin@kenyamarket.com")
        conn.close()
        return
    
    # Hash password
    password_hash = bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()).decode()
    
    # Insert admin
    cursor.execute("""
        INSERT INTO users (email, password_hash, full_name, phone, is_vendor, is_admin)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (
        'admin@kenyamarket.com',
        password_hash,
        'System Admin',
        '+254700000000',
        False,
        True
    ))
    
    conn.commit()
    cursor.close()
    conn.close()
    print("✅ Admin created in Neon!")
    print("Email: admin@kenyamarket.com")
    print("Password: admin123")

if __name__ == "__main__":
    create_admin()