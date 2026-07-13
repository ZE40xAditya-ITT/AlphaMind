from typing import Any, List
from app.interfaces.document_generator_interface import DocumentGeneratorInterface
from app.utils.pdf_generator import generate_invoice_pdf

class ReportLabDocumentProvider(DocumentGeneratorInterface):
    """
    Concrete implementation of DocumentGeneratorInterface using ReportLab.
    Encapsulates Two-Pass PDF rendering and flowable layout generation.
    """
    def generate_invoice_document(self, invoice: Any, user: Any, searches: List[Any], output_dir: str) -> str:
        return generate_invoice_pdf(invoice=invoice, user=user, searches=searches, output_dir=output_dir)
