from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db, execute_query

router = APIRouter(prefix="/api/orders", tags=["orders"])

@router.get("/")
def get_orders(status: Optional[str] = None, db: Session = Depends(get_db)):
    if status:
        orders = execute_query(
            "SELECT * FROM orders WHERE status = :status LIMIT 100",
            {"status": status},
            fetch=True
        )
    else:
        orders = execute_query("SELECT * FROM orders LIMIT 100", fetch=True)
    return orders or []

@router.get("/{order_id}")
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = execute_query(
        "SELECT * FROM orders WHERE id = :id",
        {"id": order_id},
        fetch=True
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order[0]

@router.post("/")
def create_order(order: dict, db: Session = Depends(get_db)):
    try:
        execute_query(
            """INSERT INTO orders (user_id, total_amount, status, payment_method, shipping_address, shipping_phone)
               VALUES (:user_id, :total_amount, :status, :payment_method, :shipping_address, :shipping_phone)""",
            {
                "user_id": order.get("user_id"),
                "total_amount": order.get("total_amount"),
                "status": order.get("status", "pending"),
                "payment_method": order.get("payment_method"),
                "shipping_address": order.get("shipping_address", ""),
                "shipping_phone": order.get("shipping_phone", "")
            }
        )
        return {"message": "Order created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{order_id}")
def update_order(order_id: int, order_update: dict, db: Session = Depends(get_db)):
    try:
        # Check if order exists
        existing = execute_query(
            "SELECT * FROM orders WHERE id = :id",
            {"id": order_id},
            fetch=True
        )
        if not existing:
            raise HTTPException(status_code=404, detail="Order not found")

        # Build dynamic update query
        allowed_fields = ['status', 'shipping_address', 'shipping_phone', 'payment_method']
        updates = []
        params = {"id": order_id}

        for field in allowed_fields:
            if field in order_update:
                updates.append(f"{field} = :{field}")
                params[field] = order_update[field]

        if not updates:
            raise HTTPException(status_code=400, detail="No valid fields to update")

        query = f"UPDATE orders SET {', '.join(updates)} WHERE id = :id"
        execute_query(query, params)

        return {"message": "Order updated successfully", "order_id": order_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")

@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    try:
        existing = execute_query(
            "SELECT * FROM orders WHERE id = :id",
            {"id": order_id},
            fetch=True
        )
        if not existing:
            raise HTTPException(status_code=404, detail="Order not found")

        execute_query("DELETE FROM orders WHERE id = :id", {"id": order_id})
        return {"message": "Order deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))