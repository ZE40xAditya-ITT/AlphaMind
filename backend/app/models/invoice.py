from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.base_class import Base
class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    invoice_number = Column(String(50), unique=True, nullable=False)
    total_searches = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False)
    invoice_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    pdf_path = Column(String(500), nullable=True)
    is_paid = Column(Boolean, default=False, nullable=False)
    # Relationship
    user = relationship("User", backref="invoices")
