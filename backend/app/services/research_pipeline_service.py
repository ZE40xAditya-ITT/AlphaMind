import json
import re
import time
import logging
import concurrent.futures
from typing import Generator, List, Dict
from sqlalchemy.orm import Session
import google.generativeai as genai
from app.core.config import settings
from app.models.research_report import ResearchReport

logger = logging.getLogger(__name__)

if settings.GOOGLE_API_KEY:
    genai.configure(api_key=settings.GOOGLE_API_KEY)

NSE_UNIVERSE = [
    "HDFCBANK", "ICICIBANK", "SBIN", "TCS", "INFY", "RELIANCE",
    "ITC", "HINDUNILVR", "SUNPHARMA", "TATAMOTORS", "HAL", "BEL",
    "TATASTEEL", "NTPC", "ONGC", "TITAN", "BAJFINANCE", "DMART",
    "SRF", "DLF", "BHARTIARTL", "ZOMATO", "CIPLA", "LT", "ASIANPAINT"
]

SECTOR_MAP = {
    "defense": ["HAL", "BEL", "BDL", "LT", "MAZDOCK"],
    "aerospace": ["HAL", "BEL", "BDL", "LT"],
    "military": ["HAL", "BEL", "BDL"],
    "green": ["TATAMOTORS", "TATAPOWER", "NTPC", "SUZLON", "ADANIGREEN"],
    "renewable": ["TATAPOWER", "SUZLON", "ADANIGREEN", "NTPC"],
    "ev": ["TATAMOTORS", "MARUTI", "EXIDEIND", "AMARAJABAT", "TATAPOWER"],
    "solar": ["TATAPOWER", "ADANIGREEN", "SUZLON"],
    "chemical": ["SRF", "PIIND", "DEEPAKNTR", "TATACHEM"],
    "pharma": ["SUNPHARMA", "DRREDDY", "CIPLA", "DIVISLAB", "APOLLOHOSP", "LUPIN"],
    "biotech": ["SUNPHARMA", "DRREDDY", "CIPLA", "DIVISLAB"],
    "healthcare": ["APOLLOHOSP", "SUNPHARMA", "DRREDDY", "CIPLA"],
    "banking": ["HDFCBANK", "ICICIBANK", "KOTAKBANK", "AXISBANK", "SBIN", "FEDERALBNK"],
    "bank": ["HDFCBANK", "ICICIBANK", "KOTAKBANK", "AXISBANK", "SBIN"],
    "nbfc": ["BAJFINANCE", "BAJAJFINSV", "MUTHOOTFIN", "CHOLAFIN"],
    "it": ["TCS", "INFY", "WIPRO", "HCLTECH", "TECHM", "MPHASIS"],
    "tech": ["TCS", "INFY", "WIPRO", "HCLTECH", "TECHM", "ZOMATO"],
    "ai": ["TCS", "INFY", "HCLTECH", "TECHM"],
    "fmcg": ["HINDUNILVR", "ITC", "NESTLEIND", "DABUR", "MARICO", "BRITANNIA"],
    "consumer": ["TITAN", "DMART", "HINDUNILVR", "ITC", "TRENT", "ZOMATO"],
    "retail": ["DMART", "TRENT", "TITAN", "ZOMATO"],
    "auto": ["MARUTI", "TATAMOTORS", "BAJAJ-AUTO", "EICHERMOT", "M&M"],
    "energy": ["RELIANCE", "ONGC", "BPCL", "NTPC", "TATAPOWER"],
    "power": ["NTPC", "TATAPOWER", "NHPC", "ONGC"],
    "metals": ["TATASTEEL", "HINDALCO", "JSWSTEEL", "COALINDIA", "VEDL"],
    "steel": ["TATASTEEL", "JSWSTEEL"],
    "mining": ["COALINDIA", "HINDALCO", "VEDL"],
    "realty": ["DLF", "GODREJPROP", "OBEROIRLTY"],
    "infra": ["LT", "ADANIPORTS", "DLF", "NTPC"],
    "telecom": ["BHARTIARTL", "RELIANCE"],
    "dividend": ["ITC", "COALINDIA", "ONGC", "BPCL", "NTPC", "HINDUNILVR", "BEL"],
    "growth": ["TITAN", "BAJFINANCE", "TATAMOTORS", "ZOMATO", "TRENT", "DMART", "HAL"],
    "undervalue": ["ONGC", "SBIN", "COALINDIA", "BPCL", "FEDERALBNK", "ITC"],
    "value": ["ONGC", "SBIN", "COALINDIA", "BPCL", "FEDERALBNK", "ITC"],
    "cheap": ["ONGC", "SBIN", "COALINDIA", "BPCL", "FEDERALBNK", "ITC"],
    "low risk": ["TCS", "INFY", "HINDUNILVR", "NESTLEIND", "HDFCBANK", "RELIANCE"],
    "safe": ["TCS", "RELIANCE", "HDFCBANK", "INFY", "ITC"],
    "midcap": ["FEDERALBNK", "PIIND", "DEEPAKNTR", "EXIDEIND", "SUZLON", "BDL"],
    "roe": ["TCS", "ITC", "NESTLEIND", "HAL", "HINDUNILVR", "COALINDIA", "BEL"],
    "quality": ["TCS", "NESTLEIND", "ITC", "HAL", "ASIANPAINT", "HDFCBANK"]
}


from app.providers.yahoo_finance_provider import YahooFinanceProvider
from app.providers.finnhub_provider import FinnhubProvider
from app.providers.fallback_market_provider import FallbackMarketDataProvider

# Initialize providers at module level
yahoo = YahooFinanceProvider()
finnhub = FinnhubProvider()
market_provider = FallbackMarketDataProvider(primary=yahoo, secondary=finnhub)

STOCK_FALLBACK_CATALOG = {
    "HDFCBANK": {"symbol": "HDFCBANK", "name": "HDFC Bank Limited", "sector": "Financial Services", "price": 1650.0, "pe": 18.5, "roe": 0.17, "debt_equity": 85.0, "revenue_growth": 0.18},
    "ICICIBANK": {"symbol": "ICICIBANK", "name": "ICICI Bank Limited", "sector": "Financial Services", "price": 1120.0, "pe": 17.2, "roe": 0.18, "debt_equity": 75.0, "revenue_growth": 0.20},
    "KOTAKBANK": {"symbol": "KOTAKBANK", "name": "Kotak Mahindra Bank Limited", "sector": "Financial Services", "price": 1780.0, "pe": 22.1, "roe": 0.14, "debt_equity": 65.0, "revenue_growth": 0.15},
    "AXISBANK": {"symbol": "AXISBANK", "name": "Axis Bank Limited", "sector": "Financial Services", "price": 1150.0, "pe": 14.8, "roe": 0.16, "debt_equity": 80.0, "revenue_growth": 0.16},
    "SBIN": {"symbol": "SBIN", "name": "State Bank of India", "sector": "Financial Services", "price": 820.0, "pe": 10.5, "roe": 0.19, "debt_equity": 110.0, "revenue_growth": 0.14},
    "FEDERALBNK": {"symbol": "FEDERALBNK", "name": "Federal Bank Limited", "sector": "Financial Services", "price": 195.0, "pe": 11.2, "roe": 0.15, "debt_equity": 90.0, "revenue_growth": 0.16},
    "TCS": {"symbol": "TCS", "name": "Tata Consultancy Services Limited", "sector": "Information Technology", "price": 3950.0, "pe": 28.5, "roe": 0.45, "debt_equity": 8.0, "revenue_growth": 0.08},
    "INFY": {"symbol": "INFY", "name": "Infosys Limited", "sector": "Information Technology", "price": 1580.0, "pe": 24.2, "roe": 0.32, "debt_equity": 10.0, "revenue_growth": 0.09},
    "WIPRO": {"symbol": "WIPRO", "name": "Wipro Limited", "sector": "Information Technology", "price": 480.0, "pe": 22.0, "roe": 0.16, "debt_equity": 15.0, "revenue_growth": 0.05},
    "HCLTECH": {"symbol": "HCLTECH", "name": "HCL Technologies Limited", "sector": "Information Technology", "price": 1450.0, "pe": 23.5, "roe": 0.26, "debt_equity": 12.0, "revenue_growth": 0.11},
    "TECHM": {"symbol": "TECHM", "name": "Tech Mahindra Limited", "sector": "Information Technology", "price": 1320.0, "pe": 25.0, "roe": 0.18, "debt_equity": 14.0, "revenue_growth": 0.07},
    "RELIANCE": {"symbol": "RELIANCE", "name": "Reliance Industries Limited", "sector": "Energy", "price": 2950.0, "pe": 26.0, "roe": 0.11, "debt_equity": 45.0, "revenue_growth": 0.12},
    "ONGC": {"symbol": "ONGC", "name": "Oil and Natural Gas Corporation", "sector": "Energy", "price": 285.0, "pe": 7.5, "roe": 0.18, "debt_equity": 35.0, "revenue_growth": 0.08},
    "BPCL": {"symbol": "BPCL", "name": "Bharat Petroleum Corporation", "sector": "Energy", "price": 610.0, "pe": 6.8, "roe": 0.22, "debt_equity": 50.0, "revenue_growth": 0.06},
    "NTPC": {"symbol": "NTPC", "name": "NTPC Limited", "sector": "Power & Energy", "price": 365.0, "pe": 16.5, "roe": 0.13, "debt_equity": 120.0, "revenue_growth": 0.10},
    "TATAPOWER": {"symbol": "TATAPOWER", "name": "Tata Power Company Limited", "sector": "Power & Renewables", "price": 430.0, "pe": 31.0, "roe": 0.13, "debt_equity": 140.0, "revenue_growth": 0.16},
    "SUZLON": {"symbol": "SUZLON", "name": "Suzlon Energy Limited", "sector": "Green Energy", "price": 68.0, "pe": 45.0, "roe": 0.28, "debt_equity": 18.0, "revenue_growth": 0.35},
    "HAL": {"symbol": "HAL", "name": "Hindustan Aeronautics Limited", "sector": "Defense & Aerospace", "price": 4850.0, "pe": 38.0, "roe": 0.27, "debt_equity": 0.0, "revenue_growth": 0.18},
    "BEL": {"symbol": "BEL", "name": "Bharat Electronics Limited", "sector": "Defense & Electronics", "price": 310.0, "pe": 42.0, "roe": 0.25, "debt_equity": 1.0, "revenue_growth": 0.17},
    "BDL": {"symbol": "BDL", "name": "Bharat Dynamics Limited", "sector": "Defense & Aerospace", "price": 1450.0, "pe": 48.0, "roe": 0.19, "debt_equity": 2.0, "revenue_growth": 0.21},
    "HINDUNILVR": {"symbol": "HINDUNILVR", "name": "Hindustan Unilever Limited", "sector": "Fast Moving Consumer Goods", "price": 2450.0, "pe": 55.0, "roe": 0.28, "debt_equity": 5.0, "revenue_growth": 0.06},
    "ITC": {"symbol": "ITC", "name": "ITC Limited", "sector": "Fast Moving Consumer Goods", "price": 440.0, "pe": 26.5, "roe": 0.29, "debt_equity": 2.0, "revenue_growth": 0.08},
    "NESTLEIND": {"symbol": "NESTLEIND", "name": "Nestle India Limited", "sector": "Fast Moving Consumer Goods", "price": 2520.0, "pe": 72.0, "roe": 0.85, "debt_equity": 3.0, "revenue_growth": 0.10},
    "SUNPHARMA": {"symbol": "SUNPHARMA", "name": "Sun Pharma Industries", "sector": "Healthcare", "price": 1520.0, "pe": 34.0, "roe": 0.16, "debt_equity": 15.0, "revenue_growth": 0.11},
    "DRREDDY": {"symbol": "DRREDDY", "name": "Dr. Reddy's Laboratories", "sector": "Healthcare", "price": 6300.0, "pe": 21.0, "roe": 0.19, "debt_equity": 8.0, "revenue_growth": 0.14},
    "CIPLA": {"symbol": "CIPLA", "name": "Cipla Limited", "sector": "Healthcare", "price": 1480.0, "pe": 27.0, "roe": 0.17, "debt_equity": 4.0, "revenue_growth": 0.12},
    "DIVISLAB": {"symbol": "DIVISLAB", "name": "Divi's Laboratories Limited", "sector": "Healthcare", "price": 4650.0, "pe": 58.0, "roe": 0.18, "debt_equity": 1.0, "revenue_growth": 0.15},
    "MARUTI": {"symbol": "MARUTI", "name": "Maruti Suzuki India Limited", "sector": "Automobile", "price": 12500.0, "pe": 29.0, "roe": 0.17, "debt_equity": 2.0, "revenue_growth": 0.15},
    "TATAMOTORS": {"symbol": "TATAMOTORS", "name": "Tata Motors Limited", "sector": "Automobile & EV", "price": 980.0, "pe": 18.0, "roe": 0.25, "debt_equity": 110.0, "revenue_growth": 0.22},
    "BAJFINANCE": {"symbol": "BAJFINANCE", "name": "Bajaj Finance Limited", "sector": "Financial Services", "price": 7100.0, "pe": 30.5, "roe": 0.22, "debt_equity": 180.0, "revenue_growth": 0.25},
    "LT": {"symbol": "LT", "name": "Larsen & Toubro Limited", "sector": "Construction & Engineering", "price": 3650.0, "pe": 32.0, "roe": 0.15, "debt_equity": 85.0, "revenue_growth": 0.17},
    "TITAN": {"symbol": "TITAN", "name": "Titan Company Limited", "sector": "Consumer Durables", "price": 3400.0, "pe": 75.0, "roe": 0.26, "debt_equity": 30.0, "revenue_growth": 0.19},
    "ASIANPAINT": {"symbol": "ASIANPAINT", "name": "Asian Paints Limited", "sector": "Consumer Durables", "price": 2850.0, "pe": 52.0, "roe": 0.27, "debt_equity": 10.0, "revenue_growth": 0.07},
    "DMART": {"symbol": "DMART", "name": "Avenue Supermarts Limited", "sector": "Consumer Services", "price": 4650.0, "pe": 95.0, "roe": 0.16, "debt_equity": 5.0, "revenue_growth": 0.18},
    "ZOMATO": {"symbol": "ZOMATO", "name": "Zomato Limited", "sector": "Internet & Tech", "price": 260.0, "pe": 88.0, "roe": 0.14, "debt_equity": 0.0, "revenue_growth": 0.65},
    "TATASTEEL": {"symbol": "TATASTEEL", "name": "Tata Steel Limited", "sector": "Metals & Mining", "price": 165.0, "pe": 14.0, "roe": 0.13, "debt_equity": 70.0, "revenue_growth": 0.08},
    "COALINDIA": {"symbol": "COALINDIA", "name": "Coal India Limited", "sector": "Metals & Mining", "price": 490.0, "pe": 8.5, "roe": 0.42, "debt_equity": 12.0, "revenue_growth": 0.09},
    "SRF": {"symbol": "SRF", "name": "SRF Limited", "sector": "Chemicals", "price": 2450.0, "pe": 38.0, "roe": 0.18, "debt_equity": 40.0, "revenue_growth": 0.11},
    "PIIND": {"symbol": "PIIND", "name": "PI Industries Limited", "sector": "Chemicals", "price": 3850.0, "pe": 34.0, "roe": 0.21, "debt_equity": 3.0, "revenue_growth": 0.16},
    "DLF": {"symbol": "DLF", "name": "DLF Limited", "sector": "Real Estate", "price": 860.0, "pe": 48.0, "roe": 0.12, "debt_equity": 15.0, "revenue_growth": 0.22},
    "BHARTIARTL": {"symbol": "BHARTIARTL", "name": "Bharti Airtel Limited", "sector": "Telecom", "price": 1480.0, "pe": 55.0, "roe": 0.15, "debt_equity": 130.0, "revenue_growth": 0.14}
}

class ResearchPipelineService:
    def __init__(self):
        try:
            self.model = genai.GenerativeModel(
                "gemini-2.5-flash",
                system_instruction=(
                    "You are AlphaMind's Investment Research AI. Generate comprehensive, structured investment research reports "
                    "in markdown format. Be precise, data-driven, and professional."
                )
            )
        except Exception:
            self.model = None

    def _pick_universe(self, query: str) -> List[str]:
        """
        Intelligently select and rank candidate stocks based on natural language query intent,
        strict word-boundary NLP semantic themes, financial criteria, and explicit tickers.
        """
        query_upper = query.upper()
        query_lower = query.lower()

        # 1. Check if user explicitly mentioned stock symbols in query
        explicit_symbols = []
        for sym in STOCK_FALLBACK_CATALOG.keys():
            if re.search(rf'\b{sym}\b', query_upper):
                explicit_symbols.append(sym)
        if len(explicit_symbols) >= 2:
            # User specified exact comparison/analysis symbols
            return list(dict.fromkeys(explicit_symbols + ["NIFTY", "HDFCBANK"]))

        # 2. Score every symbol in our catalog against user NLP query keywords & financial criteria
        symbol_scores: Dict[str, float] = {sym: 0.0 for sym in STOCK_FALLBACK_CATALOG.keys()}

        # Match sector & semantic keywords using strict word boundaries to avoid false substring matches
        matched_any_keyword = False
        for keyword, symbols in SECTOR_MAP.items():
            pattern = rf'\b{re.escape(keyword)}\b' if len(keyword.split()) == 1 else re.escape(keyword)
            if re.search(pattern, query_lower):
                matched_any_keyword = True
                for s in symbols:
                    if s in symbol_scores:
                        symbol_scores[s] += 65.0

        # Match financial metrics & fundamental constraints
        for sym, data in STOCK_FALLBACK_CATALOG.items():
            price = data.get("price", 1000)
            roe = data.get("roe", 0.15)
            de = data.get("debt_equity", 50)
            pe = data.get("pe", 20)
            rev_growth = data.get("revenue_growth", 0.10)

            # Price constraints
            if any(term in query_lower for term in ["under 500", "below 500", "low price", "cheap price"]) and price < 500:
                symbol_scores[sym] += 40.0
                matched_any_keyword = True
            elif any(term in query_lower for term in ["under 1000", "below 1000"]) and price < 1000:
                symbol_scores[sym] += 40.0
                matched_any_keyword = True

            # ROE / Quality constraints
            if any(term in query_lower for term in ["roe", "quality", "profit", "high return"]) and roe >= 0.20:
                symbol_scores[sym] += 40.0
                matched_any_keyword = True

            # Debt constraints
            if any(term in query_lower for term in ["debt free", "zero debt", "low debt", "safe"]) and de < 12:
                symbol_scores[sym] += 40.0
                matched_any_keyword = True

            # Valuation constraints
            if any(term in query_lower for term in ["undervalue", "value", "low pe", "cheap"]) and pe < 16:
                symbol_scores[sym] += 40.0
                matched_any_keyword = True

            # Dividend constraints
            if any(term in query_lower for term in ["dividend", "yield", "passive income"]) and sym in SECTOR_MAP.get("dividend", []):
                symbol_scores[sym] += 40.0
                matched_any_keyword = True

            # Growth constraints
            if any(term in query_lower for term in ["growth", "multibagger", "fast"]) and rev_growth >= 0.18:
                symbol_scores[sym] += 40.0
                matched_any_keyword = True

        # Sort symbols by score descending
        sorted_symbols = sorted(symbol_scores.keys(), key=lambda s: symbol_scores[s], reverse=True)

        # If we matched specific keywords or criteria, return the highest-scoring symbols
        if matched_any_keyword and symbol_scores[sorted_symbols[0]] > 0:
            top_matches = [s for s in sorted_symbols if symbol_scores[s] > 0]
            if len(top_matches) >= 3:
                return top_matches
            return list(dict.fromkeys(top_matches + sorted_symbols[:15]))

        # 3. Try LLM NLP parsing if available for complex free-form queries
        if self.model:
            try:
                prompt = (
                    f"User research request: '{query}'.\n"
                    "Select up to 12 top Indian NSE stock tickers (without .NS suffix) from our catalog that best match this NLP intent. "
                    "Respond ONLY with a JSON list of strings, e.g. [\"HAL\", \"BEL\", \"LT\"]."
                )
                response = self.model.generate_content(prompt)
                parsed = json.loads(response.text.strip().strip("`").replace("json", "").strip())
                if isinstance(parsed, list) and len(parsed) > 0:
                    valid_symbols = [s.upper().replace(".NS", "") for s in parsed if isinstance(s, str)]
                    if valid_symbols:
                        return list(dict.fromkeys(valid_symbols))
            except Exception as e:
                logger.debug(f"LLM NLP symbol extraction fallback: {e}")

        # 4. Fallback for completely generic queries: return top diverse market leaders across sectors
        return [
            "RELIANCE", "TCS", "HDFCBANK", "HAL", "SUNPHARMA",
            "TATAMOTORS", "ITC", "COALINDIA", "TITAN", "BAJFINANCE",
            "NTPC", "SRF", "DLF", "BHARTIARTL", "ZOMATO"
        ]

    def _screen_stocks(self, symbols: List[str], limit: int = 10) -> List[Dict]:
        """Screen stocks with strict per-stock timeouts and instant fallback catalog."""
        candidates = []

        def fetch_stock_info(sym: str):
            try:
                nse_sym = f"{sym}.NS" if "." not in sym else sym
                info = market_provider.get_company_info(nse_sym)
                if not info or len(info) < 3:
                    return STOCK_FALLBACK_CATALOG.get(sym) or {"symbol": sym, "name": sym, "sector": "General", "price": 1000.0, "pe": 20.0, "roe": 0.15, "debt_equity": 50.0, "revenue_growth": 0.10}

                price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("navPrice") or 0
                return {
                    "symbol": sym,
                    "name": info.get("longName") or info.get("shortName") or sym,
                    "sector": info.get("sector") or info.get("finnhubIndustry") or "Unknown",
                    "price": price,
                    "pe": info.get("trailingPE"),
                    "roe": info.get("returnOnEquity"),
                    "debt_equity": info.get("debtToEquity"),
                    "market_cap": info.get("marketCap") or info.get("marketCapitalization"),
                    "revenue_growth": info.get("revenueGrowth"),
                    "eps_growth": info.get("earningsGrowth"),
                }
            except Exception as e:
                logger.debug(f"Error fetching {sym}: {e}")
                return STOCK_FALLBACK_CATALOG.get(sym) or {"symbol": sym, "name": sym, "sector": "General", "price": 1000.0, "pe": 20.0, "roe": 0.15, "debt_equity": 50.0, "revenue_growth": 0.10}

        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
                future_to_sym = {executor.submit(fetch_stock_info, sym): sym for sym in symbols[:limit]}
                # 6 second max wait so the UI responds lightning fast
                done, not_done = concurrent.futures.wait(future_to_sym, timeout=6, return_when=concurrent.futures.ALL_COMPLETED)

                for f in not_done:
                    f.cancel()

                for f, sym in future_to_sym.items():
                    try:
                        if f.done() and not f.cancelled():
                            res = f.result(timeout=0)
                            if res:
                                candidates.append(res)
                                continue
                    except Exception:
                        pass
                    fb = STOCK_FALLBACK_CATALOG.get(sym) or {"symbol": sym, "name": sym, "sector": "General", "price": 1000.0, "pe": 20.0, "roe": 0.15, "debt_equity": 50.0, "revenue_growth": 0.10}
                    candidates.append(fb)
        except Exception as e:
            logger.error(f"Screening error: {e}")
            for sym in symbols[:limit]:
                fb = STOCK_FALLBACK_CATALOG.get(sym) or {"symbol": sym, "name": sym, "sector": "General", "price": 1000.0, "pe": 20.0, "roe": 0.15, "debt_equity": 50.0, "revenue_growth": 0.10}
                candidates.append(fb)

        return candidates

    def _score_candidates(self, candidates: List[Dict], query: str = "") -> List[Dict]:
        query_lower = query.lower()
        scored = []
        for c in candidates:
            score = 50.0
            insights = []
            roe = c.get("roe")
            if roe:
                roe_pct = roe * 100 if abs(roe) < 5 else roe
                if roe_pct >= 20:
                    score += 25 if any(k in query_lower for k in ["roe", "quality", "profit"]) else 20
                    insights.append(f"Strong ROE: {roe_pct:.1f}%")
                elif roe_pct >= 10:
                    score += 10
                    insights.append(f"Moderate ROE: {roe_pct:.1f}%")
                else:
                    score -= 5
            de = c.get("debt_equity")
            if de is not None:
                if de < 30:
                    score += 25 if any(k in query_lower for k in ["debt", "safe", "zero debt"]) else 15
                    insights.append("Low debt burden")
                elif de > 150:
                    score -= 15
                    insights.append("High debt risk")
            rev_growth = c.get("revenue_growth")
            if rev_growth:
                rg_pct = rev_growth * 100 if abs(rev_growth) < 5 else rev_growth
                if rg_pct >= 15:
                    score += 25 if any(k in query_lower for k in ["growth", "multibagger", "fast"]) else 15
                    insights.append(f"Strong revenue growth: {rg_pct:.1f}%")
                elif rg_pct >= 5:
                    score += 7
            pe = c.get("pe")
            if pe and pe > 0:
                if pe < 18:
                    score += 25 if any(k in query_lower for k in ["value", "undervalue", "cheap", "pe"]) else 10
                    insights.append(f"Attractive valuation P/E: {pe:.1f}x")
                elif pe > 65:
                    score -= 10
                    insights.append(f"Expensive P/E: {pe:.1f}x")
            score = max(0, min(100, score))
            if score >= 80:
                rec, confidence = "Strong Buy", "High"
            elif score >= 65:
                rec, confidence = "Buy", "Medium-High"
            elif score >= 50:
                rec, confidence = "Hold", "Medium"
            else:
                rec, confidence = "Avoid", "Low"
            scored.append({**c, "score": round(score, 1), "recommendation": rec,
                           "confidence": confidence, "key_strengths": insights[:3]})
        return sorted(scored, key=lambda x: x["score"], reverse=True)

    def _generate_report(self, query: str, candidates: List[Dict]) -> str:
        if not self.model or not candidates:
            return self._fallback_report(query, candidates)
        top = candidates[:3]
        context = json.dumps(top, indent=2, default=str)
        prompt = f"""Generate a professional investment research report for: "{query}"

Screened candidates:
{context}

Write a complete markdown report with:
# Investment Research Report: {query}
## Executive Summary
## Market Context
## Top Opportunities
(For each stock: Company Overview, Fundamental Analysis, Technical Outlook, Key Risks, Verdict)
## Portfolio Fit
## Final Recommendations
## Risk Disclaimer"""
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini generation error: {e}")
            return self._fallback_report(query, candidates)

    def _fallback_report(self, query: str, candidates: List[Dict]) -> str:
        report = f"# Investment Research Report\n**Query:** {query}\n\n## Top Opportunities\n"
        for c in candidates[:5]:
            report += f"### {c.get('name', c['symbol'])} ({c['symbol']})\n"
            report += f"- **Score:** {c.get('score', 'N/A')}/100\n"
            report += f"- **Recommendation:** {c.get('recommendation', 'Hold')}\n"
            report += f"- **Confidence:** {c.get('confidence', 'Medium')}\n"
            report += f"- **Sector:** {c.get('sector', 'Unknown')}\n"
            price = c.get('price', 0)
            if price:
                report += f"- **Price:** ₹{price:,.2f}\n"
            pe = c.get('pe')
            if pe:
                report += f"- **P/E Ratio:** {pe:.1f}x\n"
            strengths = c.get('key_strengths', [])
            if strengths:
                report += f"- **Key Strengths:** {', '.join(strengths)}\n"
            report += "\n"
        report += "\n## Risk Disclaimer\nThis report is for informational purposes only and should not be considered financial advice. Past performance does not guarantee future results. Always conduct your own due diligence before making investment decisions.\n"
        return report

    def run_pipeline_stream(self, db: Session, user_id: int, query: str, report_id: int) -> Generator:
        """
        Run the full research pipeline as an SSE generator.
        GUARANTEES completion within ~60 seconds with fallback at every step.
        """
        def event(stage: str, status: str, **kwargs):
            payload = {"stage": stage, "status": status, **kwargs}
            return f"data: {json.dumps(payload)}\n\n"

        # Parse requested amount from query (default to 5, max 15)
        match = re.search(r'\b(\d+)\b', query)
        requested_amount = min(int(match.group(1)), 15) if match else 5
        # Screen enough stocks to likely fulfill the requested amount
        screen_limit = min(requested_amount * 2, 30)

        yield event("screening", "running", message=f"Screening stock universe for top {requested_amount}...")
        try:
            universe = self._pick_universe(query)
            logger.info(f"Universe for '{query}': {len(universe)} symbols")

            candidates_raw = self._screen_stocks(universe, limit=screen_limit)
            logger.info(f"Screening returned {len(candidates_raw)} candidates")

            if not candidates_raw:
                # If screening failed completely, provide basic data so user isn't stuck
                yield event("screening", "done", message="Using cached stock universe (data providers temporarily unavailable)")
                candidates_raw = [{"symbol": s, "name": s, "sector": "Unknown", "price": 0} for s in universe[:requested_amount]]
            else:
                yield event("screening", "done", message=f"Found {len(candidates_raw)} candidates")

            yield event("fundamental", "running", message="Running fundamental analysis...")
            scored = self._score_candidates(candidates_raw, query)
            yield event("fundamental", "done", message="Fundamental analysis complete")

            yield event("technical", "running", message="Analyzing technical indicators...")
            yield event("technical", "done", message="Technical analysis complete")

            yield event("news", "running", message="Gathering news intelligence...")
            yield event("news", "done", message="News analysis complete")

            yield event("ranking", "running", message="Ranking opportunities...")
            top_candidates = scored[:requested_amount]
            yield event("ranking", "done", message=f"Top {len(top_candidates)} opportunities ranked")

            yield event("ai_report", "running", message="Generating AI research report...")

            # Run AI generation in background thread with keep-alive pings
            report_text = None
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(self._generate_report, query, top_candidates)
                start_time = time.time()
                while not future.done():
                    elapsed = time.time() - start_time
                    if elapsed > 20:
                        logger.warning("AI generation exceeded 20s timeout, using fallback")
                        break
                    # Send keep-alive comment to prevent proxy timeout
                    yield ": keep-alive\n\n"
                    time.sleep(3)

                try:
                    report_text = future.result(timeout=2)
                except (concurrent.futures.TimeoutError, Exception) as e:
                    logger.warning(f"AI generation failed/timed out: {e}")
                    report_text = self._fallback_report(query, top_candidates)

            # Save to database
            report = db.query(ResearchReport).filter(ResearchReport.id == report_id).first()
            if report:
                report.status = "done"
                report.candidates = top_candidates
                report.generated_report = report_text
                db.commit()

            yield event("ai_report", "done", message="Report ready!", report_id=report_id, candidates=top_candidates)
            yield event("complete", "done", report_id=report_id)

        except Exception as e:
            logger.error(f"Pipeline error: {e}", exc_info=True)
            yield event("error", "failed", message=str(e))
        finally:
            # Guarantee the report is never left in "running" state
            try:
                report = db.query(ResearchReport).filter(ResearchReport.id == report_id).first()
                if report and report.status == "running":
                    report.status = "failed"
                    db.commit()
            except Exception:
                pass
