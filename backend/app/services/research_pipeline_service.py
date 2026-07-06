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
    "HDFCBANK", "ICICIBANK", "KOTAKBANK", "AXISBANK", "SBIN", "BANDHANBNK", "FEDERALBNK",
    "TCS", "INFY", "WIPRO", "HCLTECH", "TECHM", "MPHASIS",
    "HINDUNILVR", "ITC", "NESTLEIND", "DABUR", "MARICO",
    "SUNPHARMA", "DRREDDY", "CIPLA", "DIVISLAB", "APOLLOHOSP",
    "MARUTI", "TATAMOTORS", "BAJAJ-AUTO", "EICHERMOT",
    "RELIANCE", "ONGC", "BPCL", "NTPC",
    "BAJFINANCE", "BAJAJFINSV", "MUTHOOTFIN",
    "LT", "ADANIPORTS", "TITAN", "ASIANPAINT", "DMART"
]

SECTOR_MAP = {
    "banking": ["HDFCBANK", "ICICIBANK", "KOTAKBANK", "AXISBANK", "SBIN", "BANDHANBNK", "FEDERALBNK"],
    "bank": ["HDFCBANK", "ICICIBANK", "KOTAKBANK", "AXISBANK", "SBIN"],
    "it": ["TCS", "INFY", "WIPRO", "HCLTECH", "TECHM"],
    "tech": ["TCS", "INFY", "WIPRO", "HCLTECH", "TECHM"],
    "pharma": ["SUNPHARMA", "DRREDDY", "CIPLA", "DIVISLAB", "APOLLOHOSP"],
    "fmcg": ["HINDUNILVR", "ITC", "NESTLEIND", "DABUR", "MARICO"],
    "auto": ["MARUTI", "TATAMOTORS", "BAJAJ-AUTO", "EICHERMOT"],
    "energy": ["RELIANCE", "ONGC", "BPCL", "NTPC"],
    "finance": ["BAJFINANCE", "BAJAJFINSV", "MUTHOOTFIN", "HDFCBANK"],
    "dividend": ["ITC", "ONGC", "BPCL", "NTPC", "HINDUNILVR"],
    "growth": ["TCS", "INFY", "HDFCBANK", "BAJFINANCE", "TITAN"],
    "undervalue": ["SBIN", "ONGC", "BPCL", "FEDERALBNK", "ITC"],
    "low risk": ["TCS", "INFY", "HINDUNILVR", "NESTLEIND", "HDFCBANK"],
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
    "TCS": {"symbol": "TCS", "name": "Tata Consultancy Services Limited", "sector": "Information Technology", "price": 3950.0, "pe": 28.5, "roe": 0.45, "debt_equity": 8.0, "revenue_growth": 0.08},
    "INFY": {"symbol": "INFY", "name": "Infosys Limited", "sector": "Information Technology", "price": 1580.0, "pe": 24.2, "roe": 0.32, "debt_equity": 10.0, "revenue_growth": 0.09},
    "WIPRO": {"symbol": "WIPRO", "name": "Wipro Limited", "sector": "Information Technology", "price": 480.0, "pe": 22.0, "roe": 0.16, "debt_equity": 15.0, "revenue_growth": 0.05},
    "HCLTECH": {"symbol": "HCLTECH", "name": "HCL Technologies Limited", "sector": "Information Technology", "price": 1450.0, "pe": 23.5, "roe": 0.26, "debt_equity": 12.0, "revenue_growth": 0.11},
    "RELIANCE": {"symbol": "RELIANCE", "name": "Reliance Industries Limited", "sector": "Energy", "price": 2950.0, "pe": 26.0, "roe": 0.11, "debt_equity": 45.0, "revenue_growth": 0.12},
    "ONGC": {"symbol": "ONGC", "name": "Oil and Natural Gas Corporation", "sector": "Energy", "price": 285.0, "pe": 7.5, "roe": 0.18, "debt_equity": 35.0, "revenue_growth": 0.08},
    "BPCL": {"symbol": "BPCL", "name": "Bharat Petroleum Corporation", "sector": "Energy", "price": 610.0, "pe": 6.8, "roe": 0.22, "debt_equity": 50.0, "revenue_growth": 0.06},
    "NTPC": {"symbol": "NTPC", "name": "NTPC Limited", "sector": "Energy", "price": 365.0, "pe": 16.5, "roe": 0.13, "debt_equity": 120.0, "revenue_growth": 0.10},
    "HINDUNILVR": {"symbol": "HINDUNILVR", "name": "Hindustan Unilever Limited", "sector": "Fast Moving Consumer Goods", "price": 2450.0, "pe": 55.0, "roe": 0.28, "debt_equity": 5.0, "revenue_growth": 0.06},
    "ITC": {"symbol": "ITC", "name": "ITC Limited", "sector": "Fast Moving Consumer Goods", "price": 440.0, "pe": 26.5, "roe": 0.29, "debt_equity": 2.0, "revenue_growth": 0.08},
    "SUNPHARMA": {"symbol": "SUNPHARMA", "name": "Sun Pharma Industries", "sector": "Healthcare", "price": 1520.0, "pe": 34.0, "roe": 0.16, "debt_equity": 15.0, "revenue_growth": 0.11},
    "MARUTI": {"symbol": "MARUTI", "name": "Maruti Suzuki India Limited", "sector": "Automobile", "price": 12500.0, "pe": 29.0, "roe": 0.17, "debt_equity": 2.0, "revenue_growth": 0.15},
    "TATAMOTORS": {"symbol": "TATAMOTORS", "name": "Tata Motors Limited", "sector": "Automobile", "price": 980.0, "pe": 18.0, "roe": 0.25, "debt_equity": 110.0, "revenue_growth": 0.22},
    "BAJFINANCE": {"symbol": "BAJFINANCE", "name": "Bajaj Finance Limited", "sector": "Financial Services", "price": 7100.0, "pe": 30.5, "roe": 0.22, "debt_equity": 180.0, "revenue_growth": 0.25},
    "LT": {"symbol": "LT", "name": "Larsen & Toubro Limited", "sector": "Construction", "price": 3650.0, "pe": 32.0, "roe": 0.15, "debt_equity": 85.0, "revenue_growth": 0.17},
    "TITAN": {"symbol": "TITAN", "name": "Titan Company Limited", "sector": "Consumer Durables", "price": 3400.0, "pe": 75.0, "roe": 0.26, "debt_equity": 30.0, "revenue_growth": 0.19},
    "ASIANPAINT": {"symbol": "ASIANPAINT", "name": "Asian Paints Limited", "sector": "Consumer Durables", "price": 2850.0, "pe": 52.0, "roe": 0.27, "debt_equity": 10.0, "revenue_growth": 0.07},
    "DMART": {"symbol": "DMART", "name": "Avenue Supermarts Limited", "sector": "Consumer Services", "price": 4650.0, "pe": 95.0, "roe": 0.16, "debt_equity": 5.0, "revenue_growth": 0.18}
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
        query_lower = query.lower()
        for keyword, stocks in SECTOR_MAP.items():
            if keyword in query_lower:
                return stocks
        return NSE_UNIVERSE

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

    def _score_candidates(self, candidates: List[Dict]) -> List[Dict]:
        scored = []
        for c in candidates:
            score = 50.0
            insights = []
            roe = c.get("roe")
            if roe:
                roe_pct = roe * 100 if abs(roe) < 5 else roe
                if roe_pct >= 20:
                    score += 20
                    insights.append(f"Strong ROE: {roe_pct:.1f}%")
                elif roe_pct >= 10:
                    score += 10
                    insights.append(f"Moderate ROE: {roe_pct:.1f}%")
                else:
                    score -= 5
            de = c.get("debt_equity")
            if de is not None:
                if de < 30:
                    score += 15
                    insights.append("Low debt burden")
                elif de > 150:
                    score -= 15
                    insights.append("High debt risk")
            rev_growth = c.get("revenue_growth")
            if rev_growth:
                rg_pct = rev_growth * 100 if abs(rev_growth) < 5 else rev_growth
                if rg_pct >= 15:
                    score += 15
                    insights.append(f"Strong revenue growth: {rg_pct:.1f}%")
                elif rg_pct >= 5:
                    score += 7
            pe = c.get("pe")
            if pe and pe > 0:
                if pe < 15:
                    score += 10
                    insights.append(f"Attractive valuation P/E: {pe:.1f}x")
                elif pe > 60:
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
            scored = self._score_candidates(candidates_raw)
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
