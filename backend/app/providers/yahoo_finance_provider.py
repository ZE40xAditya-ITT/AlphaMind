import yfinance as yf
import pandas as pd
from typing import Dict, Any
from app.interfaces.market_data_interface import MarketDataProvider
import requests
import random

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0"
]

class YahooFinanceProvider(MarketDataProvider):
    """
    Concrete implementation of MarketDataProvider using yfinance.
    """
    
    def _fetch_ticker(self, symbol: str):
        # Rotate user-agent for each request to avoid rate limits
        session = requests.Session()
        session.headers.update({
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        })
        return yf.Ticker(symbol, session=session)

    def get_historical_data(self, symbol: str) -> pd.DataFrame:
        ticker = self._fetch_ticker(symbol)
        try:
            hist = ticker.history(period="1y")
        except Exception:
            hist = pd.DataFrame()
            
        if hist.empty:
            try:
                # Fallback to yf.download which sometimes bypasses certain restrictions
                hist = yf.download(tickers=symbol, period="1y", progress=False)
                if not hist.empty and isinstance(hist.columns, pd.MultiIndex):
                    hist.columns = hist.columns.droplevel('Ticker')
            except Exception:
                pass
                
        return hist

    def get_company_info(self, symbol: str) -> Dict[str, Any]:
        ticker = self._fetch_ticker(symbol)
        try:
            return ticker.info
        except Exception:
            return {}
