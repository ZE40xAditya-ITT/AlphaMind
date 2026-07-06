from abc import ABC, abstractmethod

class CompanyInfoProvider(ABC):
    """
    Boundary interface for retrieving company descriptions.
    Decouples the business logic from Wikipedia or other description providers.
    """

    @abstractmethod
    def get_description(self, company_name: str) -> str:
        """Fetch a summary/description for the given company name."""
        pass
