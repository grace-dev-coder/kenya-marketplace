from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, execute_query

router = APIRouter()

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    users = execute_query("SELECT COUNT(*) as count FROM users", fetch=True)
    products = execute_query("SELECT COUNT(*) as count FROM products", fetch=True)
    orders = execute_query("SELECT COUNT(*) as count FROM orders", fetch=True)
    return {
        "users": users[0]["count"] if users else 0,
        "products": products[0]["count"] if products else 0,
        "orders": orders[0]["count"] if orders else 0
    }

@router.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    users = execute_query("SELECT id, email, full_name, is_vendor, is_admin, created_at FROM users LIMIT 100", fetch=True)
    return users or []
