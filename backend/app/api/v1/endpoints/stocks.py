from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.schemas.stock import StockAnalysisResponse, StockDetailsResponse, CompareResponse
from app.models.user import User

# Import the new decoupled services and providers
from app.services.stock_analysis_service import StockAnalysisService
from app.providers.yahoo_finance_provider import YahooFinanceProvider
from app.providers.finnhub_provider import FinnhubProvider
from app.providers.fallback_market_provider import FallbackMarketDataProvider
from app.providers.wikipedia_provider import WikipediaProvider
from app.providers.memory_cache_provider import MemoryCacheProvider
from app.providers.mock_institutional_provider import MockInstitutionalProvider
from app.services.institutional_service import InstitutionalService
from app.providers.mock_news_provider import MockNewsProvider
from app.services.news_service import NewsService

from app.services.market_data_aggregator import MarketDataAggregator
from app.services.analysis_engine import AnalysisEngine

router = APIRouter()

# Instantiate providers (in a real app, these might be singletons or injected via a container)
yahoo_provider = YahooFinanceProvider()
finnhub_provider = FinnhubProvider()
market_provider = FallbackMarketDataProvider(primary=yahoo_provider, secondary=finnhub_provider)
company_info_provider = WikipediaProvider()
cache_provider = MemoryCacheProvider()
institutional_provider = MockInstitutionalProvider()
institutional_service = InstitutionalService(institutional_provider)
news_provider = MockNewsProvider()
news_service = NewsService(news_provider)

market_data_aggregator = MarketDataAggregator(
    market_provider=market_provider,
    company_info_provider=company_info_provider,
    cache_provider=cache_provider
)
analysis_engine = AnalysisEngine()

def get_stock_analysis_service() -> StockAnalysisService:
    """Dependency injection for StockAnalysisService."""
    return StockAnalysisService(
        market_data_aggregator=market_data_aggregator,
        analysis_engine=analysis_engine,
        institutional_service=institutional_service,
        news_service=news_service
    )

@router.get("/analyze/{symbol}", response_model=StockAnalysisResponse)
def analyze_stock(
    symbol: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    stock_service: StockAnalysisService = Depends(get_stock_analysis_service)
):
    """Run full Technical & Fundamental analysis on a stock symbol, logging it to search history."""
    try:
        return stock_service.analyze_stock(db, current_user.id, symbol)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during analysis: {str(e)}"
        )

@router.get("/details/{symbol}", response_model=StockDetailsResponse)
def get_stock_details(
    symbol: str,
    current_user: User = Depends(get_current_user),
    stock_service: StockAnalysisService = Depends(get_stock_analysis_service)
):
    """Fetch quick details of a stock symbol without executing a scoring run."""
    try:
        return stock_service.get_stock_details(symbol)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred fetching stock details: {str(e)}"
        )

@router.get("/compare", response_model=CompareResponse)
def compare_stocks(
    symbol1: str,
    symbol2: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    stock_service: StockAnalysisService = Depends(get_stock_analysis_service)
):
    """Compare two stocks by full analysis."""
    try:
        return stock_service.compare_stocks(db, current_user.id, symbol1, symbol2)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during comparison: {str(e)}"
        )
