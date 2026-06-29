from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class InstitutionalHolding(Base):
    __tablename__ = "institutional_holdings"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True, nullable=False)
    promoter_pct = Column(Float, nullable=False)
    fii_pct = Column(Float, nullable=False)
    dii_pct = Column(Float, nullable=False)
    public_pct = Column(Float, nullable=False)
    insight = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
