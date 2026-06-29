from abc import ABC, abstractmethod
from typing import List, Dict, Any

class NewsDataProvider(ABC):
    """Boundary interface for retrieving financial news."""
    
    @abstractmethod
    def get_latest_news(self, symbol: str) -> List[Dict[str, Any]]:
        """
        Fetch latest news articles for a stock.
        Should return a list of dictionaries containing:
        title, source, published_at, sentiment, summary
        """
        pass
