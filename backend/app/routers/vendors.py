from fastapi import APIRouter, Depends, HTTPException
from ..models import VendorCreate, Vendor
from ..database import execute_query
from ..dependencies import get_current_active_user, require_admin

router = APIRouter()

@router.post("/register", response_model=Vendor)
async def register_vendor(
    vendor: VendorCreate,
    current_user: dict = Depends(get_current_active_user)
):
    existing = execute_query(
        "SELECT id FROM vendors WHERE user_id = ?",
        (current_user["id"],),
        fetch=True
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already registered as vendor")
    
    execute_query("UPDATE users SET role = 'vendor' WHERE id = ?", (current_user["id"],))
    
    vendor_id = execute_query(
        """INSERT INTO vendors (user_id, business_name, business_description, business_address, business_phone, kra_pin)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (current_user["id"], vendor.business_name, vendor.business_description,
         vendor.business_address, vendor.business_phone, vendor.kra_pin)
    )
    
    return execute_query("SELECT * FROM vendors WHERE id = ?", (vendor_id,), fetch=True)[0]

@router.get("/my-store")
async def get_my_store(current_user: dict = Depends(get_current_active_user)):
    vendor = execute_query(
        "SELECT * FROM vendors WHERE user_id = ?",
        (current_user["id"],),
        fetch=True
    )
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor profile not found")
    
    products = execute_query(
        "SELECT * FROM products WHERE vendor_id = ?",
        (vendor[0]["id"],),
        fetch=True
    )
    
    orders = execute_query(
        """SELECT o.* FROM orders o
           JOIN order_items oi ON o.id = oi.order_id
           JOIN products p ON oi.product_id = p.id
           WHERE p.vendor_id = ?
           GROUP BY o.id""",
        (vendor[0]["id"],),
        fetch=True
    )
    
    return {
        "vendor": vendor[0],
        "products": products,
        "orders": orders
    }

@router.get("/", response_model=list[Vendor])
async def get_vendors(current_user: dict = Depends(require_admin)):
    return execute_query("SELECT * FROM vendors", fetch=True)

@router.put("/{vendor_id}/verify")
async def verify_vendor(vendor_id: int, current_user: dict = Depends(require_admin)):
    execute_query("UPDATE vendors SET is_verified = 1 WHERE id = ?", (vendor_id,))
    return {"message": "Vendor verified successfully"}
