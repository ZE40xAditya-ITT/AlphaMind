import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.router import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="NSE-focused stock intelligence platform with transparent ranking system",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.on_event("startup")
def on_startup():
    """Create required directories and initialize database tables on startup."""
    os.makedirs(settings.INVOICE_DIR, exist_ok=True)
    from app.db.base import Base
    from app.db.session import engine
    # Import models to register them with Base
    from app.models.user import User
    from app.models.search_history import SearchHistory
    from app.models.watchlist import Watchlist
    from app.models.invoice import Invoice
    Base.metadata.create_all(bind=engine)
    
    # Automatically seed the database with admin and demo users
    from app.utils.seed import seed_database
    seed_database()


@app.get("/")
def root():
    return {
        "message": "Welcome to AlphaMind AI",
        "docs": "/docs",
        "version": "1.0.0",
    }