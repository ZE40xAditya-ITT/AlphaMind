import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas

class DigestNumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to add executive header, top accent ribbon, running footer, and total page count.
    """
    def __init__(self, *args, **kwargs):
        super(DigestNumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(DigestNumberedCanvas, self).showPage()
        super(DigestNumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        width, height = self._pagesize

        # Top Executive Ribbon (Indigo-600)
        self.setFillColor(colors.HexColor("#4F46E5"))
        self.rect(0, height - 6, width, 6, fill=1, stroke=0)

        # Running Header
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#1E293B"))
        self.drawString(54, height - 24, "ALPHAMIND AI")
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.drawString(130, height - 24, "|   EXECUTIVE WEEKLY INVESTMENT DIGEST")
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
        self.drawString(54, 26, "CONFIDENTIAL & PROPRIETARY — PREPARED BY ALPHAMIND AI ENGINE")
        self.drawRightString(width - 54, 26, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()

def generate_digest_pdf(digest, user) -> str:
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    digests_dir = os.path.join(backend_dir, "digests")
    os.makedirs(digests_dir, exist_ok=True)
    filename = os.path.join(digests_dir, f"digest_{user.id}_{digest.id}.pdf")

    # Page setup with margins accounting for header/footer
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        rightMargin=54,
        leftMargin=54,
        topMargin=45,
        bottomMargin=55
    )

    styles = getSampleStyleSheet()

    # Executive Color Palette
    PRIMARY_NAVY = colors.HexColor('#1E1B4B')
    INDIGO = colors.HexColor('#4F46E5')
    DARK_SLATE = colors.HexColor('#0F172A')
    TEXT_SLATE = colors.HexColor('#334155')
    LIGHT_BG = colors.HexColor('#F8FAFC')
    ALT_ROW_BG = colors.HexColor('#F1F5F9')
    BORDER_COLOR = colors.HexColor('#E2E8F0')
    ACCENT_GREEN = colors.HexColor('#10B981')
    ACCENT_RED = colors.HexColor('#EF4444')

    # Typography Styles
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=PRIMARY_NAVY,
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569')
    )

    section_banner_style = ParagraphStyle(
        'SectionBannerStyle',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=colors.white
    )

    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=15,
        textColor=TEXT_SLATE,
        spaceAfter=6
    )

    body_bold_style = ParagraphStyle(
        'BodyBoldStyle',
        parent=body_style,
        fontName='Helvetica-Bold',
        textColor=DARK_SLATE
    )

    callout_text_style = ParagraphStyle(
        'CalloutText',
        parent=body_style,
        fontSize=9.5,
        leading=14,
        textColor=DARK_SLATE,
        spaceAfter=0
    )

    story = []

    # 1. Title Banner Card
    date_str = digest.digest_date.strftime('%d %B %Y') if digest.digest_date else datetime.now().strftime('%d %B %Y')
    title_p = Paragraph("EXECUTIVE WEEKLY INVESTMENT DIGEST", title_style)
    sub_p = Paragraph(f"Prepared Exclusively for <b>{user.username.upper()}</b> &bull; Issued on {date_str}", subtitle_style)

    title_table = Table([[title_p], [sub_p]], colWidths=[487])
    title_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#EEF2FF')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#C7D2FE')),
        ('TOPPADDING', (0,0), (-1,-1), 14),
        ('BOTTOMPADDING', (0,0), (-1,-1), 14),
        ('LEFTPADDING', (0,0), (-1,-1), 16),
        ('RIGHTPADDING', (0,0), (-1,-1), 16),
    ]))
    story.append(title_table)
    story.append(Spacer(1, 18))

    def create_section_header(title_text):
        """Helper to create executive dark ribbon section banners."""
        p = Paragraph(f"<b>{title_text.upper()}</b>", section_banner_style)
        t = Table([[p]], colWidths=[487])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), PRIMARY_NAVY),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
            ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ]))
        return t

    # 2. Market Summary Section
    if digest.market_summary:
        story.append(create_section_header("1. Market Overview & Sentiment Analysis"))
        story.append(Spacer(1, 8))

        m = digest.market_summary
        nifty_p = m.get('nifty_price', 0)
        bank_p = m.get('banknifty_price', 0)
        nifty_chg = m.get('nifty_change_pct', 0)
        bank_chg = m.get('banknifty_change_pct', 0)

        n_chg_color = '#10B981' if nifty_chg >= 0 else '#EF4444'
        b_chg_color = '#10B981' if bank_chg >= 0 else '#EF4444'

        th_style = ParagraphStyle('TH', fontName='Helvetica-Bold', fontSize=9.5, textColor=colors.white)
        td_style = ParagraphStyle('TD', fontName='Helvetica', fontSize=9.5, textColor=DARK_SLATE)
        td_bold = ParagraphStyle('TDB', fontName='Helvetica-Bold', fontSize=9.5, textColor=DARK_SLATE)

        data = [
            [Paragraph("Market Index", th_style), Paragraph("Current Level", th_style), Paragraph("Weekly Change (%)", th_style)],
            [
                Paragraph("<b>NIFTY 50</b>", td_bold),
                Paragraph(f"₹ {nifty_p:,.2f}" if nifty_p else "N/A", td_style),
                Paragraph(f"<font color='{n_chg_color}'><b>{nifty_chg:+.2f}%</b></font>", td_style)
            ],
            [
                Paragraph("<b>NIFTY BANK</b>", td_bold),
                Paragraph(f"₹ {bank_p:,.2f}" if bank_p else "N/A", td_style),
                Paragraph(f"<font color='{b_chg_color}'><b>{bank_chg:+.2f}%</b></font>", td_style)
            ],
        ]

        t = Table(data, colWidths=[187, 150, 150])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#334155')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
            ('BACKGROUND', (0,1), (-1,1), white_or_light(1)),
            ('BACKGROUND', (0,2), (-1,2), ALT_ROW_BG),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('LEFTPADDING', (0,0), (-1,-1), 10),
        ]))
        story.append(t)
        story.append(Spacer(1, 10))

        # Sentiment Badge Callout
        sentiment_val = m.get('sentiment', 'Neutral')
        sent_color = '#10B981' if 'Bullish' in str(sentiment_val) else '#EF4444' if 'Bearish' in str(sentiment_val) else '#6366F1'
        sent_p = Paragraph(f"<b>Market Sentiment Outlook:</b> <font color='{sent_color}'><b>{sentiment_val.upper()}</b></font> &mdash; Market breadth reflects ongoing institutional positioning and sector rotation.", body_style)

        sent_box = Table([[sent_p]], colWidths=[487])
        sent_box.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), LIGHT_BG),
            ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
            ('LEFTPADDING', (0,0), (-1,-1), 12),
            ('RIGHTPADDING', (0,0), (-1,-1), 12),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(sent_box)
        story.append(Spacer(1, 16))

    # 3. AI Investment Suggestions
    if digest.ai_suggestions:
        story.append(create_section_header("2. AI Strategic Recommendations & Alpha Insights"))
        story.append(Spacer(1, 8))
        ai = digest.ai_suggestions
        if ai.get('executive_summary'):
            exec_p = Paragraph(f"<b>Executive Summary:</b> {ai['executive_summary']}", body_style)
            story.append(exec_p)
            story.append(Spacer(1, 6))

        suggestions = ai.get('suggestions', [])
        for idx, s in enumerate(suggestions, 1):
            s_p = Paragraph(f"<b>{idx}. Strategic Action:</b> {s}", callout_text_style)
            s_table = Table([[s_p]], colWidths=[487])
            s_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), LIGHT_BG if idx % 2 == 1 else colors.white),
                ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
                ('LINELEFT', (0,0), (0,0), 3.5, INDIGO),
                ('TOPPADDING', (0,0), (-1,-1), 8),
                ('BOTTOMPADDING', (0,0), (-1,-1), 8),
                ('LEFTPADDING', (0,0), (-1,-1), 12),
                ('RIGHTPADDING', (0,0), (-1,-1), 12),
            ]))
            story.append(s_table)
            story.append(Spacer(1, 6))
        story.append(Spacer(1, 12))

    # 4. Portfolio Intelligence
    if digest.portfolio_summary:
        story.append(create_section_header("3. Portfolio Intelligence & Scorecard"))
        story.append(Spacer(1, 8))
        p = digest.portfolio_summary
        avg_score = p.get('avg_score', 'N/A')
        health_score = p.get('health_score', 'N/A')

        kpi_p1 = Paragraph(f"<font size=14 color='#1E1B4B'><b>{health_score} / 100</b></font><br/><font size=8 color='#64748B'>PORTFOLIO HEALTH SCORE</font>", ParagraphStyle('KPI1', align=1))
        kpi_p2 = Paragraph(f"<font size=14 color='#4F46E5'><b>{avg_score} / 100</b></font><br/><font size=8 color='#64748B'>AVERAGE HOLDING RATING</font>", ParagraphStyle('KPI2', align=1))

        kpi_table = Table([[kpi_p1, kpi_p2]], colWidths=[240, 240])
        kpi_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), LIGHT_BG),
            ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
            ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 12),
            ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ]))
        story.append(kpi_table)
        story.append(Spacer(1, 10))

        if p.get('buy_recommendations'):
            buys = p['buy_recommendations']
            buy_p = Paragraph(f"<b>Top High-Conviction Buy Picks:</b> {', '.join([f'<b>{b}</b>' for b in buys])}", body_style)
            story.append(buy_p)
        story.append(Spacer(1, 14))

    # 5. Watchlist Insights
    if digest.watchlist_insights:
        story.append(create_section_header("4. Watchlist Monitoring & Alerts"))
        story.append(Spacer(1, 8))
        w = digest.watchlist_insights
        symbols = w.get('watchlist_symbols', [])
        watch_str = ", ".join([f"<b>{sym}</b>" for sym in symbols]) if symbols else "No symbols currently being monitored in active watchlist."
        w_p = Paragraph(f"<b>Monitored Assets:</b> {watch_str}", body_style)

        w_table = Table([[w_p]], colWidths=[487])
        w_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.white),
            ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
            ('TOPPADDING', (0,0), (-1,-1), 10),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
            ('LEFTPADDING', (0,0), (-1,-1), 12),
            ('RIGHTPADDING', (0,0), (-1,-1), 12),
        ]))
        story.append(w_table)
        story.append(Spacer(1, 16))

    # Build PDF with two-pass numbered canvas
    doc.build(story, canvasmaker=DigestNumberedCanvas)
    return filename

def white_or_light(idx):
    return colors.white
