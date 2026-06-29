from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.watchlist import Watchlist
from app.schemas.watchlist import WatchlistCreate, WatchlistResponse

router = APIRouter()

@router.post("", response_model=WatchlistResponse)
def add_to_watchlist(
    item: WatchlistCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a stock to the user's watchlist."""
    symbol = item.stock_symbol.strip().upper()
    
    # Check if already exists
    existing = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id,
        Watchlist.stock_symbol == symbol
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Stock already in watchlist")
        
    db_item = Watchlist(user_id=current_user.id, stock_symbol=symbol)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("", response_model=list[WatchlistResponse])
def get_watchlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve the user's watchlist."""
    return db.query(Watchlist).filter(Watchlist.user_id == current_user.id).order_by(Watchlist.added_at.desc()).all()

@router.delete("/{symbol}")
def remove_from_watchlist(
    symbol: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a stock from the watchlist."""
    item = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id,
        Watchlist.stock_symbol == symbol.strip().upper()
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Stock not found in watchlist")
        
    db.delete(item)
    db.commit()
    return {"message": "Removed from watchlist"}
