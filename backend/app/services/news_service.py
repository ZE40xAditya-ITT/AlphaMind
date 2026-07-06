from sqlalchemy.orm import Session
from app.models.news_cache import NewsCache
from app.interfaces.news_data_interface import NewsDataProvider
from typing import List, Dict, Any
from datetime import datetime, timezone, timedelta

class NewsService:
    def __init__(self, provider: NewsDataProvider):
        self.provider = provider

    def get_news(self, db: Session, symbol: str) -> List[Dict[str, Any]]:
        # Check cache (1 hour expiry)
        threshold = datetime.now(timezone.utc) - timedelta(hours=1)
        cached_news = db.query(NewsCache).filter(
            NewsCache.symbol == symbol,
            NewsCache.created_at >= threshold
        ).all()

        if cached_news:
            return [
                {
                    "title": item.title,
                    "source": item.source,
                    "published_at": item.published_at.isoformat() if item.published_at else None,
                    "sentiment": item.sentiment,
                    "summary": item.summary
                }
                for item in cached_news
            ]

        # Clear old cache for this symbol to avoid unbound growth
        db.query(NewsCache).filter(NewsCache.symbol == symbol).delete()
        db.commit()

        # Fetch fresh news
        news_data = self.provider.get_latest_news(symbol)
        if not news_data:
            return []

        # Save to DB
        new_items = []
        for article in news_data:
            item = NewsCache(
                symbol=symbol,
                title=article["title"],
                source=article.get("source"),
                published_at=article.get("published_at"),
                sentiment=article.get("sentiment"),
                summary=article.get("summary")
            )
            db.add(item)
            new_items.append(item)

        db.commit()

        return [
            {
                "title": item.title,
                "source": item.source,
                "published_at": item.published_at.isoformat() if item.published_at else None,
                "sentiment": item.sentiment,
                "summary": item.summary
            }
            for item in new_items
        ]
