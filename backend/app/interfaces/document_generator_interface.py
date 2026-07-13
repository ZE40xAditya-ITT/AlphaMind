from abc import ABC, abstractmethod
from typing import Any, List

class DocumentGeneratorInterface(ABC):
    """
    SOLID Boundary Interface for generating PDF documents (commercial invoices, strategic audit reports).
    Decouples domain services from third-party rendering engines (ReportLab).
    """

    @abstractmethod
    def generate_invoice_document(self, invoice: Any, user: Any, searches: List[Any], output_dir: str) -> str:
        """Render a commercial invoice PDF and return its absolute file path."""
        pass
