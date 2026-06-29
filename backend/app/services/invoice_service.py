from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime, timezone
import os

from app.models.invoice import Invoice
from app.models.user import User
from app.models.search_history import SearchHistory
from app.utils.pdf_generator import generate_invoice_pdf
from app.core.config import settings

def get_invoices(db: Session) -> list[Invoice]:
    """Retrieve all generated invoices, sorted by date descending."""
    return db.query(Invoice).order_by(Invoice.invoice_date.desc()).all()

def get_invoice_by_id(db: Session, invoice_id: int) -> Invoice | None:
    """Retrieve a single invoice by ID."""
    return db.query(Invoice).filter(Invoice.id == invoice_id).first()

def generate_invoice(db: Session, user_id: int, rate_per_search: float = 20.0) -> Invoice | None:
    """Generate an invoice for all unbilled stock searches performed by a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None

    # Determine the date of the latest invoice to only bill subsequent searches
    latest_invoice = db.query(Invoice).filter(Invoice.user_id == user_id).order_by(desc(Invoice.invoice_date)).first()
    
    query = db.query(SearchHistory).filter(SearchHistory.user_id == user_id)
    if latest_invoice:
        query = query.filter(SearchHistory.searched_at > latest_invoice.invoice_date)
        
    searches = query.all()
    total_searches = len(searches)
    
    # If the user has zero unbilled searches, we can still generate an invoice for 0 or raise an exception.
    # Let's generate it anyway (or return none/empty). The BRD suggests generation based on stats.
    # We will raise or return None if there are no new searches to bill, or generate a zero invoice.
    # Let's allow generating it if total_searches > 0, otherwise return a message or raise a warning.
    # Let's write the code to return None if total_searches is 0.
    if total_searches == 0:
        return None

    amount = total_searches * rate_per_search

    # Generate sequential unique invoice number
    # Format: INV-YYYYMMDD-XXXX where XXXX is user_id + invoice count
    count = db.query(Invoice).count() + 1
    invoice_number = f"INV-{datetime.now().strftime('%Y%m%d')}-{count:04d}"

    invoice_date = datetime.now(timezone.utc)

    # Generate the PDF
    pdf_dir = os.path.abspath(settings.INVOICE_DIR)
    pdf_path = generate_invoice_pdf(
        invoice_number=invoice_number,
        invoice_date=invoice_date,
        username=user.username,
        email=user.email,
        total_searches=total_searches,
        amount=amount,
        rate_per_search=rate_per_search,
        output_dir=pdf_dir
    )

    db_invoice = Invoice(
        user_id=user_id,
        invoice_number=invoice_number,
        total_searches=total_searches,
        amount=amount,
        invoice_date=invoice_date,
        pdf_path=pdf_path
    )
    
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    
    return db_invoice

def mark_invoice_as_paid(db: Session, invoice_id: int, is_paid: bool) -> Invoice | None:
    """Mark an invoice as paid or unpaid."""
    invoice = get_invoice_by_id(db, invoice_id)
    if not invoice:
        return None
    invoice.is_paid = is_paid
    db.commit()
    db.refresh(invoice)
    return invoice
