from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user, get_admin_user
from app.schemas.history import SearchHistoryResponse
from app.services import history_service
from app.models.user import User

router = APIRouter()

@router.get("", response_model=list[SearchHistoryResponse])
def get_my_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve search history for the authenticated user."""
    return history_service.get_user_history(db, current_user.id)

@router.get("/user/{user_id}", response_model=list[SearchHistoryResponse])
def get_user_history(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_admin_user)
):
    """Retrieve search history of a specific user (Admin only)."""
    return history_service.get_user_history(db, user_id)
