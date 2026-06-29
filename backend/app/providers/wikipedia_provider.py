import wikipedia
from app.interfaces.company_info_interface import CompanyInfoProvider

class WikipediaProvider(CompanyInfoProvider):
    """
    Concrete implementation of CompanyInfoProvider using the Wikipedia API.
    """
    
    def get_description(self, company_name: str) -> str:
        try:
            # Try to fetch summary from Wikipedia
            # Use company_name without suffixes like "Ltd." or "Inc." for better matching
            search_query = company_name.split(" Ltd")[0].split(" Inc")[0].strip()
            return wikipedia.summary(search_query, sentences=4)
        except Exception:
            return "Company description is currently unavailable."
