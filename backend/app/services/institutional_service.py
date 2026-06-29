from sqlalchemy.orm import Session
from app.models.institutional_holding import InstitutionalHolding
from app.interfaces.institutional_data_interface import InstitutionalDataProvider
from typing import Optional, Dict, Any

class InstitutionalService:
    def __init__(self, provider: InstitutionalDataProvider):
        self.provider = provider

    def get_holdings(self, db: Session, symbol: str) -> Optional[Dict[str, Any]]:
        # Check DB cache first
        holding = db.query(InstitutionalHolding).filter(InstitutionalHolding.symbol == symbol).first()
        if holding:
            return {
                "promoter_pct": holding.promoter_pct,
                "fii_pct": holding.fii_pct,
                "dii_pct": holding.dii_pct,
                "public_pct": holding.public_pct,
                "insight": self._generate_insight(holding.promoter_pct, holding.fii_pct, holding.dii_pct)
            }
        
        # Fetch from provider
        data = self.provider.get_institutional_holdings(symbol)
        if not data:
            return None
            
        # Save to DB
        new_holding = InstitutionalHolding(
            symbol=symbol,
            promoter_pct=data.get("promoter_pct", 0.0),
            fii_pct=data.get("fii_pct", 0.0),
            dii_pct=data.get("dii_pct", 0.0),
            public_pct=data.get("public_pct", 0.0),
            insight=self._generate_insight(data.get("promoter_pct", 0.0), data.get("fii_pct", 0.0), data.get("dii_pct", 0.0))
        )
        db.add(new_holding)
        db.commit()
        db.refresh(new_holding)
        
        return {
            "promoter_pct": new_holding.promoter_pct,
            "fii_pct": new_holding.fii_pct,
            "dii_pct": new_holding.dii_pct,
            "public_pct": new_holding.public_pct,
            "insight": self._generate_insight(new_holding.promoter_pct, new_holding.fii_pct, new_holding.dii_pct)
        }

    def _generate_insight(self, promoter: float, fii: float, dii: float) -> str:
        if fii > 20.0 and dii > 15.0:
            return "Strong institutional backing indicates high long-term confidence."
        elif promoter > 50.0:
            return "High promoter holding suggests management stability and confidence."
        else:
            return "Institutional ownership is moderate. Public holds a significant portion."
