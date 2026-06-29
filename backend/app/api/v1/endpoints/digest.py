from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user, get_current_user_from_query
from app.models.user import User
from app.services.digest_service import DigestService
import os

router = APIRouter()
digest_service = DigestService()

@router.get("/latest")
def get_latest_digest(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    digest = digest_service.get_latest_digest(db, current_user.id)
    if not digest:
        raise HTTPException(status_code=404, detail="No digest found. Generate one first.")
    return {
        "id": digest.id, "digest_date": digest.digest_date,
        "market_summary": digest.market_summary, "portfolio_summary": digest.portfolio_summary,
        "recommendations": digest.recommendations, "watchlist_insights": digest.watchlist_insights,
        "news_summary": digest.news_summary, "ai_suggestions": digest.ai_suggestions,
        "has_pdf": bool(digest.pdf_path), "created_at": digest.created_at,
    }

@router.get("/history")
def get_digest_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    digests = digest_service.get_digest_history(db, current_user.id)
    return [{"id": d.id, "digest_date": d.digest_date, "created_at": d.created_at} for d in digests]

@router.post("/generate")
def generate_digest(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    digest = digest_service.generate_digest(db, current_user.id)
    return {
        "id": digest.id, "message": "Digest generated successfully",
        "digest_date": digest.digest_date, "ai_suggestions": digest.ai_suggestions,
    }

@router.get("/{digest_id}/download")
def download_digest_pdf(
    digest_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_query)
):
    digest = digest_service.get_digest_by_id(db, digest_id, current_user.id)
    if not digest:
        raise HTTPException(status_code=404, detail="Digest not found")
    if not digest.pdf_path or not os.path.exists(digest.pdf_path):
        raise HTTPException(status_code=404, detail="PDF not yet available")
    return FileResponse(digest.pdf_path, media_type="application/pdf",
                        filename=f"AlphaMind_Digest_{digest.id}.pdf")
