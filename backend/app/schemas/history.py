from datetime import datetime
from pydantic import BaseModel
class SearchHistoryResponse(BaseModel):
    id: int
    user_id: int
    stock_symbol: str
    stock_name: str | None = None
    technical_score: float | None = None
    fundamental_score: float | None = None
    final_score: float | None = None
    recommendation: str | None = None
    searched_at: datetime | None = None
    class Config:
        from_attributes = True