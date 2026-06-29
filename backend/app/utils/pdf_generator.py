import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

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
    """Generate a professional PDF invoice using ReportLab."""
    os.makedirs(output_dir, exist_ok=True)
    filename = f"{invoice_number.replace('/', '_')}.pdf"
    pdf_path = os.path.join(output_dir, filename)

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'InvoiceTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        textColor=colors.HexColor('#0F172A'),  # Slate-900
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        'InvoiceSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#475569'),  # Slate-600
        spaceAfter=5
    )
    
    header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        textColor=colors.white
    )
    
    cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#1E293B')
    )
    
    cell_bold_style = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.HexColor('#0F172A')
    )

    elements = []

    # 1. Header (Brand name & title)
    elements.append(Paragraph("AlphaMind AI", title_style))
    elements.append(Paragraph("NSE Equity intelligence platform & Stock Scoring Engine", subtitle_style))
    elements.append(Paragraph("Email: billing@alphamind.com", subtitle_style))
    elements.append(Spacer(1, 20))

    # 2. Invoice Details (Metadata Table)
    meta_data = [
        [
            Paragraph(f"<b>Invoice Number:</b> {invoice_number}", cell_style),
            Paragraph(f"<b>Bill To:</b> {username}", cell_style)
        ],
        [
            Paragraph(f"<b>Invoice Date:</b> {invoice_date.strftime('%d-%b-%Y')}", cell_style),
            Paragraph(f"<b>User Email:</b> {email}", cell_style)
        ]
    ]
    
    meta_table = Table(meta_data, colWidths=[250, 250])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
    ]))
    
    elements.append(meta_table)
    elements.append(Spacer(1, 30))

    # 3. Bill Line Items Table
    # Headers: Description, Rate (INR), Qty, Total (INR)
    table_data = [
        [
            Paragraph("Description", header_style),
            Paragraph("Rate (₹)", header_style),
            Paragraph("Quantity", header_style),
            Paragraph("Total Amount (₹)", header_style)
        ],
        [
            Paragraph("AlphaMind Premium Stock Search & Analytics Usage Charges", cell_style),
            Paragraph(f"{rate_per_search:.2f}", cell_style),
            Paragraph(str(total_searches), cell_style),
            Paragraph(f"{amount:.2f}", cell_style)
        ],
        # Empty space
        [Paragraph("", cell_style), Paragraph("", cell_style), Paragraph("", cell_style), Paragraph("", cell_style)],
        # Totals
        [
            Paragraph("", cell_style),
            Paragraph("", cell_style),
            Paragraph("Grand Total:", cell_bold_style),
            Paragraph(f"₹ {amount:.2f}", cell_bold_style)
        ]
    ]

    item_table = Table(table_data, colWidths=[250, 80, 70, 100])
    item_table.setStyle(TableStyle([
        # Header Styling
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')), # Dark background
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,0), 8),
        ('TOPPADDING', (0,0), (-1,0), 8),
        # Body Row styling
        ('BOTTOMPADDING', (0,1), (-1,1), 12),
        ('TOPPADDING', (0,1), (-1,1), 12),
        ('LINEBELOW', (0,1), (-1,1), 0.5, colors.HexColor('#CBD5E1')),
        # Empty spacers
        ('BOTTOMPADDING', (0,2), (-1,2), 30),
        # Totals Row
        ('LINEABOVE', (2,3), (3,3), 1, colors.HexColor('#0F172A')),
        ('TOPPADDING', (2,3), (3,3), 8),
        # Padding
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    
    elements.append(item_table)
    elements.append(Spacer(1, 50))

    # 4. Footer terms
    elements.append(Paragraph("<b>Terms & Conditions:</b>", cell_bold_style))
    elements.append(Paragraph("1. This is a computer-generated invoice and does not require a signature.", subtitle_style))
    elements.append(Paragraph("2. Payment is due within 15 days of invoice date.", subtitle_style))
    elements.append(Paragraph("3. For any billing queries, support is available at support@alphamind.com.", subtitle_style))
    
    elements.append(Spacer(1, 30))
    elements.append(Paragraph("Thank you for using AlphaMind!", cell_bold_style))

    # Build PDF
    doc.build(elements)
    
    # Return absolute path
    return os.path.abspath(pdf_path)
