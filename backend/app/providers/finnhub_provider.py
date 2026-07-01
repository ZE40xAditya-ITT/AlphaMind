import os
import requests
import pandas as pd
from typing import Dict, Any
from datetime import datetime, timedelta
from app.interfaces.market_data_interface import MarketDataProvider

class FinnhubProvider(MarketDataProvider):
    """
    Concrete implementation of MarketDataProvider using Finnhub REST API.
    Used as a fallback or primary provider when yfinance rate limits are hit.
    """
    def __init__(self):
        self.api_key = os.getenv("FINNHUB_API_KEY")
        self.base_url = "https://finnhub.io/api/v1"

    def is_configured(self) -> bool:
        return bool(self.api_key)

    def get_historical_data(self, symbol: str) -> pd.DataFrame:
        if not self.is_configured():
            return pd.DataFrame()
        
        # Finnhub expects symbols without .NS for US, but might need .BO or .NS for India
        # For simplicity, we just pass the symbol as is
        clean_symbol = symbol.replace(".NS", ".BO") # Finnhub often uses .BO for Indian stocks
        
        end = int(datetime.now().timestamp())
        start = int((datetime.now() - timedelta(days=365)).timestamp())
        
        url = f"{self.base_url}/stock/candle?symbol={clean_symbol}&resolution=D&from={start}&to={end}&token={self.api_key}"
        try:
            res = requests.get(url, timeout=5)
            data = res.json()
            if data.get("s") == "ok":
                df = pd.DataFrame({
                    "Date": pd.to_datetime(data["t"], unit="s"),
                    "Open": data["o"],
                    "High": data["h"],
                    "Low": data["l"],
                    "Close": data["c"],
                    "Volume": data["v"]
                })
                df.set_index("Date", inplace=True)
                return df
            return pd.DataFrame()
        except Exception:
            return pd.DataFrame()

    def get_company_info(self, symbol: str) -> Dict[str, Any]:
        if not self.is_configured():
            return {}
            
        clean_symbol = symbol.replace(".NS", ".BO")
        info = {}
        
        try:
            # Get Quote
            q_res = requests.get(f"{self.base_url}/quote?symbol={clean_symbol}&token={self.api_key}", timeout=5)
            if q_res.status_code == 200:
                q_data = q_res.json()
                if q_data and "c" in q_data and q_data["c"] != 0:
                    info["currentPrice"] = q_data["c"]
                    info["regularMarketPrice"] = q_data["c"]
                    info["previousClose"] = q_data["pc"]

            # Get Profile
            p_res = requests.get(f"{self.base_url}/stock/profile2?symbol={clean_symbol}&token={self.api_key}", timeout=5)
            if p_res.status_code == 200:
                p_data = p_res.json()
                if p_data:
                    info["shortName"] = p_data.get("name", symbol)
                    info["longName"] = p_data.get("name", symbol)
                    info["sector"] = p_data.get("finnhubIndustry", "Unknown")
                    info["marketCap"] = p_data.get("marketCapitalization", 0) * 1_000_000

            # Get Metrics
            m_res = requests.get(f"{self.base_url}/stock/metric?symbol={clean_symbol}&metric=all&token={self.api_key}", timeout=5)
            if m_res.status_code == 200:
                m_data = m_res.json()
                if "metric" in m_data:
                    metrics = m_data["metric"]
                    info["trailingPE"] = metrics.get("peBasicExclExtraTTM", 0)
                    info["returnOnEquity"] = metrics.get("roeTTM", 0) / 100.0 if metrics.get("roeTTM") else 0
                    info["debtToEquity"] = metrics.get("totalDebtToEquityQuarterly", 0) / 100.0 if metrics.get("totalDebtToEquityQuarterly") else 0
                    info["revenueGrowth"] = metrics.get("revenueGrowthTTMYoy", 0) / 100.0 if metrics.get("revenueGrowthTTMYoy") else 0
                    info["earningsGrowth"] = metrics.get("epsGrowthTTMYoy", 0) / 100.0 if metrics.get("epsGrowthTTMYoy") else 0

            return info
        except Exception:
            return info
