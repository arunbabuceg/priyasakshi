"""Invoice generation service.

Generates professional PDF invoices for paid orders. The invoice is generated
only once per order and stored on disk for reuse.
"""

from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from ..config import settings, ROOT_DIR

logger = logging.getLogger("priya_sakshi.invoice")

# Invoice storage directory
INVOICE_DIR = ROOT_DIR / "uploads" / "invoices"
INVOICE_DIR.mkdir(parents=True, exist_ok=True)

# Brand colors
BRAND_COLOR = colors.HexColor("#8B2956")
BRAND_LIGHT = colors.HexColor("#F5E6ED")
TEXT_COLOR = colors.HexColor("#2E2825")
GRAY_COLOR = colors.HexColor("#6B6B6B")
LINE_COLOR = colors.HexColor("#E0D2DD")


class InvoiceService:
    def _get_next_invoice_number(self) -> str:
        """Generate the next invoice number in format INV-YYYY-000001."""
        year = datetime.now(timezone.utc).year
        # Import here to avoid circular imports
        from ..db import get_db

        # Find the highest invoice number for the current year
        cursor = get_db().orders.find(
            {"invoice_number": {"$regex": f"^INV-{year}-"}},
            {"invoice_number": 1},
        ).sort("invoice_number", -1).limit(1)

        docs = list(cursor)
        if docs:
            last_number = docs[0].get("invoice_number", f"INV-{year}-000000")
            try:
                seq = int(last_number.split("-")[-1]) + 1
            except ValueError:
                seq = 1
        else:
            seq = 1

        return f"INV-{year}-{seq:06d}"

    def _format_inr(self, amount: float) -> str:
        """Format amount as Indian INR."""
        return f"₹{amount:,.2f}"

    def _format_date(self, iso_date: str) -> str:
        """Format ISO date string to readable format."""
        try:
            dt = datetime.fromisoformat(iso_date.replace("Z", "+00:00"))
            return dt.strftime("%d %b %Y")
        except Exception:
            return iso_date

    def generate_invoice(self, order: dict) -> tuple[str, str]:
        """Generate a PDF invoice for the given order.

        Returns:
            tuple: (invoice_number, file_path)

        The invoice is generated only once and stored. Subsequent calls
        return the existing invoice details.
        """
        # Check if invoice already exists
        existing_invoice = order.get("invoice_file_path")
        existing_number = order.get("invoice_number")
        if existing_invoice and existing_number:
            full_path = ROOT_DIR / existing_invoice.lstrip("/")
            if full_path.exists():
                logger.info("Reusing existing invoice %s for order %s", existing_number, order.get("id"))
                return existing_number, str(full_path)

        invoice_number = self._get_next_invoice_number()
        filename = f"{invoice_number}.pdf"
        file_path = INVOICE_DIR / filename

        self._create_pdf(order, invoice_number, file_path)

        # Return relative path for storage
        relative_path = f"/uploads/invoices/{filename}"
        logger.info("Generated invoice %s for order %s at %s", invoice_number, order.get("id"), relative_path)

        return invoice_number, relative_path

    def _create_pdf(self, order: dict, invoice_number: str, file_path: Path) -> None:
        """Create the PDF invoice file."""
        doc = SimpleDocTemplate(
            str(file_path),
            pagesize=A4,
            leftMargin=2 * cm,
            rightMargin=2 * cm,
            topMargin=2 * cm,
            bottomMargin=2 * cm,
        )

        styles = getSampleStyleSheet()
        elements = []

        # Custom styles
        title_style = ParagraphStyle(
            "InvoiceTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=24,
            textColor=BRAND_COLOR,
            spaceAfter=4,
        )
        header_style = ParagraphStyle(
            "InvoiceHeader",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=10,
            textColor=GRAY_COLOR,
            spaceAfter=2,
        )
        section_style = ParagraphStyle(
            "SectionTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=12,
            textColor=BRAND_COLOR,
            spaceAfter=8,
            spaceBefore=16,
        )
        normal_style = ParagraphStyle(
            "InvoiceNormal",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=10,
            textColor=TEXT_COLOR,
            spaceAfter=4,
        )
        bold_style = ParagraphStyle(
            "InvoiceBold",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=10,
            textColor=TEXT_COLOR,
            spaceAfter=4,
        )
        footer_style = ParagraphStyle(
            "Footer",
            parent=styles["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=9,
            textColor=GRAY_COLOR,
            alignment=1,  # center
        )

        # Header section
        elements.append(
            Table(
                [
                    [
                        Paragraph("Priya Sakshi", title_style),
                        Paragraph(f"<b>INVOICE</b>", title_style),
                    ]
                ],
                colWidths=[10 * cm, 8 * cm],
            )
        )
        elements.append(Spacer(1, 4 * mm))

        # Store info
        elements.append(Paragraph("Kanchipuram, Tamil Nadu", header_style))
        elements.append(Paragraph("Email: hello@priyasakshi.com", header_style))
        elements.append(Paragraph("Phone: +91 98765 43210", header_style))
        elements.append(Spacer(1, 8 * mm))

        # Divider
        elements.append(
            Table(
                [[""]],
                colWidths=[18 * cm],
                rowHeights=[2],
                style=TableStyle([("BACKGROUND", (0, 0), (-1, -1), BRAND_COLOR)]),
            )
        )
        elements.append(Spacer(1, 8 * mm))

        # Invoice details and customer details side by side
        invoice_date = self._format_date(order.get("created_at", ""))
        invoice_data = [
            ["Invoice Number:", invoice_number],
            ["Invoice Date:", invoice_date],
            ["Order Number:", str(order.get("id", ""))[:8]],
            ["Payment Method:", "Razorpay"],
            ["Payment Status:", "Paid"],
        ]
        invoice_info_table = Table(
            invoice_data,
            colWidths=[3.5 * cm, 5 * cm],
        )
        invoice_info_table.setStyle(
            TableStyle(
                [
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    ("TEXTCOLOR", (0, 0), (-1, -1), TEXT_COLOR),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 2),
                ]
            )
        )

        # Customer details
        shipping = order.get("shipping", {}) or {}
        customer_data = [
            ["Customer Details", ""],
            [f"{order.get('customer_name', '')}", ""],
            [f"{order.get('customer_email', '')}", ""],
            [f"Phone: {order.get('phone', '')}", ""],
            ["Shipping Address:", ""],
            [f"{shipping.get('line1', '')}", ""],
            [
                f"{shipping.get('city', '')}, {shipping.get('state', '')} {shipping.get('postal_code', '')}",
                "",
            ],
            [f"{shipping.get('country', 'India')}", ""],
        ]
        customer_table = Table(
            customer_data,
            colWidths=[8 * cm],
        )
        customer_table.setStyle(
            TableStyle(
                [
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    ("TEXTCOLOR", (0, 0), (-1, -1), TEXT_COLOR),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                    ("TOPPADDING", (0, 0), (-1, -1), 2),
                    ("SPAN", (0, 4), (-1, 4)),
                    ("SPAN", (0, 5), (-1, -1)),
                ]
            )
        )

        # Side by side layout
        details_table = Table(
            [[invoice_info_table, customer_table]],
            colWidths=[9 * cm, 9 * cm],
        )
        details_table.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ]
            )
        )
        elements.append(details_table)
        elements.append(Spacer(1, 8 * mm))

        # Products table
        elements.append(Paragraph("Order Items", section_style))

        items = order.get("items", []) or []
        table_data = [
            [
                Paragraph("<b>Product</b>", normal_style),
                Paragraph("<b>Qty</b>", normal_style),
                Paragraph("<b>Unit Price</b>", normal_style),
                Paragraph("<b>Total</b>", normal_style),
            ]
        ]

        for item in items:
            name = item.get("name", "Product")
            quantity = item.get("quantity", 1)
            price = item.get("price", 0)
            item_total = quantity * price
            table_data.append(
                [
                    Paragraph(name, normal_style),
                    Paragraph(str(quantity), normal_style),
                    Paragraph(self._format_inr(price), normal_style),
                    Paragraph(self._format_inr(item_total), normal_style),
                ]
            )

        products_table = Table(
            table_data,
            colWidths=[9 * cm, 2 * cm, 3.5 * cm, 3.5 * cm],
        )
        products_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), BRAND_LIGHT),
                    ("TEXTCOLOR", (0, 0), (-1, 0), BRAND_COLOR),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    ("ALIGN", (1, 0), (-1, -1), "CENTER"),
                    ("ALIGN", (-1, 0), (-1, -1), "RIGHT"),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
                    ("TOPPADDING", (0, 0), (-1, -1), 10),
                    ("LINEBELOW", (0, 0), (-1, 0), 1, BRAND_COLOR),
                    ("LINEBELOW", (0, -1), (-1, -1), 1, BRAND_COLOR),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FAFAFA")]),
                ]
            )
        )
        elements.append(products_table)
        elements.append(Spacer(1, 8 * mm))

        # Summary section
        subtotal = order.get("subtotal", 0) or 0
        shipping_fee = order.get("shipping_fee", 0) or 0
        total = order.get("total", 0) or 0

        summary_data = [
            ["", ""],
            ["Subtotal:", self._format_inr(subtotal)],
            ["Shipping Charge:", self._format_inr(shipping_fee) if shipping_fee > 0 else "FREE"],
            ["", ""],
            ["Grand Total:", self._format_inr(total)],
        ]

        summary_table = Table(
            summary_data,
            colWidths=[13 * cm, 5 * cm],
        )
        summary_table.setStyle(
            TableStyle(
                [
                    ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                    ("FONTNAME", (-1, -1), (-1, -1), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 11),
                    ("FONTSIZE", (-1, -1), (-1, -1), 14),
                    ("TEXTCOLOR", (0, 0), (-1, -1), TEXT_COLOR),
                    ("TEXTCOLOR", (-1, -1), (-1, -1), BRAND_COLOR),
                    ("ALIGN", (-1, 0), (-1, -1), "RIGHT"),
                    ("BOTTOMPADDING", (0, -1), (-1, -1), 12),
                    ("TOPPADDING", (0, -1), (-1, -1), 12),
                    ("LINEABOVE", (0, -1), (-1, -1), 2, BRAND_COLOR),
                ]
            )
        )
        elements.append(summary_table)
        elements.append(Spacer(1, 16 * mm))

        # Footer
        elements.append(
            Table(
                [[""]],
                colWidths=[18 * cm],
                rowHeights=[1],
                style=TableStyle([("BACKGROUND", (0, 0), (-1, -1), LINE_COLOR)]),
            )
        )
        elements.append(Spacer(1, 4 * mm))
        elements.append(
            Paragraph("Thank you for shopping with Priya Sakshi.", footer_style)
        )
        elements.append(
            Paragraph("We hope to see you again soon!", footer_style)
        )

        # Build PDF
        doc.build(elements)
        logger.info("PDF invoice created at %s", file_path)

    def get_invoice_path(self, order: dict) -> Optional[tuple[str, str]]:
        """Get the existing invoice path for an order.

        Returns:
            tuple: (invoice_number, file_path) or None if no invoice exists
        """
        invoice_number = order.get("invoice_number")
        invoice_file_path = order.get("invoice_file_path")

        if invoice_number and invoice_file_path:
            full_path = ROOT_DIR / invoice_file_path.lstrip("/")
            if full_path.exists():
                return invoice_number, str(full_path)

        return None

    def get_invoice_filename(self, order: dict) -> str:
        """Get the invoice filename for an order."""
        invoice_number = order.get("invoice_number", "invoice")
        return f"{invoice_number}.pdf"


invoice_service = InvoiceService()
