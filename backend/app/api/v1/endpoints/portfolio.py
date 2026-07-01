from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.portfolio import PortfolioCreate, PortfolioResponse, PortfolioStockCreate, PortfolioStockResponse, PortfolioAnalysisResponse
from app.services.portfolio_service import PortfolioService
from app.services.copilot_service import CopilotService
from app.api.v1.endpoints.stocks import get_stock_analysis_service
from app.api.v1.endpoints.copilot import get_copilot_service, CopilotResponse
from pydantic import BaseModel
from typing import List

router = APIRouter()

def get_portfolio_service(stock_service = Depends(get_stock_analysis_service)) -> PortfolioService:
    return PortfolioService(stock_service)

@router.post("/", response_model=PortfolioResponse)
def create_portfolio(
    data: PortfolioCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: PortfolioService = Depends(get_portfolio_service)
):
    """Create a new portfolio for the user."""
    return service.create_portfolio(db, current_user.id, data)

@router.get("/", response_model=List[PortfolioResponse])
def get_portfolios(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: PortfolioService = Depends(get_portfolio_service)
):
    """Get all portfolios for the current user."""
    return service.get_portfolios(db, current_user.id)

@router.delete("/{portfolio_id}")
def delete_portfolio(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: PortfolioService = Depends(get_portfolio_service)
):
    """Delete a portfolio."""
    service.delete_portfolio(db, current_user.id, portfolio_id)
    return {"status": "success", "message": "Portfolio deleted successfully"}

@router.post("/{portfolio_id}/stocks", response_model=PortfolioStockResponse)
def add_stock_to_portfolio(
    portfolio_id: int,
    data: PortfolioStockCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: PortfolioService = Depends(get_portfolio_service)
):
    """Add a stock holding to a specific portfolio."""
    return service.add_stock(db, portfolio_id, current_user.id, data)

@router.delete("/{portfolio_id}/stocks/{stock_id}")
def remove_stock_from_portfolio(
    portfolio_id: int,
    stock_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: PortfolioService = Depends(get_portfolio_service)
):
    """Remove a stock holding from a portfolio."""
    service.remove_stock(db, portfolio_id, current_user.id, stock_id)
    return {"status": "success", "message": "Stock removed from portfolio"}

class ReduceStockRequest(BaseModel):
    quantity: float

@router.post("/{portfolio_id}/stocks/{stock_id}/reduce")
def reduce_stock_in_portfolio(
    portfolio_id: int,
    stock_id: int,
    data: ReduceStockRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: PortfolioService = Depends(get_portfolio_service)
):
    """Reduce the quantity of a stock in a portfolio."""
    stock = service.reduce_stock(db, portfolio_id, current_user.id, stock_id, data.quantity)
    if stock is None:
        return {"status": "success", "message": "Stock removed from portfolio"}
    return stock

@router.get("/{portfolio_id}/analyze", response_model=PortfolioAnalysisResponse)
def analyze_portfolio(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: PortfolioService = Depends(get_portfolio_service)
):
    """Perform full AI-driven analysis on the entire portfolio."""
    return service.analyze_portfolio(db, portfolio_id, current_user.id)

class PortfolioCopilotRequest(BaseModel):
    question: str

@router.post("/{portfolio_id}/ask", response_model=CopilotResponse)
def ask_portfolio_copilot(
    portfolio_id: int,
    request: PortfolioCopilotRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    portfolio_service: PortfolioService = Depends(get_portfolio_service),
    copilot_service: CopilotService = Depends(get_copilot_service)
):
    """Ask the AI Copilot a question about a specific portfolio."""
    try:
        # Get portfolio analysis context
        analysis = portfolio_service.analyze_portfolio(db, portfolio_id, current_user.id)
        # Ask copilot
        answer = copilot_service.ask_portfolio_question(request.question, analysis)
        return CopilotResponse(answer=answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
