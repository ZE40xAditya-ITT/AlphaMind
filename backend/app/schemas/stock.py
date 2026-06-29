from pydantic import BaseModel
class TechnicalKPI(BaseModel):
    """Individual technical KPI with raw value and normalized score."""
    value: float | None = None
    score: float = 0.0
    weight: float = 0.0
    insight: str = ""
class TechnicalAnalysis(BaseModel):
    rsi: TechnicalKPI
    sma_trend: TechnicalKPI
    momentum: TechnicalKPI
    volume_trend: TechnicalKPI
    technical_score: float = 0.0
    strength: str = ""  # e.g., "Strong", "Moderate", "Weak"
class FundamentalKPI(BaseModel):
    """Individual fundamental KPI with raw value and normalized score."""
    value: float | None = None
    score: float = 0.0
    weight: float = 0.0
    insight: str = ""
class FundamentalAnalysis(BaseModel):
    roe: FundamentalKPI
    debt_to_equity: FundamentalKPI
    revenue_growth: FundamentalKPI
    eps_growth: FundamentalKPI
    fundamental_score: float = 0.0
    strength: str = ""  # e.g., "Strong Growth", "Moderate", "Weak"

class InstitutionalHoldingsResponse(BaseModel):
    promoter_pct: float
    fii_pct: float
    dii_pct: float
    public_pct: float
    insight: str

class NewsArticleResponse(BaseModel):
    title: str
    source: str | None = None
    published_at: str | None = None
    sentiment: str | None = None
    summary: str | None = None

class StockAnalysisResponse(BaseModel):
    symbol: str
    company_name: str
    sector: str | None = None
    current_price: float | None = None
    technical: TechnicalAnalysis
    fundamental: FundamentalAnalysis
    institutional: InstitutionalHoldingsResponse | None = None
    news: list[NewsArticleResponse] = []
    final_score: float = 0.0
    recommendation: str = ""
    rank_label: str = ""  # e.g., "Strong Buy", "Buy", "Hold", "Weak", "Avoid"
    description: str | None = None
class CompareResponse(BaseModel):
    stock1: StockAnalysisResponse
    stock2: StockAnalysisResponse
    winner: str | None = None
    insight: str | None = None
class StockDetailsResponse(BaseModel):
    symbol: str
    company_name: str
    sector: str | None = None
    industry: str | None = None
    current_price: float | None = None
    market_cap: int | None = None
    pe_ratio: float | None = None
    fifty_two_week_high: float | None = None
    fifty_two_week_low: float | None = None