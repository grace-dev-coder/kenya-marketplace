from fastapi import APIRouter, Depends, HTTPException
from typing import List
from ..models import ReviewCreate, Review
from ..database import execute_query
from ..dependencies import get_current_active_user

router = APIRouter()

@router.post("/")
async def create_review(
    review: ReviewCreate,
    current_user: dict = Depends(get_current_active_user)
):
    purchased = execute_query(
        """SELECT oi.id FROM order_items oi
           JOIN orders o ON oi.order_id = o.id
           WHERE o.user_id = ? AND oi.product_id = ? AND o.status = 'delivered'""",
        (current_user["id"], review.product_id),
        fetch=True
    )
    if not purchased:
        raise HTTPException(status_code=400, detail="Can only review purchased and delivered products")
    
    existing = execute_query(
        "SELECT id FROM reviews WHERE user_id = ? AND product_id = ?",
        (current_user["id"], review.product_id),
        fetch=True
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already reviewed this product")
    
    review_id = execute_query(
        """INSERT INTO reviews (user_id, product_id, rating, comment)
           VALUES (?, ?, ?, ?)""",
        (current_user["id"], review.product_id, review.rating, review.comment)
    )
    
    avg_rating = execute_query(
        "SELECT AVG(rating) as avg FROM reviews WHERE product_id = ?",
        (review.product_id,),
        fetch=True
    )[0]["avg"]
    
    execute_query(
        "UPDATE products SET average_rating = ? WHERE id = ?",
        (round(float(avg_rating), 1), review.product_id)
    )
    
    return {"message": "Review added successfully"}

@router.get("/product/{product_id}", response_model=List[Review])
async def get_product_reviews(product_id: int):
    reviews = execute_query(
        """SELECT r.*, u.full_name as user_name
           FROM reviews r
           JOIN users u ON r.user_id = u.id
           WHERE r.product_id = ?
           ORDER BY r.created_at DESC""",
        (product_id,),
        fetch=True
    )
    return reviews
