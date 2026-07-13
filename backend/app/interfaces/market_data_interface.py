from abc import ABC, abstractmethod
import pandas as pd
from typing import Dict, Any

class MarketDataProvider(ABC):
    """
    Boundary interface for retrieving financial market data.
    Decouples the business logic from external libraries like yfinance.
    """

    @abstractmethod
    def get_historical_data(self, symbol: str) -> pd.DataFrame:
        """Fetch 1-year of daily historical price data."""
        pass

    @abstractmethod
    def get_company_info(self, symbol: str) -> Dict[str, Any]:
        """Fetch fundamental company information and current metrics."""
        pass

    @abstractmethod
    def get_chart_data(self, symbol: str, period: str = "1y", interval: str = "1d") -> pd.DataFrame:
        """Fetch historical chart time-series data for lightweight charts."""
        pass
