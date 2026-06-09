from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routers import auth, products, orders, payments, vendors, admin, reviews

# Create tables once
init_db()

app = FastAPI(title="Kenya Marketplace API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# No prefix here - it's in the router files
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
