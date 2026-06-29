from app.interfaces.news_data_interface import NewsDataProvider
from typing import List, Dict, Any
from datetime import datetime, timezone

class MockNewsProvider(NewsDataProvider):
    """Mock implementation for testing Financial News Intelligence."""
    
    def get_latest_news(self, symbol: str) -> List[Dict[str, Any]]:
        return [
            {
                "title": f"Strong Quarter Expected for {symbol}",
                "source": "Mock Financial News",
                "published_at": datetime.now(timezone.utc),
                "sentiment": "Positive",
                "summary": "Analysts expect the upcoming earnings report to beat estimates due to strong core business performance and strategic cost-cutting measures."
            },
            {
                "title": f"{symbol} Faces Macro Headwinds",
                "source": "Global Markets Today",
                "published_at": datetime.now(timezone.utc),
                "sentiment": "Negative",
                "summary": "Inflationary pressures and rising interest rates could squeeze margins in the near term, prompting cautious guidance from management."
            },
            {
                "title": f"{symbol} Announces Strategic Partnership",
                "source": "Industry Insider",
                "published_at": datetime.now(timezone.utc),
                "sentiment": "Positive",
                "summary": "A new partnership with a major global player is expected to unlock new revenue streams and expand market share over the next decade."
            }
        ]
