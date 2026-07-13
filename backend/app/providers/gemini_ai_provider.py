from app.interfaces.ai_provider_interface import AIAdvisoryProvider
from app.core.config import settings

class GeminiAIProvider(AIAdvisoryProvider):
    """
    Concrete implementation of AIAdvisoryProvider using Google Gemini API.
    All third-party generative AI imports and network calls are strictly encapsulated here.
    """
    def __init__(self):
        self.configured = False
        try:
            import google.generativeai as genai
            if settings.GOOGLE_API_KEY:
                genai.configure(api_key=settings.GOOGLE_API_KEY)
                self.genai = genai
                self.configured = True
        except Exception:
            self.configured = False

    def generate_response(self, system_instruction: str, prompt: str) -> str:
        if not self.configured:
            return (
                "**Executive Analysis Summary (Offline / Fallback Advisory)**\n\n"
                "The quantitative scoring engine indicates structured financial momentum. "
                "Review the Technical and Fundamental KPI metrics detailed in the data grids above "
                "for institutional buy/hold positioning."
            )
        try:
            model = self.genai.GenerativeModel(
                "gemini-2.5-flash",
                system_instruction=system_instruction
            )
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"**Advisory Notice**: Unable to reach AI inference node ({str(e)[:60]}). Please refer to the computed quantitative metrics."
