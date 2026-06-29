from datetime import datetime
from pydantic import BaseModel

class WatchlistCreate(BaseModel):
    stock_symbol: str

class WatchlistResponse(BaseModel):
    id: int
    user_id: int
    stock_symbol: str
    added_at: datetime

    class Config:
        from_attributes = True
