import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class InvoiceNumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to add executive branding ribbon, running footer, and total page count to commercial invoices.
    """
    def __init__(self, *args, **kwargs):
        super(InvoiceNumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(InvoiceNumberedCanvas, self).showPage()
        super(InvoiceNumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        width, height = self._pagesize

        # Top Executive Accent Ribbon (Slate-900 with Indigo tip)
        self.setFillColor(colors.HexColor("#0F172A"))
        self.rect(0, height - 6, width - 150, 6, fill=1, stroke=0)
        self.setFillColor(colors.HexColor("#4F46E5"))
        self.rect(width - 150, height - 6, 150, 6, fill=1, stroke=0)

        # Running Header
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#1E293B"))
        self.drawString(54, height - 24, "ALPHAMIND AI")
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(130, height - 24, "|   COMMERCIAL TAX INVOICE & BILL OF SUPPLY")
        self.drawRightString(width - 54, height - 24, datetime.now().strftime("%d %b %Y"))

        # Header Divider Line
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(54, height - 30, width - 54, height - 30)

        # Footer Divider Line
        self.line(54, 42, width - 54, 42)

        # Running Footer
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(54, 26, "ALPHAMIND AI SYSTEMS &bull; COMPUTER GENERATED INVOICE &bull; NO SIGNATURE REQUIRED")
        self.drawRightString(width - 54, 26, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()

def generate_invoice_pdf(
    invoice_number: str,
    invoice_date: datetime,
    username: str,
    email: str,
    total_searches: int,
    amount: float,
    rate_per_search: float,
    output_dir: str
) -> str:
    """Generate an ultra-premium, executive-grade PDF commercial invoice using ReportLab."""
    os.makedirs(output_dir, exist_ok=True)
    filename = f"{invoice_number.replace('/', '_')}.pdf"
    pdf_path = os.path.join(output_dir, filename)

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=A4,
        rightMargin=54,
        leftMargin=54,
        topMargin=45,
        bottomMargin=55
    )

    styles = getSampleStyleSheet()

    # Executive Color Palette
    PRIMARY_DARK = colors.HexColor('#0F172A')
    INDIGO = colors.HexColor('#4F46E5')
    TEXT_SLATE = colors.HexColor('#334155')
    TEXT_MUTED = colors.HexColor('#64748B')
    LIGHT_BG = colors.HexColor('#F8FAFC')
    ALT_ROW_BG = colors.HexColor('#F1F5F9')
    BORDER_COLOR = colors.HexColor('#E2E8F0')
    SUCCESS_GREEN = colors.HexColor('#10B981')

    # Typography
    brand_style = ParagraphStyle(
        'Brand',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=26,
        textColor=PRIMARY_DARK,
        spaceAfter=3
    )

    brand_sub_style = ParagraphStyle(
        'BrandSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=TEXT_MUTED
    )

    inv_title_style = ParagraphStyle(
        'InvTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=INDIGO,
        alignment=2 # Right align
    )

    inv_meta_style = ParagraphStyle(
        'InvMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=TEXT_SLATE,
        alignment=2 # Right align
    )

    card_header_style = ParagraphStyle(
        'CardHeader',
        parent=styles['Heading3'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=PRIMARY_DARK,
        spaceAfter=4
    )

    cell_style = ParagraphStyle(
        'Cell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=TEXT_SLATE
    )

    cell_bold_style = ParagraphStyle(
        'CellBold',
        parent=cell_style,
        fontName='Helvetica-Bold',
        textColor=PRIMARY_DARK
    )

    cell_right_style = ParagraphStyle(
        'CellRight',
        parent=cell_style,
        alignment=2
    )

    cell_right_bold_style = ParagraphStyle(
        'CellRightBold',
        parent=cell_bold_style,
        alignment=2
    )

    header_th_style = ParagraphStyle(
        'TH',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.white
    )

    header_th_right_style = ParagraphStyle(
        'THRight',
        parent=header_th_style,
        alignment=2
    )

    elements = []

    brand_p1 = Paragraph("ALPHAMIND AI", brand_style)
    brand_p2 = Paragraph("Stock Intelligence & Fundamental Scoring Engine", brand_sub_style)

    date_str = invoice_date.strftime('%d %B %Y') if invoice_date else datetime.now().strftime('%d %B %Y')
    inv_p1 = Paragraph("COMMERCIAL INVOICE", inv_title_style)
    inv_p2 = Paragraph(f"<b>Invoice #:</b> {invoice_number}<br/><b>Date of Issue:</b> {date_str}<br/><b>Status:</b> <font color='{SUCCESS_GREEN}'><b>DUE / ACTIVE</b></font>", inv_meta_style)

    header_table = Table([[ [brand_p1, brand_p2], [inv_p1, inv_p2] ]], colWidths=[260, 227])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 22))

    # 2. Bill To & Payment Terms Card
    bill_to_title = Paragraph("BILL TO / CLIENT INFORMATION", card_header_style)
    bill_to_desc = Paragraph(f"<b>Customer Name:</b> {username}<br/><b>Account Email:</b> {email}<br/><b>Account Type:</b> AlphaMind Premium Member<br/><b>Service Tier:</b> Pay-As-You-Go API & Search Query Pricing", cell_style)

    terms_title = Paragraph("PAYMENT TERMS & SCHEDULE", card_header_style)
    terms_desc = Paragraph("<b>Payment Terms:</b> Due within 15 days of invoice date<br/><b>Payment Method:</b> UPI, Net Banking, or Credit Card<br/><b>Billing Currency:</b> Indian Rupees (INR - ₹)<br/><b>Support:</b> support@alphamind.com", cell_style)

    client_card = Table([[ [bill_to_title, bill_to_desc], [terms_title, terms_desc] ]], colWidths=[240, 247])
    client_card.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_BG),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 12),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ('LEFTPADDING', (0,0), (-1,-1), 14),
        ('RIGHTPADDING', (0,0), (-1,-1), 14),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    elements.append(client_card)
    elements.append(Spacer(1, 24))

    # 3. Line Items Table
    table_data = [
        [
            Paragraph("Service Description & Code", header_th_style),
            Paragraph("Rate (₹)", header_th_right_style),
            Paragraph("Quantity", header_th_right_style),
            Paragraph("Total Amount (₹)", header_th_right_style)
        ],
        [
            Paragraph("<b>AlphaMind Stock Scoring & API Queries</b><br/><font size=8 color='#64748B'>Real-time fundamental analysis, technical RSI/SMA scores, and AI recommendations.</font>", cell_style),
            Paragraph(f"₹ {rate_per_search:,.2f}", cell_right_style),
            Paragraph(f"{total_searches:,}", cell_right_style),
            Paragraph(f"₹ {amount:,.2f}", cell_right_bold_style)
        ],
        [
            Paragraph("<b>Platform Maintenance & Data Feeds</b><br/><font size=8 color='#64748B'>Institutional NSE & BSE real-time data connectivity & storage.</font>", cell_style),
            Paragraph("₹ 0.00", cell_right_style),
            Paragraph("1", cell_right_style),
            Paragraph("INCLUDED", cell_right_bold_style)
        ]
    ]

    item_table = Table(table_data, colWidths=[247, 80, 70, 90])
    item_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY_DARK),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,0), 10),
        ('BOTTOMPADDING', (0,0), (-1,0), 10),
        ('TOPPADDING', (0,1), (-1,-1), 12),
        ('BOTTOMPADDING', (0,1), (-1,-1), 12),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('BACKGROUND', (0,1), (-1,1), colors.white),
        ('BACKGROUND', (0,2), (-1,2), ALT_ROW_BG),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    elements.append(item_table)
    elements.append(Spacer(1, 16))

    # 4. Summary & Grand Total Card
    subtotal_str = f"₹ {amount:,.2f}"
    tax_str = "₹ 0.00 (Inclusive)"
    total_str = f"₹ {amount:,.2f}"

    summary_data = [
        [Paragraph("Subtotal:", cell_right_style), Paragraph(subtotal_str, cell_right_bold_style)],
        [Paragraph("Estimated Taxes (GST 18% / Inclusive):", cell_right_style), Paragraph(tax_str, cell_right_style)],
        [Paragraph("<font size=11 color='#1E1B4B'><b>GRAND TOTAL DUE:</b></font>", cell_right_bold_style), Paragraph(f"<font size=12 color='#4F46E5'><b>{total_str}</b></font>", cell_right_bold_style)]
    ]

    summary_table = Table(summary_data, colWidths=[347, 140])
    summary_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-2), 6),
        ('BOTTOMPADDING', (0,0), (-1,-2), 6),
        ('TOPPADDING', (0,-1), (-1,-1), 10),
        ('BOTTOMPADDING', (0,-1), (-1,-1), 10),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#EEF2FF')),
        ('BOX', (0,-1), (-1,-1), 1, colors.HexColor('#C7D2FE')),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 28))

    # Build PDF with two-pass invoice canvas
    doc.build(elements, canvasmaker=InvoiceNumberedCanvas)
    return os.path.abspath(pdf_path)
