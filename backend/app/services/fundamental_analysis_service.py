from app.schemas.stock import FundamentalAnalysis, FundamentalKPI

def clean_percentage_value(val: float | None) -> float:
    """Standardize input values which might be fractions (0.15) or percentages (15.0)."""
    if val is None:
        return 0.0
    # If it's a fraction between -1.0 and 1.0 (excluding 0.0), scale to percentage
    if -1.0 <= val <= 1.0 and val != 0.0:
        return val * 100.0
    return val

def analyze(stock_info: dict) -> FundamentalAnalysis:
    """Perform fundamental analysis using ticker info dictionary from Yahoo Finance."""
    
    # 1. Return on Equity (ROE) (30%)
    # yfinance key: returnOnEquity (usually a fraction like 0.18 for 18%)
    raw_roe = stock_info.get("returnOnEquity")
    roe_val = clean_percentage_value(raw_roe)
    # Normalize: >=15% = 100, <=0% = 0
    roe_score = min(100.0, max(0.0, roe_val * (100.0 / 15.0)))
    roe_insight = f"ROE: {roe_val:.1f}% ({'Excellent' if roe_val >= 20 else 'Moderate' if roe_val >= 10 else 'Low'} profitability)"

    # 2. Debt-to-Equity (25%)
    # yfinance key: debtToEquity (can be a percentage like 85.5 meaning 0.85, or a ratio)
    raw_de = stock_info.get("debtToEquity")
    if raw_de is not None:
        # If it's > 5, it's likely represented as a percentage (e.g. 85.5 for 0.855 D/E ratio)
        if raw_de > 5.0:
            de_val = raw_de / 100.0
        else:
            de_val = raw_de
    else:
        de_val = 0.0
        
    # Normalize: <=0.5 = 100, >=2.0 = 0
    de_score = max(0.0, min(100.0, 100.0 - ((de_val - 0.5) * 66.6)))
    de_insight = f"D/E Ratio: {de_val:.2f} ({'Low leverage' if de_val < 0.5 else 'Moderate leverage' if de_val <= 1.5 else 'High leverage'})"

    # 3. Revenue Growth (20%)
    # yfinance key: revenueGrowth (fraction, e.g. 0.12 for 12% YoY)
    raw_rg = stock_info.get("revenueGrowth")
    rg_val = clean_percentage_value(raw_rg)
    # Normalize: >=15% = 100, <=-10% = 0
    rg_score = min(100.0, max(0.0, (rg_val + 10.0) * (100.0 / 25.0)))
    rg_insight = f"Revenue Growth (YoY): {rg_val:+.1f}%"

    # 4. EPS Growth (25%)
    # yfinance key: earningsGrowth (fraction, e.g. 0.15 for 15%)
    raw_eg = stock_info.get("earningsGrowth")
    if raw_eg is None:
        # Fallback to earningsQuarterlyGrowth or default to 0
        raw_eg = stock_info.get("earningsQuarterlyGrowth", 0.0)
    eg_val = clean_percentage_value(raw_eg)
    # Normalize: >=15% = 100, <=-10% = 0
    eg_score = min(100.0, max(0.0, (eg_val + 10.0) * (100.0 / 25.0)))
    eg_insight = f"Earnings (EPS) Growth: {eg_val:+.1f}%"

    # Total Score Calculation
    fund_score = (
        (roe_score * 0.30) +
        (de_score * 0.25) +
        (rg_score * 0.20) +
        (eg_score * 0.25)
    )

    if fund_score >= 80:
        strength = "Excellent Financials"
    elif fund_score >= 60:
        strength = "Stable/Healthy"
    elif fund_score >= 40:
        strength = "Average"
    else:
        strength = "Weak/Risky"

    return FundamentalAnalysis(
        roe=FundamentalKPI(value=roe_val, score=roe_score, weight=0.30, insight=roe_insight),
        debt_to_equity=FundamentalKPI(value=de_val, score=de_score, weight=0.25, insight=de_insight),
        revenue_growth=FundamentalKPI(value=rg_val, score=rg_score, weight=0.20, insight=rg_insight),
        eps_growth=FundamentalKPI(value=eg_val, score=eg_score, weight=0.25, insight=eg_insight),
        fundamental_score=float(fund_score),
        strength=strength
    )
