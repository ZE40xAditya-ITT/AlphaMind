from sqlalchemy.orm import Session
from app.models.search_history import SearchHistory

def save_search(
    db: Session,
    user_id: int,
    stock_symbol: str,
    stock_name: str | None,
    technical_score: float,
    fundamental_score: float,
    final_score: float,
    recommendation: str
) -> SearchHistory:
    """Save an execution of stock analysis to the user's search history."""
    db_history = SearchHistory(
        user_id=user_id,
        stock_symbol=stock_symbol,
        stock_name=stock_name,
        technical_score=technical_score,
        fundamental_score=fundamental_score,
        final_score=final_score,
        recommendation=recommendation
    )
    db.add(db_history)
    db.commit()
    db.refresh(db_history)
    return db_history

def get_user_history(db: Session, user_id: int) -> list[SearchHistory]:
    """Retrieve search history for a specific user, sorted by date descending."""
    return db.query(SearchHistory).filter(SearchHistory.user_id == user_id).order_by(SearchHistory.searched_at.desc()).all()

def get_all_history(db: Session) -> list[SearchHistory]:
    """Retrieve search history for all users, sorted by date descending."""
    return db.query(SearchHistory).order_by(SearchHistory.searched_at.desc()).all()

def get_search_count(db: Session, user_id: int) -> int:
    """Count total searches performed by a specific user."""
    return db.query(SearchHistory).filter(SearchHistory.user_id == user_id).count()
