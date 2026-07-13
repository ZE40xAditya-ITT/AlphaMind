from abc import ABC, abstractmethod

class AIAdvisoryProvider(ABC):
    """
    SOLID Boundary Interface for interacting with Generative AI / LLM models.
    Decouples domain services from specific third-party SDKs (e.g. Google Gemini, OpenAI, Anthropic).
    """

    @abstractmethod
    def generate_response(self, system_instruction: str, prompt: str) -> str:
        """Generate a response from the AI provider given a system instruction and user prompt."""
        pass
