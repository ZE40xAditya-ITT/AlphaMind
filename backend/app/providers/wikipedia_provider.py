import wikipedia
import concurrent.futures
from app.interfaces.company_info_interface import CompanyInfoProvider

class WikipediaProvider(CompanyInfoProvider):
    """
    Concrete implementation of CompanyInfoProvider using the Wikipedia API with strict timeout.
    """

    def get_description(self, company_name: str) -> str:
        def _fetch():
            try:
                search_query = company_name.split(" Ltd")[0].split(" Inc")[0].split(" Limited")[0].strip()
                return wikipedia.summary(search_query, sentences=3)
            except Exception:
                return "Company description is currently unavailable."

        try:
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                future = executor.submit(_fetch)
                return future.result(timeout=2.5)  # Hard 2.5-second timeout
        except Exception:
            return "Company description is currently unavailable."

