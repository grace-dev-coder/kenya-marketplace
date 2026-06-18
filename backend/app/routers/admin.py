from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, execute_query
from typing import List, Optional
from datetime import datetime, timedelta
import traceback

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    try:
        users = execute_query("SELECT COUNT(*) as count FROM users", fetch=True)
        products = execute_query("SELECT COUNT(*) as count FROM products", fetch=True)
        orders = execute_query("SELECT COUNT(*) as count FROM orders", fetch=True)
        
        revenue = execute_query(
            "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status != 'cancelled'",
            fetch=True
        )
        
        # PostgreSQL: use TO_CHAR for month filtering
        month_revenue = execute_query(
            """SELECT COALESCE(SUM(total_amount), 0) as total FROM orders 
               WHERE status != 'cancelled' 
               AND TO_CHAR(created_at, 'YYYY-MM') = TO_CHAR(NOW(), 'YYYY-MM')""",
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
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Stats error: {str(e)}")

@router.get("/sales-chart")
def get_sales_chart(db: Session = Depends(get_db)):
    try:
        # PostgreSQL: use DATE_TRUNC and NOW() - INTERVAL
        sales = execute_query(
            """SELECT DATE(created_at) as date, COALESCE(SUM(total_amount), 0) as total
               FROM orders 
               WHERE status != 'cancelled' 
               AND created_at >= NOW() - INTERVAL '6 days'
               GROUP BY DATE(created_at)
               ORDER BY date""",
            fetch=True
        )
        
        labels = []
        data = []
        for i in range(6, -1, -1):
            day = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
            day_label = (datetime.now() - timedelta(days=i)).strftime('%a %d')
            labels.append(day_label)
            day_sales = next((s for s in sales if str(s["date"]) == day), None)
            data.append(float(day_sales["total"]) if day_sales else 0)
        
        return {"labels": labels, "data": data}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Sales chart error: {str(e)}")

@router.get("/top-products")
def get_top_products(db: Session = Depends(get_db)):
    try:
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
    except Exception as e:
        traceback.print_exc()
        try:
            products = execute_query(
                """SELECT id, name, image_url, price, 0 as total_sold 
                   FROM products 
                   ORDER BY id DESC 
                   LIMIT 5""",
                fetch=True
            )
            return products or []
        except Exception as e2:
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Top products error: {str(e2)}")

@router.get("/recent-orders")
def get_recent_orders(db: Session = Depends(get_db)):
    try:
        orders = execute_query(
            """SELECT o.id, o.total_amount, o.status, o.created_at,
                      u.full_name as customer_name
               FROM orders o
               LEFT JOIN users u ON o.user_id = u.id
               ORDER BY o.created_at DESC
               LIMIT 10""",
            fetch=True
        )
        return orders or []
    except Exception as e:
        traceback.print_exc()
        try:
            orders = execute_query(
                """SELECT id, total_amount, status, created_at,
                          'Guest' as customer_name
                   FROM orders
                   ORDER BY created_at DESC
                   LIMIT 10""",
                fetch=True
            )
            return orders or []
        except Exception as e2:
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Recent orders error: {str(e2)}")

@router.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    try:
        users = execute_query(
            "SELECT id, email, full_name, is_vendor, is_admin, created_at FROM users LIMIT 100",
            fetch=True
        )
        return users or []
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Users error: {str(e)}")

@router.get("/db-check")
def check_database(db: Session = Depends(get_db)):
    """Debug endpoint to check which tables exist"""
    try:
        # PostgreSQL: use information_schema.tables
        tables = execute_query(
            """SELECT table_name as name 
               FROM information_schema.tables 
               WHERE table_schema = 'public' 
               ORDER BY table_name""",
            fetch=True
        )
        table_names = [t["name"] for t in tables] if tables else []
        
        order_cols = []
        if "orders" in table_names:
            cols = execute_query(
                """SELECT column_name as name 
                   FROM information_schema.columns 
                   WHERE table_name = 'orders'""",
                fetch=True
            )
            order_cols = [c["name"] for c in cols] if cols else []
        
        product_cols = []
        if "products" in table_names:
            cols = execute_query(
                """SELECT column_name as name 
                   FROM information_schema.columns 
                   WHERE table_name = 'products'""",
                fetch=True
            )
            product_cols = [c["name"] for c in cols] if cols else []
        
        return {
            "tables": table_names,
            "orders_columns": order_cols,
            "products_columns": product_cols
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))