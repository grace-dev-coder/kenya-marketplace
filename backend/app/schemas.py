from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# ─── User Schemas ─────────────────────────────

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_vendor: bool = False
    is_admin: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ─── Product Schemas ─────────────────────────

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category: str
    image_url: Optional[str] = None
    stock: int = 0

class ProductCreate(ProductBase):
    pass

class ProductResponse(ProductBase):
    id: int
    vendor_id: Optional[int] = None
    is_active: bool = True
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ─── Order Schemas ───────────────────────────

class OrderItemBase(BaseModel):
    product_id: int
    quantity: int

class OrderItemResponse(OrderItemBase):
    id: int
    price_at_time: float

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    total_amount: Optional[float] = None
    status: Optional[str] = "pending"
    payment_method: Optional[str] = None

class OrderCreate(OrderBase):
    items: List[OrderItemBase]

class OrderResponse(OrderBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None
    items: Optional[List[OrderItemResponse]] = []

    class Config:
        from_attributes = True

# ─── Review Schemas ──────────────────────────

class ReviewBase(BaseModel):
    product_id: int
    rating: int  # 1-5
    comment: Optional[str] = None

class ReviewResponse(ReviewBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ─── Payment / M-Pesa Schemas ────────────────

class PaymentRequest(BaseModel):
    phone_number: str  # Format: 2547XXXXXXXX
    amount: float
    order_id: int

class PaymentResponse(BaseModel):
    success: bool
    message: str
    transaction_id: Optional[str] = None

# ─── Auth Schemas ────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None