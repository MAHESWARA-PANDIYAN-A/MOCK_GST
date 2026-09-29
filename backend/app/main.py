from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import Base, engine, get_db
from app.routers import auth, applicant, officer, admin, integrations, files
from app.services.seed_service import seed_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and seed data
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        seed_database(db)
    finally:
        db.close()
    yield
    # Shutdown logic if any

app = FastAPI(
    title="Simulated GST Registration Portal API (SIH26130 Prototype)",
    description=(
        "**NOTE: This is a simulated GST Registration Prototype for the SIH26130 hackathon project.**\n\n"
        "It is NOT the official Government of India / GST Portal. "
        "It provides standard REST endpoints for simulated applicant registration, multi-step GST application filing, "
        "document verification, officer review, query management, and authenticated integration with the Main SIH Portal."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For prototype and flexible dev testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/api/health", tags=["System Health"])
def health_check(db: Session = Depends(get_db)):
    try:
        # Check database connectivity
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "ok",
        "service": "mock-gst-portal",
        "prototype": "SIH26130 Simulated GST Workflow",
        "database": db_status,
        "version": settings.VERSION
    }

# Include Routers
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(applicant.router, prefix=settings.API_PREFIX)
app.include_router(officer.router, prefix=settings.API_PREFIX)
app.include_router(admin.router, prefix=settings.API_PREFIX)
app.include_router(integrations.router, prefix=settings.API_PREFIX)
app.include_router(files.router, prefix=settings.API_PREFIX)

# Frontend static files and SPA client-side routing
possible_dist_dirs = [
    Path(__file__).resolve().parent.parent.parent / "frontend" / "dist",  # Local repo root / frontend / dist
    Path(__file__).resolve().parent.parent / "frontend" / "dist",         # backend / frontend / dist
    Path("/app/frontend/dist"),                                           # Docker container
    Path("/app/dist"),
    Path("frontend/dist").resolve(),
    Path("dist").resolve(),
]

frontend_dist = None
for p in possible_dist_dirs:
    if p.exists() and (p / "index.html").exists():
        frontend_dist = p
        break

if frontend_dist:
    assets_path = frontend_dist / "assets"
    if assets_path.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_path)), name="static_assets")

    @app.get("/", include_in_schema=False)
    async def serve_root():
        return FileResponse(frontend_dist / "index.html")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path in ["api", "docs", "redoc", "openapi.json"]:
            raise HTTPException(status_code=404, detail="API endpoint not found")
        
        file_path = frontend_dist / full_path
        if file_path.is_file():
            return FileResponse(file_path)
            
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/", include_in_schema=False)
    async def root_api():
        return {
            "service": "Mock GST Registration Portal API",
            "prototype": "SIH26130 Simulated GST Workflow",
            "docs": "/docs",
            "health": "/api/health"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8002, reload=True)
