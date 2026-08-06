"""Invoice generation service.

Generates professional PDF invoices for paid orders using ReportLab.
PDFs are written to an in-memory buffer, then uploaded to Cloudinary for
persistent storage (survives Render redeploys). When Cloudinary is not
configured the PDF is also written to the local uploads/invoices/ folder
as a development fallback.

The Cloudinary URL (or local relative path) is stored in the order
document as ``invoice_file_path`` so it can be served later without
regenerating the PDF.
"""

from __future__ import annotations

import io
import logging
import os
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

# Local fallback directory (used when Cloudinary is not configured)
INVOICE_DIR = ROOT_DIR / "uploads" / "invoices"
INVOICE_DIR.mkdir(parents=True, exist_ok=True)

# Brand colours
BRAND_COLOR = colors.HexColor("#8B2956")
BRAND_LIGHT = colors.HexColor("#F5E6ED")
TEXT_COLOR = colors.HexColor("#2E2825")
GRAY_COLOR = colors.HexColor("#6B6B6B")
LINE_COLOR = colors.HexColor("#E0D2DD")


class InvoiceService:
    async def _get_next_invoice_number(self) -> str:
        """Generate the next invoice number in format INV-YYYY-000001.

        Uses Motor's async API so the event loop is never blocked.
        """
        year = datetime.now(timezone.utc).year
        from ..db import get_db

        cursor = (
            get_db()
            .orders.find(
                {"invoice_number": {"$regex": f"^INV-{year}-"}},
                {"invoice_number": 1},
            )
            .sort("invoice_number", -1)
            .limit(1)
        )
        docs = await cursor.to_list(length=1)
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
        return f"₹{amount:,.2f}"

    def _format_date(self, iso_date: str) -> str:
        try:
            dt = datetime.fromisoformat(iso_date.replace("Z", "+00:00"))
            return dt.strftime("%d %b %Y")
        except Exception:
            return iso_date

    async def generate_invoice(self, order: dict) -> tuple[str, str]:
        """Generate a PDF invoice for the given order.

        Returns:
            tuple: (invoice_number, invoice_file_path)
            where ``invoice_file_path`` is a Cloudinary URL when Cloudinary
            is configured, otherwise a local relative path.

        The PDF is generated only once per order.  Subsequent calls reuse
        the stored ``invoice_file_path`` from the order document.
        """
        # Reuse an existing invoice if we already have one stored
        existing_path = order.get("invoice_file_path")
        existing_number = order.get("invoice_number")
        if existing_path and existing_number:
            # If it's a Cloudinary URL it's always available
            if existing_path.startswith("http://") or existing_path.startswith("https://"):
                logger.info(
                    "Reusing existing Cloudinary invoice %s for order %s",
                    existing_number,
                    order.get("id"),
                )
                return existing_number, existing_path
            # Local path — only reuse if the file still exists
            full_path = ROOT_DIR / existing_path.lstrip("/")
            if full_path.exists():
                logger.info(
                    "Reusing existing local invoice %s for order %s",
                    existing_number,
                    order.get("id"),
                )
                return existing_number, existing_path

        invoice_number = await self._get_next_invoice_number()

        # Build PDF in memory
        pdf_bytes = self._create_pdf_bytes(order, invoice_number)

        # Try Cloudinary first (persistent)
        from . import cloudinary_service

        if cloudinary_service.is_configured():
            try:
                url = await cloudinary_service.upload_pdf(pdf_bytes, invoice_number)
                logger.info(
                    "Invoice %s uploaded to Cloudinary for order %s",
                    invoice_number,
                    order.get("id"),
                )
                return invoice_number, url
            except Exception as exc:
                logger.warning(
                    "Cloudinary upload failed for invoice %s, falling back to local: %s",
                    invoice_number,
                    exc,
                )

        # Fallback: write to local filesystem
        filename = f"{invoice_number}.pdf"
        file_path = INVOICE_DIR / filename
        file_path.write_bytes(pdf_bytes)
        relative_path = f"/uploads/invoices/{filename}"
        logger.info(
            "Invoice %s saved locally for order %s at %s",
            invoice_number,
            order.get("id"),
            relative_path,
        )
        return invoice_number, relative_path

    def _create_pdf_bytes(self, order: dict, invoice_number: str) -> bytes:
        """Render the invoice as PDF and return the raw bytes."""
        buf = io.BytesIO()
        doc = SimpleDocTemplate(
            buf,
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
            alignment=1,
        )

        # Header
        elements.append(
            Table(
                [[Paragraph("Priya Sakshi", title_style), Paragraph("<b>INVOICE</b>", title_style)]],
                colWidths=[10 * cm, 8 * cm],
            )
        )
        elements.append(Spacer(1, 4 * mm))
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

        # Invoice + customer details
        invoice_date = self._format_date(order.get("created_at", ""))
        invoice_data = [
            ["Invoice Number:", invoice_number],
            ["Invoice Date:", invoice_date],
            ["Order Number:", str(order.get("id", ""))[:8]],
            ["Payment Method:", "Razorpay"],
            ["Payment Status:", "Paid"],
        ]
        invoice_info_table = Table(invoice_data, colWidths=[3.5 * cm, 5 * cm])
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
        customer_table = Table(customer_data, colWidths=[8 * cm])
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

        details_table = Table([[invoice_info_table, customer_table]], colWidths=[9 * cm, 9 * cm])
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

        products_table = Table(table_data, colWidths=[9 * cm, 2 * cm, 3.5 * cm, 3.5 * cm])
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

        # Summary
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
        summary_table = Table(summary_data, colWidths=[13 * cm, 5 * cm])
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
        elements.append(Paragraph("Thank you for shopping with Priya Sakshi.", footer_style))
        elements.append(Paragraph("We hope to see you again soon!", footer_style))

        doc.build(elements)
        return buf.getvalue()

    def get_invoice_path(self, order: dict) -> Optional[tuple[str, str]]:
        """Return (invoice_number, path_or_url) for an existing invoice, or None.

        When the stored path is a Cloudinary URL it is returned as-is.
        For local paths the file must exist on disk.
        """
        invoice_number = order.get("invoice_number")
        invoice_file_path = order.get("invoice_file_path")

        if not (invoice_number and invoice_file_path):
            return None

        # Cloudinary URL — always available
        if invoice_file_path.startswith("http://") or invoice_file_path.startswith("https://"):
            return invoice_number, invoice_file_path

        # Local path
        full_path = ROOT_DIR / invoice_file_path.lstrip("/")
        if full_path.exists():
            return invoice_number, str(full_path)

        return None

    def get_invoice_filename(self, order: dict) -> str:
        invoice_number = order.get("invoice_number", "invoice")
        return f"{invoice_number}.pdf"


invoice_service = InvoiceService()
