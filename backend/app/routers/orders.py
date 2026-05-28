from fastapi import APIRouter, Depends, HTTPException
from typing import List
from ..models import OrderCreate, Order, CartItem
from ..database import execute_query
from ..dependencies import get_current_active_user

router = APIRouter()

@router.post("/cart")
async def add_to_cart(item: CartItem, current_user: dict = Depends(get_current_active_user)):
    product = execute_query("SELECT stock_quantity FROM products WHERE id = ?", (item.product_id,), fetch=True)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product[0]["stock_quantity"] < item.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    existing = execute_query(
        "SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?",
        (current_user["id"], item.product_id),
        fetch=True
    )
    
    if existing:
        new_qty = existing[0]["quantity"] + item.quantity
        execute_query(
            "UPDATE cart_items SET quantity = ? WHERE id = ?",
            (new_qty, existing[0]["id"])
        )
    else:
        execute_query(
            "INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)",
            (current_user["id"], item.product_id, item.quantity)
        )
    
    return {"message": "Item added to cart"}

@router.get("/cart")
async def get_cart(current_user: dict = Depends(get_current_active_user)):
    cart_items = execute_query(
        """SELECT ci.*, p.name as product_name, p.price as product_price, p.images as product_image,
           (ci.quantity * p.price) as total_price
           FROM cart_items ci
           JOIN products p ON ci.product_id = p.id
           WHERE ci.user_id = ?""",
        (current_user["id"],),
        fetch=True
    )
    total = sum(item["total_price"] for item in cart_items) if cart_items else 0
    return {"items": cart_items, "total": total}

@router.delete("/cart/{item_id}")
async def remove_from_cart(item_id: int, current_user: dict = Depends(get_current_active_user)):
    execute_query("DELETE FROM cart_items WHERE id = ? AND user_id = ?", (item_id, current_user["id"]))
    return {"message": "Item removed from cart"}

@router.post("/", response_model=Order)
async def create_order(order: OrderCreate, current_user: dict = Depends(get_current_active_user)):
    total_amount = 0
    for item in order.items:
        product = execute_query(
            "SELECT price, stock_quantity FROM products WHERE id = ?",
            (item.product_id,),
            fetch=True
        )
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        if product[0]["stock_quantity"] < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for product {item.product_id}")
        total_amount += product[0]["price"] * item.quantity
    
    order_id = execute_query(
        """INSERT INTO orders (user_id, total_amount, status, shipping_address, shipping_phone)
           VALUES (?, ?, ?, ?, ?)""",
        (current_user["id"], total_amount, "pending", order.shipping_address, order.shipping_phone)
    )
    
    for item in order.items:
        product = execute_query("SELECT price FROM products WHERE id = ?", (item.product_id,), fetch=True)
        execute_query(
            """INSERT INTO order_items (order_id, product_id, quantity, unit_price)
               VALUES (?, ?, ?, ?)""",
            (order_id, item.product_id, item.quantity, product[0]["price"])
        )
        execute_query(
            "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?",
            (item.quantity, item.product_id)
        )
    
    execute_query("DELETE FROM cart_items WHERE user_id = ?", (current_user["id"],))
    
    return execute_query("SELECT * FROM orders WHERE id = ?", (order_id,), fetch=True)[0]

@router.get("/", response_model=List[Order])
async def get_orders(current_user: dict = Depends(get_current_active_user)):
    orders = execute_query(
        "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
        (current_user["id"],),
        fetch=True
    )
    return orders

@router.get("/{order_id}")
async def get_order(order_id: int, current_user: dict = Depends(get_current_active_user)):
    order = execute_query("SELECT * FROM orders WHERE id = ?", (order_id,), fetch=True)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order[0]["user_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    items = execute_query(
        """SELECT oi.*, p.name as product_name, p.images as product_image
           FROM order_items oi
           JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = ?""",
        (order_id,),
        fetch=True
    )
    
    order_data = order[0]
    order_data["items"] = items
    return order_data
