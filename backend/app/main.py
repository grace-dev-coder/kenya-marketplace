from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os

from app.database import engine, Base

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Kenya Marketplace API")

# CORS for frontend - MUST be before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers
from app.routers import auth, products, orders, payments, vendors, admin, reviews, cart
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(vendors.router)
app.include_router(admin.router)
app.include_router(reviews.router)
app.include_router(cart.router)

# ─── STATIC FILES SERVING ─────────────────────────────────────────

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

possible_paths = [
    os.path.join(BASE_DIR, ".."),
    os.path.join(BASE_DIR, "..", ".."),
    os.path.join(BASE_DIR, "static"),
    "/opt/render/project/src",
]

ADMIN_DIR = None
FRONTEND_DIR = None

for path in possible_paths:
    admin_candidate = os.path.join(path, "admin")
    frontend_candidate = os.path.join(path, "frontend")

    if ADMIN_DIR is None and os.path.exists(admin_candidate) and os.path.exists(os.path.join(admin_candidate, "index.html")):
        ADMIN_DIR = admin_candidate
        print(f"[STATIC] Found admin at: {ADMIN_DIR}")

    if FRONTEND_DIR is None and os.path.exists(frontend_candidate) and os.path.exists(os.path.join(frontend_candidate, "index.html")):
        FRONTEND_DIR = frontend_candidate
        print(f"[STATIC] Found frontend at: {FRONTEND_DIR}")

    if ADMIN_DIR and FRONTEND_DIR:
        break

if ADMIN_DIR:
    app.mount("/admin", StaticFiles(directory=ADMIN_DIR, html=True), name="admin")
    print(f"[MOUNT] Admin panel served at /admin")
else:
    print("[WARN] Admin directory not found")

# ─── KEY FIX: Serve frontend at ROOT / instead of /app ───────────

if FRONTEND_DIR:
    # Mount frontend static files at root "/" so product-detail.html works directly
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
    print(f"[MOUNT] Frontend app served at /")

    # Fallback for SPA-style routing - serve index.html for unmatched routes
    # BUT skip API routes so they don't get caught
    @app.get("/{full_path:path}")
    async def frontend_fallback(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi") or full_path == "health":
            raise HTTPException(status_code=404, detail="Not found")
        
        # Try to serve the exact file first
        requested_file = os.path.join(FRONTEND_DIR, full_path)
        if os.path.exists(requested_file) and os.path.isfile(requested_file):
            return FileResponse(requested_file)
        
        # Fallback to index.html for client-side routing
        index_path = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        raise HTTPException(status_code=404, detail="Frontend index.html not found")
else:
    print("[WARN] Frontend directory not found")

@app.get("/health")
async def health():
    return {"status": "ok", "admin_dir": ADMIN_DIR, "frontend_dir": FRONTEND_DIR}