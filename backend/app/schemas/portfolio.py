from pydantic import BaseModel
from typing import List, Optional

class PortfolioStockCreate(BaseModel):
    symbol: str
    quantity: float
    average_buy_price: float

class PortfolioStockResponse(BaseModel):
    id: int
    symbol: str
    quantity: float
    average_buy_price: float

    class Config:
        from_attributes = True

class PortfolioCreate(BaseModel):
    name: str

class PortfolioResponse(BaseModel):
    id: int
    name: str
    stocks: List[PortfolioStockResponse]

    class Config:
        from_attributes = True

class PortfolioAssetBreakdown(BaseModel):
    id: int
    symbol: str
    quantity: float
    average_buy_price: float
    current_price: float
    current_value: float
    total_invested: float
    return_pct: float
    return_abs: float

class PortfolioAnalysisResponse(BaseModel):
    total_value: float
    total_invested: float
    overall_return_pct: float
    diversification_score: float
    ai_insights: List[str]
    sector_allocation: dict
    asset_breakdown: List[PortfolioAssetBreakdown] = []
