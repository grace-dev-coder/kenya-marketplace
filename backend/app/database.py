import sqlite3
from .config import get_settings

settings = get_settings()
DB_PATH = "kenya_marketplace.db"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def execute_query(query, params=None, fetch=False):
    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        cursor.execute(query, params or ())
        if fetch:
            result = [dict(row) for row in cursor.fetchall()]
            return result
        connection.commit()
        return cursor.lastrowid
    except Exception as e:
        connection.rollback()
        raise e
    finally:
        cursor.close()
        connection.close()

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE NOT NULL, full_name TEXT NOT NULL, phone TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, role TEXT DEFAULT 'customer', is_active INTEGER DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
    cursor.execute("CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
    cursor.execute("CREATE TABLE IF NOT EXISTS vendors (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, business_name TEXT NOT NULL, business_description TEXT, business_address TEXT NOT NULL, business_phone TEXT NOT NULL, kra_pin TEXT NOT NULL, is_verified INTEGER DEFAULT 0, rating REAL DEFAULT 0.0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
    cursor.execute("CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT NOT NULL, price REAL NOT NULL, stock_quantity INTEGER DEFAULT 0, category_id INTEGER NOT NULL, vendor_id INTEGER NOT NULL, images TEXT, sku TEXT UNIQUE, average_rating REAL DEFAULT 0.0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
    cursor.execute("CREATE TABLE IF NOT EXISTS cart_items (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, product_id INTEGER NOT NULL, quantity INTEGER DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, product_id))")
    cursor.execute("CREATE TABLE IF NOT EXISTS wishlists (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, product_id INTEGER NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, product_id))")
    cursor.execute("CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, total_amount REAL NOT NULL, status TEXT DEFAULT 'pending', shipping_address TEXT NOT NULL, shipping_phone TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
    cursor.execute("CREATE TABLE IF NOT EXISTS order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, product_id INTEGER NOT NULL, quantity INTEGER NOT NULL, unit_price REAL NOT NULL)")
    cursor.execute("CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL, amount REAL NOT NULL, phone_number TEXT NOT NULL, transaction_id TEXT UNIQUE, status TEXT DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
    cursor.execute("CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, product_id INTEGER NOT NULL, rating INTEGER NOT NULL, comment TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, product_id))")
    cursor.execute("CREATE TABLE IF NOT EXISTS notifications (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, title TEXT NOT NULL, message TEXT NOT NULL, is_read INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
    cursor.execute("CREATE TABLE IF NOT EXISTS admin_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, admin_id INTEGER NOT NULL, action TEXT NOT NULL, details TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
    
    # Seed data
    categories = [('Electronics', 'Phones, laptops, and electronic accessories'), ('Fashion', 'Clothing, shoes, and accessories'), ('Home & Kitchen', 'Furniture, appliances, and kitchenware'), ('Beauty & Health', 'Cosmetics, skincare, and health products'), ('Automotive', 'Car parts and accessories'), ('Groceries', 'Food items and household supplies'), ('Sports & Outdoors', 'Sporting goods and outdoor equipment')]
    cursor.executemany("INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)", categories)
    
    cursor.execute("INSERT OR IGNORE INTO users (email, full_name, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)", ('admin@kenyamarketplace.co.ke', 'System Administrator', '254712345678', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/I1K', 'admin'))
    cursor.execute("INSERT OR IGNORE INTO users (email, full_name, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)", ('vendor@example.com', 'Sample Vendor', '254723456789', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/I1K', 'vendor'))
    cursor.execute("INSERT OR IGNORE INTO users (email, full_name, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)", ('customer@example.com', 'John Doe', '254734567890', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/I1K', 'customer'))
    
    cursor.execute("INSERT OR IGNORE INTO vendors (user_id, business_name, business_description, business_address, business_phone, kra_pin, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?)", (2, 'Mama Njoro Shop', 'Quality products for Kenyan homes', 'Nairobi, Kenya', '254723456789', 'A123456789B', 1))
    
    products = [('Samsung Galaxy A54', '6.4" AMOLED display, 128GB, 5000mAh battery', 45999.00, 50, 1, 1, 'SAMA54-001'), ('Nike Running Shoes', 'Comfortable running shoes for athletes', 8999.00, 100, 2, 1, 'NIKE-RUN-001'), ('Ramtons Blender', 'High-speed blender for smoothies', 3499.00, 30, 3, 1, 'RAM-BLEND-001'), ('Nivea Body Lotion', 'Moisturizing body lotion 400ml', 599.00, 200, 4, 1, 'NIV-LOT-001'), ('Toyota Brake Pads', 'Genuine Toyota brake pads - front', 4500.00, 25, 5, 1, 'TOY-BRAKE-001'), ('Mwea Pishori Rice 5kg', 'Premium Kenyan rice', 450.00, 500, 6, 1, 'RICE-MWE-001'), ('Adidas Football', 'Official size 5 football', 2499.00, 40, 7, 1, 'ADI-FB-001')]
    cursor.executemany("INSERT OR IGNORE INTO products (name, description, price, stock_quantity, category_id, vendor_id, sku) VALUES (?, ?, ?, ?, ?, ?, ?)", products)
    
    conn.commit()
    cursor.close()
    conn.close()
