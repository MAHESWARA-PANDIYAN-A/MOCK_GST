from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8002, reload=True)
