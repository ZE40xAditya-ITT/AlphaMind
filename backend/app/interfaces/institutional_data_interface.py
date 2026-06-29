from abc import ABC, abstractmethod
from typing import Dict, Optional

class InstitutionalDataProvider(ABC):
    """Boundary interface for retrieving institutional holdings data."""
    
    @abstractmethod
    def get_institutional_holdings(self, symbol: str) -> Optional[Dict[str, float]]:
        """
        Fetch institutional holding percentages.
        Returns dict with keys: promoter_pct, fii_pct, dii_pct, public_pct
        """
        pass
