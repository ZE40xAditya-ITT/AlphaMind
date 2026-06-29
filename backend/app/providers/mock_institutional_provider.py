from typing import Dict, Optional
from app.interfaces.institutional_data_interface import InstitutionalDataProvider
import random

class MockInstitutionalProvider(InstitutionalDataProvider):
    """Mock implementation for testing Institutional Holdings."""
    
    def get_institutional_holdings(self, symbol: str) -> Optional[Dict[str, float]]:
        # Generate realistic looking mock data
        promoter = random.uniform(30.0, 65.0)
        fii = random.uniform(5.0, 30.0)
        dii = random.uniform(5.0, 25.0)
        public = 100.0 - (promoter + fii + dii)
        
        return {
            "promoter_pct": round(promoter, 2),
            "fii_pct": round(fii, 2),
            "dii_pct": round(dii, 2),
            "public_pct": round(public, 2)
        }
