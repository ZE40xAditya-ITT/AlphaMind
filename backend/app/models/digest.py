from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from app.db.base import Base

class WeeklyDigest(Base):
    __tablename__ = "weekly_digests"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    digest_date = Column(DateTime, nullable=False)
    market_summary = Column(JSON, nullable=True)
    portfolio_summary = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    watchlist_insights = Column(JSON, nullable=True)
    news_summary = Column(JSON, nullable=True)
    ai_suggestions = Column(JSON, nullable=True)
    pdf_path = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
