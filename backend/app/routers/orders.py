from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db, execute_query

router = APIRouter()

@router.get("/")
def get_orders(db: Session = Depends(get_db)):
    orders = execute_query("SELECT * FROM orders LIMIT 100", fetch=True)
    return orders or []

@router.post("/")
def create_order(order: dict, db: Session = Depends(get_db)):
    try:
        execute_query(
            """INSERT INTO orders (user_id, total_amount, status, payment_method) 
               VALUES (:user_id, :total_amount, :status, :payment_method)""",
            {
                "user_id": order.get("user_id"),
                "total_amount": order.get("total_amount"),
                "status": order.get("status", "pending"),
                "payment_method": order.get("payment_method")
            }
        )
        return {"message": "Order created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
