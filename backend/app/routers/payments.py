from fastapi import APIRouter, Depends, HTTPException
from ..models import PaymentCreate, Payment
from ..database import execute_query
from ..dependencies import get_current_active_user
from ..services.mpesa import initiate_mpesa_payment, query_mpesa_transaction
import uuid

router = APIRouter()

@router.post("/mpesa/initiate")
async def initiate_payment(
    payment: PaymentCreate,
    current_user: dict = Depends(get_current_active_user)
):
    order = execute_query("SELECT * FROM orders WHERE id = ?", (payment.order_id,), fetch=True)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order[0]["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if order[0]["status"] != "pending":
        raise HTTPException(status_code=400, detail="Order already processed")
    
    phone = payment.phone_number
    if phone.startswith("0"):
        phone = "254" + phone[1:]
    elif phone.startswith("+"):
        phone = phone[1:]
    
    transaction_id = str(uuid.uuid4())
    payment_id = execute_query(
        """INSERT INTO payments (order_id, amount, phone_number, transaction_id, status)
           VALUES (?, ?, ?, ?, ?)""",
        (payment.order_id, payment.amount, phone, transaction_id, "pending")
    )
    
    try:
        response = initiate_mpesa_payment(phone, payment.amount, transaction_id)
        return {
            "payment_id": payment_id,
            "transaction_id": transaction_id,
            "status": "pending",
            "message": "M-Pesa payment initiated. Check your phone to complete payment.",
            "response": response
        }
    except Exception as e:
        execute_query("UPDATE payments SET status = ? WHERE id = ?", ("failed", payment_id))
        raise HTTPException(status_code=500, detail=f"Payment initiation failed: {str(e)}")

@router.post("/mpesa/callback/{transaction_id}")
async def mpesa_callback(transaction_id: str, callback_data: dict):
    result_code = callback_data.get("Body", {}).get("stkCallback", {}).get("ResultCode", 1)
    
    payment = execute_query(
        "SELECT * FROM payments WHERE transaction_id = ?",
        (transaction_id,),
        fetch=True
    )
    if not payment:
        return {"message": "Payment not found"}
    
    if result_code == 0:
        execute_query(
            "UPDATE payments SET status = ? WHERE transaction_id = ?",
            ("completed", transaction_id)
        )
        execute_query(
            "UPDATE orders SET status = ? WHERE id = ?",
            ("paid", payment[0]["order_id"])
        )
        return {"message": "Payment successful"}
    else:
        execute_query(
            "UPDATE payments SET status = ? WHERE transaction_id = ?",
            ("failed", transaction_id)
        )
        return {"message": "Payment failed"}

@router.get("/{payment_id}", response_model=Payment)
async def get_payment(payment_id: int, current_user: dict = Depends(get_current_active_user)):
    payment = execute_query("SELECT * FROM payments WHERE id = ?", (payment_id,), fetch=True)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    order = execute_query("SELECT user_id FROM orders WHERE id = ?", (payment[0]["order_id"],), fetch=True)
    if order[0]["user_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return payment[0]
