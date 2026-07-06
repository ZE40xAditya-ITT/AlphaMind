import json
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
import yfinance as yf
import google.generativeai as genai
from app.core.config import settings
from app.models.digest import WeeklyDigest
from app.models.user import User
from app.models.watchlist import Watchlist
from app.models.search_history import SearchHistory

if settings.GOOGLE_API_KEY:
    genai.configure(api_key=settings.GOOGLE_API_KEY)


class DigestService:
    def __init__(self):
        try:
            self.model = genai.GenerativeModel(
                "gemini-2.5-flash",
                system_instruction=(
                    "You are AlphaMind's Weekly Digest AI. Generate concise, premium investment digest content. "
                    "Respond ONLY with valid JSON matching the requested schema exactly. No markdown, no code blocks."
                )
            )
        except Exception:
            self.model = None

    def _get_market_summary(self) -> dict:
        try:
            nifty = yf.Ticker("^NSEI")
            banknifty = yf.Ticker("^NSEBANK")
            nifty_hist = nifty.history(period="5d")
            bank_hist = banknifty.history(period="5d")
            nifty_change = 0.0
            bank_change = 0.0
            nifty_price = 0.0
            bank_price = 0.0
            if not nifty_hist.empty and len(nifty_hist) >= 2:
                nifty_price = float(nifty_hist["Close"].iloc[-1])
                prev = float(nifty_hist["Close"].iloc[-2])
                nifty_change = round(((nifty_price - prev) / prev) * 100, 2) if prev else 0.0
            if not bank_hist.empty and len(bank_hist) >= 2:
                bank_price = float(bank_hist["Close"].iloc[-1])
                prev = float(bank_hist["Close"].iloc[-2])
                bank_change = round(((bank_price - prev) / prev) * 100, 2) if prev else 0.0
            sentiment = "Bullish" if nifty_change > 0.5 else ("Bearish" if nifty_change < -0.5 else "Neutral")
            return {
                "nifty_price": round(nifty_price, 2),
                "nifty_change_pct": nifty_change,
                "banknifty_price": round(bank_price, 2),
                "banknifty_change_pct": bank_change,
                "sentiment": sentiment,
                "trending_sectors": ["Banking", "IT", "FMCG"]
            }
        except Exception as e:
            return {"nifty_change_pct": 0.0, "banknifty_change_pct": 0.0, "sentiment": "Neutral", "error": str(e)}

    def _get_portfolio_summary(self, db: Session, user_id: int) -> dict:
        try:
            history = db.query(SearchHistory).filter(
                SearchHistory.user_id == user_id
            ).order_by(SearchHistory.searched_at.desc()).limit(20).all()
            if not history:
                return {"message": "No portfolio data available"}
            buy_stocks = [h.stock_symbol for h in history if h.recommendation and "buy" in h.recommendation.lower()]
            avg_score = sum(h.final_score or 0 for h in history) / len(history)
            return {
                "total_analyzed": len(history),
                "avg_score": round(avg_score, 1),
                "buy_recommendations": buy_stocks[:5],
                "latest_symbol": history[0].stock_symbol if history else None,
                "health_score": min(100, int(avg_score))
            }
        except Exception as e:
            return {"error": str(e)}

    def _get_watchlist_insights(self, db: Session, user_id: int) -> dict:
        try:
            watchlist = db.query(Watchlist).filter(Watchlist.user_id == user_id).limit(10).all()
            symbols = [w.stock_symbol for w in watchlist]
            return {"watchlist_symbols": symbols, "count": len(symbols)}
        except Exception as e:
            return {"error": str(e)}

    def _get_recommendation_changes(self, db: Session, user_id: int) -> dict:
        try:
            history = db.query(SearchHistory).filter(
                SearchHistory.user_id == user_id
            ).order_by(SearchHistory.searched_at.desc()).limit(30).all()
            strong_buys = [h.stock_symbol for h in history if h.recommendation and "strong buy" in h.recommendation.lower()]
            avoids = [h.stock_symbol for h in history if h.recommendation and "avoid" in h.recommendation.lower()]
            
            growth_opportunities = [
                {"symbol": "RELIANCE", "name": "Reliance Industries", "reason": "Aggressive expansion in Green Energy & New Commerce with strong cash flows."},
                {"symbol": "TCS", "name": "Tata Consultancy Services", "reason": "Digital transformation leader with attractive dividend yield & enterprise AI deal momentum."},
                {"symbol": "HDFCBANK", "name": "HDFC Bank", "reason": "Post-merger synergy unlocking with valuations at attractive risk-reward levels."},
                {"symbol": "TITAN", "name": "Titan Company", "reason": "Market share gains in consumer luxury segment with robust double-digit revenue growth."},
                {"symbol": "INFY", "name": "Infosys Ltd", "reason": "Strong large-deal pipeline in generative AI and cloud infrastructure migration."}
            ]

            return {
                "strong_buy_opportunities": strong_buys[:3] if strong_buys else ["RELIANCE", "TCS", "HDFCBANK"],
                "avoid_list": avoids[:3],
                "upgrades": strong_buys[:2],
                "downgrades": avoids[:2],
                "growth_opportunities": growth_opportunities
            }
        except Exception as e:
            return {"error": str(e)}

    def _generate_ai_suggestions(self, market: dict, portfolio: dict, watchlist: dict) -> dict:
        if not self.model:
            return {"suggestions": ["Keep diversified portfolio", "Monitor market sentiment"],
                    "executive_summary": "Market conditions remain dynamic.",
                    "top_opportunity": "Quality large-caps", "top_risk": "Global macro headwinds"}
        try:
            prompt = f"""Given this investment data, generate 5 actionable AI investment suggestions for an Indian investor.
Market Data: {json.dumps(market)}
Portfolio Summary: {json.dumps(portfolio)}
Watchlist: {json.dumps(watchlist)}
Return ONLY a JSON object with this exact schema:
{{"suggestions": ["suggestion1", "suggestion2", "suggestion3", "suggestion4", "suggestion5"],
  "executive_summary": "2-3 sentence market overview",
  "top_opportunity": "Best opportunity this week",
  "top_risk": "Biggest risk this week"}}"""
            response = self.model.generate_content(prompt)
            text = response.text.strip()
            if "```" in text:
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            return json.loads(text)
        except Exception:
            return {
                "suggestions": ["Diversify across sectors", "Focus on quality stocks with strong ROE",
                                "Consider adding defensive sectors", "Review high-debt holdings",
                                "Monitor FII flows for direction"],
                "executive_summary": "Market conditions remain dynamic. Focus on quality large-caps with strong fundamentals.",
                "top_opportunity": "Banking sector shows strong momentum",
                "top_risk": "Global macro headwinds and inflation concerns"
            }

    def generate_digest(self, db: Session, user_id: int) -> WeeklyDigest:
        market = self._get_market_summary()
        portfolio = self._get_portfolio_summary(db, user_id)
        watchlist = self._get_watchlist_insights(db, user_id)
        recommendations = self._get_recommendation_changes(db, user_id)
        ai_data = self._generate_ai_suggestions(market, portfolio, watchlist)
        news_summary = {
            "top_positive": ["Markets rally on strong corporate earnings", "FII inflows surge this week"],
            "top_negative": ["Inflation concerns persist globally", "Geopolitical uncertainty weighs on sentiment"],
            "major_events": ["RBI Monetary Policy Committee meeting", "Q1 Results season underway"]
        }
        digest = WeeklyDigest(
            user_id=user_id,
            digest_date=datetime.utcnow(),
            market_summary=market,
            portfolio_summary=portfolio,
            recommendations=recommendations,
            watchlist_insights=watchlist,
            news_summary=news_summary,
            ai_suggestions=ai_data,
            pdf_path=None
        )
        db.add(digest)
        db.commit()
        db.refresh(digest)
        try:
            from app.services.digest_pdf_service import generate_digest_pdf
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                pdf_path = generate_digest_pdf(digest, user)
                digest.pdf_path = pdf_path
                db.commit()
        except Exception:
            pass
        return digest

    def get_latest_digest(self, db: Session, user_id: int) -> Optional[WeeklyDigest]:
        return db.query(WeeklyDigest).filter(
            WeeklyDigest.user_id == user_id
        ).order_by(WeeklyDigest.created_at.desc()).first()

    def get_digest_history(self, db: Session, user_id: int):
        return db.query(WeeklyDigest).filter(
            WeeklyDigest.user_id == user_id
        ).order_by(WeeklyDigest.created_at.desc()).limit(10).all()

    def get_digest_by_id(self, db: Session, digest_id: int, user_id: int) -> Optional[WeeklyDigest]:
        return db.query(WeeklyDigest).filter(
            WeeklyDigest.id == digest_id,
            WeeklyDigest.user_id == user_id
        ).first()
