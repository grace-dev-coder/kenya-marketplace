from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, execute_query

router = APIRouter(prefix="/api/vendors", tags=["vendors"])

@router.get("/")
def get_vendors(db: Session = Depends(get_db)):
    vendors = execute_query("SELECT * FROM users WHERE is_vendor = TRUE LIMIT 100", fetch=True)
    return vendors or []

@router.get("/{vendor_id}")
def get_vendor(vendor_id: int, db: Session = Depends(get_db)):
    vendor = execute_query(
        "SELECT * FROM users WHERE id = :id AND is_vendor = TRUE",
        {"id": vendor_id},
        fetch=True
    )
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor[0]
