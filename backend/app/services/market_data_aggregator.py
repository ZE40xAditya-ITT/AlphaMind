import pandas as pd
from typing import Dict, Any, Tuple
from fastapi import HTTPException, status

from app.interfaces.market_data_interface import MarketDataProvider
from app.interfaces.company_info_interface import CompanyInfoProvider
from app.interfaces.cache_interface import CacheProvider

class MarketDataAggregator:
    def __init__(
        self,
        market_provider: MarketDataProvider,
        company_info_provider: CompanyInfoProvider,
        cache_provider: CacheProvider
    ):
        self.market_provider = market_provider
        self.company_info_provider = company_info_provider
        self.cache_provider = cache_provider

    def _normalize_symbol(self, symbol: str) -> str:
        """Normalize the stock symbol. Default to .NS (NSE) if no exchange suffix is present."""
        symbol = symbol.strip().upper()
        if not symbol:
            return ""
        if "." not in symbol:
            return f"{symbol}.NS"
        return symbol

    def _get_clean_symbol(self, symbol: str) -> str:
        """Extract symbol prefix without exchange suffix."""
        return symbol.split(".")[0]

    def get_market_data(self, raw_symbol: str) -> Tuple[str, pd.DataFrame, Dict[str, Any], str, str, float, str]:
        symbol = self._normalize_symbol(raw_symbol)
        if not symbol:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Stock symbol cannot be empty"
            )

        # 1. Check Cache
        cached_data = self.cache_provider.get(symbol)
        if cached_data:
            hist = cached_data['hist']
            info = cached_data['info']
        else:
            # 2. Fetch Historical Data
            hist = self.market_provider.get_historical_data(symbol)
            if hist.empty:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"No price data found for symbol {symbol}. Rate limits or invalid symbol."
                )

            # 3. Fetch Fundamental Data
            info = self.market_provider.get_company_info(symbol)
            if not info or len(info) <= 5:
                # Basic mock values if info is empty
                info = {
                    "longName": self._get_clean_symbol(symbol),
                    "sector": "Unknown",
                    "currentPrice": float(hist["Close"].iloc[-1]) if not hist.empty else 0.0
                }

            # Update Cache
            self.cache_provider.set(symbol, {'hist': hist, 'info': info}, ttl_seconds=900)

        # Extract metadata
        company_name = info.get("longName") or info.get("shortName") or self._get_clean_symbol(symbol)
        sector = info.get("sector")
        if not sector or sector == "Unknown":
            try:
                from app.services.portfolio_service import resolve_stock_sector
                sector = resolve_stock_sector(symbol, sector)
            except Exception:
                sector = "Diversified"

        # 4. Fetch Description
        description = info.get("longBusinessSummary") or info.get("description") or info.get("businessSummary")
        if not description or len(str(description).strip()) < 15:
            description = self.company_info_provider.get_description(company_name)
            
        if not description or len(str(description).strip()) < 15 or "currently unavailable" in str(description).lower():
            sec_label = sector if sector and sector != "Unknown" else "Diversified Industry"
            clean_sym = symbol.replace(".NS", "").replace(".BO", "").replace("^", "")
            description = f"{company_name} ({clean_sym}) is a prominent Indian enterprise operating within the {sec_label} sector. The company engages in delivering core industry products, innovative technologies, and specialized services across domestic and international markets. Listed on the National Stock Exchange (NSE), it demonstrates strong operational capabilities and maintains a competitive strategic presence in India's growing economic landscape."

        current_price = info.get("currentPrice") or info.get("regularMarketPrice")
        if current_price is None and not hist.empty:
            current_price = float(hist["Close"].iloc[-1])
            
        return symbol, hist, info, company_name, sector, current_price, description

    def get_basic_info(self, raw_symbol: str) -> Dict[str, Any]:
        symbol = self._normalize_symbol(raw_symbol)
        info = self.market_provider.get_company_info(symbol)
        
        if not info or len(info) <= 5:
            # Fallback
            hist = self.market_provider.get_historical_data(symbol)
            if hist.empty:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Stock symbol {symbol} details could not be found."
                )
            price = float(hist["Close"].iloc[-1])
            return {
                "symbol": raw_symbol.strip().upper(),
                "company_name": self._get_clean_symbol(symbol),
                "sector": "Unknown",
                "industry": "Unknown",
                "current_price": price,
                "market_cap": None,
                "pe_ratio": None,
                "fifty_two_week_high": None,
                "fifty_two_week_low": None
            }

        company_name = info.get("longName") or info.get("shortName") or self._get_clean_symbol(symbol)
        
        return {
            "symbol": raw_symbol.strip().upper(),
            "company_name": company_name,
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            "current_price": info.get("currentPrice") or info.get("regularMarketPrice") or info.get("navPrice"),
            "market_cap": info.get("marketCap"),
            "pe_ratio": info.get("trailingPE"),
            "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
            "fifty_two_week_low": info.get("fiftyTwoWeekLow")
        }
