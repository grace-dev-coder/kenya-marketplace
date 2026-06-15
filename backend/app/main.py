from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import traceback
import sys

app = FastAPI(title="Kenya Marketplace API")

origins = [
    "https://kenya-marketplace-frontend.onrender.com",
    "https://kenya-marketplace-admin.onrender.com",
    "http://localhost:8000",
    "http://localhost:3000",
    "http://127.0.0.1:5500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

@app.on_event("startup")
def on_startup():
    try:
        from app.database import init_db
        init_db()
        print("Database initialized successfully", file=sys.stderr)
    except Exception as e:
        print(f"Database init failed: {e}", file=sys.stderr)
        traceback.print_exc()

from app.routers import auth, products, orders, payments, vendors, admin, reviews

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(vendors.router)
app.include_router(admin.router)
app.include_router(reviews.router)

@app.get("/")
def root():
    return {"message": "Kenya Marketplace API", "status": "running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}