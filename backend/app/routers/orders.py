from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db, execute_query
from app.dependencies import get_current_user

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

@router.post("/checkout")
def checkout(order_data: dict, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        user_id = current_user.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="User ID not found in token")
        
        # Get cart items
        cart_items = execute_query(
            """SELECT c.product_id, c.quantity, p.price, p.name
               FROM cart_items c
               JOIN products p ON c.product_id = p.id
               WHERE c.user_id = :user_id""",
            {"user_id": user_id},
            fetch=True
        )
        
        if not cart_items:
            raise HTTPException(status_code=400, detail="Cart is empty")
        
        # Calculate total
        total_amount = sum(item["price"] * item["quantity"] for item in cart_items)
        
        # Create order
        execute_query(
            """INSERT INTO orders (user_id, total_amount, status, payment_method)
               VALUES (:user_id, :total_amount, :status, :payment_method)""",
            {
                "user_id": user_id,
                "total_amount": total_amount,
                "status": "pending",
                "payment_method": order_data.get("payment_method", "mpesa")
            }
        )
        
        # Get the created order ID
        order_result = execute_query(
            "SELECT id FROM orders WHERE user_id = :user_id ORDER BY created_at DESC LIMIT 1",
            {"user_id": user_id},
            fetch=True
        )
        order_id = order_result[0]["id"] if order_result else None
        
        # Create order items
        for item in cart_items:
            execute_query(
                """INSERT INTO order_items (order_id, product_id, quantity, price_at_time)
                   VALUES (:order_id, :product_id, :quantity, :price)""",
                {
                    "order_id": order_id,
                    "product_id": item["product_id"],
                    "quantity": item["quantity"],
                    "price": item["price"]
                }
            )
        
        # Clear cart
        execute_query(
            "DELETE FROM cart_items WHERE user_id = :user_id",
            {"user_id": user_id}
        )
        
        # Create payment record
        phone = order_data.get("phone_number", "")
        execute_query(
            """INSERT INTO payments (order_id, amount, phone_number, status)
               VALUES (:order_id, :amount, :phone_number, :status)""",
            {
                "order_id": order_id,
                "amount": total_amount,
                "phone_number": phone,
                "status": "pending"
            }
        )
        
        return {
            "message": "Order placed successfully",
            "order_id": order_id,
            "total_amount": total_amount,
            "phone_number": phone
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Checkout failed: {str(e)}")

@router.put("/{order_id}")
def update_order(order_id: int, order_update: dict, db: Session = Depends(get_db)):
    try:
        existing = execute_query(
            "SELECT * FROM orders WHERE id = :id",
            {"id": order_id},
            fetch=True
        )
        if not existing:
            raise HTTPException(status_code=404, detail="Order not found")

        allowed_fields = ['status', 'payment_method']
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