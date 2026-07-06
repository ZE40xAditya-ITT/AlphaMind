from app.db.base_class import Base

# Import models below to allow Alembic to discover them without circular imports
from app.models.user import User
from app.models.search_history import SearchHistory
from app.models.invoice import Invoice
from app.models.institutional_holding import InstitutionalHolding
from app.models.news_cache import NewsCache
from app.models.portfolio import Portfolio, PortfolioStock
