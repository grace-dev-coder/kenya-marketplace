import sqlite3
import bcrypt

DB_PATH = 'kenya_marketplace.db'

def create_admin():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if admin already exists
    cursor.execute("SELECT * FROM users WHERE email = 'admin@kenyamarket.com'")
    if cursor.fetchone():
        print("Admin already exists: admin@kenyamarket.com")
        conn.close()
        return
    
    # Hash password
    password_hash = bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()).decode()
    
    # Insert admin with exact columns from your schema
    cursor.execute("""
        INSERT INTO users (email, password_hash, full_name, phone, is_vendor, is_admin)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        'admin@kenyamarket.com',
        password_hash,
        'System Admin',
        '+254700000000',
        0,      # is_vendor = False
        1       # is_admin = True
    ))
    
    conn.commit()
    conn.close()
    print("✅ Admin created!")
    print("Email: admin@kenyamarket.com")
    print("Password: admin123")

if __name__ == "__main__":
    create_admin()