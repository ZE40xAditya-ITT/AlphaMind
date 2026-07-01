from sqlalchemy.orm import Session
from app.models.portfolio import Portfolio, PortfolioStock
from app.schemas.portfolio import PortfolioCreate, PortfolioStockCreate, PortfolioAnalysisResponse
from app.services.stock_analysis_service import StockAnalysisService
from fastapi import HTTPException

class PortfolioService:
    def __init__(self, stock_service: StockAnalysisService):
        self.stock_service = stock_service

    def create_portfolio(self, db: Session, user_id: int, data: PortfolioCreate) -> Portfolio:
        portfolio = Portfolio(user_id=user_id, name=data.name)
        db.add(portfolio)
        db.commit()
        db.refresh(portfolio)
        return portfolio

    def get_portfolios(self, db: Session, user_id: int) -> list[Portfolio]:
        return db.query(Portfolio).filter(Portfolio.user_id == user_id).all()
        
    def get_portfolio_by_id(self, db: Session, user_id: int, portfolio_id: int) -> Portfolio:
        portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id, Portfolio.user_id == user_id).first()
        if not portfolio:
            raise HTTPException(status_code=404, detail="Portfolio not found")
        return portfolio

    def delete_portfolio(self, db: Session, user_id: int, portfolio_id: int) -> None:
        portfolio = self.get_portfolio_by_id(db, user_id, portfolio_id)
        db.delete(portfolio)
        db.commit()

    def add_stock(self, db: Session, portfolio_id: int, user_id: int, data: PortfolioStockCreate) -> PortfolioStock:
        portfolio = self.get_portfolio_by_id(db, user_id, portfolio_id)
            
        sym_clean = data.symbol.upper().replace(".NS", "").replace(".BO", "").strip()
        existing_stock = None
        for s in portfolio.stocks:
            s_clean = s.symbol.upper().replace(".NS", "").replace(".BO", "").strip()
            if s_clean == sym_clean:
                existing_stock = s
                break

        if existing_stock:
            # Merge: Calculate new quantity and average price
            old_qty = existing_stock.quantity
            old_price = existing_stock.average_buy_price
            new_qty = data.quantity
            new_price = data.average_buy_price
            
            total_qty = old_qty + new_qty
            if total_qty > 0:
                avg_price = ((old_qty * old_price) + (new_qty * new_price)) / total_qty
                existing_stock.quantity = total_qty
                existing_stock.average_buy_price = avg_price
                if ".NS" in data.symbol.upper() or ".BO" in data.symbol.upper():
                    existing_stock.symbol = data.symbol.upper()
            db.commit()
            db.refresh(existing_stock)
            return existing_stock
        else:
            stock = PortfolioStock(
                portfolio_id=portfolio.id,
                symbol=data.symbol.upper(),
                quantity=data.quantity,
                average_buy_price=data.average_buy_price
            )
            db.add(stock)
            db.commit()
            db.refresh(stock)
            return stock

    def remove_stock(self, db: Session, portfolio_id: int, user_id: int, stock_id: int) -> None:
        portfolio = self.get_portfolio_by_id(db, user_id, portfolio_id)
        stock = db.query(PortfolioStock).filter(PortfolioStock.id == stock_id, PortfolioStock.portfolio_id == portfolio.id).first()
        if not stock:
            raise HTTPException(status_code=404, detail="Stock not found in portfolio")
        db.delete(stock)
        db.commit()

    def reduce_stock(self, db: Session, portfolio_id: int, user_id: int, stock_id: int, reduce_quantity: float) -> PortfolioStock | None:
        portfolio = self.get_portfolio_by_id(db, user_id, portfolio_id)
        stock = db.query(PortfolioStock).filter(PortfolioStock.id == stock_id, PortfolioStock.portfolio_id == portfolio.id).first()
        if not stock:
            raise HTTPException(status_code=404, detail="Stock not found in portfolio")
            
        if reduce_quantity >= stock.quantity:
            db.delete(stock)
            db.commit()
            return None
        else:
            stock.quantity -= reduce_quantity
            db.commit()
            db.refresh(stock)
            return stock

    def analyze_portfolio(self, db: Session, portfolio_id: int, user_id: int) -> PortfolioAnalysisResponse:
        portfolio = self.get_portfolio_by_id(db, user_id, portfolio_id)

        total_value = 0.0
        total_invested = 0.0
        sector_allocation = {}
        asset_breakdown = []
        
        for stock in portfolio.stocks:
            try:
                # Fetch current analysis for each stock
                analysis = self.stock_service.analyze_stock(db, user_id, stock.symbol)
                current_price = analysis.current_price or stock.average_buy_price
                
                invested = stock.quantity * stock.average_buy_price
                current_value = stock.quantity * current_price
                return_abs = current_value - invested
                return_pct = (return_abs / invested * 100) if invested > 0 else 0.0
                
                asset_breakdown.append({
                    "id": stock.id,
                    "symbol": stock.symbol,
                    "quantity": stock.quantity,
                    "average_buy_price": stock.average_buy_price,
                    "current_price": current_price,
                    "current_value": current_value,
                    "total_invested": invested,
                    "return_pct": return_pct,
                    "return_abs": return_abs
                })
                
                total_invested += invested
                total_value += current_value
                
                sector = analysis.sector or "Unknown"
                sector_allocation[sector] = sector_allocation.get(sector, 0.0) + current_value
                
            except Exception as e:
                # If analysis fails, fallback to average_buy_price
                invested = stock.quantity * stock.average_buy_price
                asset_breakdown.append({
                    "id": stock.id,
                    "symbol": stock.symbol,
                    "quantity": stock.quantity,
                    "average_buy_price": stock.average_buy_price,
                    "current_price": stock.average_buy_price,
                    "current_value": invested,
                    "total_invested": invested,
                    "return_pct": 0.0,
                    "return_abs": 0.0
                })
                total_invested += invested
                total_value += invested
                
        if total_invested > 0:
            overall_return_pct = ((total_value - total_invested) / total_invested) * 100
        else:
            overall_return_pct = 0.0
            
        # Normalize sector allocation to percentages
        if total_value > 0:
            for k in sector_allocation:
                sector_allocation[k] = (sector_allocation[k] / total_value) * 100
                
        # Diversification Score (HHI inverted)
        hhi = sum([(v/100)**2 for v in sector_allocation.values()])
        diversification_score = max(0.0, 100.0 - (hhi * 100))
        
        # Mock AI Insights
        insights = []
        if diversification_score < 40:
            insights.append("Portfolio is heavily concentrated in a few sectors. Consider diversifying to reduce risk.")
        else:
            insights.append("Portfolio has a healthy level of sector diversification.")
            
        if overall_return_pct > 15:
            insights.append("Your portfolio is strongly outperforming average market returns.")
        elif overall_return_pct < -5:
            insights.append("Your portfolio is underperforming. Review weak assets.")
            
        return PortfolioAnalysisResponse(
            total_value=total_value,
            total_invested=total_invested,
            overall_return_pct=overall_return_pct,
            diversification_score=diversification_score,
            ai_insights=insights,
            sector_allocation=sector_allocation,
            asset_breakdown=asset_breakdown
        )
