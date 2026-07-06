import google.generativeai as genai
from sqlalchemy.orm import Session
from app.services.stock_analysis_service import StockAnalysisService
from app.core.config import settings

# Configure Gemini with the API key from config
if settings.GOOGLE_API_KEY:
    genai.configure(api_key=settings.GOOGLE_API_KEY)

class CopilotService:
    def __init__(self, stock_service: StockAnalysisService):
        self.stock_service = stock_service
        self.system_instruction = (
            "You are AlphaMind Copilot, a strict financial and stock market AI assistant. "
            "CRITICAL RULES:\n"
            "1. You MUST reject and refuse to answer ANY prompt that is not related to finance, investing, stocks, or the AlphaMind platform.\n"
            "2. Provide a concise, structured, and clear answer using markdown formatting. Use bold headings (e.g., **Heading**), bullet points, and short paragraphs. DO NOT repeat the user's question in your response.\n"
            "3. Ground your answers in the provided data context (which comes from Yahoo Finance and Wikipedia). If the context is missing, use your general financial knowledge."
        )

        # Use a modern Gemini model
        try:
            self.model = genai.GenerativeModel(
                "gemini-2.5-flash",
                system_instruction=self.system_instruction
            )
        except Exception:
            self.model = None

    def ask_question(self, db: Session, user_id: int, symbol: str, question: str) -> str:
        """
        AI Copilot answering questions using live context from StockAnalysisService (Yahoo Finance + Wikipedia).
        """
        if not self.model:
            return "Gemini API is not configured or failed to initialize."

        try:
            # Gather grounding context
            analysis = self.stock_service.analyze_stock(db, user_id, symbol)

            context = f"**Data Context for {analysis.company_name} ({symbol})**\n"
            context += f"Description (from Wikipedia): {analysis.description}\n"
            context += f"Current Price (from Yahoo Finance): ₹{analysis.current_price}\n"
            context += f"Recommendation: {analysis.recommendation} (Score: {analysis.final_score:.1f}/100)\n"
            context += f"Technical Insights: {analysis.technical.rsi.insight}\n"
            context += f"Fundamental Insights: {analysis.fundamental.roe.insight}\n"

            if analysis.institutional:
                context += f"Institutional Confidence: {analysis.institutional.insight}\n"

            if analysis.news and len(analysis.news) > 0:
                context += f"Recent News Sentiment: {analysis.news[0].sentiment}\n"

            prompt = f"System Context:\n{context}\n\nUser Question:\n{question}"

            response = self.model.generate_content(prompt)
            return response.text

        except Exception as e:
            return f"I'm sorry, I could not gather enough context for {symbol} to answer your question. Error: {str(e)}"

    def ask_portfolio_question(self, question: str, analysis) -> str:
        """
        AI Copilot for Portfolios. Takes pre-computed portfolio analysis as context.
        """
        if not self.model:
            return "Gemini API is not configured or failed to initialize."

        try:
            context = f"**Data Context for User's Portfolio**\n"
            context += f"Total Value: ₹{analysis.total_value:,.2f}\n"
            context += f"Overall Return: {analysis.overall_return_pct:.2f}%\n"
            context += f"Diversification Score: {analysis.diversification_score:.0f}/100\n"

            if hasattr(analysis, 'ai_insights') and analysis.ai_insights:
                context += f"Key Insight: {analysis.ai_insights[0]}\n"

            prompt = f"System Context:\n{context}\n\nUser Question:\n{question}"

            response = self.model.generate_content(prompt)
            return response.text

        except Exception as e:
            return f"I'm sorry, I could not gather enough context to answer your question. Error: {str(e)}"

    def ask_global_question(self, question: str) -> str:
        """
        Global AI Copilot using world knowledge, restricted to finance.
        """
        if not self.model:
            return "Gemini API is not configured or failed to initialize."

        try:
            prompt = f"User Question:\n{question}"
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Error communicating with AI Copilot: {str(e)}"
