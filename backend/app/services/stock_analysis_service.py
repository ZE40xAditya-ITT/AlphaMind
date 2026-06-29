from sqlalchemy.orm import Session

from app.schemas.stock import StockAnalysisResponse, StockDetailsResponse, CompareResponse
from app.services import history_service
from app.services.market_data_aggregator import MarketDataAggregator
from app.services.analysis_engine import AnalysisEngine
from app.services.institutional_service import InstitutionalService
from app.services.news_service import NewsService

class StockAnalysisService:
    """
    High-level orchestrator for analyzing stocks.
    Delegates to MarketDataAggregator, AnalysisEngine, InstitutionalService, and NewsService.
    """
    
    def __init__(
        self,
        market_data_aggregator: MarketDataAggregator,
        analysis_engine: AnalysisEngine,
        institutional_service: InstitutionalService,
        news_service: NewsService
    ):
        self.market_data_aggregator = market_data_aggregator
        self.analysis_engine = analysis_engine
        self.institutional_service = institutional_service
        self.news_service = news_service

    def analyze_stock(self, db: Session, user_id: int, raw_symbol: str) -> StockAnalysisResponse:
        """Orchestrate the full technical and fundamental analysis of a stock."""
        
        # 1. Fetch Market Data
        symbol, hist, info, company_name, sector, current_price, description = self.market_data_aggregator.get_market_data(raw_symbol)
        
        # 2. Perform Analysis
        tech_analysis, fund_analysis, final_score, recommendation, rank_label = self.analysis_engine.analyze(hist, info)
        
        # 3. Fetch Institutional Holdings & News
        holdings = self.institutional_service.get_holdings(db, symbol)
        news_articles = self.news_service.get_news(db, symbol)

        # 4. Save Search to History
        history_service.save_search(
            db=db,
            user_id=user_id,
            stock_symbol=raw_symbol.strip().upper(),
            stock_name=company_name,
            technical_score=tech_analysis.technical_score,
            fundamental_score=fund_analysis.fundamental_score,
            final_score=final_score,
            recommendation=recommendation
        )

        # 5. Build Response DTO
        return StockAnalysisResponse(
            symbol=raw_symbol.strip().upper(),
            company_name=company_name,
            sector=sector,
            current_price=current_price,
            technical=tech_analysis,
            fundamental=fund_analysis,
            institutional=holdings,
            news=news_articles,
            final_score=float(final_score),
            recommendation=recommendation,
            rank_label=rank_label,
            description=description
        )

    def get_stock_details(self, raw_symbol: str) -> StockDetailsResponse:
        """Retrieve quick static stock info and basic market price data."""
        basic_info = self.market_data_aggregator.get_basic_info(raw_symbol)
        return StockDetailsResponse(**basic_info)

    def compare_stocks(self, db: Session, user_id: int, symbol1: str, symbol2: str) -> CompareResponse:
        """Compare two stocks."""
        stock1_analysis = self.analyze_stock(db, user_id, symbol1)
        stock2_analysis = self.analyze_stock(db, user_id, symbol2)
        
        if stock1_analysis.final_score > stock2_analysis.final_score:
            winner = stock1_analysis.symbol
            diff = stock1_analysis.final_score - stock2_analysis.final_score
            insight = f"{stock1_analysis.symbol} is stronger than {stock2_analysis.symbol} by {diff:.1f} points."
        elif stock2_analysis.final_score > stock1_analysis.final_score:
            winner = stock2_analysis.symbol
            diff = stock2_analysis.final_score - stock1_analysis.final_score
            insight = f"{stock2_analysis.symbol} is stronger than {stock1_analysis.symbol} by {diff:.1f} points."
        else:
            winner = "Tie"
            insight = f"Both {stock1_analysis.symbol} and {stock2_analysis.symbol} share the same final score."

        return CompareResponse(
            stock1=stock1_analysis,
            stock2=stock2_analysis,
            winner=winner,
            insight=insight
        )
