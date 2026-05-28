from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    CUSTOMER = "customer"
    VENDOR = "vendor"
    ADMIN = "admin"

class OrderStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"

# User Models
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: str
    role: UserRole = UserRole.CUSTOMER

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class User(UserBase):
    id: int
    is_active: bool = True
    created_at: datetime
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

# Vendor Models
class VendorBase(BaseModel):
    business_name: str
    business_description: Optional[str] = None
    business_address: str
    business_phone: str
    kra_pin: str

class VendorCreate(VendorBase):
    pass

class Vendor(VendorBase):
    id: int
    user_id: int
    is_verified: bool = False
    rating: float = 0.0
    created_at: datetime
    class Config:
        from_attributes = True

# Category Models
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Product Models
class ProductBase(BaseModel):
    name: str
    description: str
    price: float = Field(..., gt=0)
    stock_quantity: int = Field(..., ge=0)
    category_id: int
    images: Optional[str] = None
    sku: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock_quantity: Optional[int] = None
    category_id: Optional[int] = None
    images: Optional[str] = None

class Product(ProductBase):
    id: int
    vendor_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    average_rating: float = 0.0
    class Config:
        from_attributes = True

class ProductWithVendor(Product):
    vendor_name: str
    category_name: str

# Cart Models
class CartItem(BaseModel):
    product_id: int
    quantity: int = Field(..., ge=1)

class CartItemResponse(CartItem):
    id: int
    user_id: int
    product_name: str
    product_price: float
    product_image: Optional[str] = None
    total_price: float

# Order Models
class OrderItemBase(BaseModel):
    product_id: int
    quantity: int
    unit_price: float

class OrderCreate(BaseModel):
    shipping_address: str
    shipping_phone: str
    items: List[OrderItemBase]

class Order(BaseModel):
    id: int
    user_id: int
    total_amount: float
    status: OrderStatus
    shipping_address: str
    shipping_phone: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    class Config:
        from_attributes = True

class OrderWithItems(Order):
    items: List[dict] = []

# Payment Models
class PaymentCreate(BaseModel):
    order_id: int
    phone_number: str
    amount: float

class Payment(BaseModel):
    id: int
    order_id: int
    amount: float
    phone_number: str
    transaction_id: Optional[str] = None
    status: PaymentStatus
    created_at: datetime
    class Config:
        from_attributes = True

# Review Models
class ReviewCreate(BaseModel):
    product_id: int
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class Review(ReviewCreate):
    id: int
    user_id: int
    user_name: str
    created_at: datetime
    class Config:
        from_attributes = True

# Admin Models
class DashboardStats(BaseModel):
    total_users: int
    total_vendors: int
    total_products: int
    total_orders: int
    total_revenue: float
    pending_orders: int