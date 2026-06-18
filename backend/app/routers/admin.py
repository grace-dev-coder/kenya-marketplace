from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, execute_query
from typing import List, Optional
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    users = execute_query("SELECT COUNT(*) as count FROM users", fetch=True)
    products = execute_query("SELECT COUNT(*) as count FROM products", fetch=True)
    orders = execute_query("SELECT COUNT(*) as count FROM orders", fetch=True)
    
    # Revenue stats
    revenue = execute_query(
        "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status != 'cancelled'",
        fetch=True
    )
    month_revenue = execute_query(
        """SELECT COALESCE(SUM(total_amount), 0) as total FROM orders 
           WHERE status != 'cancelled' 
           AND created_at >= date('now', 'start of month')""",
        fetch=True
    )
    pending_orders = execute_query(
        "SELECT COUNT(*) as count FROM orders WHERE status = 'pending'", fetch=True
    )
    
    return {
        "users": users[0]["count"] if users else 0,
        "products": products[0]["count"] if products else 0,
        "orders": orders[0]["count"] if orders else 0,
        "total_revenue": float(revenue[0]["total"]) if revenue else 0,
        "month_revenue": float(month_revenue[0]["total"]) if month_revenue else 0,
        "pending_orders": pending_orders[0]["count"] if pending_orders else 0
    }

@router.get("/sales-chart")
def get_sales_chart(db: Session = Depends(get_db)):
    # Last 7 days sales
    sales = execute_query(
        """SELECT date(created_at) as date, COALESCE(SUM(total_amount), 0) as total
           FROM orders 
           WHERE status != 'cancelled' 
           AND created_at >= date('now', '-6 days')
           GROUP BY date(created_at)
           ORDER BY date(created_at)""",
        fetch=True
    )
    
    # Fill in missing days with 0
    labels = []
    data = []
    for i in range(6, -1, -1):
        day = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
        labels.append((datetime.now() - timedelta(days=i)).strftime('%a %d'))
        day_sales = next((s for s in sales if s["date"] == day), None)
        data.append(float(day_sales["total"]) if day_sales else 0)
    
    return {"labels": labels, "data": data}

@router.get("/top-products")
def get_top_products(db: Session = Depends(get_db)):
    products = execute_query(
        """SELECT p.id, p.name, p.image_url, p.price,
                  COALESCE(SUM(oi.quantity), 0) as total_sold
           FROM products p
           LEFT JOIN order_items oi ON p.id = oi.product_id
           LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
           GROUP BY p.id
           ORDER BY total_sold DESC
           LIMIT 5""",
        fetch=True
    )
    return products or []

@router.get("/recent-orders")
def get_recent_orders(db: Session = Depends(get_db)):
    orders = execute_query(
        """SELECT o.id, o.total_amount, o.status, o.payment_status, o.created_at,
                  u.full_name as customer_name
           FROM orders o
           LEFT JOIN users u ON o.user_id = u.id
           ORDER BY o.created_at DESC
           LIMIT 10""",
        fetch=True
    )
    return orders or []

@router.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    users = execute_query(
        "SELECT id, email, full_name, is_vendor, is_admin, created_at FROM users LIMIT 100",
        fetch=True
    )
    return users or []