from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/api/products", tags=["products"])

@router.get("/", response_model=List[schemas.ProductResponse])
def get_products(
    db: Session = Depends(get_db),
    category: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    sort_by: Optional[str] = Query("newest"),
    skip: int = 0,
    limit: int = 20
):
    query = db.query(models.Product)
    
    if category and category != "All Categories":
        query = query.filter(models.Product.category == category)
    
    if min_price is not None:
        query = query.filter(models.Product.price >= min_price)
    
    if max_price is not None:
        query = query.filter(models.Product.price <= max_price)
    
    # Sorting
    if sort_by == "newest":
        query = query.order_by(models.Product.created_at.desc())
    elif sort_by == "price_low":
        query = query.order_by(models.Product.price.asc())
    elif sort_by == "price_high":
        query = query.order_by(models.Product.price.desc())
    
    products = query.offset(skip).limit(limit).all()
    return products

@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product