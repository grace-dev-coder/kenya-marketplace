from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ==================== USER SCHEMAS ====================

class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_admin: bool = False
    is_vendor: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_admin: bool = False


# ==================== PRODUCT SCHEMAS ====================

class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    category: str
    image_url: Optional[str] = None
    stock: int = 0

class ProductCreate(ProductBase):
    vendor_id: Optional[int] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    stock: Optional[int] = None
    vendor_id: Optional[int] = None

class Product(ProductBase):
    id: int
    vendor_id: Optional[int] = None
    is_active: bool = True
    created_at: datetime

    class Config:
        from_attributes = True

# Alias for backward compatibility with routers
ProductResponse = Product


# ==================== ORDER SCHEMAS ====================

class OrderBase(BaseModel):
    user_id: int
    total_amount: float
    status: str = "pending"
    payment_method: Optional[str] = None

class OrderCreate(OrderBase):
    pass

class Order(OrderBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== PAYMENT SCHEMAS ====================

class PaymentBase(BaseModel):
    order_id: int
    amount: float
    phone_number: str
    status: str = "pending"

class PaymentCreate(PaymentBase):
    pass

class Payment(PaymentBase):
    id: int
    transaction_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== REVIEW SCHEMAS ====================

class ReviewBase(BaseModel):
    product_id: int
    user_id: int
    rating: int
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    pass

class Review(ReviewBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== RESPONSE SCHEMAS ====================

class MessageResponse(BaseModel):
    message: str

class ErrorResponse(BaseModel):
    detail: str