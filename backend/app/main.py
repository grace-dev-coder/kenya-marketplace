from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, products, orders, payments, vendors, admin, reviews

app = FastAPI(title="Kenya Marketplace API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(products.router, prefix="/api/products", tags=["products"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])
app.include_router(payments.router, prefix="/api/payments", tags=["payments"])
app.include_router(vendors.router, prefix="/api/vendors", tags=["vendors"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["reviews"])

@app.get("/")
def root():
    return {"message": "Kenya Marketplace API", "status": "running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
