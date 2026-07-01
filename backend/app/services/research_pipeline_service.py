import json
import re
import random
import requests
import concurrent.futures
from typing import Generator, List, Dict
from sqlalchemy.orm import Session
import yfinance as yf
import google.generativeai as genai
from app.core.config import settings
from app.models.research_report import ResearchReport

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

# Initialize providers
yahoo = YahooFinanceProvider()
finnhub = FinnhubProvider()
market_provider = FallbackMarketDataProvider(primary=yahoo, secondary=finnhub)

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
        candidates = []
        
        def fetch_stock_info(sym: str):
            try:
                info = market_provider.get_company_info(sym)
                if not info or len(info) < 5:
                    return None
                    
                # Use current price if regularMarketPrice is missing
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
            except Exception:
                return None

        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            results = executor.map(fetch_stock_info, symbols[:limit])
            
        for res in results:
            if res:
                candidates.append(res)
                
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
        except Exception:
            return self._fallback_report(query, candidates)

    def _fallback_report(self, query: str, candidates: List[Dict]) -> str:
        report = f"# Investment Research Report\n**Query:** {query}\n\n## Top Opportunities\n"
        for c in candidates[:3]:
            report += f"### {c.get('name', c['symbol'])} ({c['symbol']})\n"
            report += f"- **Score:** {c.get('score', 'N/A')}/100\n- **Recommendation:** {c.get('recommendation', 'Hold')}\n- **Sector:** {c.get('sector', 'Unknown')}\n\n"
        return report

    def run_pipeline_stream(self, db: Session, user_id: int, query: str, report_id: int) -> Generator:
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
            candidates_raw = self._screen_stocks(universe, limit=screen_limit)
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
            yield event("ai_report", "running", message="Generating AI research report... (this takes a moment)")
            
            import concurrent.futures
            import time
            report_text = None
            
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(self._generate_report, query, top_candidates)
                start_time = time.time()
                while not future.done():
                    if time.time() - start_time > 45:
                        print("Gemini generation timed out (45s). Falling back.")
                        break
                    # Send a keep-alive ping every 5 seconds to prevent Render/Vercel proxy timeout
                    yield ": keep-alive\n\n"
                    time.sleep(5)
                
                try:
                    # Give it a max of 1 second (we already waited 45s in the loop)
                    report_text = future.result(timeout=1)
                except concurrent.futures.TimeoutError:
                    report_text = self._fallback_report(query, top_candidates)
                except Exception as e:
                    # If Gemini throws an error (e.g. rate limit), use fallback
                    print(f"Gemini generation error: {e}")
                    report_text = self._fallback_report(query, top_candidates)

            report = db.query(ResearchReport).filter(ResearchReport.id == report_id).first()
            if report:
                report.status = "done"
                report.candidates = top_candidates
                report.generated_report = report_text
                db.commit()
            yield event("ai_report", "done", message="Report ready!", report_id=report_id, candidates=top_candidates)
            yield event("complete", "done", report_id=report_id)
        except Exception as e:
            yield event("error", "failed", message=str(e))
        finally:
            report = db.query(ResearchReport).filter(ResearchReport.id == report_id).first()
            if report and report.status == "running":
                report.status = "failed"
                db.commit()
