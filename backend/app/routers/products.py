from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from typing import List, Optional
from ..models import ProductCreate, ProductUpdate, Product, ProductWithVendor
from ..database import execute_query
from ..dependencies import get_current_active_user, require_vendor, require_admin
import shutil
import os
import uuid

router = APIRouter()

UPLOAD_DIR = "assets/products"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/categories")
async def get_categories():
    categories = execute_query("SELECT * FROM categories", fetch=True)
    return categories

@router.get("/", response_model=List[ProductWithVendor])
async def get_products(
    skip: int = 0,
    limit: int = 20,
    category_id: Optional[int] = None,
    vendor_id: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = "created_at"
):
    query = """
        SELECT p.*, v.business_name as vendor_name, c.name as category_name
        FROM products p
        JOIN vendors v ON p.vendor_id = v.id
        JOIN categories c ON p.category_id = c.id
        WHERE 1=1
    """
    params = []
    
    if category_id:
        query += " AND p.category_id = ?"
        params.append(category_id)
    if vendor_id:
        query += " AND p.vendor_id = ?"
        params.append(vendor_id)
    if min_price is not None and min_price > 0:
        query += " AND p.price >= ?"
        params.append(min_price)
    if max_price is not None and max_price > 0:
        query += " AND p.price <= ?"
        params.append(max_price)
    if search:
        query += " AND (p.name LIKE ? OR p.description LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%"])
    
    sort_mapping = {
        "price_asc": "p.price ASC",
        "price_desc": "p.price DESC",
        "name": "p.name ASC",
        "rating": "p.average_rating DESC",
        "created_at": "p.created_at DESC"
    }
    query += f" ORDER BY {sort_mapping.get(sort_by, 'p.created_at DESC')}"
    query += " LIMIT ? OFFSET ?"
    params.extend([limit, skip])
    
    products = execute_query(query, tuple(params), fetch=True)
    return products

@router.get("/{product_id}", response_model=ProductWithVendor)
async def get_product(product_id: int):
    product = execute_query(
        """SELECT p.*, v.business_name as vendor_name, c.name as category_name
           FROM products p
           JOIN vendors v ON p.vendor_id = v.id
           JOIN categories c ON p.category_id = c.id
           WHERE p.id = ?""",
        (product_id,),
        fetch=True
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product[0]

@router.post("/", response_model=Product)
async def create_product(
    product: ProductCreate,
    current_user: dict = Depends(require_vendor)
):
    vendor = execute_query("SELECT id FROM vendors WHERE user_id = ?", (current_user["id"],), fetch=True)
    if not vendor:
        raise HTTPException(status_code=400, detail="Vendor profile not found")
    
    product_id = execute_query(
        """INSERT INTO products (name, description, price, stock_quantity, category_id, vendor_id, sku)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (product.name, product.description, product.price, product.stock_quantity,
         product.category_id, vendor[0]["id"], product.sku or str(uuid.uuid4())[:8].upper())
    )
    
    return execute_query("SELECT * FROM products WHERE id = ?", (product_id,), fetch=True)[0]

@router.put("/{product_id}", response_model=Product)
async def update_product(
    product_id: int,
    product: ProductUpdate,
    current_user: dict = Depends(require_vendor)
):
    existing = execute_query("SELECT * FROM products WHERE id = ?", (product_id,), fetch=True)
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    vendor = execute_query("SELECT id FROM vendors WHERE user_id = ?", (current_user["id"],), fetch=True)
    if not vendor or existing[0]["vendor_id"] != vendor[0]["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this product")
    
    update_data = product.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    set_clause = ", ".join([f"{k} = ?" for k in update_data.keys()])
    values = list(update_data.values()) + [product_id]
    
    execute_query(f"UPDATE products SET {set_clause} WHERE id = ?", tuple(values))
    return execute_query("SELECT * FROM products WHERE id = ?", (product_id,), fetch=True)[0]

@router.delete("/{product_id}")
async def delete_product(product_id: int, current_user: dict = Depends(require_vendor)):
    existing = execute_query("SELECT * FROM products WHERE id = ?", (product_id,), fetch=True)
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    vendor = execute_query("SELECT id FROM vendors WHERE user_id = ?", (current_user["id"],), fetch=True)
    if not vendor or existing[0]["vendor_id"] != vendor[0]["id"]:
        if current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Not authorized")
    
    execute_query("DELETE FROM products WHERE id = ?", (product_id,))
    return {"message": "Product deleted successfully"}

@router.post("/{product_id}/upload-image")
async def upload_image(
    product_id: int,
    file: UploadFile = File(...),
    current_user: dict = Depends(require_vendor)
):
    file_ext = file.filename.split(".")[-1]
    file_name = f"{uuid.uuid4()}.{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    execute_query(
        "UPDATE products SET images = ? WHERE id = ?",
        (f"/assets/products/{file_name}", product_id)
    )
    
    return {"filename": file_name, "path": f"/assets/products/{file_name}"}
