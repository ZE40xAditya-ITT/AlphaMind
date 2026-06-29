from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.sql import func
from app.db.base import Base

class ResearchReport(Base):
    __tablename__ = "research_reports"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    query = Column(String, nullable=False)
    status = Column(String, default="pending")
    candidates = Column(JSON, nullable=True)
    generated_report = Column(Text, nullable=True)
    pdf_path = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
