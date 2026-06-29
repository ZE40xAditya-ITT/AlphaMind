import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.router import api_router
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging

limiter = Limiter(key_func=get_remote_address)
logger = logging.getLogger(__name__)

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

# Rate Limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Unhandled exception on {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again later."},
    )


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
    from app.models.digest import WeeklyDigest
    from app.models.research_report import ResearchReport
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

@app.get("/health")
def health_check():
    return {"status": "ok", "version": "1.0.0"}