from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db, execute_query
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/cart", tags=["cart"])

@router.get("/")
def get_cart(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    cart_items = execute_query(
        """SELECT c.id, c.product_id, c.quantity, 
                  p.name as product_name, p.price, p.image_url
           FROM cart_items c
           JOIN products p ON c.product_id = p.id
           WHERE c.user_id = :user_id""",
        {"user_id": user_id},
        fetch=True
    )
    
    total = sum(item["price"] * item["quantity"] for item in cart_items) if cart_items else 0
    
    return {
        "items": cart_items or [],
        "total": total,
        "count": len(cart_items) if cart_items else 0
    }

@router.post("/")
def add_to_cart(item: dict, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    product_id = item.get("product_id")
    quantity = item.get("quantity", 1)
    
    if not product_id:
        raise HTTPException(status_code=400, detail="product_id is required")
    
    product = execute_query(
        "SELECT * FROM products WHERE id = :id",
        {"id": product_id},
        fetch=True
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    existing = execute_query(
        "SELECT * FROM cart_items WHERE user_id = :user_id AND product_id = :product_id",
        {"user_id": user_id, "product_id": product_id},
        fetch=True
    )
    
    if existing:
        execute_query(
            "UPDATE cart_items SET quantity = quantity + :qty WHERE user_id = :user_id AND product_id = :product_id",
            {"user_id": user_id, "product_id": product_id, "qty": quantity}
        )
    else:
        execute_query(
            "INSERT INTO cart_items (user_id, product_id, quantity) VALUES (:user_id, :product_id, :quantity)",
            {"user_id": user_id, "product_id": product_id, "quantity": quantity}
        )
    
    return {"message": "Added to cart"}

@router.put("/{cart_item_id}")
def update_cart_item(cart_item_id: int, item: dict, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    quantity = item.get("quantity", 1)
    
    if quantity < 1:
        execute_query(
            "DELETE FROM cart_items WHERE id = :id AND user_id = :user_id",
            {"id": cart_item_id, "user_id": user_id}
        )
        return {"message": "Item removed"}
    
    execute_query(
        "UPDATE cart_items SET quantity = :quantity WHERE id = :id AND user_id = :user_id",
        {"id": cart_item_id, "user_id": user_id, "quantity": quantity}
    )
    return {"message": "Cart updated"}

@router.delete("/{cart_item_id}")
def remove_from_cart(cart_item_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    execute_query(
        "DELETE FROM cart_items WHERE id = :id AND user_id = :user_id",
        {"id": cart_item_id, "user_id": user_id}
    )
    return {"message": "Removed from cart"}

@router.delete("/")
def clear_cart(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID not found in token")
    
    execute_query(
        "DELETE FROM cart_items WHERE user_id = :user_id",
        {"user_id": user_id}
    )
    return {"message": "Cart cleared"}