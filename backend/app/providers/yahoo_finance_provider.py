import yfinance as yf
import pandas as pd
from typing import Dict, Any
from app.interfaces.market_data_interface import MarketDataProvider
import requests

class YahooFinanceProvider(MarketDataProvider):
    """
    Concrete implementation of MarketDataProvider using yfinance.
    """
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        })

    def _fetch_ticker(self, symbol: str):
        return yf.Ticker(symbol, session=self.session)

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
