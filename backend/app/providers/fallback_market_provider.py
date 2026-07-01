import pandas as pd
from typing import Dict, Any
from app.interfaces.market_data_interface import MarketDataProvider

class FallbackMarketDataProvider(MarketDataProvider):
    """
    Tries the primary provider, and if it fails (returns empty), tries the secondary provider.
    """
    def __init__(self, primary: MarketDataProvider, secondary: MarketDataProvider):
        self.primary = primary
        self.secondary = secondary

    def get_historical_data(self, symbol: str) -> pd.DataFrame:
        df = self.primary.get_historical_data(symbol)
        if df is None or df.empty:
            df = self.secondary.get_historical_data(symbol)
        return df

    def get_company_info(self, symbol: str) -> Dict[str, Any]:
        info = self.primary.get_company_info(symbol)
        if not info or len(info) <= 5: # Some providers return empty or just a symbol dict
            sec_info = self.secondary.get_company_info(symbol)
            if sec_info and len(sec_info) > len(info):
                return sec_info
        return info
