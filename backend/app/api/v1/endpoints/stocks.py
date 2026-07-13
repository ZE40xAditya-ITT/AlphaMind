from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.limiter import limiter

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
@limiter.limit("30/minute")
def analyze_stock(
    symbol: str,
    request: Request,
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

@router.get("/chart/{symbol}")
@limiter.limit("30/minute")
def get_chart_data(
    symbol: str,
    request: Request,
    interval: str = "1d",
    period: str = "1y",
    current_user: User = Depends(get_current_user)
):
    """Fetch structured OHLCV and moving average series for Lightweight Charts."""
    try:
        import pandas as pd
        import numpy as np
        from datetime import datetime, timedelta

        clean_sym = symbol.strip().upper()
        ticker_sym = clean_sym if clean_sym.endswith(".NS") or clean_sym.endswith(".BO") or clean_sym.endswith("^") else f"{clean_sym}.NS"

        df = market_provider.get_chart_data(ticker_sym, period=period, interval=interval)

        if df is None or df.empty:
            # Fallback generator for offline/missing data
            periods = 250
            start_date = datetime.now() - timedelta(days=365)
            dates = [start_date + timedelta(days=i) for i in range(periods)]
            base_price = 1500.0 if "RELIANCE" in clean_sym else 3500.0 if "TCS" in clean_sym else 1000.0

            np.random.seed(abs(hash(clean_sym)) % (2**32))
            changes = np.random.normal(0.001, 0.015, periods)
            prices = base_price * np.cumprod(1 + changes)

            candles = []
            sma50 = []
            sma200 = []

            for i, p in enumerate(prices):
                dt_str = dates[i].strftime("%Y-%m-%d")
                high = p * (1 + abs(np.random.normal(0, 0.01)))
                low = p * (1 - abs(np.random.normal(0, 0.01)))
                open_p = low + (high - low) * 0.5
                candles.append({
                    "time": dt_str,
                    "open": round(open_p, 2),
                    "high": round(high, 2),
                    "low": round(low, 2),
                    "close": round(p, 2),
                    "volume": int(np.random.uniform(500000, 5000000))
                })
                if i >= 50:
                    sma50.append({"time": dt_str, "value": round(np.mean(prices[i-50:i]), 2)})
                if i >= 200:
                    sma200.append({"time": dt_str, "value": round(np.mean(prices[i-200:i]), 2)})

            return {"symbol": clean_sym, "candles": candles, "sma50": sma50, "sma200": sma200}

        df = df.reset_index()
        df["time"] = pd.to_datetime(df["Date"]).dt.strftime("%Y-%m-%d")

        df["SMA_50"] = df["Close"].rolling(window=50).mean()
        df["SMA_200"] = df["Close"].rolling(window=200).mean()

        candles = [
            {
                "time": str(row["time"]),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row.get("Volume", 0))
            }
            for _, row in df.iterrows()
        ]

        sma50 = [
            {"time": str(r["time"]), "value": round(float(r["SMA_50"]), 2)}
            for _, r in df.dropna(subset=["SMA_50"]).iterrows()
        ]

        sma200 = [
            {"time": str(r["time"]), "value": round(float(r["SMA_200"]), 2)}
            for _, r in df.dropna(subset=["SMA_200"]).iterrows()
        ]

        return {"symbol": clean_sym, "candles": candles, "sma50": sma50, "sma200": sma200}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate chart data: {str(e)}"
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
