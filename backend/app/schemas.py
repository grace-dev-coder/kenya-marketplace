from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ==================== USER SCHEMAS ====================

class UserBase(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: str = "customer"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None

class User(UserBase):
    id: int
    is_active: bool = True
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[User] = None


# ==================== VENDOR SCHEMAS ====================

class VendorBase(BaseModel):
    business_name: str
    description: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class VendorCreate(VendorBase):
    user_id: int

class VendorUpdate(BaseModel):
    business_name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_verified: Optional[bool] = None

class Vendor(VendorBase):
    id: int
    user_id: int
    is_verified: bool = False
    rating: float = 0.0
    created_at: datetime

    class Config:
        from_attributes = True


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
    vendor_name: Optional[str] = None
    rating: float = 0.0
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==================== ORDER ITEM SCHEMAS ====================

class OrderItemBase(BaseModel):
    product_id: int
    quantity: int
    price: float

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: int
    order_id: int
    product_name: Optional[str] = None
    product_image: Optional[str] = None

    class Config:
        from_attributes = True


# ==================== ORDER SCHEMAS ====================

class OrderBase(BaseModel):
    shipping_address: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    shipping_address: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None

class Order(OrderBase):
    id: int
    user_id: int
    total_amount: float
    status: str = "pending"
    payment_status: str = "pending"
    payment_method: Optional[str] = None
    items: List[OrderItem] = []
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==================== REVIEW SCHEMAS ====================

class ReviewBase(BaseModel):
    rating: int
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    product_id: int

class ReviewUpdate(BaseModel):
    rating: Optional[int] = None
    comment: Optional[str] = None

class Review(ReviewBase):
    id: int
    product_id: int
    user_id: int
    user_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==================== PAYMENT SCHEMAS ====================

class PaymentBase(BaseModel):
    order_id: int
    amount: float
    phone: str

class PaymentCreate(PaymentBase):
    pass

class Payment(PaymentBase):
    id: int
    transaction_id: Optional[str] = None
    status: str = "pending"
    result_code: Optional[str] = None
    result_desc: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==================== CART SCHEMAS ====================

class CartItem(BaseModel):
    product_id: int
    quantity: int

class Cart(BaseModel):
    items: List[CartItem] = []
    total: float = 0.0


# ==================== ANALYTICS SCHEMAS ====================

class DashboardStats(BaseModel):
    total_users: int
    total_vendors: int
    total_products: int
    total_orders: int
    total_revenue: float
    pending_orders: int
    recent_orders: List[Order] = []
    top_products: List[Product] = []

class SalesData(BaseModel):
    labels: List[str]
    data: List[float]


# ==================== RESPONSE SCHEMAS ====================

class MessageResponse(BaseModel):
    message: str

class ErrorResponse(BaseModel):
    detail: str