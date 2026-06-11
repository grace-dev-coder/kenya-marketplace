from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, execute_query

router = APIRouter(prefix="/api/reviews", tags=["reviews"])

@router.get("/")
def get_reviews(db: Session = Depends(get_db)):
    reviews = execute_query("SELECT * FROM reviews LIMIT 100", fetch=True)
    return reviews or []

@router.post("/")
def create_review(review: dict, db: Session = Depends(get_db)):
    try:
        execute_query(
            """INSERT INTO reviews (product_id, user_id, rating, comment) 
               VALUES (:product_id, :user_id, :rating, :comment)""",
            {
                "product_id": review.get("product_id"),
                "user_id": review.get("user_id"),
                "rating": review.get("rating"),
                "comment": review.get("comment", "")
            }
        )
        return {"message": "Review added"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
