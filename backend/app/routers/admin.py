from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from ..database import execute_query
from ..dependencies import require_admin
from ..models import DashboardStats
import csv
import io

router = APIRouter()

@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(current_user: dict = Depends(require_admin)):
    total_users = execute_query("SELECT COUNT(*) as count FROM users", fetch=True)[0]["count"]
    total_vendors = execute_query("SELECT COUNT(*) as count FROM vendors", fetch=True)[0]["count"]
    total_products = execute_query("SELECT COUNT(*) as count FROM products", fetch=True)[0]["count"]
    total_orders = execute_query("SELECT COUNT(*) as count FROM orders", fetch=True)[0]["count"]
    total_revenue = execute_query(
        "SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'delivered'",
        fetch=True
    )[0]["total"]
    pending_orders = execute_query(
        "SELECT COUNT(*) as count FROM orders WHERE status = 'pending'",
        fetch=True
    )[0]["count"]
    
    return {
        "total_users": total_users,
        "total_vendors": total_vendors,
        "total_products": total_products,
        "total_orders": total_orders,
        "total_revenue": float(total_revenue),
        "pending_orders": pending_orders
    }

@router.get("/users")
async def get_all_users(
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(require_admin)
):
    users = execute_query(
        "SELECT id, email, full_name, phone, role, is_active, created_at FROM users LIMIT ? OFFSET ?",
        (limit, skip),
        fetch=True
    )
    return users

@router.put("/users/{user_id}/toggle")
async def toggle_user(user_id: int, current_user: dict = Depends(require_admin)):
    user = execute_query("SELECT is_active FROM users WHERE id = ?", (user_id,), fetch=True)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_status = not user[0]["is_active"]
    execute_query("UPDATE users SET is_active = ? WHERE id = ?", (new_status, user_id))
    return {"message": f"User {'activated' if new_status else 'deactivated'}"}

@router.get("/orders")
async def get_all_orders(
    status: str = None,
    skip: int = 0,
    limit: int = 50,
    current_user: dict = Depends(require_admin)
):
    query = "SELECT * FROM orders"
    params = []
    if status:
        query += " WHERE status = ?"
        params.append(status)
    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, skip])
    
    return execute_query(query, tuple(params), fetch=True)

@router.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: int,
    status: str,
    current_user: dict = Depends(require_admin)
):
    valid_statuses = ["pending", "paid", "shipped", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    execute_query("UPDATE orders SET status = ? WHERE id = ?", (status, order_id))
    return {"message": "Order status updated"}

@router.post("/bulk-import/products")
async def bulk_import_products(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_admin)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files allowed")
    
    contents = await file.read()
    csv_file = io.StringIO(contents.decode('utf-8'))
    reader = csv.DictReader(csv_file)
    
    imported = 0
    for row in reader:
        try:
            execute_query(
                """INSERT INTO products (name, description, price, stock_quantity, category_id, vendor_id, sku)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (row['name'], row.get('description', ''), float(row['price']),
                 int(row['stock_quantity']), int(row['category_id']), int(row['vendor_id']),
                 row.get('sku', ''))
            )
            imported += 1
        except Exception as e:
            continue
    
    return {"message": f"Successfully imported {imported} products"}
