import resend
from app.core.config import settings


def send_digest_email(digest, user) -> bool:
    if not settings.RESEND_API_KEY:
        print("RESEND_API_KEY not configured, skipping email.")
        return False
    resend.api_key = settings.RESEND_API_KEY
    market = digest.market_summary or {}
    ai = digest.ai_suggestions or {}
    portfolio = digest.portfolio_summary or {}
    sentiment = market.get('sentiment', 'Neutral')
    emoji = 'UP' if sentiment == 'Bullish' else ('DOWN' if sentiment == 'Bearish' else 'STABLE')
    exec_summary = ai.get('executive_summary', 'Your weekly market update is ready.')
    suggestions = ai.get('suggestions', [])
    suggestions_html = ''.join([f'<li style="margin-bottom:8px;">{s}</li>' for s in suggestions[:5]])
    health = portfolio.get('health_score', 'N/A')
    nifty_chg = market.get('nifty_change_pct', 0)
    bank_chg = market.get('banknifty_change_pct', 0)
    html_content = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0F172A;color:#E2E8F0;padding:32px;border-radius:16px;">
      <div style="text-align:center;margin-bottom:32px;">
        <h1 style="color:#6366F1;font-size:28px;margin:0;">AlphaMind</h1>
        <p style="color:#94A3B8;font-size:14px;margin:8px 0 0;">Weekly Investment Digest</p>
      </div>
      <div style="background:#1E293B;border-radius:12px;padding:24px;margin-bottom:24px;border-left:4px solid #6366F1;">
        <h2 style="color:#F8FAFC;margin:0 0 12px;">Good Morning, {user.username}</h2>
        <p style="color:#94A3B8;margin:0;">Market Sentiment: <strong style="color:{'#10B981' if sentiment=='Bullish' else '#EF4444' if sentiment=='Bearish' else '#F59E0B'}">{sentiment} ({emoji})</strong></p>
      </div>
      <div style="background:#1E293B;border-radius:12px;padding:24px;margin-bottom:24px;">
        <h3 style="color:#6366F1;margin:0 0 12px;">Executive Summary</h3>
        <p style="color:#CBD5E1;margin:0;line-height:1.6;">{exec_summary}</p>
      </div>
      <div style="background:#1E293B;border-radius:12px;padding:24px;margin-bottom:24px;">
        <h3 style="color:#6366F1;margin:0 0 12px;">Market Snapshot</h3>
        <p style="color:#CBD5E1;margin:4px 0;">NIFTY 50: {nifty_chg:+.2f}%</p>
        <p style="color:#CBD5E1;margin:4px 0;">BANKNIFTY: {bank_chg:+.2f}%</p>
        <p style="color:#CBD5E1;margin:4px 0;">Portfolio Health Score: <strong style="color:#10B981;">{health}/100</strong></p>
      </div>
      <div style="background:#1E293B;border-radius:12px;padding:24px;margin-bottom:24px;">
        <h3 style="color:#6366F1;margin:0 0 12px;">AI Suggestions This Week</h3>
        <ul style="color:#CBD5E1;margin:0;padding-left:20px;line-height:1.8;">{suggestions_html}</ul>
      </div>
      <div style="text-align:center;margin-top:32px;padding-top:24px;border-top:1px solid #334155;">
        <p style="color:#475569;font-size:12px;margin:0;">AlphaMind AI - Personalized Investment Intelligence</p>
        <p style="color:#475569;font-size:12px;margin:8px 0 0;">This is not financial advice. Invest responsibly.</p>
      </div>
    </div>
    """
    try:
        params = {
            "from": settings.RESEND_FROM_EMAIL,
            "to": [user.email],
            "subject": f"Your AlphaMind Weekly Digest - Market is {sentiment}",
            "html": html_content,
        }
        resend.Emails.send(params)
        return True
    except Exception as e:
        print(f"Email send failed: {e}")
        return False
