import io
import logging
import calendar
from datetime import datetime, timezone, date, timedelta
from typing import Optional, List

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch
import numpy as np

from ..database import get_db

logger = logging.getLogger(__name__)

# Color scheme
BG_COLOR = "#1e1e2e"
SURFACE_COLOR = "#2a2a3e"
ACCENT_COLOR = "#89b4fa"
TEXT_COLOR = "#cdd6f4"
SUBTEXT_COLOR = "#a6adc8"
GREEN_COLOR = "#a6e3a1"
RED_COLOR = "#f38ba8"
YELLOW_COLOR = "#f9e2af"
HEADER_COLOR = "#313244"


def _parse_date(date_str: str) -> Optional[date]:
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return None


def _get_preset_dates(preset: str) -> tuple[date, date]:
    today = date.today()
    if preset == "this_month":
        start = today.replace(day=1)
        last_day = calendar.monthrange(today.year, today.month)[1]
        end = today.replace(day=last_day)
    elif preset == "last_month":
        first_of_this = today.replace(day=1)
        end = first_of_this - timedelta(days=1)
        start = end.replace(day=1)
    elif preset == "this_week":
        start = today - timedelta(days=today.weekday())
        end = start + timedelta(days=6)
    else:
        start = today.replace(day=1)
        last_day = calendar.monthrange(today.year, today.month)[1]
        end = today.replace(day=last_day)
    return start, end


async def generate_expense_report_image(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    categories: Optional[str] = None,
    preset: Optional[str] = None,
) -> bytes:
    """Generate a dark-themed expense report PNG and return as bytes."""
    db = get_db()

    # Resolve date range
    if preset and preset != "custom":
        start, end = _get_preset_dates(preset)
    else:
        start = _parse_date(start_date) or date.today().replace(day=1)
        last_day = calendar.monthrange(start.year, start.month)[1]
        end = _parse_date(end_date) or start.replace(day=last_day)

    start_dt = datetime(start.year, start.month, start.day, tzinfo=timezone.utc)
    end_dt = datetime(end.year, end.month, end.day, 23, 59, 59, tzinfo=timezone.utc)

    # Build category filter
    cat_list: Optional[List[str]] = None
    if categories and categories.lower() != "all":
        cat_list = [c.strip() for c in categories.split(",") if c.strip()]

    query: dict = {"date": {"$gte": start_dt, "$lte": end_dt}}
    if cat_list:
        query["category"] = {"$in": cat_list}

    payments_cursor = db.payments.find(query).sort("date", 1)
    payments = await payments_cursor.to_list(length=5000)

    # Build row data
    rows = []
    for p in payments:
        pay_date = p.get("date", datetime.now(timezone.utc))
        if pay_date.tzinfo is None:
            pay_date = pay_date.replace(tzinfo=timezone.utc)
        rows.append(
            {
                "date": pay_date.strftime("%d %b %Y"),
                "category": p.get("category", "-"),
                "note": p.get("note") or "-",
                "amount": p.get("amount", 0.0),
            }
        )

    # Category summary
    cat_totals: dict = {}
    for row in rows:
        cat = row["category"]
        cat_totals[cat] = cat_totals.get(cat, 0.0) + row["amount"]

    grand_total = sum(r["amount"] for r in rows)

    # --- Build figure ---
    n_rows = len(rows) + 1  # +1 for total row
    n_summary = len(cat_totals) + 1  # +1 for header

    fig_height = max(10, 3 + n_rows * 0.35 + n_summary * 0.35 + 2)
    fig_width = 14

    fig, ax = plt.subplots(figsize=(fig_width, fig_height))
    fig.patch.set_facecolor(BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    ax.axis("off")

    y_cursor = 0.98

    def draw_text(text, x, y, fontsize=11, color=TEXT_COLOR, ha="left", weight="normal"):
        ax.text(x, y, text, transform=ax.transAxes, fontsize=fontsize,
                color=color, ha=ha, va="top", fontweight=weight)

    # Title
    draw_text("💰 Expense Report", 0.5, y_cursor, fontsize=18, color=ACCENT_COLOR, ha="center", weight="bold")
    y_cursor -= 0.04
    date_range_str = f"{start.strftime('%d %b %Y')} – {end.strftime('%d %b %Y')}"
    draw_text(date_range_str, 0.5, y_cursor, fontsize=11, color=SUBTEXT_COLOR, ha="center")
    y_cursor -= 0.03

    # Divider line
    ax.axhline(y=y_cursor, xmin=0.02, xmax=0.98, color=ACCENT_COLOR, linewidth=0.8, transform=ax.transAxes)
    y_cursor -= 0.025

    if not rows:
        draw_text("No transactions found for the selected period.", 0.5, y_cursor,
                  color=YELLOW_COLOR, ha="center", fontsize=13)
        buf = io.BytesIO()
        plt.tight_layout()
        plt.savefig(buf, format="png", dpi=150, bbox_inches="tight", facecolor=BG_COLOR)
        plt.close(fig)
        buf.seek(0)
        return buf.read()

    # Column headers
    col_xs = [0.02, 0.18, 0.38, 0.72, 0.88]
    col_labels = ["Date", "Category", "Note", "Amount (₹)"]
    col_has = ["left", "left", "left", "right"]

    row_h = 0.03
    header_y = y_cursor

    # Header background
    header_rect = FancyBboxPatch(
        (0.01, header_y - row_h),
        0.98, row_h,
        boxstyle="round,pad=0.002",
        transform=ax.transAxes,
        facecolor=HEADER_COLOR,
        edgecolor="none",
        zorder=1,
    )
    ax.add_patch(header_rect)

    for i, label in enumerate(col_labels):
        x = col_xs[i]
        ha = col_has[i]
        if ha == "right":
            x = col_xs[i + 1] if i + 1 < len(col_xs) else col_xs[i] + 0.12
        draw_text(label, x, header_y - 0.005, fontsize=10, color=ACCENT_COLOR, ha=ha, weight="bold")

    y_cursor = header_y - row_h - 0.005

    # Data rows
    for idx, row in enumerate(rows):
        if idx % 2 == 0:
            rect = FancyBboxPatch(
                (0.01, y_cursor - row_h + 0.003),
                0.98, row_h,
                boxstyle="round,pad=0.001",
                transform=ax.transAxes,
                facecolor=SURFACE_COLOR,
                edgecolor="none",
                zorder=0,
            )
            ax.add_patch(rect)

        note_text = row["note"][:35] + "…" if len(row["note"]) > 35 else row["note"]
        draw_text(row["date"], col_xs[0], y_cursor, fontsize=9, color=SUBTEXT_COLOR)
        draw_text(row["category"], col_xs[1], y_cursor, fontsize=9, color=TEXT_COLOR)
        draw_text(note_text, col_xs[2], y_cursor, fontsize=9, color=TEXT_COLOR)
        draw_text(f"₹{row['amount']:,.2f}", col_xs[4], y_cursor, fontsize=9, color=GREEN_COLOR, ha="right")

        y_cursor -= row_h

    y_cursor -= 0.005

    # Total row
    total_rect = FancyBboxPatch(
        (0.01, y_cursor - row_h + 0.003),
        0.98, row_h,
        boxstyle="round,pad=0.001",
        transform=ax.transAxes,
        facecolor="#45475a",
        edgecolor="none",
        zorder=1,
    )
    ax.add_patch(total_rect)
    draw_text("TOTAL", col_xs[0], y_cursor, fontsize=10, color=ACCENT_COLOR, weight="bold")
    draw_text(f"₹{grand_total:,.2f}", col_xs[4], y_cursor, fontsize=10, color=YELLOW_COLOR, ha="right", weight="bold")
    y_cursor -= row_h + 0.02

    # Category summary section
    ax.axhline(y=y_cursor + 0.005, xmin=0.02, xmax=0.98, color=ACCENT_COLOR, linewidth=0.5, transform=ax.transAxes)
    y_cursor -= 0.01
    draw_text("Category Summary", 0.02, y_cursor, fontsize=12, color=ACCENT_COLOR, weight="bold")
    y_cursor -= 0.03

    for cat, total in sorted(cat_totals.items(), key=lambda x: -x[1]):
        pct = (total / grand_total * 100) if grand_total > 0 else 0.0
        draw_text(f"• {cat}", 0.04, y_cursor, fontsize=9, color=TEXT_COLOR)
        draw_text(f"₹{total:,.2f}  ({pct:.1f}%)", 0.45, y_cursor, fontsize=9, color=YELLOW_COLOR)
        y_cursor -= 0.03

    plt.tight_layout(pad=0.5)
    buf = io.BytesIO()
    plt.savefig(buf, format="png", dpi=150, bbox_inches="tight", facecolor=BG_COLOR)
    plt.close(fig)
    buf.seek(0)
    return buf.read()
