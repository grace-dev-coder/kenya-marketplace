from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, execute_query

router = APIRouter(prefix="/api/payments", tags=["payments"])

@router.get("/")
def get_payments(db: Session = Depends(get_db)):
    payments = execute_query("SELECT * FROM payments LIMIT 100", fetch=True)
    return payments or []

@router.post("/")
def create_payment(payment: dict, db: Session = Depends(get_db)):
    try:
        execute_query(
            """INSERT INTO payments (order_id, amount, phone_number, status) 
               VALUES (:order_id, :amount, :phone_number, :status)""",
            {
                "order_id": payment.get("order_id"),
                "amount": payment.get("amount"),
                "phone_number": payment.get("phone_number"),
                "status": payment.get("status", "pending")
            }
        )
        return {"message": "Payment initiated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
