from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base
class SearchHistory(Base):
    __tablename__ = "search_history"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    stock_symbol = Column(String(20), nullable=False)
    stock_name = Column(String(255), nullable=True)
    technical_score = Column(Float, nullable=True)
    fundamental_score = Column(Float, nullable=True)
    final_score = Column(Float, nullable=True)
    recommendation = Column(String(50), nullable=True)
    searched_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    # Relationship
    user = relationship("User", backref="searches")