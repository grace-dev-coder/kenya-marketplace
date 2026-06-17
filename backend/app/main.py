from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
import os

from app.routers import auth, products, orders, payments, vendors, admin, reviews
from app.database import engine, Base

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Kenya Marketplace API")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(vendors.router)
app.include_router(admin.router)
app.include_router(reviews.router)

# ─── STATIC FILES SERVING ─────────────────────────────────────────

# Determine correct paths for both local dev and Render deployment
# Render runs from: /opt/render/project/src/backend/
# Local runs from:  /project/backend/
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Try multiple possible locations for admin/frontend folders
possible_paths = [
    os.path.join(BASE_DIR, ".."),           # sibling to backend/ (standard)
    os.path.join(BASE_DIR, "..", ".."),     # one level up
    os.path.join(BASE_DIR, "static"),       # inside backend/
    "/opt/render/project/src",              # Render specific
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

# Mount admin static files
if ADMIN_DIR:
    app.mount("/admin", StaticFiles(directory=ADMIN_DIR, html=True), name="admin")
    print(f"[MOUNT] Admin panel served at /admin")
else:
    print("[WARN] Admin directory not found")

# Mount frontend static files
if FRONTEND_DIR:
    app.mount("/app", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
    print(f"[MOUNT] Frontend app served at /app")
else:
    print("[WARN] Frontend directory not found")

# ─── ROOT & FALLBACK ROUTES ───────────────────────────────────────

@app.get("/")
async def root():
    return {
        "message": "Kenya Marketplace API",
        "version": "1.0.0",
        "endpoints": {
            "api_docs": "/docs",
            "admin_panel": "/admin" if ADMIN_DIR else "not configured",
            "frontend_app": "/app" if FRONTEND_DIR else "not configured"
        }
    }

# Fallback for admin deep links (SPA support)
# Must be registered AFTER app.mount, and catch-all must not conflict
if ADMIN_DIR:
    @app.get("/admin/{full_path:path}")
    async def admin_fallback(full_path: str):
        # Don't intercept API-like paths
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        
        index_path = os.path.join(ADMIN_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        raise HTTPException(status_code=404, detail="Admin index.html not found")

# Fallback for frontend deep links (SPA support)
if FRONTEND_DIR:
    @app.get("/app/{full_path:path}")
    async def frontend_fallback(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        
        index_path = os.path.join(FRONTEND_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        raise HTTPException(status_code=404, detail="Frontend index.html not found")

# Health check
@app.get("/health")
async def health():
    return {"status": "ok", "admin_dir": ADMIN_DIR, "frontend_dir": FRONTEND_DIR}