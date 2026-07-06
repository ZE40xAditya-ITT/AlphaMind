import pandas as pd
import numpy as np
from app.schemas.stock import TechnicalAnalysis, TechnicalKPI

def calculate_rsi(prices: pd.Series, period: int = 14) -> float:
    """Calculate the Relative Strength Index (RSI)."""
    if len(prices) < period + 1:
        return 50.0  # Neutral default if not enough data

    delta = prices.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    avg_gain = gain.rolling(window=period, min_periods=period).mean()
    avg_loss = loss.rolling(window=period, min_periods=period).mean()

    # Avoid division by zero
    avg_loss = avg_loss.replace(0, 0.00001)
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))

    val = rsi.iloc[-1]
    if pd.isna(val):
        return 50.0
    return float(val)

def analyze(hist_data: pd.DataFrame) -> TechnicalAnalysis:
    """Perform technical analysis on historical price data (expects 1y daily data)."""
    if hist_data.empty or "Close" not in hist_data.columns:
        # Return empty analysis if data is missing
        empty_kpi = lambda w, ins: TechnicalKPI(value=0.0, score=0.0, weight=w, insight=ins)
        return TechnicalAnalysis(
            rsi=empty_kpi(0.25, "No data available"),
            sma_trend=empty_kpi(0.30, "No data available"),
            momentum=empty_kpi(0.25, "No data available"),
            volume_trend=empty_kpi(0.20, "No data available"),
            technical_score=0.0,
            strength="Weak"
        )

    close = hist_data["Close"].ffill().bfill()
    if isinstance(close, pd.DataFrame):
        close = close.iloc[:, 0]

    volume = hist_data["Volume"].ffill().bfill()
    if isinstance(volume, pd.DataFrame):
        volume = volume.iloc[:, 0]

    # Ensure current_price is a valid float, not NaN
    try:
        current_price = float(close.iloc[-1])
        if pd.isna(current_price):
            current_price = 0.0
    except (IndexError, ValueError, TypeError):
        current_price = 0.0

    # 1. RSI (25%)
    rsi_val = calculate_rsi(close, 14)
    # Score is 100 at RSI=50. Instead of penalizing to 0, clamp penalty to 40 so one indicator doesn't nuke the score
    rsi_score = max(40.0, min(100.0, 100.0 - abs(rsi_val - 50.0) * 1.5))
    if rsi_val > 70:
        rsi_insight = f"RSI is {rsi_val:.1f} (Overbought zone - potential pullback)"
    elif rsi_val < 30:
        rsi_insight = f"RSI is {rsi_val:.1f} (Oversold zone - potential recovery)"
    else:
        rsi_insight = f"RSI is {rsi_val:.1f} (Neutral/Healthy zone)"

    # 2. SMA 50 vs SMA 200 (30%)
    try:
        sma50 = float(close.rolling(window=50, min_periods=1).mean().iloc[-1])
        if pd.isna(sma50): sma50 = current_price
    except Exception:
        sma50 = current_price

    try:
        sma200 = float(close.rolling(window=200, min_periods=1).mean().iloc[-1])
        if pd.isna(sma200): sma200 = current_price
    except Exception:
        sma200 = current_price

    if sma50 >= sma200:
        sma_score = 100.0
        sma_insight = f"Golden/Bullish Trend (SMA50 {sma50:.2f} > SMA200 {sma200:.2f})"
    else:
        # Score decreases as gap widens, but softer penalty clamping at 40
        pct_diff = (sma200 - sma50) / sma200
        sma_score = max(40.0, min(100.0, 100.0 - (pct_diff * 400.0)))
        sma_insight = f"Bearish Trend (SMA50 {sma50:.2f} < SMA200 {sma200:.2f})"

    # 3. Price Momentum (25%) - 6 months (~126 trading days)
    lookback = min(126, len(close) - 1)
    price_6m_ago = float(close.iloc[-lookback]) if lookback > 0 else current_price
    momentum_pct = ((current_price - price_6m_ago) / price_6m_ago) * 100.0 if price_6m_ago > 0 else 0.0
    # Normalize: >20% growth = 100, <-10% growth = 0
    momentum_score = min(100.0, max(0.0, (momentum_pct + 10.0) * (100.0 / 30.0)))
    momentum_insight = f"6-Month Price change: {momentum_pct:+.1f}%"

    # 4. Volume Trend (20%)
    try:
        vol20 = float(volume.rolling(window=20, min_periods=1).mean().iloc[-1])
        vol50 = float(volume.rolling(window=50, min_periods=1).mean().iloc[-1])
        if pd.isna(vol20): vol20 = 0.0
        if pd.isna(vol50): vol50 = 1.0  # prevent division by zero
    except Exception:
        vol20 = 0.0
        vol50 = 1.0
    vol_ratio = vol20 / vol50 if vol50 > 0 else 1.0
    # Normalize: >=1.1 = 100, <=0.8 = 0, linear
    volume_score = min(100.0, max(0.0, (vol_ratio - 0.8) * 333.3))
    volume_insight = f"Volume Ratio: {vol_ratio:.2f}x (20D avg vs 50D avg)"

    # Total Score Calculation
    tech_score = (
        (rsi_score * 0.25) +
        (sma_score * 0.30) +
        (momentum_score * 0.25) +
        (volume_score * 0.20)
    )

    if tech_score >= 80:
        strength = "Strong Bullish"
    elif tech_score >= 60:
        strength = "Bullish"
    elif tech_score >= 40:
        strength = "Neutral"
    else:
        strength = "Bearish"

    return TechnicalAnalysis(
        rsi=TechnicalKPI(value=rsi_val, score=rsi_score, weight=0.25, insight=rsi_insight),
        sma_trend=TechnicalKPI(value=sma50, score=sma_score, weight=0.30, insight=sma_insight),
        momentum=TechnicalKPI(value=momentum_pct, score=momentum_score, weight=0.25, insight=momentum_insight),
        volume_trend=TechnicalKPI(value=vol_ratio, score=volume_score, weight=0.20, insight=volume_insight),
        technical_score=float(tech_score),
        strength=strength
    )
