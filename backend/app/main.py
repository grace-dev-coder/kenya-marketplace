from fastapi import FastAPI, HTTPException, Request
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

# Import routers FIRST (before static file serving)
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

# Mount admin at /admin (no conflict with API)
if ADMIN_DIR:
    app.mount("/admin", StaticFiles(directory=ADMIN_DIR, html=True), name="admin")
    print(f"[MOUNT] Admin panel served at /admin")
else:
    print("[WARN] Admin directory not found")

# ─── SERVE FRONTEND WITH EXPLICIT ROUTE (not StaticFiles mount at /) ──────────
# StaticFiles mounted at / would catch ALL requests including /api/* and /docs
# We use an explicit route instead so API routes are checked first

if FRONTEND_DIR:
    print(f"[MOUNT] Frontend will be served from {FRONTEND_DIR}")

    @app.get("/{file_path:path}")
    async def serve_frontend(file_path: str, request: Request):
        # NEVER serve API routes, docs, or health through this fallback
        if file_path.startswith("api/") or file_path.startswith("docs") or file_path.startswith("openapi") or file_path == "health":
            raise HTTPException(status_code=404, detail="Not found")

        # Build the file path securely
        safe_path = os.path.normpath(os.path.join(FRONTEND_DIR, file_path))

        # Security: prevent directory traversal attacks
        if not safe_path.startswith(os.path.normpath(FRONTEND_DIR)):
            raise HTTPException(status_code=403, detail="Forbidden")

        # If requesting a directory or non-existent file, serve index.html (SPA fallback)
        if os.path.isdir(safe_path) or not os.path.exists(safe_path):
            index_path = os.path.join(FRONTEND_DIR, "index.html")
            if os.path.exists(index_path):
                return FileResponse(index_path)
            raise HTTPException(status_code=404, detail="Frontend index.html not found")

        # Serve the requested file
        return FileResponse(safe_path)
else:
    print("[WARN] Frontend directory not found")

@app.get("/health")
async def health():
    return {"status": "ok", "admin_dir": ADMIN_DIR, "frontend_dir": FRONTEND_DIR}
